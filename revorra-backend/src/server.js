import app from './app.js';
import config from './config/env.js';
import prisma from './config/prisma.js';

// Security check: JWT secret must be strong
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'super_secure_secret_key_change_in_production') {
  console.error('FATAL: You must change the default JWT_SECRET in production');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    Revorra Backend Server                                   ║
║                                                               ║
║   Server running on port: ${PORT}                              ║
║   Environment: ${config.nodeEnv}                                ║
║   Health check: http://localhost:${PORT}/api/health            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

// Auto-delete tasks after 24 hours
const cleanupExpiredTasks = async () => {
  try {
    const { default: prisma } = await import('./config/prisma.js');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // First delete completions for old tasks
    const oldTasks = await prisma.task.findMany({
      where: { createdAt: { lt: twentyFourHoursAgo } },
      select: { id: true }
    });

    if (oldTasks.length > 0) {
      const oldTaskIds = oldTasks.map(t => t.id);
      await prisma.taskCompletion.deleteMany({
        where: { taskId: { in: oldTaskIds } }
      });
      await prisma.task.deleteMany({
        where: { id: { in: oldTaskIds } }
      });
      console.log(`Cleaned up ${oldTasks.length} expired tasks`);
    }
  } catch (error) {
    console.error('Task cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredTasks, 60 * 60 * 1000);
// Also run on startup
cleanupExpiredTasks();
