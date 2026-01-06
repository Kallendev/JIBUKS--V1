import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import familyRoutes from './routes/family.js';

const app = express();

// Get configuration from environment
const LOCAL_IP = process.env.LOCAL_NETWORK_IP || '192.168.0.102';
const PORT = process.env.PORT || '4001';

// Build dynamic CORS origins
const buildCorsOrigins = () => {
  const origins = [
    // Localhost for iOS simulator and web
    'http://localhost:4001',
    'http://localhost:8081',
    `http://localhost:${PORT}`,

    // Android emulator special IP
    'http://10.0.2.2:4001',
    'http://10.0.2.2:8081',
    `http://10.0.2.2:${PORT}`,
    'exp://10.0.2.2:8081',

    // Local network IP (for physical devices)
    `http://${LOCAL_IP}:4001`,
    `http://${LOCAL_IP}:8081`,
    `http://${LOCAL_IP}:${PORT}`,
    `exp://${LOCAL_IP}:8081`,
  ];

  return process.env.NODE_ENV === 'production'
    ? ['https://your-production-domain.com']
    : origins;
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: buildCorsOrigins(),
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    network: {
      localIP: LOCAL_IP,
      port: PORT
    }
  });
});

// Serve static files (uploads)
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Root endpoint
app.get('/', (req, res) => res.json({ ok: true, message: 'JIBUKS backend' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family', familyRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;