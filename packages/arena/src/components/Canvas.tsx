import { useRef, useEffect, useCallback } from 'react';
import type { PuckConfig, PuckState, PhysicsSettings } from '@puck-arena/shared';
import { ArenaRenderer } from '../lib/renderer';

interface CanvasProps {
  puckConfigs: PuckConfig[];
  puckStates: Map<string, PuckState>;
  settings: PhysicsSettings;
  onTap: (x: number, y: number) => void;
}

// Server world dimensions (constant reference frame)
const SERVER_WIDTH = 1920;
const SERVER_HEIGHT = 1080;

export function Canvas({ puckConfigs, puckStates, settings: _settings, onTap }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ArenaRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Store previous states for interpolation
  const prevStatesRef = useRef<Map<string, PuckState>>(new Map());

  // Initialize renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new ArenaRenderer();
    rendererRef.current = renderer;

    renderer.init(containerRef.current).then(() => {
      console.log('Renderer initialized');
    });

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      renderer.destroy();
    };
  }, []);

  // Sync pucks with renderer
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.syncPucks(puckConfigs);
    }
  }, [puckConfigs]);


  // Animation loop with interpolation
  useEffect(() => {
    const animate = () => {
      if (!rendererRef.current || !containerRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const width = rendererRef.current.getWidth();
      const height = rendererRef.current.getHeight();

      // Scale factors to map server coords to client coords
      const scaleX = width / SERVER_WIDTH;
      const scaleY = height / SERVER_HEIGHT;

      // Update each puck position with interpolation
      puckStates.forEach((state, id) => {
        const prevState = prevStatesRef.current.get(id);

        // Convert server coordinates to client coordinates
        const targetX = state.x * scaleX;
        const targetY = state.y * scaleY;

        let x = targetX;
        let y = targetY;

        // Interpolate from previous position for smoother movement
        if (prevState) {
          const prevX = prevState.x * scaleX;
          const prevY = prevState.y * scaleY;
          const lerp = 0.3; // Interpolation factor

          x = prevX + (targetX - prevX) * lerp;
          y = prevY + (targetY - prevY) * lerp;
        }

        // Scale velocity for visual effects
        const vx = state.vx * scaleX;
        const vy = state.vy * scaleY;

        rendererRef.current?.updatePuck(id, x, y, state.angle, vx, vy);
      });

      // Store current states for next frame interpolation
      prevStatesRef.current = new Map(puckStates);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [puckStates]);

  // Handle tap/click
  const handleInteraction = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !rendererRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Haptic feedback for mobile devices
      if (navigator.vibrate) {
        navigator.vibrate(12); // Quick 12ms buzz
      }

      // Show local tap effect immediately
      rendererRef.current.showTapEffect(x, y);

      // Send normalized coordinates to server
      const normalizedX = x / rendererRef.current.getWidth();
      const normalizedY = y / rendererRef.current.getHeight();
      onTap(normalizedX, normalizedY);
    },
    [onTap]
  );

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleInteraction(e.clientX, e.clientY);
    },
    [handleInteraction]
  );

  // Touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleInteraction(touch.clientX, touch.clientY);
    },
    [handleInteraction]
  );

  // Show tap effects from other users
  const showRemoteTapEffect = useCallback((normalizedX: number, normalizedY: number) => {
    if (!rendererRef.current) return;
    const x = normalizedX * rendererRef.current.getWidth();
    const y = normalizedY * rendererRef.current.getHeight();
    rendererRef.current.showTapEffect(x, y);
  }, []);

  // Expose remote tap effect handler
  useEffect(() => {
    (window as unknown as { showRemoteTapEffect?: typeof showRemoteTapEffect }).showRemoteTapEffect = showRemoteTapEffect;
    return () => {
      delete (window as unknown as { showRemoteTapEffect?: typeof showRemoteTapEffect }).showRemoteTapEffect;
    };
  }, [showRemoteTapEffect]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full no-select cursor-pointer"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    />
  );
}
