import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import PDFDocument from "pdfkit";
import { storage } from "./storage";
import {
  authenticateToken,
  requireRole,
  generateToken,
  hashPassword,
  comparePassword,
  type AuthRequest
} from "./auth";
import { sendWelcomeEmail, sendContactNotification, sendContactConfirmation, sendPartnerCommissionNotification, sendPaymentProofNotificationToAdmin, sendPaymentProofConfirmationToClient, sendEmail, generateBudgetAcceptanceEmailHTML, generatePaymentStageAvailableEmailHTML } from "./email";

import {
  loginSchema,
  registerSchema,
  contactSchema,
  insertProjectSchema,
  insertTicketSchema,
} from "@shared/schema";
import {
  registerWSConnection,
  sendComprehensiveNotification,
  notifyProjectCreated,
  notifyProjectUpdated,
  notifyNewMessage,
  notifyTicketCreated,
  notifyTicketResponse,
  notifyPaymentStageAvailable,
  notifyBudgetNegotiation
} from "./notifications";
import { z } from "zod";
import { db, users, partners, projects, notifications, tickets, payments, paymentStages, portfolio, referrals, projectMessages, projectFiles, projectTimeline, ticketResponses, paymentMethods, invoices, transactions, budgetNegotiations, workModalities, clientBillingInfo, companyBillingInfo } from "./db";
import { eq, desc, and, or, count, sql, like, inArray } from "drizzle-orm"; // Import necessary drizzle-orm functions

// Middleware for authentication and authorization
const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  authenticateToken(req, res, () => {
    if (req.user) {
      next();
    } else {
      res.status(401).json({ message: "No autorizado" });
    }
  });
};

