import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'super_secure_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Admin
  adminEmail: process.env.ADMIN_EMAIL || 'admin@revorra.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'change_this_securely',
  
  // Paystack
  paystackSecret: process.env.PAYSTACK_SECRET,
  paystackBaseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  
  // VTU
  vtuApiKey: process.env.VTU_API_KEY,
  vtuBaseUrl: process.env.VTU_BASE_URL || 'https://vtu-api.example.com',
  
  // Frontend URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
};

export default config;
