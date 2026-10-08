"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Alert,
  AlertState,
  AuditEntry,
  Batch,
  Movement,
  MovementAction,
  Role,
  User,
  Warehouse,
} from "@/lib/types";
import {
  demoProfileByEmail,
  initialAudit,
  initialBatches,
  initialMovements,
  userFromProfile,
  warehouses,
} from "@/lib/demo-data";
import { nowISO } from "@/lib/time";
import { deriveAlerts } from "@/lib/selectors";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { SupabaseClient, User as SupaUser } from "@supabase/supabase-js";
import { useToast } from "./toast";

interface AddBatchInput {
  crop: string;
  category: Batch["category"];
  quantity: number;
  unit: string;
  id: string;
  warehouseId: string;
  rack: string;
  storageType: Batch["storageType"];
  notes?: string;
  lowStockThreshold?: number;
}

interface StoreValue {
  // auth
  user: User | null;
  ready: boolean;
  supabaseEnabled: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;
  logout: () => void;
  // data
  batches: Batch[];
  movements: Movement[];
  audit: AuditEntry[];
  alerts: Alert[];
  visibleBatches: Batch[];
  scopedBatches: Batch[];
  // ui state
  activeWarehouseId: string;
  activeWarehouse: Warehouse | null;
  setActiveWarehouse: (id: string) => void;
  lastSync: string;
  // actions
  addBatch: (input: AddBatchInput) => { ok: boolean; error?: string };
  recordMovement: (args: {
    batchId: string;
    action: MovementAction;
    quantity: number;
    toRack?: string;
  }) => { ok: boolean; error?: string };
  setAlertState: (alertId: string, state: AlertState) => void;
  can: (perm: Permission) => boolean;
  accessibleWarehouseIds: string[];
}

export type Permission =
  | "add_inventory"
  | "record_movement"
  | "view_reports"
  | "approve_actions"
  | "manage_users"
  | "manage_warehouses"
  | "manage_permissions"
  | "system_config";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Workers do the normal floor tasks only: add + view inventory and view
  // reports. Selling / stock movement is a MANAGER-only action.
  "WAREHOUSE WORKER": ["add_inventory", "view_reports"],
  // MANAGER is the top role — it holds every permission (formerly ADMIN).
  MANAGER: [
    "add_inventory",
    "record_movement",
    "view_reports",
    "approve_actions",
    "manage_users",
    "manage_warehouses",
    "manage_permissions",
    "system_config",
  ],
};

const StoreCtx = createContext<StoreValue | null>(null);

