// Core domain types for CROPVAULT

export type Category =
  | "Vegetables"
  | "Fruits"
  | "Grains / Cereals"
  | "Cold Storage"
  | "Other Crops";

export type FreshnessStatus =
  | "FRESH"
  | "GOOD"
  | "SELL SOON"
  | "URGENT"
  | "CRITICAL"
  | "INSPECT";

export type Role = "MANAGER" | "WAREHOUSE WORKER";

export type MovementAction =
  | "ADD"
  | "MOVE"
  | "SELL"
  | "REMOVE"
  | "DISPOSE";

export type StorageType = "Ambient" | "Cold Storage" | "Humidity Controlled";

export interface Batch {
  id: string; // batch / unit number, e.g. "T102"
  crop: string;
  category: Category;
  quantity: number; // in unit
  unit: string; // kg, quintal, piece
  warehouseId: string;
  rack: string; // e.g. "A-02"
  storageType: StorageType;
  storedAt: string; // ISO timestamp (stored in UTC, displayed in IST)
  notes?: string;
  lowStockThreshold: number;
}

export interface Movement {
  id: string;
  batchId: string;
  crop: string;
  action: MovementAction;
  quantity: number;
  fromRack?: string;
  toRack?: string;
  warehouseId: string;
  at: string; // ISO timestamp
  by: string; // user name
}

export interface Warehouse {
  id: string;
  name: string; // "Warehouse A"
  code: string; // "A"
  location: string;
  sections: string[]; // ["A", "B"]
  capacity: number; // total capacity in kg
}

export interface Rack {
  warehouseId: string;
  name: string; // "A-01"
  section: string; // "A"
}

export type AlertState = "Open" | "In Review" | "Resolved";
export type AlertPriority = "Critical" | "High" | "Medium" | "Low";
export type AlertType =
  | "SELL SOON"
  | "URGENT"
  | "LOW STOCK"
  | "OLD STOCK"
  | "STORAGE DURATION WARNING"
  | "INSPECTION REQUIRED";

export interface Alert {
  id: string;
  batchId: string;
  crop: string;
  type: AlertType;
  priority: AlertPriority;
  message: string;
  state: AlertState;
  at: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  role: Role;
  action: string;
  detail: string;
  batchId?: string;
  at: string; // ISO timestamp
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarInitials: string;
  warehouseIds: string[]; // assigned warehouses
}
