import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthenticatedSocket extends Socket {
  user?: any;
}

export const socketHandler = (io: SocketIOServer) => {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.email} connected`);

    // Join user to their personal room
    socket.join(`user:${socket.user?._id}`);

    // Handle joining chat rooms
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit('user_joined', {
        userId: socket.user?._id,
        userName: `${socket.user?.firstName} ${socket.user?.lastName}`
      });
    });

    // Handle sending messages
    socket.on('send_message', (data: {
      roomId: string;
      content: string;
      type: 'text' | 'image' | 'file';
    }) => {
      const message = {
        id: Date.now().toString(),
        content: data.content,
        type: data.type,
        sender: {
          id: socket.user?._id,
          name: `${socket.user?.firstName} ${socket.user?.lastName}`,
          avatar: socket.user?.avatar
        },
        timestamp: new Date(),
        roomId: data.roomId
      };

      // Broadcast to room
      io.to(data.roomId).emit('new_message', message);

      // Store message in database (implementation omitted for brevity)
    });

    // Handle typing indicators
    socket.on('typing_start', (roomId: string) => {
      socket.to(roomId).emit('user_typing', {
        userId: socket.user?._id,
        userName: `${socket.user?.firstName} ${socket.user?.lastName}`
      });
    });

    socket.on('typing_stop', (roomId: string) => {
      socket.to(roomId).emit('user_stop_typing', {
        userId: socket.user?._id
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.email} disconnected`);
    });
  });
};
