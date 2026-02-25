
-- Add separate coming soon columns for cloud kitchen and home delivery
ALTER TABLE public.food_items 
ADD COLUMN is_coming_soon_cloud_kitchen boolean NOT NULL DEFAULT false,
ADD COLUMN is_coming_soon_home_delivery boolean NOT NULL DEFAULT false;

-- Migrate existing data: set both to current is_coming_soon value
UPDATE public.food_items 
SET is_coming_soon_cloud_kitchen = is_coming_soon,
    is_coming_soon_home_delivery = is_coming_soon;
