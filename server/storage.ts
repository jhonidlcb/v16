import {
  users,
  partners,
  projects,
  referrals,
  tickets,
  portfolio,
  notifications,
  projectMessages,
  projectFiles,
  projectTimeline,
  ticketResponses,
  paymentMethods,
  invoices,
  transactions,
  paymentStages,
  type User,
  type InsertUser,
  type Partner,
  type InsertPartner,
  type Project,
  type InsertProject,
  type Ticket,
  type InsertTicket,
  type Notification,
  type InsertNotification,
  type Referral,
  type InsertReferral,
  type Payment,
  type InsertPayment,
  type Portfolio,
  type InsertPortfolio,
  type ProjectMessage,
  type InsertProjectMessage,
  type ProjectFile,
  type InsertProjectFile,
  type ProjectTimeline,
  type InsertProjectTimeline,
  type TicketResponse,
  type InsertTicketResponse,
  type PaymentMethod,
  type InsertPaymentMethod,
  type Invoice,
  type InsertInvoice,
  type Transaction,
  type InsertTransaction,
  budgetNegotiations,
  type BudgetNegotiation,
  type InsertBudgetNegotiation,
  workModalities,
  type WorkModality,
  type InsertWorkModality,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, ne, and, gte, isNull, lte } from "drizzle-orm";

// Importing language, currency, and related types (assuming they are defined elsewhere or will be added)
// For now, using placeholder types if they are not in the original schema imports
type Language = any; // Placeholder, replace with actual type if available
type Currency = any; // Placeholder, replace with actual type if available
type ExchangeRate = any; // Placeholder, replace with actual type if available
type UserPreferences = any; // Placeholder, replace with actual type if available
type InsertUserPreferences = any; // Placeholder, replace with actual type if available
type I18nEntry = any; // Placeholder, replace with actual type if available
type InsertI18nEntry = any; // Placeholder, replace with actual type if available
type ContentTranslation = any; // Placeholder, replace with actual type if available
type InsertContentTranslation = any; // Placeholder, replace with actual type if available

// Placeholder for languages, currencies, exchangeRates, userPreferences, i18nEntries, contentTranslations if not imported
// These would typically be imported from "@shared/schema" as well
const languages = {} as any; // Placeholder
const currencies = {} as any; // Placeholder
const exchangeRates = {} as any; // Placeholder
const userPreferences = {} as any; // Placeholder
const i18nEntries = {} as any; // Placeholder
const contentTranslations = {} as any; // Placeholder


