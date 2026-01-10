import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PuckConfig, PuckState, PhysicsSettings, FullSync, StateUpdate, UserCountUpdate } from '@puck-arena/shared';
import { DEFAULT_PHYSICS } from '@puck-arena/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [puckCount, setPuckCount] = useState(0);
  const [settings, setSettings] = useState<PhysicsSettings>(DEFAULT_PHYSICS);
  const [fps, setFps] = useState(0);

  // Puck data
  const puckConfigsRef = useRef<Map<string, PuckConfig>>(new Map());
  const puckStatesRef = useRef<Map<string, PuckState>>(new Map());

  // Animation
  const animationRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(0);

  // Canvas dimensions (fixed aspect ratio)
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 450;
  const SERVER_WIDTH = 1920;
  const SERVER_HEIGHT = 1080;

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('fullSync', (data: FullSync) => {
      const configMap = new Map<string, PuckConfig>();
      data.pucks.forEach(p => configMap.set(p.id, p));
      puckConfigsRef.current = configMap;
      setPuckCount(data.pucks.length);
      setSettings(data.settings);
      setUserCount(data.userCount);

      const stateMap = new Map<string, PuckState>();
      data.positions.forEach(s => stateMap.set(s.id, s));
      puckStatesRef.current = stateMap;
    });

    socket.on('state', (data: StateUpdate) => {
      data.pucks.forEach(state => {
        puckStatesRef.current.set(state.id, state);
      });
    });

    socket.on('userCount', (data: UserCountUpdate) => {
      setUserCount(data.count);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = CANVAS_WIDTH / SERVER_WIDTH;
    const scaleY = CANVAS_HEIGHT / SERVER_HEIGHT;

    const render = (timestamp: number) => {
      // FPS calculation
      frameCountRef.current++;
      if (timestamp - lastFpsUpdateRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = timestamp;
      }

      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);

      // Draw pucks
      puckStatesRef.current.forEach((state, id) => {
        const config = puckConfigsRef.current.get(id);
        if (!config) return;

        const x = state.x * scaleX;
        const y = state.y * scaleY;
        const radius = (config.size / 2) * scaleX;

        // Puck body
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = config.color;
        ctx.fill();

        // Velocity indicator
        const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
        if (speed > 0.5) {
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + state.vx * scaleX * 0.5, y + state.vy * scaleY * 0.5);
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Handle tap
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!socketRef.current?.connected) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    socketRef.current.emit('tap', { type: 'tap', x, y });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Live Preview</h1>
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-2 text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Users Online</p>
          <p className="text-2xl font-bold text-white">{userCount}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Pucks</p>
          <p className="text-2xl font-bold text-white">{puckCount}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">FPS</p>
          <p className="text-2xl font-bold text-white">{fps}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">Gravity</p>
          <p className="text-2xl font-bold text-white">{settings.gravityY}</p>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="w-full max-w-4xl mx-auto rounded-lg cursor-pointer"
          style={{ aspectRatio: '16/9' }}
        />
        <p className="text-center text-slate-400 text-sm mt-2">
          Click to apply force to pucks
        </p>
      </div>

      {/* Arena Link */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-2">Arena URL</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value="http://localhost:5177"
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300"
          />
          <button
            onClick={() => window.open('http://localhost:5177', '_blank')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Open Arena
          </button>
        </div>
      </div>
    </div>
  );
}
