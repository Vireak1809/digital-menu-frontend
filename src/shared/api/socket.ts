import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './client';

const BASE = (import.meta.env.VITE_API_URL as string) || '';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE || window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      auth: { token: getAccessToken() ?? undefined },
    });
  }
  return socket;
}

/** Reconnects with a fresh access token after login. */
export function reconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
  return getSocket();
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}