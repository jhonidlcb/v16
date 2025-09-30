
import { db } from "./db";
import { notifications, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./email";
import { WebSocketServer } from "ws";

// Store WebSocket connections by user ID
const wsConnections = new Map<number, Set<any>>();

export interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  projectId?: number;
  ticketId?: number;
  metadata?: any;
}

export interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
}


// Register WebSocket connection
export function registerWSConnection(userId: number, ws: any) {
  if (!wsConnections.has(userId)) {
    wsConnections.set(userId, new Set());
  }
  wsConnections.get(userId)!.add(ws);
  
  ws.on('close', () => {
    wsConnections.get(userId)?.delete(ws);
    if (wsConnections.get(userId)?.size === 0) {
      wsConnections.delete(userId);
    }
  });
}

// Send real-time notification via WebSocket
export function sendRealtimeNotification(userId: number, notification: any) {
  console.log(`🔔 Enviando notificación en tiempo real a usuario ${userId}:`, {
    title: notification.title,
    message: notification.message,
    type: notification.type
  });
  
  const userConnections = wsConnections.get(userId);
  if (userConnections && userConnections.size > 0) {
    console.log(`📡 Encontradas ${userConnections.size} conexiones para usuario ${userId}`);
    
    userConnections.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        const notificationData = {
          type: 'notification',
          data: notification,
          timestamp: new Date().toISOString(),
        };
        
        ws.send(JSON.stringify(notificationData));
        console.log(`✅ Notificación enviada por WebSocket a usuario ${userId}`);
      } else {
        console.log(`⚠️ Conexión WebSocket cerrada para usuario ${userId}`);
      }
    });
  } else {
    console.log(`❌ No hay conexiones WebSocket activas para usuario ${userId}`);
  }
}

// Create notification in database
export async function createNotification(data: NotificationData) {
  const notification = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
    })
    .returning();

  // Send real-time notification
  sendRealtimeNotification(data.userId, notification[0]);
  
  return notification[0];
}

// Send comprehensive notification (DB + WebSocket + Email)
export async function sendComprehensiveNotification(
  data: NotificationData,
  emailData?: EmailNotificationData
) {
  // Create in database and send via WebSocket
  const notification = await createNotification(data);
  
  // Send email if provided and has valid recipient
  if (emailData && emailData.to && emailData.to.trim() !== '') {
    try {
      console.log(`📧 Enviando email a: ${emailData.to}`);
      console.log(`📧 Asunto: ${emailData.subject}`);
      await sendEmail(emailData);
      console.log(`✅ Email enviado exitosamente a: ${emailData.to}`);
    } catch (error) {
      console.error(`❌ Error enviando email a ${emailData.to}:`, error);
    }
  } else if (emailData && (!emailData.to || emailData.to.trim() === '')) {
    console.log(`⚠️ Email no enviado: dirección de email vacía o inválida`);
  }

  
  return notification;
}

// Specific notification functions for different events

