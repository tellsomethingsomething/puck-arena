import type { Puck, PhysicsSettings, CreatePuckRequest, UpdatePuckRequest, LoginResponse } from '@puck-arena/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }

  return res.json();
}

export async function verifyToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/verify`, {
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Pucks API
export async function getPucks(): Promise<Puck[]> {
  const res = await fetch(`${API_URL}/api/pucks`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch pucks');
  return res.json();
}

export async function createPuck(data: CreatePuckRequest): Promise<Puck> {
  const res = await fetch(`${API_URL}/api/pucks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create puck');
  return res.json();
}

export async function updatePuck(id: string, data: UpdatePuckRequest): Promise<Puck> {
  const res = await fetch(`${API_URL}/api/pucks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update puck');
  return res.json();
}

export async function deletePuck(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/pucks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete puck');
}

export async function bulkCreatePucks(count: number, color?: string): Promise<{ created: number }> {
  const pucks = Array.from({ length: count }, () => ({ color }));
  const res = await fetch(`${API_URL}/api/pucks/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ pucks }),
  });
  if (!res.ok) throw new Error('Failed to bulk create pucks');
  return res.json();
}

// Settings API
export async function getSettings(): Promise<PhysicsSettings> {
  const res = await fetch(`${API_URL}/api/settings`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(data: Partial<PhysicsSettings>): Promise<PhysicsSettings> {
  const res = await fetch(`${API_URL}/api/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}
