-- CropVault — seed data + signup bootstrap
-- ============================================================================
-- Run AFTER 0001_init.sql.  Idempotent (ON CONFLICT DO NOTHING / OR REPLACE).
--   supabase db reset        # applies migrations + this seed in order
-- or paste into the SQL editor.
--
-- This mirrors the demo data shipped in the UI (lib/demo-data.ts) so the
-- database and the frontend show the same warehouses and batches.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Auto-create a profile for every new auth user (least-privilege default).
-- Role/warehouse are later managed by a MANAGER (the top role) via User Management.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, warehouse_ids)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'WAREHOUSE WORKER',
    '{}'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Warehouses (unique ids)
-- ---------------------------------------------------------------------------
insert into public.warehouses (id, name, code, location, capacity) values
  ('warehouse-a', 'Warehouse A', 'A', 'Plot 12, Nashik MIDC',        15000),
  ('warehouse-b', 'Warehouse B', 'B', 'Gate 4, Pimpri Chinchwad',    12000),
  ('warehouse-c', 'Warehouse C', 'C', 'Cold Zone, Baramati',          9000)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Batches — fruit/vegetable + grains across all three warehouses.
-- stored_at is relative to now() so freshness statuses (FRESH → INSPECT) look
-- realistic right after seeding.
-- ---------------------------------------------------------------------------
insert into public.batches
  (id, crop, category, quantity, unit, warehouse_id, rack, storage_type, notes, low_stock_threshold, stored_at) values
  -- Warehouse A
  ('T102','Tomato','Vegetables',1200,'kg','warehouse-a','A-02','Ambient','Arrived from Lasalgaon mandi.',200, now() - interval '6 days 2 hours'),
  ('O205','Okra','Vegetables',650,'kg','warehouse-a','B-01','Ambient',null,100, now() - interval '3 days 5 hours'),
  ('G230','Green Chilli','Vegetables',180,'kg','warehouse-a','A-03','Cold Storage',null,200, now() - interval '7 days 4 hours'),
  ('B170','Banana','Fruits',1100,'kg','warehouse-a','B-02','Ambient',null,200, now() - interval '5 days 8 hours'),
  ('BG601','Bottle Gourd','Vegetables',420,'kg','warehouse-a','A-01','Ambient',null,80, now() - interval '2 days 3 hours'),
  ('ML602','Lady Finger','Vegetables',260,'kg','warehouse-a','B-01','Cold Storage','Daily perishable lot from A markets.',60, now() - interval '1 day 6 hours'),
  ('PA603','Poha','Grains / Cereals',1800,'kg','warehouse-a','B-02','Ambient',null,300, now() - interval '22 days'),
  ('TP700','Tomato','Vegetables',90,'kg','warehouse-a','A-03','Ambient','Old lot — cross-check before dispatch.',100, now() - interval '9 days 2 hours'),
  ('PA701','Papaya','Fruits',640,'kg','warehouse-a','A-02','Cold Storage',null,120, now() - interval '3 days'),
  ('CA702','Custard Apple','Fruits',180,'kg','warehouse-a','B-01','Cold Storage',null,40, now() - interval '2 days 4 hours'),
  -- Warehouse B
  ('C118','Cucumber','Vegetables',900,'kg','warehouse-b','A-01','Cold Storage',null,150, now() - interval '5 days 1 hours'),
  ('M310','Mango','Fruits',1500,'kg','warehouse-b','B-02','Cold Storage',null,250, now() - interval '6 days 6 hours'),
  ('OR160','Orange','Fruits',980,'kg','warehouse-b','B-03','Ambient',null,200, now() - interval '9 days 2 hours'),
  ('CR512','Carrot','Vegetables',540,'kg','warehouse-b','A-02','Cold Storage',null,100, now() - interval '11 days'),
  ('BJ610','Brinjal','Vegetables',540,'kg','warehouse-b','B-01','Ambient',null,100, now() - interval '4 days 2 hours'),
  ('CP611','Capsicum','Vegetables',310,'kg','warehouse-b','A-01','Cold Storage',null,70, now() - interval '6 days'),
  ('GR612','Grapes','Fruits',760,'kg','warehouse-b','B-03','Cold Storage','Nashik vineyard consignments.',120, now() - interval '3 days 4 hours'),
  ('WM613','Watermelon','Fruits',1250,'kg','warehouse-b','A-02','Ambient',null,200, now() - interval '2 days'),
  ('MG703','Mango','Fruits',210,'kg','warehouse-b','B-02','Cold Storage','Ripening fast — inspect today.',150, now() - interval '11 days 5 hours'),
  ('PG704','Pomegranate','Fruits',720,'kg','warehouse-b','B-03','Cold Storage',null,150, now() - interval '6 days'),
  ('BT705','Beetroot','Vegetables',130,'kg','warehouse-b','A-01','Cold Storage',null,60, now() - interval '26 days'),
  -- Warehouse C
  ('A150','Apple','Fruits',2200,'kg','warehouse-c','A-01','Cold Storage',null,300, now() - interval '20 days'),
  ('FP500','Frozen Peas','Cold Storage',620,'kg','warehouse-c','C-01','Cold Storage',null,120, now() - interval '48 days'),
  ('GR510','Garlic','Other Crops',480,'kg','warehouse-c','B-01','Humidity Controlled',null,100, now() - interval '25 days'),
  ('GG511','Ginger','Other Crops',300,'kg','warehouse-c','C-02','Humidity Controlled',null,80, now() - interval '18 days'),
  ('CP513','Chilled Peas','Cold Storage',95,'kg','warehouse-c','A-02','Cold Storage',null,120, now() - interval '9 days'),
  ('BR620','Broccoli','Vegetables',180,'kg','warehouse-c','A-01','Cold Storage',null,50, now() - interval '5 days 2 hours'),
  ('CF621','Cauliflower','Vegetables',470,'kg','warehouse-c','C-01','Cold Storage',null,90, now() - interval '8 days'),
  ('PN622','Paneer','Cold Storage',95,'kg','warehouse-c','C-02','Cold Storage','Dairy block — strict 4°C hold.',30, now() - interval '10 days 5 hours'),
  ('BN706','Banana','Fruits',160,'kg','warehouse-c','B-01','Cold Storage','Colour turning — needs physical check.',120, now() - interval '8 days 3 hours'),
  ('KW707','Kiwi','Fruits',240,'kg','warehouse-c','A-01','Cold Storage',null,60, now() - interval '12 days'),
  ('SC708','Sweet Corn','Vegetables',95,'kg','warehouse-c','C-01','Cold Storage',null,50, now() - interval '4 days'),
  -- Grains & staples (formerly Warehouse D) redistributed across A / B / C
  ('P101','Potato','Vegetables',5200,'kg','warehouse-a','A-01','Cold Storage',null,800, now() - interval '12 days'),
  ('N140','Onion','Vegetables',3400,'kg','warehouse-a','A-02','Ambient',null,500, now() - interval '15 days 3 hours'),
  ('W401','Wheat','Grains / Cereals',6800,'kg','warehouse-b','B-01','Ambient',null,1000, now() - interval '40 days'),
  ('R402','Rice','Grains / Cereals',7400,'kg','warehouse-b','B-02','Ambient',null,1000, now() - interval '55 days'),
  ('CO403','Corn','Grains / Cereals',4200,'kg','warehouse-a','A-03','Ambient',null,800, now() - interval '30 days'),
  ('SB630','Soybean','Grains / Cereals',8200,'kg','warehouse-c','A-01','Ambient',null,1200, now() - interval '35 days'),
  ('TG631','Toor Dal','Other Crops',3600,'kg','warehouse-b','B-01','Humidity Controlled',null,600, now() - interval '28 days'),
  ('SG632','Sugar','Other Crops',5100,'kg','warehouse-c','C-02','Ambient',null,800, now() - interval '18 days'),
  ('DK709','Dragon Fruit','Fruits',85,'kg','warehouse-c','A-02','Cold Storage',null,40, now() - interval '9 days'),
  ('GC711','Green Chilli','Vegetables',75,'kg','warehouse-b','B-02','Ambient','Held past window — inspect before sale.',80, now() - interval '9 days'),
  ('SP710','Spinach','Vegetables',60,'kg','warehouse-c','B-01','Cold Storage',null,30, now() - interval '4 days 6 hours')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Bootstrap a MANAGER (the top role) — run once after you sign up in the app.
-- Replace <MANAGER_UID> with the uuid from auth.users for your manager email.
-- ---------------------------------------------------------------------------
-- update public.profiles
--   set role = 'MANAGER',
--       warehouse_ids = array['warehouse-a','warehouse-b','warehouse-c']
--   where id = '<MANAGER_UID>';
