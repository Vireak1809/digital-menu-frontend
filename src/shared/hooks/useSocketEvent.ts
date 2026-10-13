import { useEffect, useRef } from 'react';
import { getSocket } from '../api/socket';

/** Subscribes to a Socket.IO event for the lifetime of the component. */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const fn = (payload: T) => ref.current(payload);
    socket.on(event, fn);
    return () => { socket.off(event, fn); };
  }, [event]);
}

/** Joins a table room so the customer receives live status updates. */
export function useTableRoom(qrToken?: string) {
  useEffect(() => {
    if (!qrToken) return;
    const socket = getSocket();
    const join = () => socket.emit('join:table', { qrToken });
    join();
    socket.on('connect', join);
    return () => { socket.off('connect', join); };
  }, [qrToken]);
}