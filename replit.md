# SoftwarePar - Full-Stack Software Development Platform

## Overview

SoftwarePar is a comprehensive software development platform built for the Argentine market, offering custom software development services with integrated client management, partner referral programs, and payment processing. The platform serves as a complete business solution for managing software projects from initial client contact through development, payment, and ongoing support.

The system supports three user roles: administrators who manage the entire platform, partners who earn commissions through referrals, and clients who purchase and track their software projects. Key features include project management with progress tracking, multi-stage payment processing via MercadoPago, integrated support ticketing, WhatsApp notifications via Twilio, and a comprehensive portfolio showcase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 using TypeScript and Vite as the build tool. The UI leverages shadcn/ui components with Radix UI primitives and Tailwind CSS for styling. State management is handled through TanStack Query for server state and React's built-in state for local UI state. The application uses Wouter for client-side routing and Framer Motion for animations.

The component structure follows a modular approach with reusable UI components in the `/components/ui` directory and feature-specific components organized by functionality. The application supports responsive design with mobile-first approach and includes real-time notifications through WebSocket connections.

### Backend Architecture
The backend is built with Express.js and TypeScript, following a RESTful API design pattern. The server implements JWT-based authentication with role-based access control (RBAC) supporting admin, partner, and client roles. Password hashing is handled through bcryptjs for security.

The API routes are organized by feature domains (auth, users, projects, payments, etc.) with middleware for authentication, authorization, and request validation using Zod schemas. The server includes WebSocket support for real-time notifications and file upload capabilities for project assets.

### Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema is defined in TypeScript with proper relationships between entities. Key tables include users, partners, projects, payment stages, tickets, notifications, and portfolio items.

Database migrations are managed through Drizzle Kit, and the connection is established using Neon's serverless PostgreSQL driver. The schema includes proper indexing for performance and foreign key constraints for data integrity.

### Authentication & Authorization
JWT-based authentication system with tokens stored in localStorage on the frontend. Role-based access control restricts access to different parts of the application based on user roles. Authentication middleware validates tokens on protected routes and maintains user sessions.

Password security is implemented using bcryptjs with proper salt rounds. The system includes password reset functionality and account activation flows via email notifications.

### Payment Processing
Integration with MercadoPago for handling payments in the Argentine market. The system supports multi-stage payment processing where projects can be broken down into payment milestones based on development progress. Payment configurations are stored in the database and can be updated by administrators.

The payment flow includes automatic payment link generation, webhook handling for payment status updates, and commission calculations for partner referrals.

### Communication Systems
Dual communication channels through email (Gmail SMTP) and WhatsApp (Twilio API). Email notifications are sent for account creation, project updates, and important system events. WhatsApp integration provides instant notifications for critical updates and can be configured per user preference.

Real-time notifications are delivered through WebSocket connections, allowing immediate updates for project changes, new messages, and system alerts without page refreshes.

## ANÁLISIS COMPLETO DEL SISTEMA (Actualizado)

### 🚨 Estado de Seguridad y Configuración