const LS = {
  user: "cropvault.user",
  batches: "cropvault.batches",
  movements: "cropvault.movements",
  audit: "cropvault.audit",
  alerts: "cropvault.alertStates",
  wh: "cropvault.activeWarehouse",
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/** Collision-safe unique id (timestamp + monotonic counter + entropy). */
let _uid = 0;
function uid(prefix = "id"): string {
  _uid += 1;
  return `${prefix}-${Date.now().toString(36)}-${_uid.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Normalize a role string from the DB to the app's Role union. */
function normalizeRole(role: unknown): Role {
  const r = String(role ?? "")
    .toUpperCase()
    .replace(/[\s_-]+/g, " ")
    .trim();
  // "ADMIN" is a legacy value — it now maps to the top role, MANAGER.
  if (r === "MANAGER" || r === "ADMIN") return "MANAGER";
  return "WAREHOUSE WORKER";
}

/** Map a Supabase `batches` row to the app Batch shape. */
function rowToBatch(r: Record<string, any>): Batch {
  return {
    id: r.id,
    crop: r.crop,
    category: r.category,
    quantity: Number(r.quantity),
    unit: r.unit,
    warehouseId: r.warehouse_id,
    rack: r.rack,
    storageType: r.storage_type,
    notes: r.notes ?? undefined,
    storedAt: r.stored_at,
    lowStockThreshold: Number(r.low_stock_threshold),
  };
}

/** Map an app Batch to a Supabase `batches` insert row. */
function batchToRow(b: Batch, createdBy?: string) {
  return {
    id: b.id,
    crop: b.crop,
    category: b.category,
    quantity: b.quantity,
    unit: b.unit,
    warehouse_id: b.warehouseId,
    rack: b.rack,
    storage_type: b.storageType,
    notes: b.notes ?? null,
    low_stock_threshold: b.lowStockThreshold,
    stored_at: b.storedAt,
    created_by: createdBy ?? null,
    updated_at: nowISO(),
  };
}

/**
 * Resolve the authoritative app user for an authenticated identity.
 * Role + warehouse scope come from the DB `profiles` row (RLS-protected) when
 * present, then from a demo profile, and finally default to a new worker.
 * The role is NEVER taken from a frontend selection.
 */
async function resolveAppUser(sb: SupabaseClient, u: SupaUser): Promise<User> {
  // 1) Supabase `profiles` table — the real source of role + warehouse scope.
  try {
    const { data } = await sb
      .from("profiles")
      .select("role, warehouse_ids, full_name")
      .eq("id", u.id)
      .maybeSingle();
    if (data) {
      const name =
        (data.full_name as string | undefined)?.trim() ||
        u.email?.split("@")[0] ||
        "User";
      const whIds = Array.isArray(data.warehouse_ids)
        ? (data.warehouse_ids as string[])
        : [];
      return userFromProfile(u.id, u.email ?? "", {
        name,
        role: normalizeRole(data.role),
        warehouseIds: whIds.length ? whIds : ["warehouse-a"],
      });
    }
  } catch {
    /* profiles table not provisioned yet — fall through to demo/defaults */
  }
  // 2) Demo profile keyed by the authenticated email.
  const demo = demoProfileByEmail(u.email ?? "");
  if (demo) return userFromProfile(u.id, demo.email, demo.profile);
  // 3) Brand-new signup with no profile row: least-privilege worker.
  const meta = (u.user_metadata ?? {}) as { full_name?: string };
  const name = meta.full_name?.trim() || u.email?.split("@")[0] || "New User";
  return userFromProfile(u.id, u.email ?? "", {
    name,
    role: "WAREHOUSE WORKER",
    warehouseIds: ["warehouse-a"],
  });
}

/** Turn raw Supabase auth errors into friendlier copy. */
function friendlyAuthError(message: string): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Invalid email or password.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email before signing in.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with that email already exists.";
  if (m.includes("rate limit") || m.includes("forabidden"))
    return "Too many attempts. Please try again in a moment.";
  return message || "Something went wrong. Please try again.";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [audit, setAudit] = useState<AuditEntry[]>(initialAudit);
  const [alertStates, setAlertStates] = useState<Record<string, AlertState>>({});
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(warehouses[0].id);
  const [lastSync, setLastSync] = useState<string>(nowISO());

  // Always-current mirror of batches for use inside timers (avoids stale closures).
  const batchesRef = useRef<Batch[]>(initialBatches);
  useEffect(() => {
    batchesRef.current = batches;
  }, [batches]);

  // Hydrate from localStorage on mount. If a previous session left the store
  // empty (e.g. cleared or sold down), fall back to the seeded demo data so the
  // inventory is never blank — then the persist effect re-saves the seed.
  useEffect(() => {
    const storedBatches = isSupabaseConfigured ? [] : load<Batch[]>(LS.batches, initialBatches);
    const storedMovements = load<Movement[]>(LS.movements, initialMovements);
    setBatches(storedBatches.length ? storedBatches : initialBatches);
    setMovements(storedMovements.length ? storedMovements : initialMovements);
    setAudit(load<AuditEntry[]>(LS.audit, initialAudit));
    setAlertStates(load<Record<string, AlertState>>(LS.alerts, {}));
    setActiveWarehouseId(load<string>(LS.wh, warehouses[0].id));
    // When Supabase is configured, auth state is owned by the session effect below.
    if (!isSupabaseConfigured) setUser(load<User | null>(LS.user, null));
    setReady(true);
  }, []);

  // Supabase session: restore on load and react to sign-in / sign-out changes.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let mounted = true;
    const applySession = async (u: SupaUser) => {
      const appUser = await resolveAppUser(sb, u);
      if (!mounted) return;
      setUser(appUser);
      setActiveWarehouseId((prev) =>
        appUser.warehouseIds.includes(prev)
          ? prev
          : appUser.warehouseIds[0] ?? warehouses[0].id
      );
    };
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) void applySession(data.session.user);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void applySession(session.user);
      else if (mounted) setUser(null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!ready) return;
    if (!isSupabaseConfigured) save(LS.batches, batches);
    save(LS.movements, movements);
    save(LS.audit, audit);
    save(LS.alerts, alertStates);
    save(LS.wh, activeWarehouseId);
    if (user) save(LS.user, user);
    else window.localStorage.removeItem(LS.user);
  }, [ready, batches, movements, audit, alertStates, activeWarehouseId, user]);

  // Cross-session sync: whenever another tab/window (e.g. a worker adding
  // stock) writes to storage, re-hydrate so every role — Worker, Manager and
  // Admin — sees the same live inventory for the warehouses they can access.
  useEffect(() => {
    if (!ready) return;
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith("cropvault.")) return;
      if (e.key === LS.batches && !isSupabaseConfigured)
        setBatches(load<Batch[]>(LS.batches, initialBatches));
      else if (e.key === LS.movements)
        setMovements(load<Movement[]>(LS.movements, initialMovements));
      else if (e.key === LS.audit) setAudit(load<AuditEntry[]>(LS.audit, initialAudit));
      else if (e.key === LS.alerts)
        setAlertStates(load<Record<string, AlertState>>(LS.alerts, {}));
      if (e.key === LS.batches || e.key === LS.movements) setLastSync(nowISO());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [ready]);

  // ---- Shared inventory (Supabase is the source of truth for stock) --------
  // Pull the authoritative batch list + alert-resolution map from the database.
  // Row Level Security scopes rows to the signed-in user's warehouses.
  // We keep a signature of the last payload so an unchanged poll does NOT
  // trigger a re-render of the whole tree — this is the main idle-cost fix.
  const batchesSig = useRef<string>("");
  const alertsSig = useRef<string>("");

  const refreshShared = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;

    const { data, error } = await sb
      .from("batches")
      .select("*")
      .order("stored_at", { ascending: false });
    if (!error && data) {
      const sig = JSON.stringify(data);
      if (sig !== batchesSig.current) {
        batchesSig.current = sig;
        setBatches(data.map(rowToBatch));
        setLastSync(nowISO());
      }
    }

    // Alert resolution is best-effort: if the alert_states table has not been
    // created yet (migration not applied) we silently keep the local copy.
    const { data: ad, error: aerr } = await sb
      .from("alert_states")
      .select("id, state")
      .order("updated_at", { ascending: false });
    if (!aerr && ad) {
      const sig = JSON.stringify(ad);
      if (sig !== alertsSig.current) {
        alertsSig.current = sig;
        const map: Record<string, AlertState> = {};
        for (const r of ad) map[r.id] = r.state as AlertState;
        setAlertStates(map);
      }
    }
  }, []);

  // While a user is signed in and Supabase is configured, load shared data once
  // and then poll — but only while the tab is visible, so a backgrounded app
  // costs nothing. A sale/addition made in ANY browser shows up everywhere.
  useEffect(() => {
    if (!ready || !user || !isSupabaseConfigured) return;
    void refreshShared();
    const iv = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void refreshShared();
    }, 5000);
    const onVis = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible")
        void refreshShared();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ready, user, refreshShared]);

  const pushAudit = useCallback(
    (entry: Omit<AuditEntry, "id" | "at" | "user" | "role">) => {
      const record: AuditEntry = {
        id: uid("a"),
        at: nowISO(),
        user: user?.name ?? "System",
        role: user?.role ?? "MANAGER",
        ...entry,
      };
      setAudit((prev) => [record, ...prev]);
    },
    [user]
  );

  const auditAuth = useCallback((u: User, action: string) => {
    const entry: AuditEntry = {
      id: uid("a"),
      at: nowISO(),
      user: u.name,
      role: u.role,
      action,
      detail: action === "Signed in" ? "Successful login" : "Account created",
    };
    setAudit((prev) => [entry, ...prev]);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      // Authentication is delegated ENTIRELY to Supabase. There is no frontend
      // credential check and no demo bypass — a session only exists if Supabase
      // issues one.
      const sb = getSupabase();
      if (!sb) {
        return {
          ok: false,
          error:
            "Supabase Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and the anon key to .env, then run `npm run seed:users`.",
        };
      }
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.user) {
        // Only ever shown because Supabase actually rejected the credentials.
        const base = friendlyAuthError(error?.message ?? "Unable to sign in.");
        const isDemo = !!demoProfileByEmail(email);
        return {
          ok: false,
          error: isDemo
            ? `${base} Demo accounts must be provisioned in Supabase — run \`npm run seed:users\`.`
            : base,
        };
      }
      // Real session → resolve role + warehouse scope from the DB profile.
      const appUser = await resolveAppUser(sb, data.user);
      setUser(appUser);
      setActiveWarehouseId(appUser.warehouseIds[0] ?? warehouses[0].id);
      auditAuth(appUser, "Signed in");
      return { ok: true };
    },
    [auditAuth]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const sb = getSupabase();
      if (!sb)
        return {
          ok: false,
          error: "Sign up is unavailable — Supabase is not configured.",
        };
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
        },
      });
      if (error) return { ok: false, error: friendlyAuthError(error.message) };
      // If email confirmation is required there is a user but no session yet.
      if (data.session && data.user) {
        const appUser = await resolveAppUser(sb, data.user);
        setUser(appUser);
        setActiveWarehouseId(appUser.warehouseIds[0] ?? warehouses[0].id);
        auditAuth(appUser, "Signed in");
        return { ok: true, needsConfirmation: false };
      }
      return { ok: true, needsConfirmation: true };
    },
    [auditAuth]
  );

  const logout = useCallback(() => {
    const sb = getSupabase();
    if (sb) void sb.auth.signOut();
    setUser(null);
    try {
      window.localStorage.removeItem(LS.user);
    } catch {
      /* ignore */
    }
  }, []);

  const can = useCallback(
    (perm: Permission) => (user ? ROLE_PERMISSIONS[user.role].includes(perm) : false),
    [user]
  );

  const accessibleWarehouseIds = useMemo(() => {
    if (!user) return [];
    // Managers operate across every warehouse; workers are limited to their scope.
    if (user.role === "MANAGER") return warehouses.map((w) => w.id);
    return user.warehouseIds;
  }, [user]);

  const visibleBatches = useMemo(
    () => batches.filter((b) => accessibleWarehouseIds.includes(b.warehouseId)),
    [batches, accessibleWarehouseIds]
  );

  const activeWarehouse = useMemo(
    () => warehouses.find((w) => w.id === activeWarehouseId) ?? null,
    [activeWarehouseId]
  );

  // Keep the active warehouse inside the user's accessible set (never hardcoded).
  useEffect(() => {
    if (!user) return;
    if (!accessibleWarehouseIds.includes(activeWarehouseId)) {
      setActiveWarehouseId(accessibleWarehouseIds[0] ?? warehouses[0].id);
    }
  }, [user, accessibleWarehouseIds, activeWarehouseId]);

  // Batches for the currently selected warehouse — the working scope used by
  // the dashboard, inventory, alerts and warehouse overview. In production this
  // maps directly to a `.eq("warehouse_id", activeWarehouseId)` query.
  const scopedBatches = useMemo(
    () => visibleBatches.filter((b) => b.warehouseId === activeWarehouseId),
    [visibleBatches, activeWarehouseId]
  );

  const alerts = useMemo(
    () => deriveAlerts(scopedBatches, alertStates),
    [scopedBatches, alertStates]
  );

  const addBatch = useCallback(
    (input: AddBatchInput) => {
      // Validation (never rely only on the UI):
      if (!input.crop.trim()) return { ok: false, error: "Crop name is required." };
      if (!input.id.trim()) return { ok: false, error: "Batch number is required." };
      if (!Number.isFinite(input.quantity) || input.quantity <= 0)
        return { ok: false, error: "Quantity must be greater than zero." };
      if (!/^[A-Za-z0-9-]{2,20}$/.test(input.id.trim()))
        return { ok: false, error: "Batch number must be 2–20 letters/digits/dashes." };
      if (batches.some((b) => b.id.toLowerCase() === input.id.trim().toLowerCase()))
        return { ok: false, error: "That batch number already exists." };
      if (!input.rack.trim())
        return { ok: false, error: "Select a rack / location." };

      const storedAt = nowISO(); // auto IST timestamp (stored UTC)
      const batch: Batch = {
        id: input.id.trim().toUpperCase(),
        crop: input.crop.trim(),
        category: input.category,
        quantity: input.quantity,
        unit: input.unit,
        warehouseId: input.warehouseId,
        rack: input.rack,
        storageType: input.storageType,
        notes: input.notes?.trim() || undefined,
        storedAt,
        lowStockThreshold: input.lowStockThreshold ?? 100,
      };
      const movement: Movement = {
        id: uid("m"),
        batchId: batch.id,
        crop: batch.crop,
        action: "ADD",
        quantity: batch.quantity,
        toRack: batch.rack,
        warehouseId: batch.warehouseId,
        at: storedAt,
        by: user?.name ?? "System",
      };
      setBatches((prev) => [batch, ...prev]);
      setMovements((prev) => [movement, ...prev]);
      pushAudit({
        action: "Added inventory",
        detail: `${batch.quantity} ${batch.unit} ${batch.crop} added to Rack ${batch.rack}`,
        batchId: batch.id,
      });
      setLastSync(nowISO());
      // Persist to the shared database (optimistic local update above).
      if (isSupabaseConfigured) {
        const sb = getSupabase();
        if (sb) {
          void (async () => {
            const { error } = await sb.from("batches").insert(batchToRow(batch, user?.id));
            if (error) toast("error", "Saved on this device only", error.message);
            else void refreshShared();
          })();
        }
      }
      return { ok: true };
    },
    [batches, pushAudit, user, toast, refreshShared]
  );

  const recordMovement = useCallback(
    ({
      batchId,
      action,
      quantity,
      toRack,
    }: {
      batchId: string;
      action: MovementAction;
      quantity: number;
      toRack?: string;
    }) => {
      const batch = batches.find((b) => b.id === batchId);
      if (!batch) return { ok: false, error: "Batch not found." };
      if (!Number.isFinite(quantity) || quantity <= 0)
        return { ok: false, error: "Quantity must be greater than zero." };

      let newQty = batch.quantity;
      if (action === "ADD") newQty = batch.quantity + quantity;
      else if (action === "SELL" || action === "REMOVE" || action === "DISPOSE") {
        newQty = batch.quantity - quantity;
        if (newQty < 0)
          return {
            ok: false,
            error: `Only ${batch.quantity} ${batch.unit} available in this batch.`,
          };
      } else if (action === "MOVE") {
        if (!toRack) return { ok: false, error: "Select a destination rack." };
        newQty = batch.quantity;
      }

      const at = nowISO();
      const by = user?.name ?? "System";
      const movement: Movement = {
        id: uid("m"),
        batchId,
        crop: batch.crop,
        action,
        quantity,
        fromRack: action === "MOVE" ? batch.rack : undefined,
        toRack: action === "MOVE" ? toRack : action === "ADD" ? batch.rack : undefined,
        warehouseId: batch.warehouseId,
        at,
        by,
      };

      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? {
                ...b,
                quantity: newQty,
                rack: action === "MOVE" ? toRack! : b.rack,
              }
            : b
        )
      );
      setMovements((prev) => [movement, ...prev]);
      const verb: Record<MovementAction, string> = {
        ADD: "Added stock",
        MOVE: `Moved to Rack ${toRack}`,
        SELL: "Sold stock",
        REMOVE: "Removed stock",
        DISPOSE: "Disposed stock",
      };
      pushAudit({
        action: verb[action],
        detail: `${batch.crop} (${batchId}) · ${quantity} ${batch.unit}`,
        batchId,
      });
      setLastSync(nowISO());
      // Persist the new quantity/rack to the shared database so every user
      // (and warehouse) sees the same stock. Local state updated optimistically.
      if (isSupabaseConfigured) {
        const sb = getSupabase();
        if (sb) {
          void (async () => {
            const { error } = await sb
              .from("batches")
              .update({
                quantity: newQty,
                rack: action === "MOVE" ? toRack! : batch.rack,
                updated_at: nowISO(),
              })
              .eq("id", batchId);
            if (error) toast("error", "Saved on this device only", error.message);
            else void refreshShared();
          })();
        }
      }
      return { ok: true };
    },
    [batches, pushAudit, user, toast, refreshShared]
  );

  const setAlertState = useCallback(
    (alertId: string, state: AlertState) => {
      setAlertStates((prev) => ({ ...prev, [alertId]: state }));
      const batchId = alertId.split(":")[0];
      pushAudit({
        action: "Reviewed alert",
        detail: `Alert marked ${state}`,
        batchId,
      });
      // Persist the resolution to the shared database so it appears for every
      // user in that warehouse (best-effort: needs the alert_states table).
      if (isSupabaseConfigured) {
        const sb = getSupabase();
        const wh = batchesRef.current.find((b) => b.id === batchId)?.warehouseId;
        if (sb && wh) {
          void (async () => {
            const { error } = await sb.from("alert_states").upsert(
              {
                id: alertId,
                state,
                warehouse_id: wh,
                updated_by: user?.id ?? null,
                updated_at: nowISO(),
              },
              { onConflict: "id" }
            );
            if (!error) void refreshShared();
          })();
        }
      }
    },
    [pushAudit, user, refreshShared]
  );

  // ---- Mock realtime -------------------------------------------------
  // A heartbeat refreshes "last synchronized". Occasionally a remote worker
  // records a small sale so the dashboard updates without a manual refresh.
  const heartbeat = useRef<number | null>(null);
  useEffect(() => {
    if (!ready || !user) return;
    heartbeat.current = window.setInterval(() => {
      setLastSync(nowISO());
    }, 15000);
    return () => {
      if (heartbeat.current) window.clearInterval(heartbeat.current);
    };
  }, [ready, user]);

  const liveSim = useRef<number | null>(null);
  useEffect(() => {
    if (!ready || !user || isSupabaseConfigured) return;
    liveSim.current = window.setInterval(() => {
      // Only act on perishable batches with enough stock to spare.
      const candidates = batchesRef.current.filter(
        (b) =>
          b.category === "Vegetables" &&
          b.quantity > b.lowStockThreshold + 150
      );
      if (!candidates.length) return;
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const qty = Math.min(
        target.quantity - target.lowStockThreshold,
        50 + Math.floor(Math.random() * 4) * 25
      );
      if (qty <= 0) return;
      const at = nowISO();
      const by = ["Sunil Pawar", "Riya Sharma"][Math.floor(Math.random() * 2)];
      const movement: Movement = {
        id: uid("m-live"),
        batchId: target.id,
        crop: target.crop,
        action: "SELL",
        quantity: qty,
        warehouseId: target.warehouseId,
        at,
        by,
      };
      // Pure, separate updates — never nest setState inside an updater.
      setBatches((prev) =>
        prev.map((b) => (b.id === target.id ? { ...b, quantity: b.quantity - qty } : b))
      );
      setMovements((prev) => [movement, ...prev]);
      setLastSync(at);
    }, 45000);
    return () => {
      if (liveSim.current) window.clearInterval(liveSim.current);
    };
  }, [ready, user]);

  const value: StoreValue = {
    user,
    ready,
    supabaseEnabled: isSupabaseConfigured,
    login,
    signup,
    logout,
    batches,
    movements,
    audit,
    alerts,
    visibleBatches,
    scopedBatches,
    activeWarehouseId,
    activeWarehouse,
    setActiveWarehouse: setActiveWarehouseId,
    lastSync,
    addBatch,
    recordMovement,
    setAlertState,
    can,
    accessibleWarehouseIds,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