export async function notifyProjectCreated(clientId: number, adminIds: number[], projectName: string) {
  try {
    const client = await db.select().from(users).where(eq(users.id, clientId)).limit(1);
    const clientName = client[0]?.fullName || 'Cliente';
    
    console.log(`📧 Notificando creación de proyecto "${projectName}" a ${adminIds.length} administradores`);
  
    // Notify each admin individually
    for (const adminId of adminIds) {
      try {
        // Get admin's email address
        const adminData = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
        const admin = adminData[0];
        
        console.log(`📧 Procesando notificación para admin ID ${adminId}: ${admin?.email || 'sin email'}`);
        
        // Always send WebSocket notification
        await sendComprehensiveNotification({
          userId: adminId,
          title: '🚀 Nuevo Proyecto Creado',
          message: `${clientName} ha creado el proyecto "${projectName}"`,
          type: 'info',
        });
        
        // Send email notification if admin has email
        if (admin?.email) {
          console.log(`📧 Enviando email de proyecto creado a admin: ${admin.email}`);
          await sendEmail({
            to: admin.email,
            subject: `Nuevo Proyecto: ${projectName}`,
            html: generateProjectCreatedEmailHTML(clientName, projectName, client[0]?.email),
          });
          console.log(`✅ Email enviado exitosamente a admin: ${admin.email}`);
        } else {
          console.log(`⚠️ Admin ${adminId} no tiene email configurado - solo notificación WebSocket enviada`);
        }
      } catch (adminError) {
        console.error(`❌ Error notificando a admin ${adminId}:`, adminError);
      }
    }
    
    // También enviar email al email principal del sistema
    try {
      console.log(`📧 Enviando email adicional al email principal del sistema`);
      await sendEmail({
        to: process.env.GMAIL_USER || 'softwarepar.lat@gmail.com',
        subject: `Nuevo Proyecto: ${projectName}`,
        html: generateProjectCreatedEmailHTML(clientName, projectName, client[0]?.email),
      });
      console.log(`✅ Email adicional enviado al email principal del sistema`);
    } catch (systemEmailError) {
      console.error(`❌ Error enviando email al sistema principal:`, systemEmailError);
    }
  
    // Confirm to client
    if (client[0]?.email) {
      await sendComprehensiveNotification(
        {
          userId: clientId,
          title: '✅ Proyecto Creado Exitosamente',
          message: `Tu proyecto "${projectName}" ha sido creado y está siendo revisado`,
          type: 'success',
        },
        {
          to: client[0].email,
          subject: `Proyecto creado exitosamente: ${projectName}`,
          html: generateProjectCreatedConfirmationEmailHTML(clientName, projectName),
        }
      );
    } else {
      // Send notification without email if client doesn't have email
      await sendComprehensiveNotification({
        userId: clientId,
        title: '✅ Proyecto Creado Exitosamente',
        message: `Tu proyecto "${projectName}" ha sido creado y está siendo revisado`,
        type: 'success',
      });
      console.log(`⚠️ Cliente ${clientId} no tiene email configurado - solo notificación WebSocket enviada`);
    }
    
  } catch (error) {
    console.error('❌ ERROR en notifyProjectCreated:', error);
    console.error('❌ Stack del error:', error.stack);
    throw error;
  }
}

export async function notifyProjectUpdated(
  clientId: number, 
  projectName: string, 
  updateDescription: string,
  updatedBy: string
) {
  try {
    const client = await db.select().from(users).where(eq(users.id, clientId)).limit(1);
    
    console.log(`📧 Notificando actualización de proyecto "${projectName}" - ${updateDescription}`);
    
    // Notify client
    await sendComprehensiveNotification(
      {
        userId: clientId,
        title: '📋 Proyecto Actualizado',
        message: `Tu proyecto "${projectName}" ha sido actualizado: ${updateDescription}`,
        type: 'info',
      },
      {
        to: client[0]?.email || '',
        subject: `Actualización en tu proyecto: ${projectName}`,
        html: generateProjectUpdateEmailHTML(projectName, updateDescription, updatedBy),
      }
    );
    
    // Notify all admins about project update
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    
    for (const admin of adminUsers) {
      try {
        // Always send WebSocket notification to admin
        await sendComprehensiveNotification({
          userId: admin.id,
          title: '📋 Proyecto Actualizado por Admin',
          message: `Proyecto "${projectName}" actualizado: ${updateDescription}`,
          type: 'info',
        });
        
        // Send email notification to admin if they have email
        if (admin.email) {
          console.log(`📧 Enviando notificación de actualización a admin: ${admin.email}`);
          await sendEmail({
            to: admin.email,
            subject: `Proyecto actualizado: ${projectName}`,
            html: generateAdminProjectUpdateEmailHTML(projectName, updateDescription, updatedBy, client[0]?.fullName || 'Cliente'),
          });
          console.log(`✅ Email de actualización enviado a admin: ${admin.email}`);
        }
      } catch (adminError) {
        console.error(`❌ Error notificando actualización a admin ${admin.id}:`, adminError);
      }
    }
    
    // También enviar email al email principal del sistema
    try {
      console.log(`📧 Enviando email de actualización al email principal del sistema`);
      await sendEmail({
        to: process.env.GMAIL_USER || 'softwarepar.lat@gmail.com',
        subject: `Proyecto actualizado: ${projectName}`,
        html: generateAdminProjectUpdateEmailHTML(projectName, updateDescription, updatedBy, client[0]?.fullName || 'Cliente'),
      });
      console.log(`✅ Email de actualización enviado al email principal del sistema`);
    } catch (systemEmailError) {
      console.error(`❌ Error enviando email de actualización al sistema principal:`, systemEmailError);
    }
    
  } catch (error) {
    console.error('❌ ERROR en notifyProjectUpdated:', error);
    throw error;
  }
}