// Validation middleware
const validateSchema = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF) y PDFs.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      const dbTest = await db.select().from(users).limit(1);

      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
        database_url_configured: !!process.env.DATABASE_URL,
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });



  // API routes
  // Seed initial data
  await storage.seedUsers();

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const token = generateToken(user.id);
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
        message: "Inicio de sesión exitoso",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Public registration disabled - only admins can create users

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { password: _, ...userWithoutPassword } = req.user!;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Contact Routes
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = contactSchema.parse(req.body);

      // Send notification email to admin
      try {
        await sendContactNotification(contactData);
        console.log(`📧 Notificación de contacto enviada al admin para: ${contactData.fullName}`);
      } catch (emailError) {
        console.error("Error sending contact notification:", emailError);
      }

      // Send confirmation email to client
      try {
        await sendContactConfirmation(contactData.email, contactData.fullName);
        console.log(`📧 Confirmación enviada al cliente: ${contactData.email}`);
      } catch (emailError) {
        console.error("Error sending contact confirmation:", emailError);
      }

      res.json({
        message: "¡Gracias por contactarnos! Hemos recibido tu consulta y te responderemos en las próximas 24 horas."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });



  // User Routes
  app.get("/api/users", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update user (Admin or own profile)
  app.put("/api/users/:id", requireAuth, async (req: AuthRequest, res) => {
    const userId = parseInt(req.params.id);

    // Permitir si es admin o si está actualizando su propio perfil
    if (req.user!.role !== "admin" && req.user!.id !== userId) {
      return res.status(403).json({ message: "Permisos insuficientes" });
    }
    try {
      const updates = req.body;

      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }

      const user = await storage.updateUser(userId, updates);
      const { password: _, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Partner Routes
  app.get("/api/partners/me", authenticateToken, requireRole(["partner"]), async (req: AuthRequest, res) => {
    try {
      const partner = await storage.getPartner(req.user!.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner no encontrado" });
      }

      const stats = await storage.getPartnerStats(partner.id);
      res.json({ ...partner, ...stats });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/partners/referrals", authenticateToken, requireRole(["partner"]), async (req: AuthRequest, res) => {
    try {
      const partner = await storage.getPartner(req.user!.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner no encontrado" });
      }

      const referrals = await storage.getReferrals(partner.id);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/partner/earnings", authenticateToken, requireRole(["partner"]), async (req: AuthRequest, res) => {
    try {
      const partner = await storage.getPartner(req.user!.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner no encontrado" });
      }

      const earningsData = await storage.getPartnerEarningsData(partner.id);
      res.json(earningsData);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/partner/commissions", authenticateToken, requireRole(["partner"]), async (req: AuthRequest, res) => {
    try {
      const partner = await storage.getPartner(req.user!.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner no encontrado" });
      }

      const commissions = await storage.getPartnerCommissions(partner.id);
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/partners", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const { userId, commissionRate } = req.body;

      const existingPartner = await storage.getPartner(userId);
      if (existingPartner) {
        return res.status(400).json({ message: "El usuario ya es un partner" });
      }

      const referralCode = `PAR${userId}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const partner = await storage.createPartner({
        userId,
        referralCode,
        commissionRate: commissionRate || "25.00",
        totalEarnings: "0.00",
      });

      res.status(201).json(partner);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Projects
  app.get("/api/projects", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projects = await storage.getProjects(req.user!.id, req.user!.role);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/projects/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Verificar permisos
      if (req.user!.role !== "admin" && project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para ver este proyecto" });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/projects/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID de proyecto inválido" });
      }

      // Verificar que el proyecto existe y el usuario tiene permisos
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Solo el cliente dueño o admin puede eliminar
      if (req.user!.role !== "admin" && project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para eliminar este proyecto" });
      }

      await storage.deleteProject(projectId);
      res.json({ message: "Proyecto eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, description, price } = req.body;

      const projectData = {
        name,
        description,
        price: price.toString(), // Ensure price is a string for decimal field
        clientId: req.user!.id,
        status: "pending",
        progress: 0,
      };

      // Only admin can set different client ID
      if (req.user!.role === "admin" && req.body.clientId) {
        projectData.clientId = req.body.clientId;
      }

      const project = await storage.createProject(projectData);

      // Send notifications
      const adminUsers = await storage.getUsersByRole("admin");
      const adminIds = adminUsers.map(admin => admin.id);
      await notifyProjectCreated(projectData.clientId, adminIds, name);

      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/projects/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID de proyecto inválido" });
      }

      // Get original project data
      const originalProject = await storage.getProject(projectId);
      if (!originalProject) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Validate dates if provided
      if (updates.startDate && updates.startDate !== null) {
        const startDate = new Date(updates.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ message: "Fecha de inicio inválida" });
        }
      }

      if (updates.deliveryDate && updates.deliveryDate !== null) {
        const deliveryDate = new Date(updates.deliveryDate);
        if (isNaN(deliveryDate.getTime())) {
          return res.status(400).json({ message: "Fecha de entrega inválida" });
        }
      }

      const project = await storage.updateProject(projectId, updates);

      // Send notification about project update
      if (req.user!.role === "admin") {
        let updateDescription = "El proyecto ha sido actualizado";
        let hasStatusChange = false;
        let hasProgressChange = false;

        if (updates.status && updates.status !== originalProject.status) {
          const statusLabels = {
            'pending': 'Pendiente',
            'in_progress': 'En Progreso',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
          };
          updateDescription = `Estado cambiado a: ${statusLabels[updates.status as keyof typeof statusLabels] || updates.status}`;
          hasStatusChange = true;
        }

        if (updates.progress && updates.progress !== originalProject.progress) {
          if (hasStatusChange) {
            updateDescription += ` - Progreso actualizado a ${updates.progress}%`;
          } else {
            updateDescription = `Progreso actualizado a ${updates.progress}%`;
          }
          hasProgressChange = true;
        }

        if (updates.startDate && updates.startDate !== originalProject.startDate) {
          updateDescription += ` - Fecha de inicio actualizada`;
        }

        if (updates.deliveryDate && updates.deliveryDate !== originalProject.deliveryDate) {
          updateDescription += ` - Fecha de entrega actualizada`;
        }

        if (updates.price && updates.price !== originalProject.price) {
          updateDescription += ` - Precio actualizado a $${updates.price}`;
        }

        console.log(`📧 Enviando notificaciones de actualización de proyecto: ${updateDescription}`);

        await notifyProjectUpdated(
          originalProject.clientId,
          originalProject.name,
          updateDescription,
          req.user!.fullName
        );

        // Special notifications for status changes
        if (hasStatusChange) {
          const statusLabels = {
            'pending': 'Pendiente',
            'in_progress': 'En Progreso',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
          };

          console.log(`📧 Enviando notificaciones especiales de cambio de estado a: ${updates.status}`);

          // Notify all admins about status change
          const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
          for (const admin of adminUsers) {
            try {
              if (admin.email) {
                await sendEmail({
                  to: admin.email,
                  subject: `Cambio de Estado: ${originalProject.name} - ${statusLabels[updates.status as keyof typeof statusLabels] || updates.status}`,
                  html: generateProjectStatusChangeEmailHTML(
                    originalProject.name,
                    statusLabels[originalProject.status as keyof typeof statusLabels] || originalProject.status,
                    statusLabels[updates.status as keyof typeof statusLabels] || updates.status,
                    req.user!.fullName,
                    originalProject.clientId
                  ),
                });
                console.log(`✅ Email de cambio de estado enviado a admin: ${admin.email}`);
              }
            } catch (adminError) {
              console.error(`❌ Error enviando email de cambio de estado a admin ${admin.id}:`, adminError);
            }
          }

          // También enviar al email principal del sistema
          try {
            await sendEmail({
              to: process.env.GMAIL_USER || 'softwarepar.lat@gmail.com',
              subject: `Cambio de Estado: ${originalProject.name} - ${statusLabels[updates.status as keyof typeof statusLabels] || updates.status}`,
              html: generateProjectStatusChangeEmailHTML(
                originalProject.name,
                statusLabels[originalProject.status as keyof typeof statusLabels] || originalProject.status,
                statusLabels[updates.status as keyof typeof statusLabels] || updates.status,
                req.user!.fullName,
                originalProject.clientId
              ),
            });
            console.log(`✅ Email de cambio de estado enviado al email principal del sistema`);
          } catch (systemEmailError) {
            console.error(`❌ Error enviando email de cambio de estado al sistema principal:`, systemEmailError);
          }
        }
      }

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });



  // Project detail routes
  app.get("/api/projects/:id/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const messages = await storage.getProjectMessages(projectId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects/:id/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { message } = req.body;

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const newMessage = await storage.createProjectMessage({
        projectId,
        userId: req.user!.id,
        message,
      });

      // Notify the other party (if client sends message, notify admin; if admin sends, notify client)
      if (req.user!.role === "client") {
        // Client sent message, notify admins
        const adminUsers = await storage.getUsersByRole("admin");
        for (const admin of adminUsers) {
          await notifyNewMessage(
            admin.id,
            req.user!.fullName,
            project.name,
            message
          );
        }
      } else if (req.user!.role === "admin") {
        // Admin sent message, notify client
        await notifyNewMessage(
          project.clientId,
          req.user!.fullName,
          project.name,
          message
        );
      }

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error creating project message:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/projects/:id/files", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const files = await storage.getProjectFiles(projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects/:id/files", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { fileName, fileUrl, fileType } = req.body;

      const newFile = await storage.createProjectFile({
        projectId,
        fileName,
        fileUrl,
        fileType,
        uploadedBy: req.user!.id,
      });

      res.status(201).json(newFile);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/projects/:id/timeline", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const timeline = await storage.getProjectTimeline(projectId);
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects/:id/timeline", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const timelineData = { ...req.body, projectId };

      const timeline = await storage.createProjectTimeline(timelineData);
      res.status(201).json(timeline);
    } catch (error) {
      console.error("Error creating project timeline:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/projects/:id/timeline/:timelineId", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      const updates = req.body;

      const timeline = await storage.updateProjectTimeline(timelineId, updates);
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Budget Negotiation Routes
  app.get("/api/projects/:id/budget-negotiations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const negotiations = await storage.getBudgetNegotiations(projectId);
      res.json(negotiations);
    } catch (error) {
      console.error("Error getting budget negotiations:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects/:id/budget-negotiations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { proposedPrice, message } = req.body;

      // Get project for original price
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const negotiation = await storage.createBudgetNegotiation({
        projectId,
        proposedBy: req.user!.id,
        originalPrice: project.price,
        proposedPrice: proposedPrice.toString(),
        message,
        status: "pending",
      });

      // Notify the other party about the budget negotiation
      if (req.user!.role === "client") {
        // Client made proposal, notify admins
        const adminUsers = await storage.getUsersByRole("admin");
        for (const admin of adminUsers) {
          await notifyBudgetNegotiation(
            admin.id,
            project.name,
            proposedPrice.toString(),
            message || "",
            false
          );
        }
      } else if (req.user!.role === "admin") {
        // Admin made counter-proposal, notify client
        await notifyBudgetNegotiation(
          project.clientId,
          project.name,
          proposedPrice.toString(),
          message || "",
          true
        );
      }

      res.status(201).json(negotiation);
    } catch (error) {
      console.error("Error creating budget negotiation:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/budget-negotiations/:id/respond", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const negotiationId = parseInt(req.params.id);
      const { status, message, counterPrice } = req.body;

      let updates: any = { status };

      // If accepting, also update the project price
      if (status === "accepted") {
        const [negotiation] = await db
          .select()
          .from(budgetNegotiations)
          .where(eq(budgetNegotiations.id, negotiationId))
          .limit(1);

        if (negotiation) {
          await storage.updateProject(negotiation.projectId, {
            price: negotiation.proposedPrice,
            status: "in_progress",
          });

          // Get project and client info for email notification
          const project = await storage.getProject(negotiation.projectId);
          const client = await storage.getUserById(project?.clientId);

          if (project && client) {
            // Notify all admins about acceptance
            const adminUsers = await storage.getUsersByRole("admin");
            for (const admin of adminUsers) {
              try {
                if (admin.email) {
                  await sendEmail({
                    to: admin.email,
                    subject: `✅ Contraoferta Aceptada: ${project.name} - $${negotiation.proposedPrice}`,
                    html: generateBudgetAcceptanceEmailHTML(
                      project.name,
                      client.fullName,
                      client.email,
                      negotiation.originalPrice,
                      negotiation.proposedPrice,
                      message || ""
                    ),
                  });
                  console.log(`✅ Email de aceptación de contraoferta enviado a admin: ${admin.email}`);
                }
              } catch (adminError) {
                console.error(`❌ Error enviando email de aceptación a admin ${admin.id}:`, adminError);
              }
            }

            // También enviar al email principal del sistema
            try {
              await sendEmail({
                to: process.env.GMAIL_USER || 'softwarepar.lat@gmail.com',
                subject: `✅ Contraoferta Aceptada: ${project.name} - $${negotiation.proposedPrice}`,
                html: generateBudgetAcceptanceEmailHTML(
                  project.name,
                  client.fullName,
                  client.email,
                  negotiation.originalPrice,
                  negotiation.proposedPrice,
                  message || ""
                ),
              });
              console.log(`✅ Email de aceptación enviado al email principal del sistema`);
            } catch (systemEmailError) {
              console.error(`❌ Error enviando email de aceptación al sistema principal:`, systemEmailError);
            }
          }
        }
      }

      // If countering, create new negotiation
      if (status === "countered" && counterPrice) {
        const [oldNegotiation] = await db
          .select()
          .from(budgetNegotiations)
          .where(eq(budgetNegotiations.id, negotiationId))
          .limit(1);

        if (oldNegotiation) {
          await storage.createBudgetNegotiation({
            projectId: oldNegotiation.projectId,
            proposedBy: req.user!.id,
            originalPrice: oldNegotiation.proposedPrice,
            proposedPrice: counterPrice.toString(),
            message,
            status: "pending",
          });
        }
      }

      const updated = await storage.updateBudgetNegotiation(negotiationId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error responding to budget negotiation:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Ticket Routes
  app.get("/api/tickets", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const tickets = await storage.getTickets(req.user!.id);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/tickets", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { title, description, priority, projectId } = req.body;

      const ticketData = {
        title,
        description,
        priority: priority || "medium",
        userId: req.user!.id,
        projectId: projectId || null,
      };

      const ticket = await storage.createTicket(ticketData);

      // Notify admins about new ticket
      const adminUsers = await storage.getUsersByRole("admin");
      const adminIds = adminUsers.map(admin => admin.id);
      await notifyTicketCreated(adminIds, req.user!.fullName, title);

      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/tickets/:id/responses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { message } = req.body;

      // Get ticket info
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket no encontrado" });
      }

      const response = await storage.createTicketResponse({
        ticketId,
        userId: req.user!.id,
        message,
        isFromSupport: req.user!.role === "admin",
      });

      // Notify the other party about the response
      if (req.user!.role === "admin") {
        // Admin responded, notify the ticket creator (client)
        await notifyTicketResponse(
          ticket.userId,
          req.user!.fullName,
          ticket.title,
          message,
          true
        );
      } else {
        // Client responded, notify admins
        const adminUsers = await storage.getUsersByRole("admin");
        for (const admin of adminUsers) {
          await notifyTicketResponse(
            admin.id,
            req.user!.fullName,
            ticket.title,
            message,
            false
          );
        }
      }

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating ticket response:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/tickets/:id/responses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const responses = await storage.getTicketResponses(ticketId);
      res.json(responses);
    } catch (error) {
      console.error("Error getting ticket responses:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Notification Routes
  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notificación marcada como leída" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Payment Stages Routes
  app.post("/api/projects/:id/payment-stages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { stages } = req.body;

      // Verify project exists and user has access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Create payment stages
      const createdStages = [];
      const availableStages = [];
      for (const stage of stages) {
        const stageData = {
          projectId: projectId,
          stageName: stage.name,
          stagePercentage: stage.percentage,
          amount: (parseFloat(project.price) * stage.percentage / 100),
          requiredProgress: stage.requiredProgress,
          status: stage.requiredProgress === 0 ? 'available' : 'pending'
        };
        const created = await storage.createPaymentStage(stageData);
        createdStages.push(created);

        // Recopilar etapas disponibles para notificar
        if (stageData.status === 'available') {
          availableStages.push(created);
        }
      }

      // Notificar al cliente por email sobre etapas disponibles
      if (availableStages.length > 0) {
        const client = await storage.getUserById(project.clientId);
        if (client?.email) {
          for (const stage of availableStages) {
            try {
              await sendEmail({
                to: client.email,
                subject: `💰 Pago Disponible: ${project.name} - ${stage.stageName}`,
                html: generatePaymentStageAvailableEmailHTML(
                  client.fullName,
                  project.name,
                  stage.stageName,
                  stage.amount.toString(),
                  stage.stagePercentage
                ),
              });
              console.log(`📧 Email de etapa disponible enviado a cliente: ${client.email} para etapa: ${stage.stageName}`);
            } catch (emailError) {
              console.error(`❌ Error enviando email de etapa disponible a cliente:`, emailError);
            }
          }
        }
      }

      // Crear timeline automáticamente solo si no existe ya uno
      const hasTimeline = await storage.hasProjectTimeline(projectId);

      if (!hasTimeline) {
        const timelineItems = [
          {
            title: "Análisis y Planificación",
            description: "Análisis de requerimientos y planificación del proyecto",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Diseño y Arquitectura",
            description: "Diseño de la interfaz y arquitectura del sistema",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Desarrollo - Fase 1",
            description: "Desarrollo de funcionalidades principales (50% del proyecto)",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Desarrollo - Fase 2",
            description: "Completar desarrollo y optimizaciones (90% del proyecto)",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Testing y QA",
            description: "Pruebas exhaustivas y control de calidad",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Entrega Final",
            description: "Entrega del proyecto completado y documentación",
            status: "pending",
            estimatedDate: null
          }
        ];

        // Crear elementos del timeline
        for (const timelineItem of timelineItems) {
          await storage.createProjectTimeline({
            projectId: projectId,
            title: timelineItem.title,
            description: timelineItem.description,
            status: timelineItem.status,
            estimatedDate: timelineItem.estimatedDate,
          });
        }
      }

      res.json(createdStages);
    } catch (error) {
      console.error("Error creating payment stages:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/projects/:id/payment-stages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const stages = await storage.getPaymentStages(projectId);
      res.json(stages);
    } catch (error) {
      console.error("Error fetching payment stages:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.patch("/api/payment-stages/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);
      const updates = req.body;
      const updated = await storage.updatePaymentStage(stageId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating payment stage:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/payment-stages/:id/complete", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);
      const updated = await storage.completePaymentStage(stageId);
      res.json(updated);
    } catch (error) {
      console.error("Error completing payment stage:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/payment-stages/:id/confirm-payment", authenticateToken, upload.single('proofFile'), async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);

      // Obtener datos del formulario (multipart/form-data)
      const paymentMethod = req.body.paymentMethod;
      const proofFileInfo = req.body.proofFileInfo ? JSON.parse(req.body.proofFileInfo) : null;
      const proofFile = req.file; // Archivo procesado por multer

      console.log(`💰 Procesando confirmación de pago para etapa ${stageId}:`, {
        paymentMethod,
        hasFile: !!proofFile,
        fileName: proofFile?.originalname,
        fileSize: proofFile?.size,
        mimetype: proofFile?.mimetype
      });

      // Get stage info and project details
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const client = await storage.getUserById(project.clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      // Construir URL del archivo si existe
      let proofFileUrl = null;
      if (proofFile) {
        proofFileUrl = `comprobante_${stageId}_${Date.now()}_${proofFile.originalname}`;
      } else if (proofFileInfo) {
        proofFileUrl = `comprobante_${stageId}_${Date.now()}.${proofFileInfo.fileType?.split('/')[1] || 'jpg'}`;
      }

      const updated = await storage.updatePaymentStage(stageId, {
        paymentMethod,
        proofFileUrl,
        status: 'pending_verification',
        paymentData: {
          confirmedBy: req.user!.id,
          confirmedAt: new Date(),
          method: paymentMethod,
          fileInfo: proofFileInfo || (proofFile ? {
            fileName: proofFile.originalname,
            fileSize: proofFile.size,
            fileType: proofFile.mimetype
          } : null),
          originalFileName: proofFile?.originalname
        }
      });

      // Notify admin about payment confirmation
      const adminUsers = await storage.getUsersByRole("admin");
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: "📋 Comprobante de Pago Recibido",
          message: `El cliente ${client.fullName} envió comprobante de pago para "${stage[0].stageName}" mediante ${paymentMethod}. ${proofFile ? 'Comprobante adjunto: ' + proofFile.originalname : 'Sin comprobante adjunto'}. Requiere verificación.`,
          type: "warning",
        });
      }

      // Send email notifications
      try {
        // Preparar información del archivo para el email
        let fileAttachmentInfo = null;
        if (proofFile) {
          const fileSizeMB = (proofFile.size / 1024 / 1024).toFixed(2);
          fileAttachmentInfo = `📎 Comprobante adjunto: ${proofFile.originalname} (${fileSizeMB} MB) - Tipo: ${proofFile.mimetype}`;
          console.log(`📎 Archivo recibido: ${proofFile.originalname}, Tamaño: ${fileSizeMB}MB, Tipo: ${proofFile.mimetype}`);
        } else if (proofFileInfo) {
          const fileSizeMB = (proofFileInfo.fileSize / 1024 / 1024).toFixed(2);
          fileAttachmentInfo = `📎 Archivo indicado: ${proofFileInfo.fileName} (${fileSizeMB} MB) - ${proofFileInfo.fileType}`;
        } else {
          console.log(`ℹ️ No se adjuntó comprobante para la etapa ${stageId}`);
        }

        // Notificar al admin por email con información del comprobante
        await sendPaymentProofNotificationToAdmin(
          client.fullName,
          project.name,
          stage[0].stageName,
          stage[0].amount,
          paymentMethod,
          fileAttachmentInfo
        );

        // Confirmar al cliente por email
        await sendPaymentProofConfirmationToClient(
          client.email,
          client.fullName,
          project.name,
          stage[0].stageName,
          stage[0].amount,
          paymentMethod
        );

        console.log(`📧 Notificaciones de email enviadas para pago de ${client.fullName}`);
      } catch (emailError) {
        console.error("❌ Error enviando notificaciones por email:", emailError);
        // No fallar la operación por errores de email
      }

      res.json({
        ...updated,
        message: "Comprobante enviado exitosamente. Tu pago está pendiente de verificación por nuestro equipo. Te notificaremos cuando sea aprobado.",
      });
    } catch (error) {
      console.error("❌ Error confirming payment stage:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/payment-stages/:id/approve-payment", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);
      console.log(`✅ Admin aprobando pago para etapa: ${stageId}`);

      // Get stage info and project details
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        console.error(`❌ Etapa ${stageId} no encontrada`);
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      if (stage[0].status !== 'pending_verification') {
        return res.status(400).json({ message: "Esta etapa no está pendiente de verificación" });
      }

      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        console.error(`❌ Proyecto ${stage[0].projectId} no encontrado`);
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const client = await storage.getUserById(project.clientId);
      if (!client) {
        console.error(`❌ Cliente ${project.clientId} no encontrado`);
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      // Update stage to paid
      const updated = await storage.updatePaymentStage(stageId, {
        status: 'paid',
        paidAt: new Date(),
        approvedBy: req.user!.id,
        approvedAt: new Date()
      });

      // Notify client about payment approval
      await storage.createNotification({
        userId: project.clientId,
        title: "✅ Pago Aprobado",
        message: `Tu pago para la etapa "${stage[0].stageName}" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!`,
        type: "success",
      });

      res.json({
        ...updated,
        message: "Pago aprobado exitosamente"
      });
    } catch (error) {
      console.error("❌ Error approving payment:", error);
      res.status(500).json({
        message: "Error al aprobar pago",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/payment-stages/:id/reject-payment", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);
      const { reason } = req.body;
      console.log(`❌ Admin rechazando pago para etapa: ${stageId}, razón: ${reason}`);

      // Get stage info and project details
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        console.error(`❌ Etapa ${stageId} no encontrada`);
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      if (stage[0].status !== 'pending_verification') {
        return res.status(400).json({ message: "Esta etapa no está pendiente de verificación" });
      }

      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        console.error(`❌ Proyecto ${stage[0].projectId} no encontrado`);
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Update stage back to available
      const updated = await storage.updatePaymentStage(stageId, {
        status: 'available',
        paymentMethod: null,
        proofFileUrl: null,
        paymentData: {
          ...stage[0].paymentData,
          rejectedBy: req.user!.id,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      // Notify client about payment rejection
      await storage.createNotification({
        userId: project.clientId,
        title: "❌ Pago Rechazado",
        message: `Tu comprobante de pago para "${stage[0].stageName}" fue rechazado. Motivo: ${reason}. Por favor, envía un nuevo comprobante.`,
        type: "error",
      });

      res.json({
        ...updated,
        message: "Pago rechazado"
      });
    } catch (error) {
      console.error("❌ Error rejecting payment:", error);
      res.status(500).json({
        message: "Error al rechazar pago",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/payment-stages/:id/receipt-file", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);

      // Get stage info
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      // Check if user has permission to view this file
      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Only admin or project client can view the receipt
      if (req.user!.role !== "admin" && project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para ver este archivo" });
      }

      // Check if there's a payment proof file
      if (!stage[0].proofFileUrl) {
        return res.status(404).json({ message: "No hay comprobante disponible" });
      }

      // For now, we'll return file info since we don't have actual file storage
      // In a real implementation, you would serve the actual file from storage
      const fileInfo = stage[0].paymentData?.fileInfo || {};

      res.json({
        message: "Información del comprobante",
        fileName: stage[0].paymentData?.originalFileName || "comprobante.jpg",
        fileUrl: stage[0].proofFileUrl,
        fileType: fileInfo.fileType || "image/jpeg",
        fileSize: fileInfo.fileSize || 0,
        uploadedAt: stage[0].paymentData?.confirmedAt || stage[0].updatedAt,
        note: "En un entorno de producción, aquí se serviría el archivo real desde el almacenamiento."
      });
    } catch (error) {
      console.error("❌ Error serving receipt file:", error);
      res.status(500).json({
        message: "Error al servir archivo",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Endpoint para descargar factura de etapa de pago
  app.get("/api/client/stage-invoices/:stageId/download", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.stageId);

      if (isNaN(stageId)) {
        return res.status(400).json({ message: "ID de etapa inválido" });
      }

      // Get stage info
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      // Get project info
      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Verificar que la etapa pertenece al cliente
      if (project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para ver esta factura" });
      }

      // Verificar que la etapa esté pagada
      if (stage[0].status !== 'paid') {
        return res.status(400).json({ message: "Esta etapa aún no ha sido pagada" });
      }

      // Get all stages to determine which stage number this is
      const allStages = await storage.getPaymentStages(stage[0].projectId);
      const sortedStages = allStages.sort((a: any, b: any) => a.requiredProgress - b.requiredProgress);
      const stageNumber = sortedStages.findIndex(s => s.id === stage[0].id) + 1;
      const totalStages = sortedStages.length;

      // Generate professional invoice number
      const invoiceNumber = `${String(new Date().getFullYear()).slice(-2)}${String(stage[0].projectId).padStart(4, '0')}`;
      const issueDate = new Date().toLocaleDateString('es-PY');

      // Create PDF document with A4 size
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="SoftwarePar_Factura_${invoiceNumber}_Etapa_${stageNumber}.pdf"`);

      // Handle PDF stream errors
      doc.on('error', (error) => {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error generando PDF" });
        }
      });

      // Pipe PDF to response
      doc.pipe(res);

      // Page dimensions
      const pageWidth = 595;
      const leftMargin = 50;
      const rightMargin = 50;
      const contentWidth = pageWidth - leftMargin - rightMargin;

      // HEADER with blue background like the example
      doc.rect(0, 0, pageWidth, 100).fillColor('#2563eb').fill();

      // Company logo placeholder and name in header
      doc.fontSize(20).fillColor('#ffffff').text('SoftwarePar', leftMargin, 30);
      doc.fontSize(12).fillColor('#ffffff').text('Desarrollo de Software Profesional', leftMargin, 55);

      // INVOICE title on the right
      doc.fontSize(36).fillColor('#ffffff').text('INVOICE', pageWidth - 200, 25);

      // Company details below header
      let yPos = 120;
      doc.fontSize(14).fillColor('#000').text('SoftwarePar S.R.L.', leftMargin, yPos);
      yPos += 20;
      doc.fontSize(10).fillColor('#6b7280');
      doc.text('Paraguay, América del Sur', leftMargin, yPos);
      doc.text('Phone: +595 985 990 046', leftMargin, yPos + 12);
      doc.text('Email: softwarepar.lat@gmail.com', leftMargin, yPos + 24);

      // Invoice details on the right
      const rightColumnX = 350;
      let rightYPos = 120;
      doc.fontSize(10).fillColor('#374151');
      doc.text('Date:', rightColumnX, rightYPos);
      doc.text('Invoice #:', rightColumnX, rightYPos + 15);
      doc.text('Etapa de Pago:', rightColumnX, rightYPos + 30);

      doc.fontSize(10).fillColor('#000');
      doc.text(issueDate, rightColumnX + 70, rightYPos);
      doc.text(invoiceNumber, rightColumnX + 70, rightYPos + 15);
      doc.text(`${stageNumber} de ${totalStages}`, rightColumnX + 70, rightYPos + 30);

      // Bill To section with blue header like example
      yPos = 240;
      doc.rect(leftMargin, yPos, contentWidth, 25).fillColor('#2563eb').fill();
      doc.fontSize(12).fillColor('#ffffff').text('Bill To:', leftMargin + 10, yPos + 7);

      yPos += 35;
      doc.fontSize(11).fillColor('#000');
      doc.text(req.user!.fullName, leftMargin + 10, yPos);
      doc.text(req.user!.email, leftMargin + 10, yPos + 15);
      doc.text(`Cliente ID: ${req.user!.id.toString().padStart(6, '0')}`, leftMargin + 10, yPos + 30);
      doc.text(`Proyecto: ${project.name}`, leftMargin + 10, yPos + 45);

      // Table header with blue background like example
      yPos = 320;
      const tableX = leftMargin;
      const tableWidth = contentWidth;
      const rowHeight = 30;

      // Table header
      doc.rect(tableX, yPos, tableWidth, rowHeight).fillColor('#2563eb').fill();

      doc.fontSize(11).fillColor('#ffffff');
      doc.text('Quantity', tableX + 10, yPos + 9);
      doc.text('Description', tableX + 80, yPos + 9);
      doc.text('Unit price', tableX + 320, yPos + 9);
      doc.text('Amount', tableX + 420, yPos + 9);

      // Table rows with alternating colors
      const rows = [
        {
          qty: '1',
          description: `${stage[0].stageName} - Etapa ${stageNumber} de ${totalStages}`,
          unitPrice: `$ ${parseFloat(stage[0].amount).toFixed(2)}`,
          amount: `$ ${parseFloat(stage[0].amount).toFixed(2)}`
        }
      ];

      yPos += rowHeight;
      let isEvenRow = false;

      rows.forEach((row, index) => {
        // Alternate row colors
        if (isEvenRow) {
          doc.rect(tableX, yPos, tableWidth, rowHeight).fillColor('#f8f9fa').fill();
        }

        doc.rect(tableX, yPos, tableWidth, rowHeight).strokeColor('#e5e7eb').stroke();

        doc.fontSize(10).fillColor('#000');
        doc.text(row.qty, tableX + 15, yPos + 10);
        doc.text(row.description, tableX + 80, yPos + 10);
        doc.text(row.unitPrice, tableX + 320, yPos + 10);
        doc.text(row.amount, tableX + 420, yPos + 10);

        yPos += rowHeight;
        isEvenRow = !isEvenRow;
      });

      // Add 8 empty rows like in the example
      for (let i = 0; i < 8; i++) {
        if (isEvenRow) {
          doc.rect(tableX, yPos, tableWidth, rowHeight).fillColor('#f8f9fa').fill();
        }
        doc.rect(tableX, yPos, tableWidth, rowHeight).strokeColor('#e5e7eb').stroke();
        yPos += rowHeight;
        isEvenRow = !isEvenRow;
      }

      // Totals section on the right like example
      yPos += 20;
      const totalsX = 350;
      const totalsWidth = 145;

      // Subtotal
      doc.fontSize(10).fillColor('#374151');
      doc.text('Subtotal', totalsX, yPos);
      doc.text(`$ ${parseFloat(stage[0].amount).toFixed(2)}`, totalsX + 100, yPos);

      yPos += 20;
      doc.text('Tax', totalsX, yPos);
      doc.text('0.00%', totalsX + 100, yPos);

      // Balance due with blue background like example
      yPos += 25;
      doc.rect(totalsX, yPos - 5, totalsWidth, 30).fillColor('#2563eb').fill();
      doc.fontSize(12).fillColor('#ffffff').text('Balance due', totalsX + 10, yPos + 7);
      doc.fontSize(14).fillColor('#ffffff').text(`$ ${parseFloat(stage[0].amount).toFixed(2)}`, totalsX + 90, yPos + 7);

      // Payment information
      yPos += 60;
      doc.fontSize(11).fillColor('#000').text('Información de la Etapa de Pago:', leftMargin, yPos);
      yPos += 20;
      doc.fontSize(10).fillColor('#374151');
      doc.text(`• Esta es la etapa ${stageNumber} de ${totalStages} del proyecto`, leftMargin, yPos);
      doc.text(`• Estado: PAGADO ✓`, leftMargin, yPos + 15);
      doc.text(`• Método de pago: ${stage[0].paymentMethod || 'Transferencia Bancaria'}`, leftMargin, yPos + 30);
      doc.text(`• Fecha de pago: ${stage[0].paidAt ? new Date(stage[0].paidAt).toLocaleDateString('es-PY') : issueDate}`, leftMargin, yPos + 45);

      // Footer message like example
      yPos += 80;
      doc.fontSize(16).fillColor('#2563eb').text('¡Gracias por confiar en SoftwarePar!', leftMargin, yPos, { align: 'center', width: contentWidth });

      // Company footer info
      yPos += 40;
      doc.fontSize(9).fillColor('#6b7280');
      doc.text('SoftwarePar S.R.L. • RUC: En proceso • Paraguay', leftMargin, yPos, { align: 'center', width: contentWidth });
      doc.text('Email: softwarepar.lat@gmail.com • Tel: +595 985 990 046', leftMargin, yPos + 12, { align: 'center', width: contentWidth });

      // Authorized signature
      doc.text('Firma Autorizada', totalsX + 20, yPos + 30);
      doc.moveTo(totalsX + 20, yPos + 50).lineTo(totalsX + 120, yPos + 50).stroke();

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error("❌ Error downloading stage invoice:", error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Error interno del servidor",
          error: process.env.NODE_ENV === 'development' ? error.message : 'Error al generar factura'
        });
      }
    }
  });

  // Endpoint para descargar Boleta RESIMPLE (versión simplificada según SET Paraguay)
  app.get("/api/client/stage-invoices/:stageId/download-resimple", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.stageId);

      if (isNaN(stageId)) {
        return res.status(400).json({ message: "ID de etapa inválido" });
      }

      // Get stage info
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      // Get project info
      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Verificar que la etapa pertenece al cliente
      if (project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para ver esta factura" });
      }

      // Verificar que la etapa esté pagada
      if (stage[0].status !== 'paid') {
        return res.status(400).json({ message: "Esta etapa aún no ha sido pagada" });
      }

      // Get company billing info (ORDEN CORRECTO: primero más reciente)
      const companyInfo = await db
        .select()
        .from(companyBillingInfo)
        .where(eq(companyBillingInfo.isActive, true))
        .orderBy(sql`${companyBillingInfo.updatedAt} DESC`)
        .limit(1);

      console.log('📋 Company info para factura:', companyInfo[0]);

      // Get client billing info
      const clientInfo = await db
        .select()
        .from(clientBillingInfo)
        .where(eq(clientBillingInfo.userId, req.user!.id))
        .limit(1);

      // Get all stages to determine stage info
      const allStages = await storage.getPaymentStages(stage[0].projectId);
      const sortedStages = allStages.sort((a: any, b: any) => a.requiredProgress - b.requiredProgress);
      const stageNumber = sortedStages.findIndex(s => s.id === stage[0].id) + 1;
      const totalStages = sortedStages.length;

      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(project.id).padStart(4, '0')}-${String(stageNumber).padStart(2, '0')}`;
      const issueDate = new Date().toLocaleDateString('es-PY', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });

      // Create PDF document with professional layout
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4'
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="SoftwarePar_Boleta_RESIMPLE_${invoiceNumber}.pdf"`);

      // Handle PDF stream errors
      doc.on('error', (error) => {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error generando PDF" });
        }
        return;
      });

      // Pipe PDF to response
      doc.pipe(res);

      // Page dimensions and professional styling
      const pageWidth = 595.28; // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      
      // Professional color scheme
      const primaryColor = '#2563eb'; // Professional blue
      const secondaryColor = '#1e40af'; // Darker blue
      const textColor = '#1f2937'; // Dark gray
      const lightGray = '#f3f4f6';
      const borderColor = '#e5e7eb';

      // ===== HEADER SECTION =====
      let yPos = margin;

      // Logo/Company name section with blue background
      doc.rect(0, 0, pageWidth, 80)
        .fill(primaryColor);

      // Company name in header
      doc.fontSize(24)
        .fillColor('#ffffff')
        .text(companyInfo[0]?.companyName || 'SoftwarePar S.R.L.', margin, 25, {
          width: contentWidth * 0.6,
          align: 'left'
        });

      // BOLETA title on the right
      doc.fontSize(28)
        .fillColor('#ffffff')
        .text('BOLETA RESIMPLE', pageWidth - 200, 20, {
          width: 150,
          align: 'right'
        });

      // Company details section
      yPos = 100;
      
      // Company info box
      doc.rect(margin, yPos, contentWidth * 0.6, 80)
        .fillAndStroke(lightGray, borderColor)
        .lineWidth(1);

      yPos += 15;
      doc.fontSize(12)
        .fillColor(textColor)
        .text(`RUC: ${companyInfo[0]?.ruc || 'En proceso'}`, margin + 15, yPos);
      
      yPos += 15;
      doc.text(`${companyInfo[0]?.address || 'Paraguay, América del Sur'}`, margin + 15, yPos, {
        width: contentWidth * 0.6 - 30
      });
      
      yPos += 15;
      doc.text(`Ciudad: ${companyInfo[0]?.city || 'Itapúa'} - ${companyInfo[0]?.country || 'Paraguay'}`, margin + 15, yPos);
      
      yPos += 15;
      doc.text(`Tel: ${companyInfo[0]?.phone || '+595 985 990 046'}`, margin + 15, yPos);
      
      yPos += 15;
      doc.text(`Email: ${companyInfo[0]?.email || 'softwarepar.lat@gmail.com'}`, margin + 15, yPos);

      // Invoice details box on the right
      const rightBoxX = margin + contentWidth * 0.65;
      const rightBoxWidth = contentWidth * 0.35;
      
      doc.rect(rightBoxX, 100, rightBoxWidth, 80)
        .fillAndStroke(lightGray, borderColor)
        .lineWidth(1);

      yPos = 115;
      doc.fontSize(12)
        .fillColor(textColor)
        .text('Número:', rightBoxX + 15, yPos);
      doc.fontSize(11)
        .text(invoiceNumber, rightBoxX + 15, yPos + 12);
      
      yPos += 30;
      doc.fontSize(12)
        .text('Fecha:', rightBoxX + 15, yPos);
      doc.fontSize(11)
        .text(issueDate, rightBoxX + 15, yPos + 12);

      // ===== CLIENT SECTION =====
      yPos = 200;
      
      // Client section header
      doc.rect(margin, yPos, contentWidth, 25)
        .fill(secondaryColor);
      
      doc.fontSize(14)
        .fillColor('#ffffff')
        .text('DATOS DEL CLIENTE', margin + 15, yPos + 7);

      yPos += 35;
      const clientName = clientInfo[0]?.legalName || req.user!.fullName;
      
      doc.fontSize(12)
        .fillColor(textColor)
        .text('Cliente:', margin, yPos);
      doc.fontSize(11)
        .text(clientName, margin + 80, yPos, { width: 300 });
      
      yPos += 20;
      if (clientInfo[0]?.documentType && clientInfo[0]?.documentNumber) {
        doc.fontSize(12)
          .text(`${clientInfo[0].documentType}:`, margin, yPos);
        doc.fontSize(11)
          .text(clientInfo[0].documentNumber, margin + 80, yPos);
        yPos += 20;
      }
      
      doc.fontSize(12)
        .text('Email:', margin, yPos);
      doc.fontSize(11)
        .text(req.user!.email, margin + 80, yPos, { width: 300 });
      
      yPos += 20;
      if (clientInfo[0]?.address) {
        doc.fontSize(12)
          .text('Dirección:', margin, yPos);
        doc.fontSize(11)
          .text(clientInfo[0].address, margin + 80, yPos, { width: 350 });
        yPos += 20;
      }

      // ===== SERVICES TABLE =====
      yPos += 20;
      
      // Table headers
      const tableStartY = yPos;
      const colWidths = [80, 300, 100, 100]; // Adjusted for better spacing
      
      // Header row
      doc.rect(margin, tableStartY, contentWidth, 30)
        .fill(primaryColor);
      
      doc.fontSize(12)
        .fillColor('#ffffff')
        .text('Cantidad', margin + 10, tableStartY + 10)
        .text('Descripción del Servicio', margin + colWidths[0] + 10, tableStartY + 10)
        .text('Precio Unit.', margin + colWidths[0] + colWidths[1] + 10, tableStartY + 10)
        .text('Total', margin + colWidths[0] + colWidths[1] + colWidths[2] + 10, tableStartY + 10);

      // Content row
      yPos = tableStartY + 30;
      const rowHeight = 40;
      
      doc.rect(margin, yPos, contentWidth, rowHeight)
        .fillAndStroke('#ffffff', borderColor)
        .lineWidth(1);
      
      doc.fontSize(11)
        .fillColor(textColor)
        .text('1', margin + 10, yPos + 15)
        .text(`${stage[0].stageName}`, margin + colWidths[0] + 10, yPos + 8, { 
          width: colWidths[1] - 20,
          height: rowHeight - 16
        })
        .text(`Etapa ${stageNumber} de ${totalStages}`, margin + colWidths[0] + 10, yPos + 22, { 
          width: colWidths[1] - 20
        })
        .text(`$ ${parseFloat(stage[0].amount).toFixed(2)}`, margin + colWidths[0] + colWidths[1] + 10, yPos + 15)
        .text(`$ ${parseFloat(stage[0].amount).toFixed(2)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + 10, yPos + 15);

      // ===== TOTALS SECTION =====
      yPos += rowHeight + 30;
      const totalsX = pageWidth - 200;
      
      // Subtotal
      doc.fontSize(11)
        .fillColor(textColor)
        .text('Subtotal:', totalsX, yPos)
        .text(`$ ${parseFloat(stage[0].amount).toFixed(2)}`, totalsX + 80, yPos);
      
      yPos += 18;
      doc.text('IVA (Exento):', totalsX, yPos)
        .text('$ 0.00', totalsX + 80, yPos);
      
      // Total with highlight
      yPos += 25;
      doc.rect(totalsX - 10, yPos - 5, 180, 25)
        .fill(primaryColor);
        
      doc.fontSize(14)
        .fillColor('#ffffff')
        .text('TOTAL:', totalsX, yPos + 5)
        .text(`$ ${parseFloat(stage[0].amount).toFixed(2)}`, totalsX + 80, yPos + 5);

      // ===== PAYMENT INFO =====
      yPos += 50;
      
      doc.rect(margin, yPos, contentWidth, 25)
        .fill(secondaryColor);
      
      doc.fontSize(14)
        .fillColor('#ffffff')
        .text('INFORMACIÓN DE PAGO', margin + 15, yPos + 7);

      yPos += 35;
      doc.fontSize(11)
        .fillColor(textColor)
        .text(`Método de pago: ${stage[0].paymentMethod || 'Transferencia Bancaria'}`, margin, yPos);
      
      yPos += 18;
      doc.text('Estado: PAGADO ✓', margin, yPos);
      
      yPos += 18;
      doc.text(`Fecha de pago: ${stage[0].paidAt ? new Date(stage[0].paidAt).toLocaleDateString('es-PY') : issueDate}`, margin, yPos);

      // ===== FOOTER =====
      yPos = pageHeight - 100;
      
      // Legal notice box
      doc.rect(margin, yPos, contentWidth, 60)
        .fillAndStroke('#f8f9fa', '#e9ecef')
        .lineWidth(1);
      
      yPos += 15;
      doc.fontSize(10)
        .fillColor('#6c757d')
        .text('Régimen RESIMPLE - SET Paraguay', margin + 15, yPos, {
          align: 'center',
          width: contentWidth - 30
        });
      
      yPos += 12;
      doc.text(`Régimen Tributario: ${companyInfo[0]?.taxRegime || 'Pequeño Contribuyente - RESIMPLE'}`, margin + 15, yPos, {
        align: 'center',
        width: contentWidth - 30
      });
      
      yPos += 12;
      doc.text('Servicios digitales exentos de IVA según Ley 125/91', margin + 15, yPos, {
        align: 'center',
        width: contentWidth - 30
      });

      // Final thank you
      yPos += 20;
      doc.fontSize(12)
        .fillColor(primaryColor)
        .text('¡Gracias por confiar en SoftwarePar!', margin, yPos, {
          align: 'center',
          width: contentWidth
        });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error("❌ Error downloading RESIMPLE invoice:", error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Error interno del servidor",
          error: process.env.NODE_ENV === 'development' ? error.message : 'Error al generar Boleta RESIMPLE'
        });
      }
      return;
    }
  });


  // Payment Routes - TODO: Implementar nuevo sistema de pagos

  // Portfolio Routes
  app.get("/api/portfolio", async (req, res) => {
    try {
      const portfolioItems = await storage.getPortfolio();
      res.json(portfolioItems);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/portfolio", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const portfolioData = req.body;
      const portfolio = await storage.createPortfolio(portfolioData);
      res.status(201).json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/portfolio/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const updates = req.body;
      const portfolio = await storage.updatePortfolio(portfolioId, updates);
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/portfolio/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      await storage.deletePortfolio(portfolioId);
      res.json({ message: "Elemento del portfolio eliminado" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Client billing routes
  app.get("/api/client/invoices", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoices = await storage.getInvoicesByClient(req.user!.id);
      res.json(invoices);
    } catch (error) {
      console.error("Error getting client invoices:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app.get("/api/client/billing", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const billingData = await storage.getClientBillingData(req.user!.id);
      res.json(billingData);
    } catch (error) {
      console.error("Error getting client billing data:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/client/invoices", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoices = await storage.getInvoicesByClient(req.user!.id);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/client/payment-methods", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentMethods = await storage.getPaymentMethodsByUser(req.user!.id);
      res.json(paymentMethods);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/client/payment-methods", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentMethodData = {
        ...req.body,
        userId: req.user!.id,
      };
      const paymentMethod = await storage.createPaymentMethod(paymentMethodData);
      res.status(201).json(paymentMethod);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/client/payment-methods/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentMethodId = parseInt(req.params.id);
      const updates = req.body;
      const paymentMethod = await storage.updatePaymentMethod(paymentMethodId, updates);
      res.json(paymentMethod);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/client/payment-methods/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentMethodId = parseInt(req.params.id);
      await storage.deletePaymentMethod(paymentMethodId);
      res.json({ message: "Método de pago eliminado" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/client/transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const transactions = await storage.getTransactionsByUser(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Routes
  app.get("/api/admin/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Partners Management
  app.get("/api/admin/partners", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const partners = await storage.getAllPartnersForAdmin();
      res.json(partners);
    } catch (error) {
      console.error("Error getting partners for admin:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/partners/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getPartnerStatsForAdmin();
      res.json(stats);
    } catch (error) {
      console.error("Error getting partner stats for admin:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/partners/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const partnerId = parseInt(req.params.id);
      const updates = req.body;
      const partner = await storage.updatePartner(partnerId, updates);
      res.json(partner);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Users Stats
  app.get("/api/admin/users/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getUserStatsForAdmin();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const userData = req.body;

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create partner if role is partner
      if (userData.role === "partner") {
        const referralCode = `PAR${user.id}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        await storage.createPartner({
          userId: user.id,
          referralCode,
          commissionRate: "25.00",
          totalEarnings: "0.00",
        });
      }

      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.fullName);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }

      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        user: userWithoutPassword,
        message: "Usuario creado exitosamente",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }

      // No permitir que un admin se elimine a sí mismo
      if (req.user!.id === userId) {
        return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
      }

      await storage.deleteUser(userId);

      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting user:", error);

      if (error.message === "Usuario no encontrado") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message === "No se puede eliminar el último administrador del sistema") {
        return res.status(400).json({ message: error.message });
      }

      if (error.message === "No puedes eliminar tu propia cuenta") {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ 
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/projects", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const projects = await storage.getAllProjectsForAdmin();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/projects/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;

      console.log("Updating project:", projectId, "with data:", updates);

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID de proyecto inválido" });
      }

      // Validate dates if provided
      if (updates.startDate && updates.startDate !== null) {
        const startDate = new Date(updates.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ message: "Fecha de inicio inválida" });
        }
      }

      if (updates.deliveryDate && updates.deliveryDate !== null) {
        const deliveryDate = new Date(updates.deliveryDate);
        if (isNaN(deliveryDate.getTime())) {
          return res.status(400).json({ message: "Fecha de entrega inválida" });
        }
      }

      const project = await storage.updateProject(projectId, updates);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  app.delete("/api/admin/projects/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID de proyecto inválido" });
      }

      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      await storage.deleteProject(projectId);
      res.json({ message: "Proyecto eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/projects/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getProjectStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Analytics Routes
  app.get("/api/admin/analytics", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const period = req.query.period || '30';
      const analytics = await storage.getAnalyticsData(parseInt(period as string));
      res.json(analytics);
    } catch (error) {
      console.error("Error getting analytics data:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/analytics/revenue", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const period = req.query.period || '30';
      const revenueData = await storage.getRevenueAnalytics(parseInt(period as string));
      res.json(revenueData);
    } catch (error) {
      console.error("Error getting revenue analytics:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/analytics/users", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const period = req.query.period || '30';
      const userAnalytics = await storage.getUserAnalytics(parseInt(period as string));
      res.json(userAnalytics);
    } catch (error) {
      console.error("Error getting user analytics:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/analytics/export", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const format = req.query.format || 'pdf';
      const analytics = await storage.getAnalyticsData(30);

      // TODO: Implement PDF/Excel export
      res.json({ message: `Exporting analytics as ${format}`, data: analytics });
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Client Billing Information Routes
  app.get("/api/client/billing-info", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const billingInfo = await db
        .select()
        .from(clientBillingInfo)
        .where(eq(clientBillingInfo.userId, req.user!.id))
        .limit(1);

      if (billingInfo.length === 0) {
        return res.status(404).json({ message: "No se encontraron datos de facturación" });
      }

      res.json(billingInfo[0]);
    } catch (error) {
      console.error("Error getting client billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/client/billing-info", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const billingData = {
        ...req.body,
        userId: req.user!.id,
      };

      const [newBillingInfo] = await db
        .insert(clientBillingInfo)
        .values(billingData)
        .returning();

      res.status(201).json(newBillingInfo);
    } catch (error) {
      console.error("Error creating client billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/client/billing-info/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const billingId = parseInt(req.params.id);
      const updates = req.body;

      const [updatedBillingInfo] = await db
        .update(clientBillingInfo)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(
          eq(clientBillingInfo.id, billingId),
          eq(clientBillingInfo.userId, req.user!.id)
        ))
        .returning();

      if (!updatedBillingInfo) {
        return res.status(404).json({ message: "Datos de facturación no encontrados" });
      }

      res.json(updatedBillingInfo);
    } catch (error) {
      console.error("Error updating client billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Company Billing Information Routes (Admin only)
  app.get("/api/admin/company-billing-info", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const companyInfo = await db
        .select()
        .from(companyBillingInfo)
        .where(eq(companyBillingInfo.isActive, true))
        .limit(1);

      if (companyInfo.length === 0) {
        return res.status(404).json({ message: "No se encontraron datos de facturación de la empresa" });
      }

      res.json(companyInfo[0]);
    } catch (error) {
      console.error("Error getting company billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/company-billing-info", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      // Desactivar datos existentes
      await db
        .update(companyBillingInfo)
        .set({ isActive: false, updatedAt: new Date() });

      // Crear nuevos datos
      const [newCompanyInfo] = await db
        .insert(companyBillingInfo)
        .values({ ...req.body, isActive: true })
        .returning();

      res.status(201).json(newCompanyInfo);
    } catch (error) {
      console.error("Error creating company billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/company-billing-info/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const updates = req.body;

      console.log(`Updating company billing info ID ${companyId}:`, updates);

      // Validate required fields
      if (!updates.companyName || !updates.ruc || !updates.address || !updates.city) {
        return res.status(400).json({ 
          message: "Campos requeridos faltantes: companyName, ruc, address, city" 
        });
      }

      const [updatedCompanyInfo] = await db
        .update(companyBillingInfo)
        .set({ 
          ...updates, 
          updatedAt: new Date(),
          isActive: true // Ensure it remains active
        })
        .where(eq(companyBillingInfo.id, companyId))
        .returning();

      if (!updatedCompanyInfo) {
        return res.status(404).json({ message: "Datos de facturación de la empresa no encontrados" });
      }

      console.log(`✅ Company billing info updated successfully:`, updatedCompanyInfo);
      res.json(updatedCompanyInfo);
    } catch (error) {
      console.error("❌ Error updating company billing info:", error);
      res.status(500).json({ 
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Admin Invoice Management Routes
  app.get("/api/admin/invoices", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const invoices = await storage.getAllInvoicesForAdmin();
      res.json(invoices);
    } catch (error) {
      console.error("Error getting invoices for admin:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/invoices", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const { projectId, amount, dueDate } = req.body;

      if (!projectId || !amount || !dueDate) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
      }

      const invoice = await storage.createInvoiceForProject(
        parseInt(projectId),
        amount.toString(),
        new Date(dueDate)
      );

      // Notify client about new invoice
      const project = await storage.getProject(parseInt(projectId));
      if (project) {
        await storage.createNotification({
          userId: project.clientId,
          title: "💰 Nueva Factura Generada",
          message: `Se ha generado una nueva factura por $${amount} para el proyecto "${project.name}". Vence el ${new Date(dueDate).toLocaleDateString()}.`,
          type: "info",
        });
      }

      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/invoices/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "ID de factura inválido" });
      }

      const updateData: any = { status };
      if (status === 'paid') {
        updateData.paidAt = new Date();
      }
      const invoice = await storage.updateInvoice(invoiceId, updateData);

      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/client/invoices/:id/pay", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { paymentMethodId } = req.body;

      if (isNaN(invoiceId) || !paymentMethodId) {
        return res.status(400).json({ message: "Datos inválidos" });
      }

      // Verificar que la factura pertenece al cliente
      const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (!invoice[0] || invoice[0].clientId !== req.user!.id) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      // Crear transacción
      const [transaction] = await db.insert(transactions).values({
        invoiceId: invoiceId,
        paymentMethodId: parseInt(paymentMethodId),
        userId: req.user!.id,
        amount: invoice[0].amount,
        currency: invoice[0].currency,
        status: 'completed',
        transactionId: `TXN_${Date.now()}_${invoiceId}`,
        createdAt: new Date(),
        completedAt: new Date(),
      }).returning();

      // Actualizar estado de la factura
      await storage.updateInvoiceStatus(invoiceId, 'paid', new Date());

      // Notificar al admin
      const adminUsers = await storage.getUsersByRole("admin");
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: "💰 Pago Recibido",
          message: `El cliente ${req.user!.fullName} ha pagado la factura #${invoiceId} por $${invoice[0].amount}.`,
          type: "success",
        });
      }

      res.json({
        message: "Pago procesado exitosamente",
        transaction: transaction,
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/client/invoices/:id/download", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);

      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "ID de factura inválido" });
      }

      // Verificar que la factura pertenece al cliente
      const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (!invoice[0] || invoice[0].clientId !== req.user!.id) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      // TODO: Generate actual PDF
      const pdfContent = `Factura #INV-${new Date().getFullYear()}-${invoiceId.toString().padStart(3, '0')}

Cliente: ${req.user!.fullName}
Monto: $${invoice[0].amount}
Estado: ${invoice[0].status}
Fecha: ${invoice[0].createdAt}

Esta es una factura demo generada por el sistema.`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="factura_${invoiceId}.pdf"`);
      res.send(Buffer.from(pdfContent));
    } catch (error) {
      console.error("Error downloading invoice:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Support Routes
  app.get("/api/admin/tickets", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const tickets = await storage.getAllTicketsForAdmin();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/tickets/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updates = req.body;
      const ticket = await storage.updateTicket(ticketId, updates);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/tickets/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getTicketStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/tickets/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      await storage.deleteTicket(ticketId);
      res.json({ message: "Ticket eliminado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });



  // Work Modalities Routes
  app.get("/api/work-modalities", async (req, res) => {
    try {
      const modalities = await storage.getWorkModalities();
      res.json(modalities);
    } catch (error) {
      console.error("Error getting work modalities:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Test endpoint para probar el flujo completo de emails
  app.post("/api/test-email-flow", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      console.log("🧪 Iniciando prueba completa del flujo de emails...");

      // 1. Crear un cliente de prueba
      const testClientEmail = "cliente.prueba@test.com";
      const testClientName = "Cliente de Prueba";

      let testClient;
      try {
        testClient = await storage.getUserByEmail(testClientEmail);
        if (!testClient) {
          const hashedPassword = await hashPassword("123456");
          testClient = await storage.createUser({
            email: testClientEmail,
            password: hashedPassword,
            fullName: testClientName,
            role: "client",
            isActive: true,
          });
          console.log("✅ Cliente de prueba creado:", testClient.email);
        } else {
          console.log("✅ Usando cliente existente:", testClient.email);
        }
      } catch (clientError) {
        console.error("❌ Error creando cliente:", clientError);
        return res.status(500).json({ message: "Error creando cliente de prueba" });
      }

      // 2. Crear proyecto de prueba
      const projectData = {
        name: "Proyecto de Prueba Email - " + new Date().toISOString(),
        description: "Este es un proyecto de prueba para verificar el flujo completo de emails",
        price: "5000.00",
        clientId: testClient.id,
        status: "pending",
        progress: 0,
      };

      let testProject;
      try {
        testProject = await storage.createProject(projectData);
        console.log("✅ Proyecto de prueba creado:", testProject.name);
      } catch (projectError) {
        console.error("❌ Error creando proyecto:", projectError);
        return res.status(500).json({ message: "Error creando proyecto de prueba" });
      }

      // 3. Simular notificaciones de creación de proyecto
      try {
        console.log("📧 Enviando notificaciones de creación de proyecto...");
        const adminUsers = await storage.getUsersByRole("admin");
        const adminIds = adminUsers.map(admin => admin.id);
        await notifyProjectCreated(testClient.id, adminIds, testProject.name);
        console.log("✅ Notificaciones de creación enviadas");
      } catch (notifyError) {
        console.error("❌ Error enviando notificaciones de creación:", notifyError);
      }

      // 4. Simular cambio de estado: pending -> in_progress
      try {
        console.log("📧 Simulando cambio de estado: pending -> in_progress...");
        const updatedProject1 = await storage.updateProject(testProject.id, { 
          status: "in_progress",
          progress: 25,
          startDate: new Date()
        });

        await notifyProjectUpdated(
          testClient.id,
          testProject.name,
          "Estado cambiado a: En Progreso - Progreso actualizado a 25%",
          req.user!.fullName
        );

        // Notificar cambio de estado especial
        const statusLabels = {
          'pending': 'Pendiente',
          'in_progress': 'En Progreso',
          'completed': 'Completado',
          'cancelled': 'Cancelado'
        };

        const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
        for (const admin of adminUsers) {
          if (admin.email) {
            await sendEmail({
              to: admin.email,
              subject: `Cambio de Estado (PRUEBA): ${testProject.name} - En Progreso`,
              html: generateProjectStatusChangeEmailHTML(
                testProject.name,
                statusLabels['pending'],
                statusLabels['in_progress'],
                req.user!.fullName,
                testClient.id
              ),
            });
          }
        }

        console.log("✅ Cambio de estado 1 procesado");
      } catch (updateError) {
        console.error("❌ Error en cambio de estado 1:", updateError);
      }

      // 5. Esperar un momento y cambiar a completed
      setTimeout(async () => {
        try {
          console.log("📧 Simulando cambio de estado: in_progress -> completed...");
          await storage.updateProject(testProject.id, { 
            status: "completed",
            progress: 100,
            deliveryDate: new Date()
          });

          await notifyProjectUpdated(
            testClient.id,
            testProject.name,
            "Estado cambiado a: Completado - Progreso actualizado a 100%",
            req.user!.fullName
          );

          // Notificar cambio de estado especial
          const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
          for (const admin of adminUsers) {
            if (admin.email) {
              await sendEmail({
                to: admin.email,
                subject: `Cambio de Estado (PRUEBA): ${testProject.name} - Completado`,
                html: generateProjectStatusChangeEmailHTML(
                  testProject.name,
                  'En Progreso',
                  'Completado',
                  req.user!.fullName,
                  testClient.id
                ),
              });
            }
          }

          console.log("✅ Cambio de estado 2 procesado");
        } catch (finalError) {
          console.error("❌ Error en cambio de estado final:", finalError);
        }
      }, 2000);

      // 6. Crear un ticket de prueba
      try {
        console.log("📧 Creando ticket de prueba...");
        const testTicket = await storage.createTicket({
          title: "Ticket de Prueba - Consulta sobre el proyecto",
          description: "Este es un ticket de prueba para verificar las notificaciones",
          priority: "medium",
          userId: testClient.id,
          projectId: testProject.id,
        });

        const adminUsers = await storage.getUsersByRole("admin");
        const adminIds = adminUsers.map(admin => admin.id);
        await notifyTicketCreated(adminIds, testClient.fullName, testTicket.title);
        console.log("✅ Ticket de prueba creado y notificaciones enviadas");
      } catch (ticketError) {
        console.error("❌ Error creando ticket:", ticketError);
      }

      // 7. Simular mensaje en el proyecto
      try {
        console.log("📧 Enviando mensaje de prueba...");
        const testMessage = await storage.createProjectMessage({
          projectId: testProject.id,
          userId: testClient.id,
          message: "Este es un mensaje de prueba desde el cliente para verificar las notificaciones.",
        });

        const adminUsers = await storage.getUsersByRole("admin");
        for (const admin of adminUsers) {
          await notifyNewMessage(
            admin.id,
            testClient.fullName,
            testProject.name,
            testMessage.message
          );
        }
        console.log("✅ Mensaje de prueba enviado y notificaciones procesadas");
      } catch (messageError) {
        console.error("❌ Error enviando mensaje:", messageError);
      }

      res.json({
        success: true,
        message: "Prueba de flujo de emails iniciada exitosamente",
        details: {
          clientEmail: testClient.email,
          clientName: testClient.fullName,
          projectName: testProject.name,
          projectId: testProject.id,
          adminEmails: (await storage.getUsersByRole("admin")).map(admin => admin.email),
          systemEmail: process.env.GMAIL_USER,
        },
        instructions: [
          "1. Revisa los logs del servidor para ver el progreso",
          "2. Verifica tu email (tanto admin como sistema)",
          "3. Los cambios de estado ocurren con 2 segundos de diferencia",
          "4. Se han enviado: notificación de creación, 2 cambios de estado, ticket y mensaje"
        ]
      });

    } catch (error) {
      console.error("❌ Error en prueba de flujo de emails:", error);
      res.status(500).json({ 
        message: "Error en prueba de flujo de emails",
        error: error.message 
      });
    }
  });

  // Helper function para generar HTML de cambio de estado (extraída para reutilizar)
  function generateProjectStatusChangeEmailHTML(projectName: string, oldStatus: string, newStatus: string, updatedBy: string, clientId: number) {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'pending':
        case 'pendiente':
          return '#f59e0b';
        case 'in_progress':
        case 'en progreso':
          return '#3b82f6';
        case 'completed':
        case 'completado':
          return '#10b981';
        case 'cancelled':
        case 'cancelado':
          return '#ef4444';
        default:
          return '#6b7280';
      }
    };

    const newStatusColor = getStatusColor(newStatus);

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Cambio de Estado - ${projectName}</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${newStatusColor} 0%, ${newStatusColor}dd 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0;">🔄 Cambio de Estado del Proyecto</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">${newStatus.toUpperCase()}</p>
        </div>
        <div style="padding: 30px 0;">
          <h2>Estado del proyecto actualizado</h2>
          <div style="background: #f8fafc; border-left: 4px solid ${newStatusColor}; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: ${newStatusColor};">${projectName}</h3>
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <span style="background: #f3f4f6; padding: 5px 10px; border-radius: 5px; margin-right: 10px;">${oldStatus}</span>
              <span style="margin: 0 10px;">→</span>
              <span style="background: ${newStatusColor}; color: white; padding: 5px 10px; border-radius: 5px;">${newStatus}</span>
            </div>
            <p><strong>Actualizado por:</strong> ${updatedBy}</p>
            <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })}</p>
            <p style="background: #fff3cd; padding: 10px; border-radius: 5px; color: #856404; border: 1px solid #ffeaa7;"><strong>🧪 ESTO ES UNA PRUEBA</strong> - Email enviado desde el sistema de testing</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://softwarepar.lat/admin/projects" style="background: ${newStatusColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Proyecto en Admin</a>
          </div>
          <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #0369a1;"><strong>💡 Recordatorio:</strong> El cliente también ha sido notificado de este cambio.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  app.post("/api/admin/work-modalities", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const modality = await storage.createWorkModality(req.body);
      res.status(201).json(modality);
    } catch (error) {
      console.error("Error creating work modality:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/work-modalities/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const modalityId = parseInt(req.params.id);
      const updated = await storage.updateWorkModality(modalityId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating work modality:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/work-modalities/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const modalityId = parseInt(req.params.id);
      await storage.deleteWorkModality(modalityId);
      res.json({ message: "Modalidad eliminada exitosamente" });
    } catch (error) {
      console.error("Error deleting work modality:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });


  // WebSocket Server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    perMessageDeflate: false // Disable compression for better performance
  });

  // Heartbeat mechanism to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        console.log("🔌 Terminando conexión WebSocket inactiva");
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on("connection", (ws: WebSocket, request) => {
    console.log("✅ Nueva conexión WebSocket establecida");

    // Configurar heartbeat para mantener conexiones vivas
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Manejar errores de conexión
    ws.on('error', (error) => {
      console.error('❌ Error WebSocket:', error);
    });

    ws.on('close', () => {
      console.log("🔌 Conexión WebSocket cerrada");
    });

    console.log("New WebSocket connection");
    let userId: number | null = null;

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log("Received WebSocket message:", data);

        // Handle user authentication for WebSocket
        if (data.type === 'auth') {
          console.log('🔐 Intento de autenticación WebSocket:', {
            userId: data.userId,
            hasToken: !!data.token
          });

          if (data.userId) {
            userId = data.userId;
            registerWSConnection(userId, ws);

            console.log('✅ Usuario registrado en WebSocket:', userId);

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "auth_success",
                message: "Usuario autenticado para notificaciones",
                userId: userId,
                timestamp: new Date().toISOString(),
              }));
            }
          } else {
            console.error('❌ Autenticación WebSocket falló: No userId');
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "auth_error",
                message: "Error de autenticación",
                timestamp: new Date().toISOString(),
              }));
            }
          }
        }

        // Echo back for other message types
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "echo",
            data: data,
            timestamp: new Date().toISOString(),
          }));
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });

    // Send welcome message
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "welcome",
        message: "Conectado al servidor de notificaciones en tiempo real",
        timestamp: new Date().toISOString(),
      }));
    }
  });

  return httpServer;
}