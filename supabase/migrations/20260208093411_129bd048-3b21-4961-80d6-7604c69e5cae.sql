-- Create vehicle rent rules table
CREATE TABLE public.vehicle_rent_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_type TEXT NOT NULL,
  minimum_rent NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_rent_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage vehicle rent rules" 
ON public.vehicle_rent_rules 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active vehicle rent rules" 
ON public.vehicle_rent_rules 
FOR SELECT 
USING (is_active = true);

-- Insert default vehicle types
INSERT INTO public.vehicle_rent_rules (vehicle_type, minimum_rent, display_order) VALUES
('Passenger Auto', 150, 1),
('Appae Auto', 250, 2),
('Mini Pick Up Van', 350, 3);

-- Create customer addresses table
CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  address_label TEXT DEFAULT 'Home',
  full_address TEXT NOT NULL,
  landmark TEXT,
  panchayat_id UUID REFERENCES public.panchayats(id),
  ward_number INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own addresses" 
ON public.customer_addresses 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses" 
ON public.customer_addresses 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add vehicle_type column to indoor_event_vehicles
ALTER TABLE public.indoor_event_vehicles 
ADD COLUMN vehicle_type TEXT,
ADD COLUMN rent_amount NUMERIC DEFAULT 0;