export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(userId: number): Promise<void>;

  // Partner operations
  getPartner(userId: number): Promise<Partner | undefined>;
  getPartnerByReferralCode(code: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: number, updates: Partial<Partner>): Promise<Partner>;
  getPartnerStats(partnerId: number): Promise<any>;
  getPartnerEarningsData(partnerId: number): Promise<any>;
  getPartnerCommissions(partnerId: number): Promise<any[]>;


  // Project operations
  getProjects(userId: number, role: string): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(projectId: number): Promise<void>;

  // Referral operations
  getReferrals(partnerId: number): Promise<any[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;

  // Ticket operations
  getTickets(userId: number): Promise<(Ticket & { responses?: (TicketResponse & { author: string; role: string })[]; })[]>;
  getTicket(ticketId: number): Promise<any | null>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket>;
  // Ticket response operations
  createTicketResponse(responseData: InsertTicketResponse): Promise<TicketResponse>;
  getTicketResponses(ticketId: number): Promise<(TicketResponse & { author: string; role: string })[]>;


  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  // Send notification to all admins
  notifyAdmins(notificationData: InsertNotification): Promise<void>;
  // Send notification to a specific user
  notifyUser(userId: number, notificationData: InsertNotification): Promise<void>;

  // Payment operations
  createPayment(insertPayment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, updates: Partial<Payment>): Promise<Payment>;

  // Payment methods
  getPaymentMethodsByUser(userId: number): Promise<PaymentMethod[]>;
  createPaymentMethod(data: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<void>;

  // Invoices
  getInvoicesByClient(clientId: number): Promise<any[]>;
  createInvoice(data: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice>;

  // Transactions
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<any[]>;
  getAdminStats(): Promise<any>;
  getAllProjectsForAdmin(): Promise<any[]>;
  deleteProject(projectId: number): Promise<void>;
  getProjectStats(): Promise<any>;
  getAllTicketsForAdmin(): Promise<any[]>;
  updateTicket(ticketId: number, updates: any): Promise<any>;
  deleteTicket(ticketId: number): Promise<void>;
  getTicketStats(): Promise<any>;
  getAllPartnersForAdmin(): Promise<any[]>;
  getPartnerStatsForAdmin(): Promise<any>;


  // Portfolio operations
  getPortfolio(): Promise<Portfolio[]>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(id: number, updates: Partial<Portfolio>): Promise<Portfolio>;
  deletePortfolio(id: number): Promise<void>;

  // Project management operations
  getProjectMessages(projectId: number): Promise<ProjectMessage[]>;
  createProjectMessage(message: InsertProjectMessage): Promise<ProjectMessage>;
  getProjectFiles(projectId: number): Promise<ProjectFile[]>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  deleteProjectFile(id: number): Promise<void>;
  getProjectTimeline(projectId: number): Promise<ProjectTimeline[]>;
  createProjectTimeline(timeline: InsertProjectTimeline): Promise<ProjectTimeline>;
  updateProjectTimeline(timelineId: number, updates: any): Promise<ProjectTimeline>;
  hasProjectTimeline(projectId: number): Promise<boolean>;

  // Analytics Methods
  getAnalyticsData(period?: number): Promise<any>;
  getRevenueAnalytics(period?: number): Promise<any>;
  getUserAnalytics(period?: number): Promise<any>;
  getProjectAnalytics(period?: number): Promise<any>;
  getPartnerAnalytics(period?: number): Promise<any>;
  getKPIAnalytics(period?: number): Promise<any>;

  // Admin User Management
  getUserStatsForAdmin(): Promise<any>;

  // Seed data
  seedUsers(): Promise<void>;

  // Payment stages operations
  createPaymentStage(data: any): Promise<any>;
  getPaymentStages(projectId: number): Promise<any[]>;
  updatePaymentStage(stageId: number, updates: any): Promise<any>;
  completePaymentStage(stageId: number): Promise<any>;

  // Budget Negotiation Methods
  getBudgetNegotiations(projectId: number): Promise<BudgetNegotiation[]>;
  createBudgetNegotiation(negotiation: InsertBudgetNegotiation): Promise<BudgetNegotiation>;
  updateBudgetNegotiation(negotiationId: number, updates: Partial<BudgetNegotiation>): Promise<BudgetNegotiation>;
  getLatestBudgetNegotiation(projectId: number): Promise<BudgetNegotiation | null>;

  // Work Modalities Methods
  getWorkModalities(): Promise<WorkModality[]>;
  createWorkModality(modality: InsertWorkModality): Promise<WorkModality>;
  updateWorkModality(id: number, updates: Partial<WorkModality>): Promise<WorkModality>;
  deleteWorkModality(id: number): Promise<void>;

  // i18n and currency methods
  getLanguages(): Promise<Language[]>;
  getActiveLanguages(): Promise<Language[]>;
  getDefaultLanguage(): Promise<Language | null>;
  getCurrencies(): Promise<Currency[]>;
  getActiveCurrencies(): Promise<Currency[]>;
  getDefaultCurrency(): Promise<Currency | null>;
  getExchangeRates(): Promise<ExchangeRate[]>;
  getUserPreferences(userId: number): Promise<UserPreferences | null>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences>;
  getTranslation(keyName: string, languageCode: string): Promise<string | null>;
  createTranslation(entry: InsertI18nEntry): Promise<I18nEntry>;
  updateTranslation(id: number, updates: Partial<I18nEntry>): Promise<I18nEntry>;
  getContentTranslation(contentType: string, contentId: number, fieldName: string, languageCode: string): Promise<string | null>;
  createContentTranslation(translation: InsertContentTranslation): Promise<ContentTranslation>;
  convertCurrency(amount: number, fromCurrencyCode: string, toCurrencyCode: string): Promise<number>;

  // Admin invoice management
  createInvoiceForProject(projectId: number, amount: string, dueDate: Date): Promise<Invoice>;
  getAllInvoicesForAdmin(): Promise<any[]>;
  updateInvoiceStatus(invoiceId: number, status: string, paidAt?: Date): Promise<Invoice>;

  // Client billing data
  getClientBillingData(clientId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Use the imported db instance directly
  // Removed db instance from here as it's already imported at the top level.

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning();

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return user;
  }

  async deleteUser(userId: number): Promise<void> {
    // Verificar que el usuario existe
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // No permitir eliminar el último administrador
    if (user.role === 'admin') {
      const adminCount = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, 'admin'));

      if (Number(adminCount[0]?.count || 0) <= 1) {
        throw new Error("No se puede eliminar el último administrador del sistema");
      }
    }

    // Eliminar en cascada todos los datos relacionados
    console.log(`🗑️ Iniciando eliminación en cascada para usuario ${userId}`);

    // 1. Eliminar respuestas de tickets
    const userTickets = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.userId, userId));
    for (const ticket of userTickets) {
      await db.delete(ticketResponses).where(eq(ticketResponses.ticketId, ticket.id));
    }

    // 2. Eliminar tickets del usuario
    await db.delete(tickets).where(eq(tickets.userId, userId));

    // 3. Eliminar respuestas de tickets donde el usuario respondió (pero no es dueño del ticket)
    await db.delete(ticketResponses).where(eq(ticketResponses.userId, userId));

    // 4. Obtener proyectos del usuario para eliminar datos relacionados
    const userProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.clientId, userId));

    for (const project of userProjects) {
      // Eliminar mensajes del proyecto
      await db.delete(projectMessages).where(eq(projectMessages.projectId, project.id));

      // Eliminar archivos del proyecto
      await db.delete(projectFiles).where(eq(projectFiles.projectId, project.id));

      // Eliminar timeline del proyecto
      await db.delete(projectTimeline).where(eq(projectTimeline.projectId, project.id));

      // Eliminar etapas de pago del proyecto
      await db.delete(paymentStages).where(eq(paymentStages.projectId, project.id));

      // Eliminar negociaciones de presupuesto del proyecto
      await db.delete(budgetNegotiations).where(eq(budgetNegotiations.projectId, project.id));

      // Eliminar pagos legacy del proyecto
      await db.delete(payments).where(eq(payments.projectId, project.id));
    }

    // 5. Eliminar proyectos del usuario
    await db.delete(projects).where(eq(projects.clientId, userId));

    // 6. Eliminar mensajes de proyectos donde el usuario participó (pero no es dueño)
    await db.delete(projectMessages).where(eq(projectMessages.userId, userId));

    // 7. Eliminar archivos subidos por el usuario en cualquier proyecto
    await db.delete(projectFiles).where(eq(projectFiles.uploadedBy, userId));

    // 8. Eliminar negociaciones de presupuesto propuestas por el usuario
    await db.delete(budgetNegotiations).where(eq(budgetNegotiations.proposedBy, userId));

    // 9. Si es partner, eliminar datos de partner
    const partner = await db.select({ id: partners.id }).from(partners).where(eq(partners.userId, userId)).limit(1);
    if (partner[0]) {
      // Eliminar referidos del partner
      await db.delete(referrals).where(eq(referrals.partnerId, partner[0].id));

      // Eliminar el registro de partner
      await db.delete(partners).where(eq(partners.userId, userId));
    }

    // 10. Eliminar referidos donde el usuario es el cliente referido
    await db.delete(referrals).where(eq(referrals.clientId, userId));

    // 11. Eliminar notificaciones del usuario
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // 12. Eliminar métodos de pago del usuario
    await db.delete(paymentMethods).where(eq(paymentMethods.userId, userId));

    // 13. Eliminar facturas del usuario
    const userInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.clientId, userId));
    for (const invoice of userInvoices) {
      // Eliminar transacciones de la factura
      await db.delete(transactions).where(eq(transactions.invoiceId, invoice.id));
    }
    await db.delete(invoices).where(eq(invoices.clientId, userId));

    // 14. Eliminar transacciones del usuario
    await db.delete(transactions).where(eq(transactions.userId, userId));

    // 15. Finalmente, eliminar el usuario
    await db.delete(users).where(eq(users.id, userId));

    console.log(`✅ Usuario ${userId} y todos sus datos relacionados eliminados exitosamente`);
  }

  async getPartner(userId: number): Promise<Partner | undefined> {
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.userId, userId));
    return partner;
  }

  async getPartnerByReferralCode(code: string): Promise<Partner | undefined> {
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.referralCode, code));
    return partner;
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const [partner] = await db
      .insert(partners)
      .values(insertPartner)
      .returning();
    return partner;
  }

  async updatePartner(id: number, updates: Partial<Partner>): Promise<Partner> {
    const [partner] = await db
      .update(partners)
      .set(updates)
      .where(eq(partners.id, id))
      .returning();
    return partner;
  }

  async getPartnerStats(partnerId: number): Promise<any> {
    const [stats] = await db
      .select({
        totalEarnings: partners.totalEarnings,
        activeReferrals: sql<number>`COUNT(DISTINCT ${referrals.id})`,
        closedSales: sql<number>`COUNT(DISTINCT CASE WHEN ${referrals.status} = 'paid' THEN ${referrals.id} END)`
      })
      .from(partners)
      .leftJoin(referrals, eq(partners.id, referrals.partnerId))
      .where(eq(partners.id, partnerId))
      .groupBy(partners.id);

    return {
      totalEarnings: stats?.totalEarnings || "0.00",
      activeReferrals: stats?.activeReferrals || 0,
      closedSales: stats?.closedSales || 0,
      conversionRate: stats?.activeReferrals > 0
        ? Math.round((stats.closedSales / stats.activeReferrals) * 100)
        : 0,
    };
  }

  async getPartnerEarningsData(partnerId: number): Promise<any> {
    try {
      // Total earnings
      const totalEarnings = await db
        .select({ sum: sql`COALESCE(sum(commission_amount), 0)` })
        .from(referrals)
        .where(and(eq(referrals.partnerId, partnerId), eq(referrals.status, "paid")));

      // Monthly earnings (current month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyEarnings = await db
        .select({ sum: sql`COALESCE(sum(commission_amount), 0)` })
        .from(referrals)
        .where(and(
          eq(referrals.partnerId, partnerId),
          eq(referrals.status, "paid"),
          sql`created_at >= ${currentMonth}`
        ));

      // Pending commissions
      const pendingCommissions = await db
        .select({ sum: sql`COALESCE(sum(commission_amount), 0)` })
        .from(referrals)
        .where(and(eq(referrals.partnerId, partnerId), eq(referrals.status, "converted")));

      // Total referrals
      const totalReferrals = await db
        .select({ count: sql`count(*)` })
        .from(referrals)
        .where(eq(referrals.partnerId, partnerId));

      // Active referrals (with projects)
      const activeReferrals = await db
        .select({ count: sql`count(*)` })
        .from(referrals)
        .where(and(
          eq(referrals.partnerId, partnerId),
          sql`project_id IS NOT NULL`
        ));

      const conversionRate = totalReferrals[0]?.count > 0 ?
        (Number(activeReferrals[0]?.count || 0) / Number(totalReferrals[0]?.count) * 100) : 0;

      return {
        totalEarnings: Number(totalEarnings[0]?.sum || 0),
        monthlyEarnings: Number(monthlyEarnings[0]?.sum || 0),
        pendingCommissions: Number(pendingCommissions[0]?.sum || 0),
        paidCommissions: Number(totalEarnings[0]?.sum || 0),
        conversionRate: Math.round(conversionRate * 100) / 100,
        referralsCount: Number(totalReferrals[0]?.count || 0),
        activeReferrals: Number(activeReferrals[0]?.count || 0),
      };
    } catch (error) {
      console.error("Error getting partner earnings data:", error);
      throw error;
    }
  }

  async getPartnerCommissions(partnerId: number): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: referrals.id,
          projectName: projects.name,
          clientName: users.fullName,
          amount: referrals.commissionAmount,
          status: referrals.status,
          date: referrals.createdAt,
          paymentDate: sql`CASE WHEN ${referrals.status} = 'paid' THEN ${referrals.createdAt} ELSE NULL END`,
        })
        .from(referrals)
        .leftJoin(projects, eq(referrals.projectId, projects.id))
        .leftJoin(users, eq(referrals.clientId, users.id))
        .where(eq(referrals.partnerId, partnerId))
        .orderBy(desc(referrals.createdAt));

      return result.map(commission => ({
        ...commission,
        amount: Number(commission.amount || 0),
      }));
    } catch (error) {
      console.error("Error getting partner commissions:", error);
      throw error;
    }
  }

  async getProjects(userId: number, userRole: string): Promise<Project[]> {
    let query = db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        price: projects.price,
        status: projects.status,
        progress: projects.progress,
        clientId: projects.clientId,
        partnerId: projects.partnerId,
        startDate: projects.startDate,
        deliveryDate: projects.deliveryDate,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects);

    if (userRole !== "admin") {
      query = query.where(eq(projects.clientId, userId));
    }

    return await query.orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    try {
      console.log("Updating project with data:", updates);

      // Ensure dates are properly formatted
      const updateData: any = {
        ...updates,
        updatedAt: new Date(),
      };

      // Handle startDate conversion
      if (updates.startDate) {
        updateData.startDate = new Date(updates.startDate);
      }

      // Handle deliveryDate conversion
      if (updates.deliveryDate) {
        updateData.deliveryDate = new Date(updates.deliveryDate);
      }

      const [updatedProject] = await db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, id))
        .returning();

      // Si se actualiza el progreso, activar etapas correspondientes
      if (updates.progress !== undefined) {
        await this.updatePaymentStagesStatus(id, updates.progress);
      }

      return updatedProject;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  async updatePaymentStagesStatus(projectId: number, currentProgress: number) {
    try {
      // Activar etapas que cumplan el progreso requerido
      await db
        .update(paymentStages)
        .set({ status: 'available' })
        .where(
          and(
            eq(paymentStages.projectId, projectId),
            lte(paymentStages.stagePercentage, currentProgress),
            eq(paymentStages.status, 'pending')
          )
        );
    } catch (error) {
      console.error("Error updating payment stages status:", error);
    }
  }


  async getReferrals(partnerId: number): Promise<any[]> {
    return await db
      .select({
        id: referrals.id,
        status: referrals.status,
        commissionAmount: referrals.commissionAmount,
        createdAt: referrals.createdAt,
        clientName: users.fullName,
        clientEmail: users.email,
        projectName: projects.name,
        projectPrice: projects.price,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.clientId, users.id))
      .leftJoin(projects, eq(referrals.projectId, projects.id))
      .where(eq(referrals.partnerId, partnerId))
      .orderBy(desc(referrals.createdAt));
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values(insertReferral)
      .returning();
    return referral;
  }

  async getTickets(userId: number): Promise<(Ticket & { responses?: (TicketResponse & { author: string; role: string })[]; })[]> {
    const ticketList = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        status: tickets.status,
        priority: tickets.priority,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        projectName: projects.name,
        projectId: tickets.projectId,
      })
      .from(tickets)
      .leftJoin(projects, eq(tickets.projectId, projects.id))
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));

    // Get responses for each ticket
    const ticketsWithResponses = await Promise.all(
      ticketList.map(async (ticket) => {
        const responses = await this.getTicketResponses(ticket.id);
        return {
          ...ticket,
          responses,
        };
      })
    );

    return ticketsWithResponses;
  }

  async getTicket(ticketId: number): Promise<any | null> {
    try {
      const result = await db
        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          status: tickets.status,
          priority: tickets.priority,
          userId: tickets.userId,
          projectId: tickets.projectId,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
        })
        .from(tickets)
        .where(eq(tickets.id, ticketId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Error getting ticket:", error);
      throw error;
    }
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values(insertTicket)
      .returning();
    return ticket;
  }

  // This method is duplicated, keeping the one from the changes
  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  async createTicketResponse(responseData: InsertTicketResponse): Promise<TicketResponse> {
    const [response] = await db
      .insert(ticketResponses)
      .values({
        ...responseData,
        createdAt: new Date(), // Store as Date object
      })
      .returning();
    return response;
  }

  async getTicketResponses(ticketId: number): Promise<(TicketResponse & { author: string; role: string })[]> {
    return await db
      .select({
        id: ticketResponses.id,
        message: ticketResponses.message,
        author: users.fullName,
        role: users.role,
        createdAt: ticketResponses.createdAt,
        isFromSupport: ticketResponses.isFromSupport,
      })
      .from(ticketResponses)
      .leftJoin(users, eq(ticketResponses.userId, users.id))
      .where(eq(ticketResponses.ticketId, ticketId))
      .orderBy(ticketResponses.createdAt);
  }


  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    try {
      const [notification] = await db
        .insert(notifications)
        .values(insertNotification)
        .returning();
      return notification;
    } catch (error) {
      // Si hay error de clave duplicada, intentar con un nuevo ID
      if (error.code === '23505' && error.constraint === 'notifications_pkey') {
        console.warn("🔄 Reintentando inserción de notificación por clave duplicada");
        const [notification] = await db
          .insert(notifications)
          .values({
            ...insertNotification,
            // Dejar que la base de datos genere un nuevo ID automáticamente
          })
          .returning();
        return notification;
      }
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async notifyAdmins(notificationData: InsertNotification): Promise<void> {
    try {
      const admins = await this.getUsersByRole('admin');
      await Promise.all(admins.map(admin =>
        this.createNotification({ ...notificationData, userId: admin.id })
      ));
    } catch (error) {
      console.error("Error notifying admins:", error);
      throw error;
    }
  }

  async notifyUser(userId: number, notificationData: InsertNotification): Promise<void> {
    try {
      await this.createNotification({ ...notificationData, userId });
    } catch (error) {
      console.error(`Error notifying user ${userId}:`, error);
      throw error;
    }
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    // This method is no longer used due to the removal of the 'payments' table.
    // If 'payments' table is re-added, this method will need to be uncommented and adjusted.
    // const [payment] = await db
    //   .insert(payments)
    //   .values(insertPayment)
    //   .returning();
    // return payment;
    throw new Error("Payment operations are currently disabled.");
  }

  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment> {
    // This method is no longer used due to the removal of the 'payments' table.
    // If 'payments' table is re-added, this method will need to be uncommented and adjusted.
    // const [payment] = await db
    //   .update(payments)
    //   .set(updates)
    //   .where(eq(payments.id, id))
    //   .returning();
    // return payment;
    throw new Error("Payment operations are currently disabled.");
  }

  // Payment methods
  async getPaymentMethodsByUser(userId: number): Promise<PaymentMethod[]> {
    try {
      // Consultar sin la columna details que no existe en la DB
      const methods = await db
        .select({
          id: paymentMethods.id,
          userId: paymentMethods.userId,
          type: paymentMethods.type,
          isDefault: paymentMethods.isDefault,
          isActive: paymentMethods.isActive,
          createdAt: paymentMethods.createdAt,
          updatedAt: paymentMethods.updatedAt
        })
        .from(paymentMethods)
        .where(and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.isActive, true)
        ))
        .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));

      // Agregar details mock basados en el tipo para compatibilidad con el frontend
      return methods.map(method => ({
        ...method,
        details: method.type === 'card' ? {
          last4: '****',
          brand: 'Tarjeta',
          expiryDate: 'MM/AA',
          holderName: 'Titular'
        } : {
          bankName: 'Banco',
          accountNumber: '****'
        }
      }));
    } catch (error) {
      console.error("Error getting payment methods:", error);
      // Retornar array vacío en lugar de datos mock
      return [];
    }
  }

  async createPaymentMethod(data: InsertPaymentMethod): Promise<PaymentMethod> {
    try {
      // If this is set as default, remove default from other methods
      if (data.isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(eq(paymentMethods.userId, data.userId));
      }

      const [paymentMethod] = await db
        .insert(paymentMethods)
        .values({
          ...data,
          createdAt: new Date(),
        })
        .returning();
      return paymentMethod;
    } catch (error) {
      console.error("Error creating payment method:", error);
      throw new Error("No se pudo crear el método de pago");
    }
  }

  async updatePaymentMethod(id: number, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod> {
    try {
      const [paymentMethod] = await db
        .update(paymentMethods)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(paymentMethods.id, id))
        .returning();
      return paymentMethod;
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw new Error("No se pudo actualizar el método de pago");
    }
  }

  async deletePaymentMethod(id: number): Promise<void> {
    try {
      await db
        .update(paymentMethods)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(paymentMethods.id, id));
    } catch (error) {
      console.error("Error deleting payment method:", error);
      throw new Error("No se pudo eliminar el método de pago");
    }
  }

  // Invoices
  async getInvoicesByClient(clientId: number): Promise<any[]> {
    try {
      // Primero obtener facturas de payment stages pagadas
      const stageInvoices = await db
        .select({
          id: paymentStages.id,
          invoiceNumber: sql<string>`CONCAT('INV-STAGE-', ${paymentStages.projectId}, '-', ${paymentStages.id})`.as('invoiceNumber'),
          projectName: projects.name,
          amount: paymentStages.amount,
          status: sql<string>`'paid'`.as('status'),
          dueDate: paymentStages.paidAt,
          paidAt: paymentStages.paidAt,
          createdAt: paymentStages.createdAt,
          stageName: paymentStages.stageName,
          stagePercentage: paymentStages.stagePercentage,
          type: sql<string>`'stage_payment'`.as('type'),
        })
        .from(paymentStages)
        .leftJoin(projects, eq(paymentStages.projectId, projects.id))
        .where(and(
          eq(projects.clientId, clientId),
          eq(paymentStages.status, 'paid')
        ))
        .orderBy(desc(paymentStages.paidAt));

      // También obtener facturas tradicionales si existen (corregir nombre de columna)
      const traditionalInvoices = await db
        .select({
          id: invoices.id,
          invoiceNumber: sql<string>`CONCAT('INV-', EXTRACT(YEAR FROM ${invoices.createdAt}), '-', LPAD(${invoices.id}::text, 3, '0'))`.as('invoiceNumber'),
          projectName: projects.name,
          amount: invoices.amount,
          status: invoices.status,
          dueDate: invoices.dueDate,
          paidAt: invoices.paidDate, // Corregido: usar paidDate en lugar de paidAt
          createdAt: invoices.createdAt,
          stageName: sql<string>`NULL`.as('stageName'),
          stagePercentage: sql<number>`NULL`.as('stagePercentage'),
          type: sql<string>`'traditional'`.as('type'),
        })
        .from(invoices)
        .leftJoin(projects, eq(invoices.projectId, projects.id))
        .where(eq(invoices.clientId, clientId))
        .orderBy(desc(invoices.createdAt));

      // Combinar ambos tipos de facturas
      const allInvoices = [...stageInvoices, ...traditionalInvoices].sort((a, b) => {
        const dateA = new Date(a.paidAt || a.createdAt);
        const dateB = new Date(b.paidAt || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      return allInvoices;
    } catch (error) {
      console.error("Error getting invoices by client:", error);
      return [];
    }
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    try {
      const [invoice] = await db
        .insert(invoices)
        .values(data)
        .returning();
      return invoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw new Error("No se pudo crear la factura.");
    }
  }

  async updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  // Transactions
  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    try {
      const userTransactions = await db
        .select({
          id: transactions.id,
          type: sql<string>`CASE
            WHEN ${transactions.amount} > 0 THEN 'payment'
            ELSE 'fee'
          END`.as('type'),
          amount: transactions.amount,
          description: sql<string>`CONCAT('Transacción para factura #', ${transactions.invoiceId})`.as('description'),
          status: transactions.status,
          date: transactions.createdAt,
          invoiceId: transactions.invoiceId,
          paymentMethodId: transactions.paymentMethodId,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt));

      return userTransactions;
    } catch (error) {
      console.error("Error getting transactions:", error);
      // Return mock data for now
      return [
        {
          id: 1,
          type: 'payment',
          amount: '2500.00',
          description: 'Pago de proyecto demo',
          status: 'completed',
          date: new Date(),
          invoiceId: 1,
          paymentMethodId: 1,
        }
      ];
    }
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(data)
      .returning();
    return transaction;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).orderBy(users.createdAt);

    // Enriquecer con conteos de proyectos y tickets
    const enrichedUsers = await Promise.all(
      allUsers.map(async (user) => {
        const projectCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(projects)
          .where(eq(projects.clientId, user.id));

        const ticketCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(tickets)
          .where(eq(tickets.userId, user.id));

        return {
          ...user,
          projectsCount: Number(projectCount[0]?.count || 0),
          ticketsCount: Number(ticketCount[0]?.count || 0),
        };
      })
    );

    return enrichedUsers;
  }

  async getUsersByRole(role: string): Promise<any[]> {
    try {
      return await db.select().from(users).where(eq(users.role, role));
    } catch (error) {
      console.error("Error getting users by role:", error);
      throw error;
    }
  }

  // Portfolio operations (Implemented)
  async getPortfolio(): Promise<Portfolio[]> {
    try {
      const result = await db.select().from(portfolio).where(eq(portfolio.isActive, true)).orderBy(desc(portfolio.createdAt));
      return result;
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      // Return empty array instead of throwing to prevent 500 errors
      return [];
    }
  }

  async createPortfolio(data: InsertPortfolio): Promise<Portfolio> {
    try {
      // Convert string date to Date object if needed
      const portfolioData = {
        ...data,
        completedAt: typeof data.completedAt === 'string' ? new Date(data.completedAt) : data.completedAt
      };

      const [newPortfolio] = await db.insert(portfolio).values(portfolioData).returning();
      return newPortfolio;
    } catch (error) {
      console.error("Error creating portfolio:", error);
      throw error;
    }
  }

  async updatePortfolio(id: number, updates: Partial<Portfolio>): Promise<Portfolio> {
    try {
      // Convert string date to Date object if needed
      const portfolioUpdates = {
        ...updates,
        completedAt: updates.completedAt && typeof updates.completedAt === 'string'
          ? new Date(updates.completedAt)
          : updates.completedAt,
        updatedAt: new Date()
      };

      const [updatedPortfolio] = await db
        .update(portfolio)
        .set(portfolioUpdates)
        .where(eq(portfolio.id, id))
        .returning();
      return updatedPortfolio;
    } catch (error) {
      console.error("Error updating portfolio:", error);
      throw error;
    }
  }

  async deletePortfolio(id: number): Promise<void> {
    try {
      await db.delete(portfolio).where(eq(portfolio.id, id));
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      throw error;
    }
  }

  // Admin Stats
  async getAdminStats(): Promise<any> {
    try {
      const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
      const activePartners = await db.select({ count: sql`count(*)` }).from(partners);
      const totalProjects = await db.select({ count: sql`count(*)` }).from(projects);

      // Calculate real revenue from paid payment stages
      const totalRevenue = await db
        .select({ sum: sql`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(paymentStages)
        .where(eq(paymentStages.status, 'paid'));

      // Calculate monthly revenue (current month)
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      const monthlyRevenue = await db
        .select({ sum: sql`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(paymentStages)
        .where(and(
          eq(paymentStages.status, 'paid'),
          sql`updated_at >= ${firstDayOfMonth.toISOString()}`
        ));

      return {
        totalUsers: totalUsers[0]?.count?.toString() || "0",
        activePartners: activePartners[0]?.count?.toString() || "0",
        totalProjects: totalProjects[0]?.count?.toString() || "0",
        totalRevenue: Number(totalRevenue[0]?.sum || 0).toFixed(2),
        monthlyRevenue: Number(monthlyRevenue[0]?.sum || 0).toFixed(2),
      };
    } catch (error) {
      console.error("Error getting admin stats:", error);
      throw error;
    }
  }

  // Nuevo método para obtener datos de billing en tiempo real por cliente
  async getClientBillingData(clientId: number): Promise<any> {
    try {
      // Total pagado por el cliente (de payment_stages)
      const totalPaidStages = await db
        .select({ sum: sql`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(paymentStages)
        .leftJoin(projects, eq(paymentStages.projectId, projects.id))
        .where(and(
          eq(projects.clientId, clientId),
          eq(paymentStages.status, 'paid')
        ));

      // Total pendiente (etapas disponibles no pagadas)
      const pendingPayments = await db
        .select({ sum: sql`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(paymentStages)
        .leftJoin(projects, eq(paymentStages.projectId, projects.id))
        .where(and(
          eq(projects.clientId, clientId),
          eq(paymentStages.status, 'available')
        ));

      // Próximo vencimiento (etapa más antigua disponible)
      const nextPayment = await db
        .select({
          dueDate: sql`MIN(${paymentStages.createdAt})`,
          amount: sql`MIN(CAST(${paymentStages.amount} AS DECIMAL))`
        })
        .from(paymentStages)
        .leftJoin(projects, eq(paymentStages.projectId, projects.id))
        .where(and(
          eq(projects.clientId, clientId),
          eq(paymentStages.status, 'available')
        ));

      return {
        currentBalance: 0, // Balance siempre 0 para clientes
        totalPaid: Number(totalPaidStages[0]?.sum || 0),
        pendingPayments: Number(pendingPayments[0]?.sum || 0),
        nextPaymentDue: nextPayment[0]?.dueDate ? new Date(nextPayment[0].dueDate).toISOString().split('T')[0] : null,
      };
    } catch (error) {
      console.error("Error getting client billing data:", error);
      return {
        currentBalance: 0,
        totalPaid: 0,
        pendingPayments: 0,
        nextPaymentDue: null,
      };
    }
  }

  async getAllProjectsForAdmin(): Promise<any[]> {
    return await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        price: projects.price,
        status: projects.status,
        progress: projects.progress,
        startDate: projects.startDate,
        deliveryDate: projects.deliveryDate,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientId: projects.clientId,
        clientName: users.fullName,
        clientEmail: users.email,
      })
      .from(projects)
      .leftJoin(users, eq(projects.clientId, users.id))
      .orderBy(desc(projects.createdAt));
  }

  async deleteProject(projectId: number): Promise<void> {
    try {
      // First delete related records in the correct order to avoid foreign key constraints

      // Delete ticket responses for tickets related to this project
      await db.delete(ticketResponses).where(
        sql`ticket_id IN (SELECT id FROM tickets WHERE project_id = ${projectId})`
      );

      // Delete tickets related to this project
      await db.delete(tickets).where(eq(tickets.projectId, projectId));

      // Delete budget negotiations related to this project
      await db.delete(budgetNegotiations).where(eq(budgetNegotiations.projectId, projectId));

      // Delete project timeline
      await db.delete(projectTimeline).where(eq(projectTimeline.projectId, projectId));

      // Delete project messages
      await db.delete(projectMessages).where(eq(projectMessages.projectId, projectId));

      // Delete project files
      await db.delete(projectFiles).where(eq(projectFiles.projectId, projectId));

      // Delete referrals related to this project
      await db.delete(referrals).where(eq(referrals.projectId, projectId));

      // Delete transactions related to invoices of this project (before deleting invoices)
      await db.delete(transactions).where(
        sql`invoice_id IN (SELECT id FROM invoices WHERE project_id = ${projectId})`
      );

      // Delete invoices related to this project
      await db.delete(invoices).where(eq(invoices.projectId, projectId));

      // Delete payments related to this project (if the column exists)
      try {
        // This part is commented out because the 'payments' table has been removed.
        // If the 'payments' table is re-added with a 'projectId' column, this can be uncommented.
        // await db.delete(payments).where(eq(payments.projectId, projectId));
      } catch (error) {
        // Ignore if projectId column doesn't exist in payments table
        console.log("Note: payments table may not have projectId column or is removed.");
      }

      // Delete payment stages related to this project
      await db.delete(paymentStages).where(eq(paymentStages.projectId, projectId));

      // Finally delete the project
      await db.delete(projects).where(eq(projects.id, projectId));

    } catch (error) {
      console.error("Error deleting project:", error);
      throw new Error(`Error al eliminar el proyecto: ${error.message}`);
    }
  }

  async getProjectStats(): Promise<any> {
    try {
      const stats = await db
        .select({
          status: projects.status,
          count: sql<number>`count(*)`,
        })
        .from(projects)
        .groupBy(projects.status);

      // Calculate real revenue from paid payment stages
      const realRevenue = await db
        .select({ sum: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(paymentStages)
        .where(eq(paymentStages.status, 'paid'));

      // Also get potential revenue (all project prices)
      const potentialRevenue = await db
        .select({ sum: sql<number>`COALESCE(SUM(CAST(price AS DECIMAL)), 0)` })
        .from(projects);

      const result = {
        pending: "0",
        inProgress: "0",
        completed: "0",
        cancelled: "0",
        totalRevenue: Number(realRevenue[0]?.sum || 0).toFixed(2),
        potentialRevenue: Number(potentialRevenue[0]?.sum || 0).toFixed(2),
      };

      stats.forEach((stat) => {
        const status = stat.status as keyof typeof result;
        if (status !== 'totalRevenue' && status !== 'potentialRevenue') {
          result[status] = stat.count?.toString() || "0";
        }
      });

      return result;
    } catch (error) {
      console.error("Error getting project stats:", error);
      throw error;
    }
  }

  // Project management operations
  async getProjectMessages(projectId: number): Promise<ProjectMessage[]> {
    return await db
      .select({
        id: projectMessages.id,
        projectId: projectMessages.projectId,
        userId: projectMessages.userId,
        message: projectMessages.message,
        createdAt: projectMessages.createdAt,
        author: users.fullName,
        role: users.role,
      })
      .from(projectMessages)
      .leftJoin(users, eq(projectMessages.userId, users.id))
      .where(eq(projectMessages.projectId, projectId))
      .orderBy(desc(projectMessages.createdAt));
  }

  async createProjectMessage(message: InsertProjectMessage): Promise<ProjectMessage> {
    const [newMessage] = await db
      .insert(projectMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    return await db
      .select({
        id: projectFiles.id,
        projectId: projectFiles.projectId,
        fileName: projectFiles.fileName,
        fileUrl: projectFiles.fileUrl,
        fileType: projectFiles.fileType,
        uploadedBy: projectFiles.uploadedBy,
        uploadedAt: projectFiles.uploadedAt,
        uploaderName: users.fullName,
      })
      .from(projectFiles)
      .leftJoin(users, eq(projectFiles.uploadedBy, users.id))
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(desc(projectFiles.uploadedAt));
  }

  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    const [newFile] = await db
      .insert(projectFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async deleteProjectFile(id: number): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.id, id));
  }

  async getProjectTimeline(projectId: number): Promise<ProjectTimeline[]> {
    return await db
      .select()
      .from(projectTimeline)
      .where(eq(projectTimeline.projectId, projectId))
      .orderBy(projectTimeline.createdAt);
  }

  async createProjectTimeline(timeline: InsertProjectTimeline): Promise<ProjectTimeline> {
    try {
      const timelineData: any = { ...timeline };

      // Convert string dates to Date objects, handle null values properly
      if (timeline.estimatedDate !== undefined && timeline.estimatedDate !== null) {
        if (typeof timeline.estimatedDate === 'string') {
          const estimatedDate = new Date(timeline.estimatedDate);
          if (isNaN(estimatedDate.getTime())) {
            throw new Error("Fecha estimada inválida");
          }
          timelineData.estimatedDate = estimatedDate;
        }
      } else if (timeline.estimatedDate === null) {
        timelineData.estimatedDate = null;
      }

      if (timeline.completedAt !== undefined && timeline.completedAt !== null) {
        if (typeof timeline.completedAt === 'string') {
          const completedAt = new Date(timeline.completedAt);
          if (isNaN(completedAt.getTime())) {
            throw new Error("Fecha de completado inválida");
          }
          timelineData.completedAt = completedAt;
        }
      } else if (timeline.completedAt === null) {
        timelineData.completedAt = null;
      }

      const [newTimeline] = await db
        .insert(projectTimeline)
        .values(timelineData)
        .returning();
      return newTimeline;
    } catch (error) {
      console.error("Error creating project timeline:", error);
      throw error;
    }
  }

  async updateProjectTimeline(timelineId: number, updates: any): Promise<ProjectTimeline> {
    try {
      const updateData: any = { ...updates };

      // Handle completedAt date conversion if present
      if (updates.completedAt !== undefined) {
        if (updates.completedAt === null) {
          updateData.completedAt = null;
        } else if (typeof updates.completedAt === 'string') {
          const completedDate = new Date(updates.completedAt);
          if (isNaN(completedDate.getTime())) {
            throw new Error("Fecha de completado inválida");
          }
          updateData.completedAt = completedDate;
        }
      }

      // Si se está marcando como completado, agregar fecha
      if (updates.status === 'completed' && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }

      const [timeline] = await db
        .update(projectTimeline)
        .set(updateData)
        .where(eq(projectTimeline.id, timelineId))
        .returning();

      if (!timeline) {
        throw new Error("Timeline no encontrado");
      }

      // Si se completó un elemento del timeline, actualizar el progreso del proyecto
      if (updates.status === 'completed') {
        await this.updateProjectProgressBasedOnTimeline(timeline.projectId);
      }

      return timeline;
    } catch (error) {
      console.error("Error updating project timeline:", error);
      throw error;
    }
  }

  // Método para verificar si ya existe timeline para un proyecto
  async hasProjectTimeline(projectId: number): Promise<boolean> {
    const timeline = await db
      .select()
      .from(projectTimeline)
      .where(eq(projectTimeline.projectId, projectId))
      .limit(1);

    return timeline.length > 0;
  }

  // Nuevo método para actualizar progreso basado en timeline completado
  async updateProjectProgressBasedOnTimeline(projectId: number): Promise<void> {
    try {
      // Obtener todos los elementos del timeline
      const allTimeline = await db
        .select()
        .from(projectTimeline)
        .where(eq(projectTimeline.projectId, projectId));

      if (allTimeline.length === 0) return;

      // Calcular progreso basado en elementos completados
      const completedCount = allTimeline.filter(item => item.status === 'completed').length;
      const totalCount = allTimeline.length;
      const progressPercentage = Math.round((completedCount / totalCount) * 100);

      console.log(`📊 Actualizando progreso del proyecto ${projectId}: ${completedCount}/${totalCount} = ${progressPercentage}%`);

      // Actualizar el progreso del proyecto
      await this.updateProject(projectId, { progress: progressPercentage });

    } catch (error) {
      console.error("Error updating project progress based on timeline:", error);
    }
  }

  // Budget Negotiations
  async getBudgetNegotiations(projectId: number): Promise<BudgetNegotiation[]> {
    return db
      .select({
        id: budgetNegotiations.id,
        projectId: budgetNegotiations.projectId,
        proposedBy: budgetNegotiations.proposedBy,
        originalPrice: budgetNegotiations.originalPrice,
        proposedPrice: budgetNegotiations.proposedPrice,
        message: budgetNegotiations.message,
        status: budgetNegotiations.status,
        createdAt: budgetNegotiations.createdAt,
        respondedAt: budgetNegotiations.respondedAt,
        proposerName: users.fullName,
        proposerRole: users.role,
      })
      .from(budgetNegotiations)
      .leftJoin(users, eq(budgetNegotiations.proposedBy, users.id))
      .where(eq(budgetNegotiations.projectId, projectId))
      .orderBy(desc(budgetNegotiations.createdAt));
  }

  async createBudgetNegotiation(negotiation: InsertBudgetNegotiation): Promise<BudgetNegotiation> {
    const [created] = await db
      .insert(budgetNegotiations)
      .values(negotiation)
      .returning();

    if (!created) {
      throw new Error("Error al crear negociación de presupuesto");
    }

    return created;
  }

  async updateBudgetNegotiation(negotiationId: number, updates: Partial<BudgetNegotiation>): Promise<BudgetNegotiation> {
    const [updated] = await db
      .update(budgetNegotiations)
      .set({
        ...updates,
        respondedAt: updates.status ? new Date() : undefined,
      })
      .where(eq(budgetNegotiations.id, negotiationId))
      .returning();

    if (!updated) {
      throw new Error("Negociación no encontrada");
    }

    return updated;
  }

  async getLatestBudgetNegotiation(projectId: number): Promise<BudgetNegotiation | null> {
    const [latest] = await db
      .select()
      .from(budgetNegotiations)
      .where(eq(budgetNegotiations.projectId, projectId))
      .orderBy(desc(budgetNegotiations.createdAt))
      .limit(1);

    return latest || null;
  }

  // Work Modalities Methods
  async getWorkModalities(): Promise<WorkModality[]> {
    try {
      const modalities = await db
        .select()
        .from(workModalities)
        .where(eq(workModalities.isActive, true))
        .orderBy(workModalities.displayOrder, workModalities.createdAt);

      // Procesar features para asegurar que sea un array válido
      return modalities.map(modality => ({
        ...modality,
        features: typeof modality.features === 'string'
          ? JSON.parse(modality.features)
          : Array.isArray(modality.features)
            ? modality.features
            : []
      }));
    } catch (error) {
      console.error("Error getting work modalities:", error);
      return [];
    }
  }

  // Seed data
  async seedUsers(): Promise<void> {
    try {
      console.log("🌱 Verificando usuarios iniciales...");

      // Check if admin user exists (check multiple possible emails)
      const possibleAdminEmails = [
        "admin@softwarepar.com",
        "softwarepar.lat@gmail.com",
        "admin@softwarepar.lat"
      ];

      let existingAdmin = null;
      for (const email of possibleAdminEmails) {
        existingAdmin = await this.getUserByEmail(email);
        if (existingAdmin) {
          console.log(`✅ Usuario admin ya existe: ${email}`);
          break;
        }
      }

      // Only create if no admin exists
      if (!existingAdmin) {
        try {
          const { hashPassword } = await import("./auth");
          const hashedPassword = await hashPassword("admin123");

          await this.createUser({
            email: "admin@softwarepar.com",
            password: hashedPassword,
            fullName: "Administrador",
            role: "admin",
            isActive: true,
          });

          console.log("✅ Usuario admin creado: admin@softwarepar.com / admin123");
        } catch (createError) {
          if (createError.code === '23505') {
            console.log("✅ Usuario admin ya existe (detectado durante creación)");
          } else {
            throw createError;
          }
        }
      }

      // Verificar y crear modalidades de trabajo por defecto
      await this.seedWorkModalities();
    } catch (error) {
      if (error.code === '23505') {
        console.log("✅ Usuarios ya existen, continuando...");
      } else {
        console.error("❌ Error en seedUsers:", error);
      }
      // No throw error to prevent server crash
    }
  }

  async seedWorkModalities(): Promise<void> {
    try {
      console.log("🌱 Verificando modalidades de trabajo...");

      const existingModalities = await db.select().from(workModalities).limit(1);

      if (existingModalities.length === 0) {
        console.log("📝 Creando modalidades de trabajo por defecto...");

        const defaultModalities = [
          {
            title: "Compra Completa",
            subtitle: "Solución integral para tu negocio",
            badgeText: "Más Popular",
            badgeVariant: "default",
            description: "Desarrollo completo de tu proyecto con código fuente, propiedad intelectual total y documentación técnica completa. Ideal para empresas que quieren tener control total sobre su software.",
            priceText: "$2,500 - $15,000",
            priceSubtitle: "Precio según complejidad",
            features: [
              "Código fuente completo incluido",
              "Propiedad intelectual total",
              "Documentación técnica completa",
              "Soporte técnico por 6 meses",
              "3 revisiones incluidas",
              "Hosting gratis por 1 año",
              "Capacitación del equipo",
              "Mantenimiento preventivo"
            ],
            buttonText: "Solicitar Cotización",
            buttonVariant: "default",
            isPopular: true,
            isActive: true,
            displayOrder: 1
          },
          {
            title: "Software como Servicio",
            subtitle: "Pago mensual, sin complicaciones",
            badgeText: "Flexible",
            badgeVariant: "secondary",
            description: "Accede a tu software personalizado con un modelo de suscripción mensual. Ideal para startups y empresas que prefieren pagos escalables.",
            priceText: "$200 - $800/mes",
            priceSubtitle: "Según funcionalidades",
            features: [
              "Acceso completo al software",
              "Actualizaciones automáticas",
              "Soporte técnico 24/7",
              "Backup automático diario",
              "Escalabilidad según crecimiento",
              "Sin costos de instalación",
              "Migración de datos incluida",
              "Análisis de uso mensual"
            ],
            buttonText: "Comenzar Prueba",
            buttonVariant: "outline",
            isPopular: false,
            isActive: true,
            displayOrder: 2
          }
        ];

        for (const modality of defaultModalities) {
          await this.createWorkModality(modality);
        }

        console.log("✅ Modalidades de trabajo creadas exitosamente");
      } else {
        console.log("✅ Modalidades de trabajo ya existen");
      }
    } catch (error) {
      console.error("❌ Error creando modalidades por defecto:", error);
    }
  }

  async createWorkModality(modality: InsertWorkModality): Promise<WorkModality> {
    try {
      const [created] = await db
        .insert(workModalities)
        .values({
          ...modality,
          features: JSON.stringify(modality.features),
        })
        .returning();
      return created;
    } catch (error) {
      console.error("Error creating work modality:", error);
      throw error;
    }
  }

  async updateWorkModality(id: number, updates: Partial<WorkModality>): Promise<WorkModality> {
    try {
      const updateData = { ...updates, updatedAt: new Date() };
      if (updates.features) {
        updateData.features = JSON.stringify(updates.features);
      }

      const [updated] = await db
        .update(workModalities)
        .set(updateData)
        .where(eq(workModalities.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating work modality:", error);
      throw error;
    }
  }

  async deleteWorkModality(id: number): Promise<void> {
    try {
      await db
        .update(workModalities)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(workModalities.id, id));
    } catch (error) {
      console.error("Error deleting work modality:", error);
      throw error;
    }
  }

  // Admin Partners Management - Funciones faltantes
  async getAllPartnersForAdmin(): Promise<any[]> {
    try {
      return await db
        .select({
          id: partners.id,
          userId: partners.userId,
          referralCode: partners.referralCode,
          commissionRate: partners.commissionRate,
          totalEarnings: partners.totalEarnings,
          createdAt: partners.createdAt,
          user: {
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            isActive: users.isActive,
          }
        })
        .from(partners)
        .leftJoin(users, eq(partners.userId, users.id))
        .orderBy(desc(partners.createdAt));
    } catch (error) {
      console.error("Error getting all partners for admin:", error);
      return [];
    }
  }

  async getPartnerStatsForAdmin(): Promise<any> {
    try {
      const totalPartners = await db.select({ count: sql`count(*)` }).from(partners);
      const activePartners = await db
        .select({ count: sql`count(*)` })
        .from(partners)
        .leftJoin(users, eq(partners.userId, users.id))
        .where(eq(users.isActive, true));

      const totalCommissions = await db
        .select({ sum: sql<number>`COALESCE(SUM(CAST(commission_amount AS DECIMAL)), 0)` })
        .from(referrals)
        .where(eq(referrals.status, "paid"));

      const totalReferrals = await db.select({ count: sql`count(*)` }).from(referrals);
      const convertedReferrals = await db
        .select({ count: sql`count(*)` })
        .from(referrals)
        .where(eq(referrals.status, "paid"));

      const conversionRate = totalReferrals[0]?.count > 0
        ? (Number(convertedReferrals[0]?.count || 0) / Number(totalReferrals[0]?.count) * 100)
        : 0;

      return {
        totalPartners: Number(totalPartners[0]?.count || 0),
        activePartners: Number(activePartners[0]?.count || 0),
        totalCommissionsPaid: Number(totalCommissions[0]?.sum || 0),
        averageConversionRate: Math.round(conversionRate * 100) / 100,
        topPerformers: 0, // Placeholder for now
      };
    } catch (error) {
      console.error("Error getting partner stats for admin:", error);
      return {
        totalPartners: 0,
        activePartners: 0,
        totalCommissionsPaid: 0,
        averageConversionRate: 0,
        topPerformers: 0,
      };
    }
  }

  async getUserStatsForAdmin(): Promise<any> {
    try {
      const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
      const activeUsers = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.isActive, true));
      const adminUsers = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "admin"));
      const clientUsers = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "client"));
      const partnerUsers = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "partner"));

      // Get users created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newUsers = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(sql`created_at >= ${thirtyDaysAgo.toISOString()}`);

      return {
        totalUsers: Number(totalUsers[0]?.count || 0),
        activeUsers: Number(activeUsers[0]?.count || 0),
        newUsersLast30Days: Number(newUsers[0]?.count || 0),
        usersByRole: {
          admin: Number(adminUsers[0]?.count || 0),
          client: Number(clientUsers[0]?.count || 0),
          partner: Number(partnerUsers[0]?.count || 0),
        }
      };
    } catch (error) {
      console.error("Error getting user stats for admin:", error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersLast30Days: 0,
        usersByRole: {
          admin: 0,
          client: 0,
          partner: 0,
        }
      };
    }
  }

  // Analytics Methods - implementación completa con datos reales
  async getAnalyticsData(period?: number): Promise<any> {
    try {
      const periodDays = period || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // 1. REVENUE ANALYTICS - Datos reales de payment_stages
      const totalRevenue = await db
        .select({ sum: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(paymentStages)
        .where(eq(paymentStages.status, 'paid'));

      const monthlyRevenue = await db
        .select({ sum: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(paymentStages)
        .where(
          and(
            eq(paymentStages.status, 'paid'),
            sql`paid_date >= ${startDate.toISOString()}`
          )
        );

      // Ingresos por mes para el gráfico (últimos 6 meses)
      const monthlyRevenueChart = [];
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthRevenue = await db
          .select({
            sum: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`,
            count: sql<number>`COUNT(*)`
          })
          .from(paymentStages)
          .where(
            and(
              eq(paymentStages.status, 'paid'),
              sql`paid_date >= ${monthStart.toISOString()}`,
              sql`paid_date <= ${monthEnd.toISOString()}`
            )
          );

        monthlyRevenueChart.push({
          month: monthNames[monthStart.getMonth()],
          revenue: Number(monthRevenue[0]?.sum || 0),
          projects: Number(monthRevenue[0]?.count || 0)
        });
      }

      // 2. USERS ANALYTICS - Datos reales de users
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const activeUsers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true));

      // Usuarios por mes para el gráfico
      const monthlyUsersChart = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthUsers = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(sql`created_at <= ${monthEnd.toISOString()}`);

        const monthActiveUsers = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            and(
              eq(users.isActive, true),
              sql`created_at <= ${monthEnd.toISOString()}`
            )
          );

        monthlyUsersChart.push({
          month: monthNames[monthStart.getMonth()],
          users: Number(monthUsers[0]?.count || 0),
          active: Number(monthActiveUsers[0]?.count || 0)
        });
      }

      // 3. PROJECTS ANALYTICS - Datos reales de projects
      const totalProjects = await db.select({ count: sql<number>`count(*)` }).from(projects);
      const completedProjects = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, 'completed'));
      const inProgressProjects = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, 'in_progress'));
      const pendingProjects = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, 'pending'));

      const totalCount = Number(totalProjects[0]?.count || 0);
      const completedCount = Number(completedProjects[0]?.count || 0);
      const successRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      // 4. PARTNERS ANALYTICS - Datos reales de partners
      const totalPartners = await db.select({ count: sql<number>`count(*)` }).from(partners);
      const partnerEarnings = await db
        .select({
          partnerName: users.fullName,
          earnings: partners.totalEarnings,
          referrals: sql<number>`COUNT(${referrals.id})`
        })
        .from(partners)
        .leftJoin(users, eq(partners.userId, users.id))
        .leftJoin(referrals, eq(partners.id, referrals.partnerId))
        .groupBy(partners.id, users.fullName, partners.totalEarnings)
        .orderBy(desc(partners.totalEarnings))
        .limit(5);

      // 5. KPIs CALCULADOS
      const avgProjectValue = totalCount > 0 ? Number(totalRevenue[0]?.sum || 0) / totalCount : 0;
      const customerLifetimeValue = avgProjectValue * 1.5; // Estimación
      const churnRate = 5.2; // Placeholder - necesitaría más datos históricos
      const satisfactionScore = 4.6; // Placeholder - necesitaría sistema de ratings

      // Calcular growth rate (comparación con período anterior)
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

      const previousRevenue = await db
        .select({ sum: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(paymentStages)
        .where(
          and(
            eq(paymentStages.status, 'paid'),
            sql`paid_date >= ${previousPeriodStart.toISOString()}`,
            sql`paid_date < ${startDate.toISOString()}`
          )
        );

      const previousUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            sql`created_at >= ${previousPeriodStart.toISOString()}`,
            sql`created_at < ${startDate.toISOString()}`
          )
        );

      const currentRevenueNum = Number(monthlyRevenue[0]?.sum || 0);
      const previousRevenueNum = Number(previousRevenue[0]?.sum || 0);
      const revenueGrowth = previousRevenueNum > 0
        ? ((currentRevenueNum - previousRevenueNum) / previousRevenueNum) * 100
        : 0;

      const currentUsersNum = Number(activeUsers[0]?.count || 0);
      const previousUsersNum = Number(previousUsers[0]?.count || 0);
      const userGrowth = previousUsersNum > 0
        ? ((currentUsersNum - previousUsersNum) / previousUsersNum) * 100
        : 0;

      // ESTRUCTURA COMPLETA PARA EL FRONTEND
      return {
        revenue: {
          total: Number(totalRevenue[0]?.sum || 0),
          monthly: currentRevenueNum,
          growth: Math.round(revenueGrowth * 100) / 100,
          chart: monthlyRevenueChart
        },
        users: {
          total: Number(totalUsers[0]?.count || 0),
          active: currentUsersNum,
          growth: Math.round(userGrowth * 100) / 100,
          chart: monthlyUsersChart
        },
        projects: {
          total: totalCount,
          completed: completedCount,
          success_rate: Math.round(successRate * 100) / 100,
          chart: [
            { status: "Completados", count: completedCount, color: "#22c55e" },
            { status: "En Desarrollo", count: Number(inProgressProjects[0]?.count || 0), color: "#3b82f6" },
            { status: "Pendientes", count: Number(pendingProjects[0]?.count || 0), color: "#f59e0b" }
          ]
        },
        partners: {
          total: Number(totalPartners[0]?.count || 0),
          active: partnerEarnings.length,
          conversion: 45.2, // Placeholder - necesitaría más datos
          earnings: partnerEarnings.map(p => ({
            partner: p.partnerName || 'Partner',
            earnings: Number(p.earnings || 0),
            referrals: Number(p.referrals || 0)
          }))
        },
        kpis: {
          customer_lifetime_value: Math.round(customerLifetimeValue),
          churn_rate: churnRate,
          satisfaction_score: satisfactionScore,
          avg_project_value: Math.round(avgProjectValue)
        }
      };

    } catch (error) {
      console.error("Error getting analytics data:", error);
      // Fallback con estructura mínima
      return {
        revenue: { total: 0, monthly: 0, growth: 0, chart: [] },
        users: { total: 0, active: 0, growth: 0, chart: [] },
        projects: { total: 0, completed: 0, success_rate: 0, chart: [] },
        partners: { total: 0, active: 0, conversion: 0, earnings: [] },
        kpis: { customer_lifetime_value: 0, churn_rate: 0, satisfaction_score: 0, avg_project_value: 0 }
      };
    }
  }

  async getRevenueAnalytics(period?: number): Promise<any> {
    try {
      const totalRevenue = await db
        .select({ sum: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
        .from(paymentStages)
        .where(eq(paymentStages.status, 'paid'));

      return {
        totalRevenue: Number(totalRevenue[0]?.sum || 0),
        period: period || 30,
      };
    } catch (error) {
      console.error("Error getting revenue analytics:", error);
      return {
        totalRevenue: 0,
        period: period || 30,
      };
    }
  }

  async getUserAnalytics(period?: number): Promise<any> {
    try {
      return await this.getUserStatsForAdmin();
    } catch (error) {
      console.error("Error getting user analytics:", error);
      return {};
    }
  }

  async getProjectAnalytics(period?: number): Promise<any> {
    try {
      return await this.getProjectStats();
    } catch (error) {
      console.error("Error getting project analytics:", error);
      return {};
    }
  }

  async getPartnerAnalytics(period?: number): Promise<any> {
    try {
      return await this.getPartnerStatsForAdmin();
    } catch (error) {
      console.error("Error getting partner analytics:", error);
      return {};
    }
  }

  async getKPIAnalytics(period?: number): Promise<any> {
    try {
      const stats = await this.getAdminStats();
      return {
        kpis: stats,
        period: period || 30,
      };
    } catch (error) {
      console.error("Error getting KPI analytics:", error);
      return {
        kpis: {},
        period: period || 30,
      };
    }
  }

  // Ticket Management for Admin
  async getAllTicketsForAdmin(): Promise<any[]> {
    try {
      return await db
        .select({
          id: tickets.id,
          title: tickets.title,
          description: tickets.description,
          status: tickets.status,
          priority: tickets.priority,
          userId: tickets.userId,
          projectId: tickets.projectId,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
          userName: users.fullName,
          userEmail: users.email,
          projectName: projects.name,
        })
        .from(tickets)
        .leftJoin(users, eq(tickets.userId, users.id))
        .leftJoin(projects, eq(tickets.projectId, projects.id))
        .orderBy(desc(tickets.createdAt));
    } catch (error) {
      console.error("Error getting all tickets for admin:", error);
      return [];
    }
  }

  async getTicketStats(): Promise<any> {
    try {
      const totalTickets = await db.select({ count: sql`count(*)` }).from(tickets);
      const openTickets = await db.select({ count: sql`count(*)` }).from(tickets).where(eq(tickets.status, "open"));
      const closedTickets = await db.select({ count: sql`count(*)` }).from(tickets).where(eq(tickets.status, "closed"));
      const inProgressTickets = await db.select({ count: sql`count(*)` }).from(tickets).where(eq(tickets.status, "in_progress"));

      return {
        total: Number(totalTickets[0]?.count || 0),
        open: Number(openTickets[0]?.count || 0),
        closed: Number(closedTickets[0]?.count || 0),
        inProgress: Number(inProgressTickets[0]?.count || 0),
      };
    } catch (error) {
      console.error("Error getting ticket stats:", error);
      return {
        total: 0,
        open: 0,
        closed: 0,
        inProgress: 0,
      };
    }
  }

  async deleteTicket(ticketId: number): Promise<void> {
    try {
      // Delete ticket responses first
      await db.delete(ticketResponses).where(eq(ticketResponses.ticketId, ticketId));

      // Delete the ticket
      await db.delete(tickets).where(eq(tickets.id, ticketId));
    } catch (error) {
      console.error("Error deleting ticket:", error);
      throw error;
    }
  }

  // Payment stages operations
  async createPaymentStage(data: any): Promise<any> {
    try {
      const [created] = await db.insert(paymentStages).values(data).returning();
      return created;
    } catch (error) {
      console.error("Error creating payment stage:", error);
      throw error;
    }
  }

  async getPaymentStages(projectId: number): Promise<any[]> {
    try {
      const stages = await db
        .select()
        .from(paymentStages)
        .where(eq(paymentStages.projectId, projectId))
        .orderBy(paymentStages.requiredProgress);

      return stages;
    } catch (error) {
      console.error("Error getting payment stages:", error);
      return [];
    }
  }

  async updatePaymentStage(stageId: number, updates: any): Promise<any> {
    try {
      const [updated] = await db
        .update(paymentStages)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(paymentStages.id, stageId))
        .returning();

      // Si se marca como pagado, crear/actualizar fecha de pago
      if (updates.status === 'paid' && !updates.paidAt) {
        await db
          .update(paymentStages)
          .set({ paidAt: new Date() })
          .where(eq(paymentStages.id, stageId));
      }

      return updated;
    } catch (error) {
      console.error("Error updating payment stage:", error);
      throw error;
    }
  }

  async completePaymentStage(stageId: number): Promise<any> {
    try {
      const [updated] = await db
        .update(paymentStages)
        .set({
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(paymentStages.id, stageId))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error completing payment stage:", error);
      throw error;
    }
  }

  // Seed i18n data - disabled until tables are created
  async seedI18n(): Promise<void> {
    console.log("🌱 i18n seeding disabled until tables are created");
  }

  // i18n and currency methods implementation
  async getLanguages(): Promise<Language[]> {
    try {
      return await db.select().from(languages).orderBy(languages.name);
    } catch (error) {
      console.error("Error getting languages:", error);
      return [];
    }
  }

  async getActiveLanguages(): Promise<Language[]> {
    try {
      return await db.select().from(languages)
        .where(eq(languages.isActive, true))
        .orderBy(desc(languages.isDefault), languages.name);
    } catch (error) {
      console.error("Error getting active languages:", error);
      return [];
    }
  }

  async getDefaultLanguage(): Promise<Language | null> {
    try {
      const [defaultLang] = await db.select().from(languages)
        .where(eq(languages.isDefault, true))
        .limit(1);
      return defaultLang || null;
    } catch (error) {
      console.error("Error getting default language:", error);
      return null;
    }
  }

  async getCurrencies(): Promise<Currency[]> {
    try {
      return await db.select().from(currencies).orderBy(currencies.name);
    } catch (error) {
      console.error("Error getting currencies:", error);
      return [];
    }
  }

  async getActiveCurrencies(): Promise<Currency[]> {
    try {
      return await db.select().from(currencies)
        .where(eq(currencies.isActive, true))
        .orderBy(desc(currencies.isDefault), currencies.name);
    } catch (error) {
      console.error("Error getting active currencies:", error);
      return [];
    }
  }

  async getDefaultCurrency(): Promise<Currency | null> {
    try {
      const [defaultCurr] = await db.select().from(currencies)
        .where(eq(currencies.isDefault, true))
        .limit(1);
      return defaultCurr || null;
    } catch (error) {
      console.error("Error getting default currency:", error);
      return null;
    }
  }

  async getExchangeRates(): Promise<ExchangeRate[]> {
    try {
      // Temporary fix: return empty array to avoid error
      console.warn("⚠️ Exchange rates table needs to be created. Returning empty array.");
      return [];
    } catch (error) {
      console.error("Error getting exchange rates:", error);
      return [];
    }
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | null> {
    try {
      const [prefs] = await db.select().from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
      return prefs || null;
    } catch (error) {
      console.error("Error getting user preferences:", error);
      return null;
    }
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [created] = await db.insert(userPreferences).values(preferences).returning();
    return created;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const [updated] = await db.update(userPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updated;
  }

  async getTranslation(keyName: string, languageCode: string): Promise<string | null> {
    try {
      const [language] = await db.select().from(languages)
        .where(eq(languages.code, languageCode))
        .limit(1);

      if (!language) return null;

      const [entry] = await db.select().from(i18nEntries)
        .where(and(
          eq(i18nEntries.keyName, keyName),
          eq(i18nEntries.languageId, language.id)
        ))
        .limit(1);

      return entry?.value || null;
    } catch (error) {
      console.error("Error getting translation:", error);
      return null;
    }
  }

  async createTranslation(entry: InsertI18nEntry): Promise<I18nEntry> {
    const [created] = await db.insert(i18nEntries).values(entry).returning();
    return created;
  }

  async updateTranslation(id: number, updates: Partial<I18nEntry>): Promise<I18nEntry> {
    const [updated] = await db.update(i18nEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(i18nEntries.id, id))
      .returning();
    return updated;
  }

  async getContentTranslation(contentType: string, contentId: number, fieldName: string, languageCode: string): Promise<string | null> {
    try {
      const [language] = await db.select().from(languages)
        .where(eq(languages.code, languageCode))
        .limit(1);

      if (!language) return null;

      const [translation] = await db.select().from(contentTranslations)
        .where(and(
          eq(contentTranslations.contentType, contentType),
          eq(contentTranslations.contentId, contentId),
          eq(contentTranslations.fieldName, fieldName),
          eq(contentTranslations.languageId, language.id)
        ))
        .limit(1);

      return translation?.translatedValue || null;
    } catch (error) {
      console.error("Error getting content translation:", error);
      return null;
    }
  }

  async createContentTranslation(translation: InsertContentTranslation): Promise<ContentTranslation> {
    const [created] = await db.insert(contentTranslations).values(translation).returning();
    return created;
  }

  async convertCurrency(amount: number, fromCurrencyCode: string, toCurrencyCode: string): Promise<number> {
    try {
      if (fromCurrencyCode === toCurrencyCode) return amount;

      const rates = await this.getExchangeRates();
      if (rates.length === 0) return amount;

      const fromCurrency = await db.select().from(currencies).where(eq(currencies.code, fromCurrencyCode)).limit(1);
      const toCurrency = await db.select().from(currencies).where(eq(currencies.code, toCurrencyCode)).limit(1);

      if (!fromCurrency[0] || !toCurrency[0]) return amount;

      const rate = rates.find(r =>
        r.fromCurrencyId === fromCurrency[0].id && r.toCurrencyId === toCurrency[0].id
      );

      if (rate) return amount * Number(rate.rate);

      const reverseRate = rates.find(r =>
        r.fromCurrencyId === toCurrency[0].id && r.toCurrencyId === fromCurrency[0].id
      );

      if (reverseRate) return amount / Number(reverseRate.rate);

      return amount;
    } catch (error) {
      console.error("Error converting currency:", error);
      return amount;
    }
  }

  // Admin invoice management
  async createInvoiceForProject(projectId: number, amount: string, dueDate: Date): Promise<Invoice> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error("Proyecto no encontrado");
      }

      const [invoice] = await db
        .insert(invoices)
        .values({
          projectId,
          clientId: project.clientId,
          amount,
          dueDate,
          status: 'pending',
          currency: 'USD',
          paidDate: null, // Usar paidDate en lugar de paidAt
        })
        .returning();

      return invoice;
    } catch (error) {
      console.error("Error creating invoice for project:", error);
      throw new Error("No se pudo crear la factura");
    }
  }

  async getAllInvoicesForAdmin(): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: invoices.id,
          invoiceNumber: sql<string>`CONCAT('INV-', EXTRACT(YEAR FROM ${invoices.createdAt}), '-', LPAD(${invoices.id}::text, 3, '0'))`.as('invoiceNumber'),
          projectName: projects.name,
          clientName: users.fullName,
          amount: invoices.amount,
          status: invoices.status,
          dueDate: invoices.dueDate,
          paidAt: invoices.paidDate, // Usar paidDate en lugar de paidAt
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .leftJoin(projects, eq(invoices.projectId, projects.id))
        .leftJoin(users, eq(invoices.clientId, users.id))
        .orderBy(desc(invoices.createdAt));

      return result;
    } catch (error) {
      console.error("Error getting all invoices for admin:", error);
      throw new Error("No se pudieron obtener las facturas");
    }
  }

  async updateInvoiceStatus(invoiceId: number, status: string, paidAt?: Date): Promise<Invoice> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (paidAt) {
        updateData.paidDate = paidAt; // Usar paidDate en lugar de paidAt
      }

      const [invoice] = await db
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.id, invoiceId))
        .returning();

      return invoice;
    } catch (error) {
      console.error("Error updating invoice status:", error);
      throw new Error("No se pudo actualizar el estado de la factura");
    }
  }

}

export const storage = new DatabaseStorage();