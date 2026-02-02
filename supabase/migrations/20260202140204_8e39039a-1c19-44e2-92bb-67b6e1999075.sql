-- Add serves_persons column to food_items table
-- This column indicates how many persons one unit of this food item can serve
ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS serves_persons integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.food_items.serves_persons IS 'Number of persons one unit of this food item can serve (e.g., 1 kg biryani serves 6 persons)';