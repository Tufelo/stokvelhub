import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import stokvelRoutes from "./routes/stokvel.routes";
import { initializeDatabase } from "./db/database";

dotenv.config();

const app = express();

// Initialize database
initializeDatabase();

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://stokvelhub.vercel.app', 'http://localhost:3000']
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    database: "SQLite",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stokvels", stokvelRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to StokvelHub API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "GET /api/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login"
      },
      stokvels: {
        create: "POST /api/stokvels",
        list: "GET /api/stokvels",
        getOne: "GET /api/stokvels/:id",
        update: "PUT /api/stokvels/:id",
        delete: "DELETE /api/stokvels/:id",
        clone: "POST /api/stokvels/:id/clone"
      }
    }
  });
});

export default app;