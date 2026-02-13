-- Fix: Add delivery_staff role for existing delivery staff users who only have customer role
INSERT INTO public.user_roles (user_id, role)
SELECT ds.user_id, 'delivery_staff'::app_role
FROM public.delivery_staff ds
WHERE ds.user_id IS NOT NULL
  AND ds.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = ds.user_id AND ur.role = 'delivery_staff'
  )
ON CONFLICT (user_id) DO UPDATE SET role = 'delivery_staff';
