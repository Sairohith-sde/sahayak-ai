import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import householdRoutes from './routes/household.js';
import visitRoutes from './routes/visit.js';
import supervisorRoutes from './routes/supervisor.js';
import dashboardRoutes from './routes/dashboard.js';
import { authMiddleware, roleMiddleware } from './middleware/auth.js';
import { resolveEscalation } from './controllers/supervisor.js';
import { offlineSimulation, setOfflineSimulation } from './services/ai.js';
import { connectDB } from './config/db.js';
import { seedData } from './data/seed.js';

const app = express();

// 1. Enable Cross-Origin Resource Sharing immediately at the entrypoint (bypasses DB connection delays)
const corsMiddleware = cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'https://client-beryl-three-55.vercel.app', 'https://sahayak-portal-nhm.vercel.app'].filter(Boolean),
  credentials: true
});

app.use(corsMiddleware);
app.options('*', corsMiddleware);

// 2. On-Demand Serverless DB Initialization & Seeding Middleware
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      await seedData();
      dbConnected = true;
    } catch (e) {
      console.error("⚠️ Serverless db initialization error:", e);
    }
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Backend Welcome Index (Self-Documenting) ---
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Sahayak AI Decision-Support API Portal',
    clientPortal: 'http://localhost:5173',
    healthCheck: 'http://localhost:3001/api/health',
    status: 'online',
    version: '1.0.0'
  });
});

// --- API Health Endpoint ---
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'Sahayak AI Backend Services',
    databaseMode: isMongoConnected() ? 'MongoDB' : 'Memory'
  });
});

// Import helper to check active DB mode
import { isMongoMode } from './config/db.js';
function isMongoConnected() {
  try {
    return isMongoMode();
  } catch (e) {
    return false;
  }
}

// --- Bind Domain Routers ---
app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Spec checklist alternate route path mapping
app.patch('/api/escalations/:id', authMiddleware, roleMiddleware(['supervisor']), resolveEscalation);

// --- Debug / Offline Simulation Routes ---
app.post('/api/debug/offline-mode', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Forbidden in production mode.' });
  }
  const { enabled } = req.body;
  setOfflineSimulation(!!enabled);
  res.status(200).json({ enabled: offlineSimulation });
});

app.get('/api/debug/offline-mode', (req, res) => {
  res.status(200).json({ enabled: offlineSimulation });
});

// --- 404 Not Found Handler ---
app.use((req, res, next) => {
  res.status(404).json({ message: `API Endpoint not found: ${req.originalUrl}` });
});

// --- Centralized Error Handling Middleware (Requirement-compliant) ---
app.use((err, req, res, next) => {
  console.error('❌ Express Boundary Error Caught:', err.stack);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

export default app;
