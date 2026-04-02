import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Hide Express signature
app.disable('x-powered-by');

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limiting - General
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Rate limiting - Auth routes (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again later.' }
});

// Rate limiting - VTU routes (prevent abuse)
const vtuLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many VTU requests. Please try again later.' }
});

app.use(generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/vtu', vtuLimiter);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  'https://revorra.org',
  'https://www.revorra.org',
  'https://admin.revorra.org',
  'https://revorra.vercel.app',
  'https://revorra-admin.vercel.app',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
app.use('/api/notifications', notificationRoutes);

// Public settings endpoint
import {Router} from 'express';
const settingsRouter = Router();
settingsRouter.get('/coupon-link', async (req, res) => {
  const { default: prisma } = await import('./config/prisma.js');
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'COUPON_REQUEST_LINK' }
    });
    let link = setting?.value || 'https://wa.me/your-number';
    if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
      link = 'https://' + link;
    }
    res.json({ success: true, data: { link } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.use('/api/settings', settingsRouter);

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
