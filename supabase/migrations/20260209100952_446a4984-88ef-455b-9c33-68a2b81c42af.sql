
-- Create a security definer function to check order ownership without RLS
CREATE OR REPLACE FUNCTION public.is_order_customer(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = _order_id AND customer_id = _user_id
  )
$$;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_order_assigned_cook(_cook_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cooks
    WHERE id = _cook_id AND user_id = _user_id
  )
$$;

-- Create a security definer function to get cook assignments without RLS
CREATE OR REPLACE FUNCTION public.is_cook_assigned_to_order(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.order_assigned_cooks oac
    JOIN public.cooks c ON c.id = oac.cook_id
    WHERE oac.order_id = _order_id AND c.user_id = _user_id
  )
$$;

-- Drop all problematic policies
DROP POLICY IF EXISTS "Cooks can view their own assignments" ON public.order_assigned_cooks;
DROP POLICY IF EXISTS "Cooks can update their own assignment status" ON public.order_assigned_cooks;
DROP POLICY IF EXISTS "Customers can create cook assignments for their orders" ON public.order_assigned_cooks;
DROP POLICY IF EXISTS "Admins can manage order cook assignments" ON public.order_assigned_cooks;

-- Recreate using security definer functions (no cross-table RLS)
CREATE POLICY "Admins can manage order cook assignments"
ON public.order_assigned_cooks FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cooks can view their own assignments"
ON public.order_assigned_cooks FOR SELECT
USING (is_order_assigned_cook(cook_id, auth.uid()));

CREATE POLICY "Cooks can update their own assignment status"
ON public.order_assigned_cooks FOR UPDATE
USING (is_order_assigned_cook(cook_id, auth.uid()));

CREATE POLICY "Customers can create cook assignments for their orders"
ON public.order_assigned_cooks FOR INSERT
WITH CHECK (is_order_customer(order_id, auth.uid()));

-- Fix orders policies for cooks too
DROP POLICY IF EXISTS "Cooks can view assigned orders via assignments" ON public.orders;
DROP POLICY IF EXISTS "Cooks can update cook status on assigned orders" ON public.orders;

CREATE POLICY "Cooks can view assigned orders via assignments"
ON public.orders FOR SELECT
USING (is_cook_assigned_to_order(id, auth.uid()));

CREATE POLICY "Cooks can update cook status on assigned orders"
ON public.orders FOR UPDATE
USING (is_cook_assigned_to_order(id, auth.uid()));

-- Fix order_items policy for cooks
DROP POLICY IF EXISTS "Cooks can view order items for their assigned orders" ON public.order_items;

CREATE POLICY "Cooks can view order items for their assigned orders"
ON public.order_items FOR SELECT
USING (is_cook_assigned_to_order(order_id, auth.uid()));
