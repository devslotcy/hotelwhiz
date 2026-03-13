"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface NewMessageEvent {
  sessionId: string;
  message: string;
  reply: string;
  intent: string | null;
  modelUsed: string | null;
  conversationId: string;
  timestamp: string;
}

export function useSocket(
  hotelId: string | null,
  onNewMessage?: (data: NewMessageEvent) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    if (!hotelId) return;

    const socket = io(window.location.origin, {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      socket.emit("join-hotel", hotelId);
    });

    socket.on("new-message", (data: NewMessageEvent) => {
      console.log("[Socket] New message:", data);
      callbackRef.current?.(data);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [hotelId]);

  const isConnected = useCallback(() => {
    return socketRef.current?.connected ?? false;
  }, []);

  return { isConnected };
}
