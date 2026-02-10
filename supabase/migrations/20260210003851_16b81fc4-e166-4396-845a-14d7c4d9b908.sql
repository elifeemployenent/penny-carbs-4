
-- Add new module columns
ALTER TABLE public.admin_permissions
  ADD COLUMN perm_categories text NOT NULL DEFAULT 'none',
  ADD COLUMN perm_banners text NOT NULL DEFAULT 'none',
  ADD COLUMN perm_locations text NOT NULL DEFAULT 'none',
  ADD COLUMN perm_special_offers text NOT NULL DEFAULT 'none';

-- Add new text columns for existing permissions
ALTER TABLE public.admin_permissions
  ADD COLUMN perm_items text NOT NULL DEFAULT 'none',
  ADD COLUMN perm_orders text NOT NULL DEFAULT 'none',
  ADD COLUMN perm_assign_orders text NOT NULL DEFAULT 'none',
  ADD COLUMN perm_cooks text NOT NULL DEFAULT 'none',
  ADD COLUMN perm_delivery_staff text NOT NULL DEFAULT 'none',
  ADD COLUMN perm_reports text NOT NULL DEFAULT 'none',
  ADD COLUMN perm_settlements text NOT NULL DEFAULT 'none';

-- Migrate existing boolean values to text
UPDATE public.admin_permissions SET
  perm_items = CASE WHEN can_manage_items THEN 'write' ELSE 'none' END,
  perm_orders = CASE WHEN can_manage_orders THEN 'write' ELSE 'none' END,
  perm_assign_orders = CASE WHEN can_assign_orders THEN 'write' ELSE 'none' END,
  perm_cooks = CASE WHEN can_register_cooks THEN 'write' ELSE 'none' END,
  perm_delivery_staff = CASE WHEN can_register_delivery_staff THEN 'write' ELSE 'none' END,
  perm_reports = CASE WHEN can_access_reports THEN 'read' ELSE 'none' END,
  perm_settlements = CASE WHEN can_approve_settlements THEN 'write' ELSE 'none' END;

-- Drop old boolean columns
ALTER TABLE public.admin_permissions
  DROP COLUMN can_manage_items,
  DROP COLUMN can_manage_orders,
  DROP COLUMN can_assign_orders,
  DROP COLUMN can_register_cooks,
  DROP COLUMN can_register_delivery_staff,
  DROP COLUMN can_access_reports,
  DROP COLUMN can_approve_settlements;

-- Add check constraint for valid values
ALTER TABLE public.admin_permissions
  ADD CONSTRAINT chk_perm_values CHECK (
    perm_items IN ('none','read','write') AND
    perm_orders IN ('none','read','write') AND
    perm_assign_orders IN ('none','read','write') AND
    perm_cooks IN ('none','read','write') AND
    perm_delivery_staff IN ('none','read','write') AND
    perm_reports IN ('none','read','write') AND
    perm_settlements IN ('none','read','write') AND
    perm_categories IN ('none','read','write') AND
    perm_banners IN ('none','read','write') AND
    perm_locations IN ('none','read','write') AND
    perm_special_offers IN ('none','read','write')
  );