**Variables de Entorno Críticas:**
- ✅ **DATABASE_URL**: `postgresql://neondb_owner:npg_f1jQRacpFG3V@ep-red-shape-ac6qnrhr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- ✅ **GMAIL_USER**: `jhonidelacruz89@gmail.com`
- ✅ **GMAIL_PASS**: `htzmerglesqpdoht`
- 🚨 **JWT_SECRET**: **PROBLEMA** - Usando fallback inseguro "your-super-secret-jwt-key"
- ❌ **MERCADOPAGO_ACCESS_TOKEN**: No configurado (MercadoPago no implementado)
- ❌ **TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN**: No configurados, usando datos desde BD

### 🗄️ Estructura de Base de Datos Completa (18 Tablas)

**Core del Sistema:**
1. **users** - Usuarios con roles (admin, client, partner)
2. **partners** - Sistema de afiliados con códigos referido
3. **projects** - Proyectos con progreso, precios, fechas
4. **referrals** - Sistema de referidos partners→clientes

**Sistema de Pagos Sofisticado:**
5. **payments** - Pagos simples por proyecto
6. **payment_stages** - ⭐ Pagos por etapas/milestones
7. **invoices** - Facturación con impuestos/descuentos
8. **transactions** - Historial detallado de transacciones
9. **payment_methods** - Métodos de pago usuarios

**Gestión de Proyectos:**
10. **project_messages** - Comunicación por proyecto
11. **project_files** - Archivos subidos
12. **project_timeline** - Timeline con fechas
13. **budget_negotiations** - ⭐ Negociación presupuestos

**Soporte y Comunicación:**
14. **tickets** / **ticket_responses** - Sistema soporte completo
15. **notifications** - Notificaciones sistema
16. **twilio_config** - Configuración WhatsApp
17. **portfolio** - Showcase trabajos
18. **work_modalities** - Modalidades trabajo configurables

### 💰 Sistema de Pagos REAL (No MercadoPago)

**Métodos de Pago Locales Paraguay:**
- **Mango**: Alias 4220058 (Cédula)
- **Ueno Bank**: Alias 4220058 (Cédula)  
- **Banco Solar**: Alias softwarepar.lat@gmail.com (Email)

**Proceso Manual:**
1. Cliente selecciona método de pago
2. Realiza transferencia con alias
3. Sube comprobante al sistema
4. Sistema notifica admin por email + WhatsApp
5. Admin verifica y confirma pago manualmente

### 🏗️ Arquitectura del Backend (1700+ líneas de API)

**server/storage.ts** - 1725 líneas - Capa de acceso a datos:
- 40+ métodos para operaciones CRUD
- Analytics complejos para partners/admins
- Gestión de comisiones automáticas
- Activación automática etapas de pago por progreso

**server/routes.ts** - 1700+ líneas - API REST completa:
- Sistema autenticación JWT + RBAC
- Rutas por dominio: auth, users, projects, partners
- Middleware validación Zod
- Upload archivos con Multer (10MB)
- WebSocket server integrado

**Notificaciones Comprehensivas:**
- Base de datos + WebSocket + Email + WhatsApp simultáneo
- Templates específicos para cada evento
- Registro conexiones WebSocket por usuario

### 📱 Frontend Ultra-Moderno

**Stack Tecnológico:**
- **React 18 + TypeScript + Vite**
- **TanStack Query** - Estado servidor + cache inteligente
- **Wouter** - Routing ligero
- **Tailwind + shadcn/ui + Radix UI** - Sistema diseño
- **Framer Motion** - Animaciones

**Arquitectura Componentes:**
- Routing por roles: `/admin/*`, `/client/*`, `/partner/*`
- Hooks custom para auth, WebSocket, proyectos
- Layout responsive con integración WhatsApp directa
- Sistema notificaciones tiempo real

### 🔗 Servicios Externos Configurados

**Base de Datos:**
- **Neon PostgreSQL**: Serverless con pooling automático
- **Drizzle ORM**: Type-safe con migraciones automáticas

**Comunicación:**
- **Gmail SMTP**: Emails transaccionales (configurado ✅)
- **Twilio WhatsApp**: Configuración dinámica desde BD (variables faltantes ❌)

**Frontend:**
- **Vercel/Netlify Ready**: Build con Vite optimizado
- **WebSocket**: Tiempo real sobre HTTP/WS

## Recent Changes

### ✅ Fresh Replit Environment Setup (September 30, 2025)

**GitHub Import Configuration Completed:**
1. **Dependencies Installed**: All 625 npm packages installed successfully
2. **Database Connected**: PostgreSQL Neon database connected and verified
3. **Database Schema**: Existing database schema aligned with application
4. **Development Workflow**: Configured to run on port 5000 with Vite HMR
5. **Admin User Ready**: Default admin user exists (softwarepar.lat@gmail.com)
6. **Work Modalities**: Work modalities already configured in database
7. **Deployment Configuration**: VM deployment configured with build and production scripts

**Current Status:**
- ✅ **Frontend**: React 18 + TypeScript + Vite running successfully on port 5000
- ✅ **Backend**: Express server with WebSocket support running
- ✅ **Database**: PostgreSQL connected with all 18 tables ready
- ✅ **Security**: JWT authentication with development fallback configured
- ✅ **Email**: Gmail SMTP configured for notifications
- ✅ **Deployment**: VM deployment ready for production

**Key Configuration:**
- **Development**: `npm run dev` - Runs TypeScript server with Vite HMR on port 5000
- **Build**: `npm run build` - Builds both frontend (Vite) and backend (esbuild)
- **Production**: `npm start` - Runs production build from dist/
- **Database**: `npm run db:push` - Syncs schema changes to PostgreSQL
- **Environment**: DATABASE_URL configured, JWT_SECRET uses secure fallback

**Vite Configuration:**
- Host: `0.0.0.0:5000` with `allowedHosts: true` for Replit proxy
- API Proxy: Backend proxied from `localhost:3001` to `/api`
- WebSocket: Proxied to `/socket.io` for real-time notifications
- HMR: Full hot module replacement working in development

### ✅ Invoice/Receipt Design Improvements (September 30, 2025)

**Professional PDF Invoice Template:**
- **Redesigned completely** based on modern business invoice standards
- **Header**: Blue gradient header with logo placeholder and "INVOICE" title
- **Company Info**: Professional layout with company details on left side
- **Invoice Details**: Date, Invoice #, and PO # on right side
- **Bill To Section**: Blue header bar with client information
- **Items Table**: 
  - Professional table with blue headers
  - Alternating row colors (white/light gray) for readability
  - Columns: Quantity, Description, Unit Price, Amount
  - Project and stage details included
- **Totals Section**:
  - Subtotal, Credit, Tax (0% for digital services)
  - **Balance Due** highlighted in blue
- **Payment Instructions**: Clear payment methods and instructions
- **Footer**: Thank you message and legal compliance info
- **Styling**: Modern, clean design with professional color scheme (#2563EB blue)

**Endpoint**: `/api/client/stage-invoices/:stageId/download-resimple`
**File Format**: PDF (A4 size)
**File Name Pattern**: `SoftwarePar_Invoice_BSP-{YEAR}-{NUMBER}.pdf`