export async function notifyNewMessage(
  recipientId: number,
  senderName: string,
  projectName: string,
  message: string
) {
  const recipient = await db.select().from(users).where(eq(users.id, recipientId)).limit(1);
  const link = `${process.env.BASE_URL || 'https://softwarepar.lat'}/client/projects`;
  
  
  await sendComprehensiveNotification(
    {
      userId: recipientId,
      title: '💬 Nuevo Mensaje',
      message: `${senderName} te ha enviado un mensaje en "${projectName}"`,
      type: 'info',
    },
    {
      to: recipient[0]?.email || '',
      subject: `Nuevo mensaje en proyecto: ${projectName}`,
      html: generateNewMessageEmailHTML(senderName, projectName, message),
    }
  );
}

export async function notifyTicketCreated(adminIds: number[], clientName: string, ticketTitle: string, clientId?: number) {
  for (const adminId of adminIds) {
    await sendComprehensiveNotification(
      {
        userId: adminId,
        title: '🎫 Nuevo Ticket de Soporte',
        message: `${clientName} ha creado el ticket: "${ticketTitle}"`,
        type: 'warning',
      },
      {
        to: process.env.GMAIL_USER || 'jhonidelacruz89@gmail.com',
        subject: `Nuevo Ticket: ${ticketTitle}`,
        html: generateTicketCreatedEmailHTML(clientName, ticketTitle),
      }
    );
  }

}

export async function notifyTicketResponse(
  recipientId: number,
  responderName: string,
  ticketTitle: string,
  response: string,
  isFromSupport: boolean
) {
  const recipient = await db.select().from(users).where(eq(users.id, recipientId)).limit(1);
  const notificationType = isFromSupport ? 'Respuesta de Soporte' : 'Nueva Respuesta';
  const link = `${process.env.BASE_URL || 'https://softwarepar.lat'}/client/support`;
  
  
  await sendComprehensiveNotification(
    {
      userId: recipientId,
      title: `📞 ${notificationType}`,
      message: `${responderName} respondió a tu ticket: "${ticketTitle}"`,
      type: 'info',
    },
    {
      to: recipient[0]?.email || '',
      subject: `${notificationType}: ${ticketTitle}`,
      html: generateTicketResponseEmailHTML(responderName, ticketTitle, response, isFromSupport),
    }
  );
}

export async function notifyPaymentStageAvailable(
  clientId: number,
  projectName: string,
  stageName: string,
  amount: string
) {
  const client = await db.select().from(users).where(eq(users.id, clientId)).limit(1);
  const link = `${process.env.BASE_URL || 'https://softwarepar.lat'}/client/projects`;
  
  
  await sendComprehensiveNotification(
    {
      userId: clientId,
      title: '💰 Pago Disponible',
      message: `Nueva etapa de pago disponible: ${stageName} - $${amount}`,
      type: 'success',
    },
    {
      to: client[0]?.email || '',
      subject: `Pago disponible para ${projectName}`,
      html: generatePaymentStageEmailHTML(projectName, stageName, amount),
    }
  );
}

