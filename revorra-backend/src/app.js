import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/env.js';
import { requestMetadata } from './middlewares/requestMetadata.js';

// Import routes (placeholders for now)
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import vtuRoutes from './routes/vtuRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    'https://revorra.vercel.app',
    'https://revorra-admin.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request metadata middleware (captures IP and device fingerprint)
app.use(requestMetadata);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/vtu', vtuRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/announcements', announcementRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
