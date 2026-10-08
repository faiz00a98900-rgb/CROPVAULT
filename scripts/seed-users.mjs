// CropVault — provision demo users in Supabase Auth + profiles table.
// ============================================================================
// SERVER-SIDE ONLY. Uses the service-role key, which must NEVER appear in the
// frontend. This creates real authentication users so the demo accounts on the
// login screen can actually sign in through Supabase Auth.
//
//   1) Put SUPABASE_SERVICE_ROLE_KEY (and optionally DEMO_PASSWORD) in .env
//   2) Run:  npm run seed:users
//      (equivalent to: node --env-file=.env scripts/seed-users.mjs)
// ============================================================================
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.DEMO_PASSWORD || "CropVaultDemo123!";

if (!url || !serviceKey) {
  console.error(
    "\n✖ Missing SUPABASE credentials.\n" +
      "  Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env,\n" +
      "  then re-run: npm run seed:users\n"
  );
  process.exit(1);
}

// Admin client — service-role bypasses RLS for provisioning only.
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Must match lib/demo-data.ts (demoAccounts) and the RLS role enum.
// Only two roles exist: WAREHOUSE WORKER and MANAGER (the top role).
const accounts = [
  { email: "workerA@cropvault.demo", name: "Arjun Rao", role: "WAREHOUSE WORKER", warehouse_ids: ["warehouse-a"] },
  { email: "workerB@cropvault.demo", name: "Bhavna Nair", role: "WAREHOUSE WORKER", warehouse_ids: ["warehouse-b"] },
  { email: "workerC@cropvault.demo", name: "Chirag Patel", role: "WAREHOUSE WORKER", warehouse_ids: ["warehouse-c"] },
  { email: "manager@cropvault.demo", name: "Riya Sharma", role: "MANAGER", warehouse_ids: ["warehouse-a", "warehouse-b", "warehouse-c"] },
];

async function findUserId(email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase()) || null;
}

async function ensureUser({ email, name }) {
  const existing = await findUserId(email);
  if (existing) {
    // Reset the password so the shared demo password always works.
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: demoPassword,
      email_confirm: true,
    });
    if (error) throw error;
    return { id: existing.id, created: false };
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw error;
  return { id: data.user.id, created: true };
}

async function upsertProfile(uid, { email, name, role, warehouse_ids }) {
  const { error } = await supabase.from("profiles").upsert(
    { id: uid, email, full_name: name, role, warehouse_ids },
    { onConflict: "id" }
  );
  if (error) throw error;
}

console.log(`\nProvisioning ${accounts.length} demo accounts in Supabase…\n`);
let ok = 0;
for (const acc of accounts) {
  try {
    const { id, created } = await ensureUser(acc);
    await upsertProfile(id, acc);
    console.log(
      `  ${created ? "✔ created" : "✔ updated"}  ${acc.email.padEnd(26)} ${acc.role.padEnd(17)} → ${acc.warehouse_ids.join(", ")}`
    );
    ok++;
  } catch (err) {
    console.error(`  ✖ ${acc.email}: ${err.message}`);
  }
}

// Remove legacy demo accounts that no longer exist in the product:
//   - admin@cropvault.demo (ADMIN role removed — only Worker + Manager remain)
//   - workerD@cropvault.demo (Warehouse D removed)
// Their profiles rows cascade-delete with the auth user.
const legacyEmails = ["admin@cropvault.demo", "workerD@cropvault.demo"];
for (const email of legacyEmails) {
  try {
    const existing = await findUserId(email);
    if (existing) {
      const { error } = await supabase.auth.admin.deleteUser(existing.id);
      if (error) throw error;
      console.log(`  🗑  removed legacy account  ${email}`);
    }
  } catch (err) {
    console.error(`  ✖ could not remove ${email}: ${err.message}`);
  }
}

console.log(
  `\nDone: ${ok}/${accounts.length} accounts ready.\n` +
    `Shared demo password: ${demoPassword}\n` +
    `Set this in .env as DEMO_PASSWORD if you change it. Log in from the app.\n`
);
