import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db, users } from "./db"; // Import database connection and users model
import { verifyEnvironmentConfiguration } from "./env-check";
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Verificar configuración completa del sistema
  console.log('🚀 Iniciando servidor...');
  
  // Verificar variables de entorno
  const envCorrect = verifyEnvironmentConfiguration();
  if (!envCorrect) {
    console.error('❌ Configuración de variables de entorno incorrecta');
  }
  
  console.log('🔗 Verificando conexión a PostgreSQL...');

  try {
    // Test database connection
    const testQuery = await db.select().from(users).limit(1);
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log('👥 Usuarios en la base de datos:', testQuery.length > 0 ? 'SÍ' : 'Base de datos vacía');
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    throw new Error('No se pudo conectar a la base de datos');
  }

  const server = await registerRoutes(app);

  // Servir archivos estáticos desde client/public
  app.use('/public', express.static(path.join(__dirname, '../client/public')));
  app.use(express.static(path.join(__dirname, '../client/public')));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  // Configure server with better stability for development
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 120000;
  server.timeout = 0; // Disable timeout for long-running connections
  server.requestTimeout = 0; // Disable request timeout

  // Optimize server for WebSocket connections
  server.on('upgrade', (request, socket, head) => {
    socket.on('error', (err) => {
      console.error('WebSocket upgrade error:', err);
    });
  });

  // Prevent client cache issues and handle Vite HMR requests
  server.on('request', (req, res) => {
    if (req.url?.includes('/@vite/client') || req.url?.includes('/__vite_ping')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
  });

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 Server running on port ${port}`);
    log(`📊 Environment: ${process.env.NODE_ENV}`);
    log(`🔧 Mode: ${app.get("env") === "development" ? "Development with Vite HMR" : "Production"}`);
    log(`🌐 WebSocket server ready on ws://0.0.0.0:${port}/ws`);
  });
})();