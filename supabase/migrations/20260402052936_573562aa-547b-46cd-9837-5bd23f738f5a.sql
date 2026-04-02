ALTER TABLE public.delivery_rules
ADD COLUMN IF NOT EXISTS charge_above_threshold numeric DEFAULT NULL;