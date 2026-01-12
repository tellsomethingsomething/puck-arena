import { useEffect, useState } from 'react';
import { DEFAULT_PHYSICS, type PhysicsSettings } from '@puck-arena/shared';
import { getSettings, updateSettings } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Settings() {
  const [settings, setSettings] = useState<PhysicsSettings>(DEFAULT_PHYSICS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_PHYSICS);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Physics Settings</h1>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Apply Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gravity */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Gravity</h2>

          <div className="space-y-4">
            <SliderSetting
              label="Gravity X"
              value={settings.gravityX}
              min={-2}
              max={2}
              step={0.1}
              onChange={(v) => setSettings({ ...settings, gravityX: v })}
            />
            <SliderSetting
              label="Gravity Y"
              value={settings.gravityY}
              min={-2}
              max={2}
              step={0.1}
              onChange={(v) => setSettings({ ...settings, gravityY: v })}
            />
          </div>
        </div>

        {/* Friction */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Friction</h2>

          <div className="space-y-4">
            <SliderSetting
              label="Surface Friction"
              value={settings.friction}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => setSettings({ ...settings, friction: v })}
            />
            <SliderSetting
              label="Air Friction"
              value={settings.airFriction}
              min={0}
              max={0.1}
              step={0.001}
              onChange={(v) => setSettings({ ...settings, airFriction: v })}
            />
          </div>
        </div>

        {/* Bounciness */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Bounciness</h2>

          <div className="space-y-4">
            <SliderSetting
              label="Restitution"
              value={settings.restitution}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setSettings({ ...settings, restitution: v })}
              description="How bouncy pucks are (0 = no bounce, 1 = full bounce)"
            />
          </div>
        </div>

        {/* LED Arch Mode */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">LED Arch Mode</h2>

          <div className="space-y-4">
            <SliderSetting
              label="Arch Gravity"
              value={settings.archGravity}
              min={0}
              max={10}
              step={0.5}
              onChange={(v) => setSettings({ ...settings, archGravity: v })}
              description="Pucks fall toward edges (0 = off, higher = stronger pull toward sides)"
            />
          </div>
        </div>

        {/* Limits */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Limits</h2>

          <div className="space-y-4">
            <SliderSetting
              label="Max Pucks"
              value={settings.maxPucks}
              min={10}
              max={100}
              step={10}
              onChange={(v) => setSettings({ ...settings, maxPucks: v })}
              description="Maximum number of pucks allowed in the arena"
            />
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Presets</h2>
        <div className="flex flex-wrap gap-3">
          <PresetButton
            label="Air Hockey"
            onClick={() => setSettings({
              ...settings,
              gravityX: 0,
              gravityY: 0,
              friction: 0.001,
              airFriction: 0.0005,
              restitution: 0.95,
            })}
          />
          <PresetButton
            label="Pinball"
            onClick={() => setSettings({
              ...settings,
              gravityX: 0,
              gravityY: 1,
              friction: 0.05,
              airFriction: 0.001,
              restitution: 0.8,
            })}
          />
          <PresetButton
            label="Pool Table"
            onClick={() => setSettings({
              ...settings,
              gravityX: 0,
              gravityY: 0,
              friction: 0.1,
              airFriction: 0.02,
              restitution: 0.7,
            })}
          />
          <PresetButton
            label="Bouncy Castle"
            onClick={() => setSettings({
              ...settings,
              gravityX: 0,
              gravityY: 0.3,
              friction: 0.01,
              airFriction: 0.001,
              restitution: 1,
            })}
          />
          <PresetButton
            label="Zero Gravity"
            onClick={() => setSettings({
              ...settings,
              gravityX: 0,
              gravityY: 0,
              friction: 0.001,
              airFriction: 0.0001,
              restitution: 0.99,
              archGravity: 0,
            })}
          />
          <PresetButton
            label="LED Arch"
            onClick={() => setSettings({
              ...settings,
              gravityX: 0,
              gravityY: 0,
              friction: 0.005,
              airFriction: 0.001,
              restitution: 0.9,
              archGravity: 5,
            })}
          />
        </div>
      </div>
    </div>
  );
}

function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  onChange,
  description,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  description?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm text-slate-400">{value.toFixed(step < 1 ? 3 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
    </div>
  );
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
    >
      {label}
    </button>
  );
}
