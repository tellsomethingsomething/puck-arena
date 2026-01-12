import { useEffect, useState } from 'react';
import { getPucks, getSettings } from '../lib/api';
import type { Puck, PhysicsSettings } from '@puck-arena/shared';
import { io } from 'socket.io-client';
import { LoadingSpinner } from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function Dashboard() {
  const [pucks, setPucks] = useState<Puck[]>([]);
  const [settings, setSettings] = useState<PhysicsSettings | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pucksData, settingsData] = await Promise.all([getPucks(), getSettings()]);
        setPucks(pucksData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Connect to socket for live user count
    const socket = io(API_URL);
    socket.on('userCount', (data: { count: number }) => {
      setUserCount(data.count);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const activePucks = pucks.filter((p) => p.active).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Users Online"
          value={userCount}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Active Pucks"
          value={activePucks}
          icon="🎯"
          color="green"
        />
        <StatCard
          title="Total Pucks"
          value={pucks.length}
          icon="🏒"
          color="purple"
        />
        <StatCard
          title="Max Pucks"
          value={settings?.maxPucks || 0}
          icon="📊"
          color="orange"
        />
      </div>

      {/* Physics Settings Preview */}
      {settings && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Current Physics Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SettingItem label="Gravity X" value={settings.gravityX} />
            <SettingItem label="Gravity Y" value={settings.gravityY} />
            <SettingItem label="Friction" value={settings.friction} />
            <SettingItem label="Restitution" value={settings.restitution} />
            <SettingItem label="Air Friction" value={settings.airFriction} />
            <SettingItem label="Max Pucks" value={settings.maxPucks} />
          </div>
        </div>
      )}

      {/* Color Distribution */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Puck Colors</h2>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(pucks.map((p) => p.color))).map((color) => {
            const count = pucks.filter((p) => p.color === color).length;
            return (
              <div
                key={color}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-300 text-sm">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  );
}
