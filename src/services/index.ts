// src/services/index.ts

// Minimal types for now — adjust later to match your DB.
export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

export type Machine = {
  id: string;
  name: string;
  location: string | null;
  status: "online" | "offline";
};

export type InventoryItem = {
  id: string;
  machine_id: string;
  sku: string;
  name: string;
  qty: number;
  price_cents: number;
  updated_at: string;
};

export type VendEvent = {
  id: string;
  machine_id: string;
  sku: string;
  qty: number;
  amount_cents: number;
  created_at: string;
};

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// 🚧 Stubs (wire to Supabase in a later step)
export async function getProfile(_id: string): Promise<ServiceResult<Profile>> {
  return { data: null, error: null };
}

export async function listMachines(): Promise<ServiceResult<Machine[]>> {
  return { data: [], error: null };
}

export async function listInventory(
  _machineId?: string
): Promise<ServiceResult<InventoryItem[]>> {
  return { data: [], error: null };
}

export async function recordVend(
  _event: Omit<VendEvent, "id" | "created_at">
): Promise<ServiceResult<{ success: true }>> {
  return { data: { success: true }, error: null };
}

export const services = {
  getProfile,
  listMachines,
  listInventory,
  recordVend,
};
