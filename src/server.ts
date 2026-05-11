import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.ts';
import { initSocket } from './config/socket.ts';
import { ENV } from './config/index.ts';
import routes from './routes/index.ts';
import errorHandler from './middleware/errorHandler.ts';

const app: Application = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: ENV.CORS_ORIGIN,
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initSocket(server);

app.use('/api', routes);

app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

connectDB().then(() => {
  server.listen(ENV.PORT, () => {
    console.log(`Server running on port ${ENV.PORT}`);
    console.log(`Environment: ${ENV.NODE_ENV}`);
  });
}).catch((err: Error) => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

export default server;