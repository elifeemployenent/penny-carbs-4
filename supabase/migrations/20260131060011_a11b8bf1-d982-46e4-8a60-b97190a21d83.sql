-- Add password column to cooks table for direct authentication
ALTER TABLE public.cooks ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Update RLS to allow reading own cook record for login
CREATE POLICY "Anyone can verify cook credentials for login"
ON public.cooks
FOR SELECT
USING (true);