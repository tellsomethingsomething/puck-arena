import { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { DEFAULT_PUCK } from '@puck-arena/shared';
import type { Puck, CreatePuckRequest, UpdatePuckRequest } from '@puck-arena/shared';

interface PuckFormProps {
  puck?: Puck;
  onSubmit: (data: CreatePuckRequest | UpdatePuckRequest) => void;
  onCancel: () => void;
}

export function PuckForm({ puck, onSubmit, onCancel }: PuckFormProps) {
  const [color, setColor] = useState(puck?.color || DEFAULT_PUCK.color);
  const [size, setSize] = useState(puck?.size || DEFAULT_PUCK.size);
  const [mass, setMass] = useState(puck?.mass || DEFAULT_PUCK.mass);
  const [label, setLabel] = useState(puck?.label || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      color,
      size,
      mass,
      label: label || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Size: {size}px
        </label>
        <input
          type="range"
          min="10"
          max="100"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Mass: {mass.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={mass}
          onChange={(e) => setMass(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Label (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter a label"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {puck ? 'Update' : 'Create'} Puck
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
