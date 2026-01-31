-- Drop the broken policy
DROP POLICY IF EXISTS "Cooks can view assigned orders" ON public.orders;

-- Create corrected policy that uses order_assigned_cooks table
CREATE POLICY "Cooks can view assigned orders via assignments"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.order_assigned_cooks oac
    INNER JOIN public.cooks c ON c.id = oac.cook_id
    WHERE oac.order_id = orders.id 
      AND c.user_id = auth.uid()
  )
);