export async function notifyBudgetNegotiation(
  recipientId: number,
  projectName: string,
  proposedPrice: string,
  message: string,
  isCounterOffer: boolean = false
) {
  const recipient = await db.select().from(users).where(eq(users.id, recipientId)).limit(1);
  const title = isCounterOffer ? '💵 Contraoferta Recibida' : '💰 Nueva Negociación de Presupuesto';
  
  await sendComprehensiveNotification(
    {
      userId: recipientId,
      title,
      message: `Proyecto "${projectName}": Precio propuesto $${proposedPrice}`,
      type: 'warning',
    },
    {
      to: recipient[0]?.email || '',
      subject: `${title}: ${projectName}`,
      html: generateBudgetNegotiationEmailHTML(projectName, proposedPrice, message, isCounterOffer),
    }
  );
}

// Email HTML templates
function generateProjectCreatedEmailHTML(clientName: string, projectName: string, clientEmail?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Nuevo Proyecto</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0;">🚀 Nuevo Proyecto Creado</h1>
      </div>
      <div style="padding: 30px 0;">
        <h2>¡Hola Admin!</h2>
        <p><strong>${clientName}</strong> ha creado un nuevo proyecto:</p>
        <div style="background: #f8fafc; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${projectName}</h3>
          <p style="margin: 0;"><strong>Cliente:</strong> ${clientName}</p>
          ${clientEmail ? `<p style="margin: 0;"><strong>Email:</strong> ${clientEmail}</p>` : ''}
        </div>
        <p>Por favor revisa el proyecto y asígnale un estado apropiado.</p>
      </div>
    </body>
    </html>
  `;
}

function generateProjectUpdateEmailHTML(projectName: string, updateDescription: string, updatedBy: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Proyecto Actualizado</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0;">📋 Proyecto Actualizado</h1>
      </div>
      <div style="padding: 30px 0;">
        <h2>¡Tu proyecto ha sido actualizado!</h2>
        <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${projectName}</h3>
          <p><strong>Actualización:</strong> ${updateDescription}</p>
          <p><strong>Actualizado por:</strong> ${updatedBy}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/client/projects" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Proyecto</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateNewMessageEmailHTML(senderName: string, projectName: string, message: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Nuevo Mensaje</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0;">💬 Nuevo Mensaje</h1>
      </div>
      <div style="padding: 30px 0;">
        <h2>Tienes un nuevo mensaje</h2>
        <div style="background: #faf5ff; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
          <p><strong>De:</strong> ${senderName}</p>
          <p><strong>Proyecto:</strong> ${projectName}</p>
          <p><strong>Mensaje:</strong></p>
          <div style="background: white; padding: 10px; border-radius: 5px; margin-top: 10px;">
            ${message}
          </div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/client/projects" style="background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Responder</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTicketCreatedEmailHTML(clientName: string, ticketTitle: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Nuevo Ticket</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0;">🎫 Nuevo Ticket de Soporte</h1>
      </div>
      <div style="padding: 30px 0;">
        <h2>¡Nueva solicitud de soporte!</h2>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p><strong>Cliente:</strong> ${clientName}</p>
          <p><strong>Título:</strong> ${ticketTitle}</p>
        </div>
        <p>Por favor revisa y responde al ticket lo antes posible.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/admin/support" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Ticket</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTicketResponseEmailHTML(responderName: string, ticketTitle: string, response: string, isFromSupport: boolean) {
  const color = isFromSupport ? '#059669' : '#1e40af';
  const title = isFromSupport ? 'Respuesta de Soporte' : 'Nueva Respuesta';
  
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${title}</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0;">📞 ${title}</h1>
      </div>
      <div style="padding: 30px 0;">
        <h2>Respuesta a tu ticket</h2>
        <div style="background: #f8fafc; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0;">
          <p><strong>De:</strong> ${responderName}</p>
          <p><strong>Ticket:</strong> ${ticketTitle}</p>
          <p><strong>Respuesta:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
            ${response}
          </div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/client/support" style="background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Ticket</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePaymentStageEmailHTML(projectName: string, stageName: string, amount: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Pago Disponible</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0;">💰 Pago Disponible</h1>
        <p style="margin: 10px 0 0 0; font-size: 24px;">$${amount}</p>
      </div>
      <div style="padding: 30px 0;">
        <h2>¡Tu proyecto ha avanzado!</h2>
        <p>Una nueva etapa de pago está disponible para tu proyecto:</p>
        <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
          <p><strong>Proyecto:</strong> ${projectName}</p>
          <p><strong>Etapa:</strong> ${stageName}</p>
          <p><strong>Monto:</strong> $${amount}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/client/projects" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Realizar Pago</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateBudgetNegotiationEmailHTML(projectName: string, proposedPrice: string, message: string, isCounterOffer: boolean) {
  const title = isCounterOffer ? 'Contraoferta Recibida' : 'Nueva Negociación de Presupuesto';
  
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${title}</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0;">💵 ${title}</h1>
        <p style="margin: 10px 0 0 0; font-size: 24px;">$${proposedPrice}</p>
      </div>
      <div style="padding: 30px 0;">
        <h2>Nueva propuesta de presupuesto</h2>
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p><strong>Proyecto:</strong> ${projectName}</p>
          <p><strong>Precio propuesto:</strong> $${proposedPrice}</p>
          ${message ? `<p><strong>Mensaje:</strong></p><div style="background: white; padding: 10px; border-radius: 5px; margin-top: 10px;">${message}</div>` : ''}
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/client/projects" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Revisar Propuesta</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateAdminProjectUpdateEmailHTML(projectName: string, updateDescription: string, updatedBy: string, clientName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Proyecto Actualizado - Admin</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0;">📋 Proyecto Actualizado</h1>
      </div>
      <div style="padding: 30px 0;">
        <h2>Actualización de Proyecto</h2>
        <div style="background: #f0fdf4; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${projectName}</h3>
          <p><strong>Cliente:</strong> ${clientName}</p>
          <p><strong>Actualización:</strong> ${updateDescription}</p>
          <p><strong>Actualizado por:</strong> ${updatedBy}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-PY')}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/admin/projects" style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver en Dashboard Admin</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

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

function generateProjectCreatedConfirmationEmailHTML(clientName: string, projectName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Proyecto Creado Exitosamente</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎉 ¡Proyecto Creado Exitosamente!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu solicitud ha sido recibida</p>
      </div>
      
      <div style="padding: 30px 0;">
        <h2 style="color: #059669;">¡Hola ${clientName}!</h2>
        <p>Gracias por confiar en SoftwarePar. Tu proyecto <strong>"${projectName}"</strong> ha sido creado exitosamente y nuestro equipo ya está evaluando los detalles.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #059669;">🔍 ¿Qué está pasando ahora?</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
            <li><strong>Revisión técnica:</strong> Analizamos los requerimientos de tu proyecto</li>
            <li><strong>Estimación:</strong> Calculamos tiempos y recursos necesarios</li>
            <li><strong>Asignación:</strong> Seleccionamos al equipo ideal para tu proyecto</li>
            <li><strong>Propuesta:</strong> Te enviaremos una propuesta detallada</li>
          </ul>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">⏰ Tiempo de respuesta</h3>
          <p style="margin: 5px 0; color: #1e40af;"><strong>Te contactaremos en las próximas 24-48 horas</strong> con una propuesta detallada y los siguientes pasos.</p>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #d97706;">💬 ¿Necesitas contactarnos?</h3>
          <p style="margin: 5px 0;">Para consultas urgentes o información adicional:</p>
          <div style="text-align: center; margin: 15px 0;">
            <a href="https://wa.me/595985990046?text=Hola,%20he%20creado%20el%20proyecto%20'${projectName}'%20y%20quisiera%20más%20información." 
               style="background: #25d366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              📱 WhatsApp: +595 985 990 046
            </a>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/client/projects" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Mi Dashboard</a>
        </div>

        <p>¡Estamos emocionados de trabajar contigo y hacer realidad tu proyecto!</p>

        <p style="margin-top: 30px;">
          Saludos cordiales,<br>
          <strong>El equipo de SoftwarePar</strong>
        </p>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>SoftwarePar - Desarrollo de Software Profesional</p>
        <p>Itapúa, Carlos Antonio López, Paraguay</p>
        <p>📧 softwarepar.lat@gmail.com | 📱 +595 985 990 046</p>
      </div>
    </body>
    </html>
  `;
}
