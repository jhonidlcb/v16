import nodemailer from "nodemailer";

console.log('📧 Configurando transporter de email:', {
  user: process.env.GMAIL_USER,
  hasPass: !!(process.env.GMAIL_PASS)
});

// Verificar configuración específica
const expectedGmailUser = 'jhonidelacruz89@gmail.com';
if (process.env.GMAIL_USER !== expectedGmailUser) {
  console.warn('⚠️  Gmail user no coincide:', process.env.GMAIL_USER, 'vs', expectedGmailUser);
}

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
  console.error('❌ Variables de entorno GMAIL_USER y GMAIL_PASS requeridas');
  throw new Error('Configuración de email incompleta');
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    console.log(`📧 Enviando email a: ${options.to}, Asunto: ${options.subject}`);
    await transporter.sendMail({
      from: `"SoftwarePar" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`📧 Email enviado exitosamente a: ${options.to}`);
  } catch (error) {
    console.error("Error enviando email:", error);
    throw new Error("Error enviando email");
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bienvenido a SoftwarePar</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">¡Bienvenido a SoftwarePar!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu cuenta ha sido creada exitosamente</p>
      </div>

      <div style="padding: 30px 0;">
        <h2 style="color: #1e40af;">Hola ${name},</h2>
        <p>Gracias por unirte a SoftwarePar. Estamos emocionados de tenerte en nuestra plataforma.</p>

        <p>Con tu cuenta puedes:</p>
        <ul style="color: #666;">
          <li>Solicitar cotizaciones para tus proyectos</li>
          <li>Hacer seguimiento del progreso de tus desarrollos</li>
          <li>Acceder a soporte técnico especializado</li>
          <li>Gestionar tus facturas y pagos</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat" style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Acceder a mi Dashboard</a>
        </div>

        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

        <p style="margin-top: 30px;">
          Saludos,<br>
          <strong>El equipo de SoftwarePar</strong>
        </p>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>SoftwarePar - Desarrollo de Software Profesional</p>
        <p>Itapúa, Carlos Antonio López, Paraguay | softwarepar.lat@gmail.com</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "¡Bienvenido a SoftwarePar!",
    html,
  });
};

export const sendContactNotification = async (contactData: any): Promise<void> => {
  console.log(`📧 Enviando notificación de contacto a admin: ${process.env.GMAIL_USER} para ${contactData.fullName}`);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nueva Consulta - SoftwarePar</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1e40af; color: white; padding: 20px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0;">Nueva Consulta Recibida</h1>
      </div>

      <div style="padding: 20px 0;">
        <h2>Detalles del Contacto:</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Nombre:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${contactData.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${contactData.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Teléfono:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${contactData.phone || "No proporcionado"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Empresa:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${contactData.company || "No proporcionado"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Tipo de Servicio:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${contactData.serviceType || "No especificado"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Presupuesto:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${contactData.budget || "No especificado"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Timeline:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${contactData.timeline || "No especificado"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Asunto:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${contactData.subject}</td>
          </tr>
        </table>

        <h3>Mensaje:</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #1e40af;">
          ${contactData.message}
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 5px;">
          <p style="margin: 0; font-weight: bold; color: #0369a1;">💡 Acción Requerida:</p>
          <p style="margin: 5px 0 0 0; color: #0369a1;">El cliente será redirigido a WhatsApp con esta información. Responde rápidamente para una mejor experiencia.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: "softwarepar.lat@gmail.com",
    subject: `Nueva consulta: ${contactData.subject} - ${contactData.fullName}`,
    html,
  });
};

export const sendContactConfirmation = async (
  clientEmail: string,
  clientName: string
): Promise<void> => {
  console.log(`📧 Enviando confirmación de contacto a: ${clientEmail}`);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmación de Consulta - SoftwarePar</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">¡Gracias por contactarnos!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Hemos recibido tu consulta exitosamente</p>
      </div>

      <div style="padding: 30px 0;">
        <h2 style="color: #1e40af;">Hola ${clientName},</h2>
        <p>Gracias por contactar a SoftwarePar. Hemos recibido tu consulta y nuestro equipo la está revisando.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #059669;">¿Qué sigue ahora?</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
            <li>Revisaremos tu consulta en detalle</li>
            <li>Te contactaremos en las próximas 24 horas</li>
            <li>Prepararemos una propuesta personalizada</li>
            <li>Coordinaremos una reunión para discutir tu proyecto</li>
          </ul>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">💬 ¿Necesitas respuesta inmediata?</h3>
          <p style="margin: 5px 0;">También puedes contactarnos directamente por WhatsApp:</p>
          <div style="text-align: center; margin: 15px 0;">
            <a href="https://wa.me/595985990046?text=Hola,%20he%20realizado%20una%20consulta%20y%20enviado%20los%20detalles%20con%20el%20formulario.%20Me%20gustaría%20obtener%20más%20información."
               style="background: #25d366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
              📱 Contactar por WhatsApp
            </a>
          </div>
        </div>

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

  await sendEmail({
    to: clientEmail,
    subject: "Confirmación de tu consulta - SoftwarePar",
    html,
  });
};

export const sendPartnerCommissionNotification = async (
  partnerEmail: string,
  partnerName: string,
  commission: string,
  projectName: string
): Promise<void> => {
  console.log(`📧 Enviando notificación de comisión a ${partnerEmail} para ${partnerName} por el proyecto ${projectName}`);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nueva Comisión - SoftwarePar</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">¡Nueva Comisión Generada!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">$${commission}</p>
      </div>

      <div style="padding: 30px 0;">
        <h2 style="color: #059669;">¡Felicitaciones ${partnerName}!</h2>
        <p>Has generado una nueva comisión por la venta del proyecto <strong>"${projectName}"</strong>.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #059669;">Detalles de la comisión:</h3>
          <p style="margin: 5px 0;"><strong>Proyecto:</strong> ${projectName}</p>
          <p style="margin: 5px 0;"><strong>Comisión:</strong> $${commission}</p>
          <p style="margin: 5px 0;"><strong>Estado:</strong> Procesada</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Dashboard</a>
        </div>

        <p>¡Sigue refiriendo clientes y genera más ingresos!</p>

        <p style="margin-top: 30px;">
          Saludos,<br>
          <strong>El equipo de SoftwarePar</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: partnerEmail,
    subject: `¡Nueva comisión de $${commission} generada!`,
    html,
  });
};

export const sendPaymentProofNotificationToAdmin = async (
  clientName: string,
  projectName: string,
  stageName: string,
  amount: string,
  paymentMethod: string,
  fileAttachmentInfo?: string
): Promise<void> => {
  console.log(`📧 Enviando notificación de comprobante al admin para ${clientName}`);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Comprobante de Pago Recibido - SoftwarePar</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">💰 Comprobante de Pago Recibido</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">$${amount}</p>
      </div>

      <div style="padding: 30px 0;">
        <h2 style="color: #059669;">🎉 Nuevo comprobante recibido</h2>
        <p><strong>${clientName}</strong> ha enviado un comprobante de pago:</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #059669;">📋 Detalles del pago:</h3>
          <p style="margin: 5px 0;"><strong>Cliente:</strong> ${clientName}</p>
          <p style="margin: 5px 0;"><strong>Proyecto:</strong> ${projectName}</p>
          <p style="margin: 5px 0;"><strong>Etapa:</strong> ${stageName}</p>
          <p style="margin: 5px 0;"><strong>Monto:</strong> $${amount}</p>
          <p style="margin: 5px 0;"><strong>Método de pago:</strong> ${paymentMethod}</p>
          <p style="margin: 5px 0;"><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })}</p>
        </div>

        ${fileAttachmentInfo ? `
        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #d97706;">📎 Información del comprobante:</h3>
          <p style="margin: 5px 0; font-size: 16px;">${fileAttachmentInfo}</p>
          <p style="margin: 10px 0 5px 0; font-size: 14px; color: #d97706;">
            <strong>Nota:</strong> El cliente también contactará por WhatsApp con más detalles del pago.
          </p>
        </div>
        ` : `
        <div style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6b7280;">📄 Sin comprobante adjunto</h3>
          <p style="margin: 5px 0; color: #6b7280;">El cliente indicó el pago pero no adjuntó comprobante. Contactará por WhatsApp.</p>
        </div>
        `}

        <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #0369a1;">📱 Próximos pasos:</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #0369a1;">
            <li>El cliente contactará por WhatsApp (+595 985 990 046)</li>
            <li>Verificar el comprobante y confirmar la recepción</li>
            <li>Actualizar el estado del proyecto una vez confirmado</li>
            <li>Iniciar trabajo en la siguiente etapa</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/admin/projects" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Ver en Dashboard</a>
          <a href="https://wa.me/595985990046" style="background: #25d366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Abrir WhatsApp</a>
        </div>

        <p><strong>⚠️ Acción requerida:</strong> Por favor revisa el comprobante cuando el cliente contacte por WhatsApp y confirma el pago en el sistema.</p>

        <p style="margin-top: 30px;">
          Saludos,<br>
          <strong>Sistema SoftwarePar</strong>
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: "softwarepar.lat@gmail.com",
    subject: `🎉 Comprobante de pago recibido: ${projectName} - ${stageName} ($${amount})`,
    html,
  });
};

export const sendPaymentProofConfirmationToClient = async (
  clientEmail: string,
  clientName: string,
  projectName: string,
  stageName: string,
  amount: string,
  paymentMethod: string
): Promise<void> => {
  console.log(`📧 Enviando confirmación de comprobante al cliente: ${clientEmail}`);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Comprobante Recibido - SoftwarePar</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">✅ Comprobante Recibido</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Gracias por tu pago</p>
      </div>

      <div style="padding: 30px 0;">
        <h2 style="color: #1e40af;">Hola ${clientName},</h2>
        <p>Hemos recibido exitosamente tu comprobante de pago. Nuestro equipo lo revisará y confirmará en las próximas horas.</p>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">📋 Resumen del pago:</h3>
          <p style="margin: 5px 0;"><strong>Proyecto:</strong> ${projectName}</p>
          <p style="margin: 5px 0;"><strong>Etapa:</strong> ${stageName}</p>
          <p style="margin: 5px 0;"><strong>Monto:</strong> $${amount}</p>
          <p style="margin: 5px 0;"><strong>Método de pago:</strong> ${paymentMethod}</p>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #059669;">🚀 ¿Qué sigue ahora?</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
            <li>Nuestro equipo verificará tu comprobante</li>
            <li>Una vez confirmado, iniciaremos el trabajo en esta etapa</li>
            <li>Recibirás actualizaciones regulares del progreso</li>
            <li>Te notificaremos cuando la etapa esté completa</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/client/projects" style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Mi Proyecto</a>
        </div>

        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

        <p style="margin-top: 30px;">
          Saludos,<br>
          <strong>El equipo de SoftwarePar</strong>
        </p>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>SoftwarePar - Desarrollo de Software Profesional</p>
        <p>📧 softwarepar.lat@gmail.com | 📱 +595 985 990 046</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: clientEmail,
    subject: `Comprobante recibido: ${projectName} - ${stageName}`,
    html,
  });
};

// Función para generar email de aceptación de contraoferta
export function generateBudgetAcceptanceEmailHTML(
  projectName: string,
  clientName: string,
  clientEmail: string,
  originalPrice: string,
  acceptedPrice: string,
  clientMessage: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Contraoferta Aceptada - SoftwarePar</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🎉 ¡Contraoferta Aceptada!</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">El cliente ha aceptado tu propuesta</p>
      </div>

      <div style="padding: 30px 0;">
        <h2 style="color: #059669;">¡Excelente noticia!</h2>
        <p><strong>${clientName}</strong> ha aceptado tu contraoferta para el proyecto <strong>"${projectName}"</strong>.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #059669;">💰 Detalles de la Negociación:</h3>
          <div style="margin-bottom: 10px;">
            <span><strong>Cliente:</strong> ${clientName}</span><br>
            <span><strong>Email:</strong> ${clientEmail}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <span>Precio Original del Cliente:</span>
            <span style="text-decoration: line-through; color: #666; margin-left: 10px;">$${parseFloat(originalPrice).toLocaleString()}</span>
          </div>
          <div style="margin-bottom: 15px;">
            <span><strong>Precio Aceptado:</strong></span>
            <span style="font-size: 24px; font-weight: bold; color: #059669; margin-left: 10px;">$${parseFloat(acceptedPrice).toLocaleString()}</span>
          </div>
          <p style="margin: 10px 0 5px 0;"><strong>Proyecto:</strong> ${projectName}</p>
          <p style="margin: 5px 0;"><strong>Nuevo Estado:</strong> En Desarrollo</p>
        </div>

        ${clientMessage ? `
        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #d97706;">💬 Mensaje del Cliente:</h4>
          <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #fbbf24;">
            "${clientMessage}"
          </div>
        </div>
        ` : ''}

        <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #0369a1;">🚀 Próximos Pasos:</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #0369a1;">
            <li><strong>Configurar Etapas de Pago:</strong> Crea las etapas de pago para el proyecto</li>
            <li><strong>Planificar Timeline:</strong> Define las fases de desarrollo</li>
            <li><strong>Comunicar con el Cliente:</strong> Coordina el inicio del proyecto</li>
            <li><strong>Activar Primera Etapa:</strong> Permite que el cliente haga el primer pago</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/admin/projects" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Gestionar Proyecto</a>
          <a href="https://wa.me/595985990046?text=Hola%2C%20${encodeURIComponent(clientName)}%20ha%20aceptado%20la%20contraoferta%20para%20${encodeURIComponent(projectName)}%20por%20%24${acceptedPrice}.%20Vamos%20a%20coordinar%20el%20inicio." style="background: #25d366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Contactar Cliente</a>
        </div>

        <p style="margin-top: 30px;">
          <strong>¡Es hora de comenzar el desarrollo!</strong><br>
          El equipo de SoftwarePar
        </p>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>SoftwarePar - Panel de Administración</p>
        <p>📧 softwarepar.lat@gmail.com | 📱 +595 985 990 046</p>
      </div>
    </body>
    </html>
  `;
}

// Función para generar email de etapa de pago disponible
export function generatePaymentStageAvailableEmailHTML(
  clientName: string,
  projectName: string,
  stageName: string,
  amount: string,
  percentage: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pago Disponible - SoftwarePar</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">💰 ¡Pago Disponible!</h1>
        <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">$${parseFloat(amount).toLocaleString()}</p>
        <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Tu proyecto está listo para la siguiente etapa</p>
      </div>

      <div style="padding: 30px 0;">
        <h2 style="color: #059669;">¡Hola ${clientName}!</h2>
        <p>¡Excelentes noticias! Tu proyecto <strong>"${projectName}"</strong> ha avanzado y ya puedes realizar el siguiente pago para continuar con el desarrollo.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #059669;">📋 Detalles del Pago:</h3>
          <div style="space-y: 10px;">
            <p style="margin: 5px 0;"><strong>Proyecto:</strong> ${projectName}</p>
            <p style="margin: 5px 0;"><strong>Etapa:</strong> ${stageName}</p>
            <p style="margin: 5px 0;"><strong>Porcentaje:</strong> ${percentage}% del proyecto</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 15px 0; padding: 15px; background: #fff; border-radius: 8px; border: 2px solid #059669;">
              <span style="font-size: 18px; font-weight: bold;">Monto a Pagar:</span>
              <span style="font-size: 28px; font-weight: bold; color: #059669;">$${parseFloat(amount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #0369a1;">🚀 ¿Qué sucede después del pago?</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #0369a1;">
            <li><strong>Inicio Inmediato:</strong> Comenzamos a trabajar en esta etapa del proyecto</li>
            <li><strong>Actualizaciones Regulares:</strong> Te mantendremos informado del progreso</li>
            <li><strong>Comunicación Directa:</strong> Canal de comunicación disponible 24/7</li>
            <li><strong>Transparencia Total:</strong> Podrás ver el avance en tiempo real</li>
          </ul>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #d97706;">💡 Métodos de Pago Disponibles:</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
            <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
              <strong>🥭 Mango</strong><br>
              <span style="color: #666;">Alias: 4220058</span>
            </div>
            <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
              <strong>🏦 Ueno Bank</strong><br>
              <span style="color: #666;">Alias: 4220058</span>
            </div>
          </div>
          <div style="text-align: center; margin-top: 10px;">
            <div style="display: inline-block; padding: 10px; background: white; border-radius: 5px;">
              <strong>☀️ Banco Solar</strong><br>
              <span style="color: #666;">softwarepar.lat@gmail.com</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://softwarepar.lat/client/projects" style="background: #059669; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 18px; font-weight: bold; margin-right: 10px;">💳 Realizar Pago</a>
          <a href="https://wa.me/595985990046?text=Hola%2C%20quiero%20realizar%20el%20pago%20de%20la%20etapa%20${encodeURIComponent(stageName)}%20del%20proyecto%20${encodeURIComponent(projectName)}%20por%20%24${amount}" style="background: #25d366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">📱 WhatsApp</a>
        </div>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #374151;">📞 ¿Necesitas ayuda?</h4>
          <p style="margin: 5px 0; color: #6b7280;">Nuestro equipo está disponible para ayudarte con cualquier pregunta sobre el pago o el proyecto.</p>
          <p style="margin: 5px 0; color: #6b7280;"><strong>WhatsApp:</strong> +595 985 990 046</p>
          <p style="margin: 5px 0; color: #6b7280;"><strong>Email:</strong> softwarepar.lat@gmail.com</p>
        </div>

        <p style="margin-top: 30px;">
          ¡Gracias por confiar en SoftwarePar!<br>
          <strong>El equipo de desarrollo</strong>
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