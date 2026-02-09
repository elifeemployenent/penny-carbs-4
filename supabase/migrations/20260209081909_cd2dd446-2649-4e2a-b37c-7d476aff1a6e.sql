-- Fix RLS policies for homemade order cook assignment flow

-- 1. Allow customers to insert cook assignments for their own orders
CREATE POLICY "Customers can create cook assignments for their orders"
ON public.order_assigned_cooks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_assigned_cooks.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- 2. Allow customers to update order items they created (for assigned_cook_id)
CREATE POLICY "Customers can update their order items"
ON public.order_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- 3. Allow customers to update their own orders (for assigned_cook_id, cook_assignment_status)
CREATE POLICY "Customers can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);