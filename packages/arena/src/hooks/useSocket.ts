import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  FullSync,
  StateUpdate,
  ConfigUpdate,
  UserCountUpdate,
  PuckConfig,
  PuckState,
  PhysicsSettings,
} from '@puck-arena/shared';
import { DEFAULT_PHYSICS } from '@puck-arena/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface TapEffectEvent {
  x: number;
  y: number;
  timestamp: number;
}

export function useSocket(onTapEffect?: (effect: TapEffectEvent) => void) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [puckConfigs, setPuckConfigs] = useState<PuckConfig[]>([]);
  const [puckStates, setPuckStates] = useState<Map<string, PuckState>>(new Map());
  const [settings, setSettings] = useState<PhysicsSettings>(DEFAULT_PHYSICS);

  // Interpolation state
  const targetStatesRef = useRef<Map<string, PuckState>>(new Map());
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socket.on('fullSync', (data: FullSync) => {
      console.log('Full sync received:', data.pucks.length, 'pucks');
      setPuckConfigs(data.pucks);
      setSettings(data.settings);
      setUserCount(data.userCount);

      // Initialize puck states from positions
      const newStates = new Map<string, PuckState>();
      data.positions.forEach((state) => {
        newStates.set(state.id, state);
      });
      setPuckStates(newStates);
      targetStatesRef.current = new Map(newStates);
    });

    socket.on('state', (data: StateUpdate) => {
      lastUpdateRef.current = data.timestamp;

      // Update target states for interpolation
      data.pucks.forEach((state) => {
        targetStatesRef.current.set(state.id, state);
      });

      // Apply state update
      setPuckStates((prev) => {
        const newStates = new Map(prev);
        data.pucks.forEach((state) => {
          newStates.set(state.id, state);
        });
        return newStates;
      });
    });

    socket.on('configUpdate', (data: ConfigUpdate) => {
      if (data.pucks) {
        setPuckConfigs(data.pucks);

        // Remove states for deleted pucks
        const configIds = new Set(data.pucks.map((p) => p.id));
        setPuckStates((prev) => {
          const newStates = new Map(prev);
          newStates.forEach((_, id) => {
            if (!configIds.has(id)) {
              newStates.delete(id);
              targetStatesRef.current.delete(id);
            }
          });
          return newStates;
        });
      }
      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    });

    socket.on('userCount', (data: UserCountUpdate) => {
      setUserCount(data.count);
    });

    socket.on('tapEffect', (data: TapEffectEvent) => {
      onTapEffect?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [onTapEffect]);

  const sendTap = useCallback((x: number, y: number, force?: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('tap', { type: 'tap', x, y, force });
    }
  }, []);

  // Get interpolated states
  const getInterpolatedStates = useCallback((): Map<string, PuckState> => {
    return puckStates;
  }, [puckStates]);

  return {
    connected,
    userCount,
    puckConfigs,
    puckStates,
    settings,
    sendTap,
    getInterpolatedStates,
  };
}
