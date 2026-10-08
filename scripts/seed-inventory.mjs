// CropVault — sync Supabase reference data to the current 3-warehouse model.
// ============================================================================
// SERVER-SIDE ONLY. Uses the service-role key. Idempotent.
//   Run:  npm run seed:inventory
//     (equivalent to: node --env-file=.env scripts/seed-inventory.mjs)
//
// The app now treats the Supabase `batches` table as the SHARED source of truth
// for stock (so a sale made by one user is visible to everyone). This script
// migrates an existing database that still has the old 4-warehouse layout:
//   1) Reassigns the batches that used to live in Warehouse D across A / B / C.
//   2) Removes any leftover Warehouse D batches and the Warehouse D row itself.
// ============================================================================
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "\n✖ Missing SUPABASE credentials.\n" +
      "  Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env,\n" +
      "  then re-run: npm run seed:inventory\n"
  );
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Batches formerly in Warehouse D, redistributed across A / B / C.
// Must match the redistribution in lib/demo-data.ts.
const reassign = [
  ["P101", "warehouse-a", "A-01"],
  ["N140", "warehouse-a", "A-02"],
  ["W401", "warehouse-b", "B-01"],
  ["R402", "warehouse-b", "B-02"],
  ["CO403", "warehouse-a", "A-03"],
  ["SB630", "warehouse-c", "A-01"],
  ["TG631", "warehouse-b", "B-01"],
  ["SG632", "warehouse-c", "C-02"],
  ["DK709", "warehouse-c", "A-02"],
  ["GC711", "warehouse-b", "B-02"],
  ["SP710", "warehouse-c", "B-01"],
];

console.log("\nSyncing inventory to the 3-warehouse model…\n");

for (const [id, wh, rack] of reassign) {
  const { error } = await sb
    .from("batches")
    .update({ warehouse_id: wh, rack, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error(`  ✖ ${id}: ${error.message}`);
  else console.log(`  ✔ ${id} → ${wh} / ${rack}`);
}

// Remove any leftover Warehouse D batches, then the warehouse row itself.
const delBatches = await sb.from("batches").delete().eq("warehouse_id", "warehouse-d");
if (delBatches.error) console.error("  ✖ leftover batch cleanup:", delBatches.error.message);

const delWh = await sb.from("warehouses").delete().eq("id", "warehouse-d");
if (delWh.error) console.error("  ✖ could not remove warehouse-d:", delWh.error.message);
else console.log("  ✔ removed warehouse-d");

const { count } = await sb
  .from("batches")
  .select("id", { count: "exact", head: true });
const { data: whs } = await sb.from("warehouses").select("id");

console.log(
  `\nDone. Warehouses: ${(whs ?? []).map((w) => w.id).join(", ")}.\n` +
    `Batches in database: ${count}.\n` +
    `Inventory is now shared across every signed-in browser.\n`
);
