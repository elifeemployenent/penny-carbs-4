-- Fix existing order: assign cook and create assignment
UPDATE public.order_items 
SET assigned_cook_id = '78975fc9-ca77-4868-a37f-2620bbdb3df8' 
WHERE order_id = '7da2e351-a0b5-4969-99cb-bbef0619ba43' 
  AND food_item_id = '7ecb1960-6b4b-4437-ba2e-d6ea7cec0491';

INSERT INTO public.order_assigned_cooks (order_id, cook_id, cook_status, assigned_at)
VALUES ('7da2e351-a0b5-4969-99cb-bbef0619ba43', '78975fc9-ca77-4868-a37f-2620bbdb3df8', 'pending', now())
ON CONFLICT DO NOTHING;

-- Use user_id for orders.assigned_cook_id (FK references auth.users)
UPDATE public.orders 
SET assigned_cook_id = '2113f29d-257a-41b5-837e-2176e8cf2a00',
    cook_assignment_status = 'pending'
WHERE id = '7da2e351-a0b5-4969-99cb-bbef0619ba43';