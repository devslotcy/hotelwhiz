import { Server as SocketIOServer } from "socket.io";

export function getIO(): SocketIOServer | null {
  return (global as Record<string, unknown>).__io as SocketIOServer | null;
}

export function emitNewMessage(hotelId: string, data: {
  sessionId: string;
  message: string;
  reply: string;
  intent: string | null;
  modelUsed: string | null;
  conversationId: string;
  timestamp: string;
}) {
  const io = getIO();
  if (io) {
    io.to(`hotel:${hotelId}`).emit("new-message", data);
    console.log(`[Socket.io] Emitted new-message to hotel:${hotelId}`);
  }
}
