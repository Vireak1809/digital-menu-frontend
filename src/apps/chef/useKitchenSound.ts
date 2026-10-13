import { useCallback, useRef, useState } from 'react';

/**
 * Kitchen alert tone generated with the Web Audio API — no asset files needed,
 * and it works offline once the user has interacted with the page.
 */
export function useKitchenSound() {
  const [enabled, setEnabled] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctor();
    }
    void ctxRef.current?.resume();
  }, []);

  const notify = useCallback(() => {
    if (!enabled) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.18, 0.36].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 2 ? 1180 : 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  }, [enabled]);

  const toggle = useCallback(() => {
    unlock();
    setEnabled((v) => !v);
  }, [unlock]);

  return { enabled, toggle, notify, unlock };
}