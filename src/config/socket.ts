import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        socket.userId = decoded.id;
      } catch {
        // Allow connection without auth for public events
      }
    }
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join:workspace', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`User ${socket.userId} joined workspace:${workspaceId}`);
    });

    socket.on('leave:workspace', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their notification room`);
    });

    socket.on('typing:start', ({ workspaceId, userId, username }: { workspaceId: string; userId: string; username: string }) => {
      socket.to(`workspace:${workspaceId}`).emit('user:typing', { userId, username });
    });

    socket.on('typing:stop', ({ workspaceId, userId }: { workspaceId: string; userId: string }) => {
      socket.to(`workspace:${workspaceId}`).emit('user:stopTyping', { userId });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export default { initSocket, getIO };