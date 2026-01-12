import { useEffect, useState, useRef } from 'react';
import type { Puck, CreatePuckRequest, UpdatePuckRequest } from '@puck-arena/shared';
import { getPucks, createPuck, updatePuck, deletePuck, bulkCreatePucks } from '../lib/api';
import { PuckForm } from '../components/PuckForm';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Pucks() {
  const [pucks, setPucks] = useState<Puck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPuck, setEditingPuck] = useState<Puck | null>(null);
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkColor, setBulkColor] = useState('#3B82F6');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedPucks, setSelectedPucks] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPucks = async () => {
    try {
      const data = await getPucks();
      setPucks(data);
    } catch (error) {
      console.error('Failed to load pucks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPucks();
  }, []);

  const handleCreate = async (data: CreatePuckRequest) => {
    try {
      await createPuck(data);
      await loadPucks();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create puck:', error);
    }
  };

  const handleUpdate = async (data: UpdatePuckRequest) => {
    if (!editingPuck) return;
    try {
      await updatePuck(editingPuck.id, data);
      await loadPucks();
      setEditingPuck(null);
    } catch (error) {
      console.error('Failed to update puck:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this puck?')) return;
    try {
      await deletePuck(id);
      await loadPucks();
    } catch (error) {
      console.error('Failed to delete puck:', error);
    }
  };

  const handleBulkCreate = async () => {
    try {
      await bulkCreatePucks(bulkCount, bulkColor);
      await loadPucks();
    } catch (error) {
      console.error('Failed to bulk create pucks:', error);
    }
  };

  const handleToggleActive = async (puck: Puck) => {
    try {
      await updatePuck(puck.id, { active: !puck.active });
      await loadPucks();
    } catch (error) {
      console.error('Failed to toggle puck:', error);
    }
  };

  // Export pucks to JSON
  const handleExport = () => {
    const exportData = pucks.map(p => ({
      color: p.color,
      size: p.size,
      mass: p.mass,
      label: p.label,
      logoUrl: p.logoUrl,
      active: p.active,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pucks-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import pucks from JSON
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text) as CreatePuckRequest[];

      for (const puckData of importData) {
        await createPuck(puckData);
      }

      await loadPucks();
      alert(`Imported ${importData.length} pucks successfully!`);
    } catch (error) {
      console.error('Failed to import pucks:', error);
      alert('Failed to import pucks. Please check the file format.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Bulk delete selected pucks
  const handleBulkDelete = async () => {
    if (selectedPucks.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPucks.size} pucks?`)) return;

    try {
      for (const id of selectedPucks) {
        await deletePuck(id);
      }
      setSelectedPucks(new Set());
      await loadPucks();
    } catch (error) {
      console.error('Failed to bulk delete pucks:', error);
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedPucks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPucks(newSelected);
  };

  // Select all filtered pucks
  const toggleSelectAll = () => {
    if (selectedPucks.size === filteredPucks.length) {
      setSelectedPucks(new Set());
    } else {
      setSelectedPucks(new Set(filteredPucks.map(p => p.id)));
    }
  };

  // Filter pucks
  const filteredPucks = pucks.filter(puck => {
    const matchesSearch = searchTerm === '' ||
      puck.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      puck.label?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterActive === 'all' ||
      (filterActive === 'active' && puck.active) ||
      (filterActive === 'inactive' && !puck.active);

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pucks ({pucks.length})</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Export JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Import JSON
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + Add Puck
          </button>
        </div>
      </div>

      {/* Bulk Create */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Bulk Create</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Count</label>
            <input
              type="number"
              min="1"
              max="100"
              value={bulkCount}
              onChange={(e) => setBulkCount(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Color</label>
            <input
              type="color"
              value={bulkColor}
              onChange={(e) => setBulkColor(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
          </div>
          <button
            onClick={handleBulkCreate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Create {bulkCount} Pucks
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="Search by color or label..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400"
            />
          </div>
          <div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          {selectedPucks.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete {selectedPucks.size} Selected
            </button>
          )}
          <span className="text-slate-400 text-sm">
            Showing {filteredPucks.length} of {pucks.length}
          </span>
        </div>
      </div>

      {/* Puck List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-slate-700/50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPucks.size === filteredPucks.length && filteredPucks.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Color</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Mass</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Label</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Active</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPucks.map((puck) => (
                <tr key={puck.id} className={`hover:bg-slate-700/30 ${selectedPucks.has(puck.id) ? 'bg-blue-900/20' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPucks.has(puck.id)}
                      onChange={() => toggleSelection(puck.id)}
                      className="w-4 h-4 rounded border-slate-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: puck.color }}
                      />
                      <span className="text-slate-300 text-sm">{puck.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{puck.size}px</td>
                  <td className="px-4 py-3 text-slate-300">{puck.mass}</td>
                  <td className="px-4 py-3 text-slate-300">{puck.label || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(puck)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        puck.active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {puck.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingPuck(puck)}
                      className="text-blue-400 hover:text-blue-300 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(puck.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPucks.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            {pucks.length === 0 ? 'No pucks yet. Create one to get started!' : 'No pucks match your search criteria.'}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <Modal title="Create Puck" onClose={() => setShowForm(false)}>
          <PuckForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingPuck && (
        <Modal title="Edit Puck" onClose={() => setEditingPuck(null)}>
          <PuckForm
            puck={editingPuck}
            onSubmit={handleUpdate}
            onCancel={() => setEditingPuck(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
