-- Create missing tables only

-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'offline',
  current_call_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_profiles table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT,
  name TEXT,
  email TEXT,
  call_history_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calls table
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  twilio_call_sid TEXT UNIQUE,
  customer_number TEXT,
  call_status TEXT,
  call_direction TEXT,
  agent_id UUID REFERENCES public.agents(id),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table (for ecommerce)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID,
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create triggers for new tables only
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agents_updated_at') THEN
    CREATE TRIGGER update_agents_updated_at
      BEFORE UPDATE ON public.agents
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customer_profiles_updated_at') THEN
    CREATE TRIGGER update_customer_profiles_updated_at
      BEFORE UPDATE ON public.customer_profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_calls_updated_at') THEN
    CREATE TRIGGER update_calls_updated_at
      BEFORE UPDATE ON public.calls
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON public.products
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Insert sample data for new tables
INSERT INTO public.agents (name, status) 
SELECT 'Agent Smith', 'online'
WHERE NOT EXISTS (SELECT 1 FROM public.agents LIMIT 1);

INSERT INTO public.agents (name, status) 
SELECT 'Agent Johnson', 'offline'
WHERE NOT EXISTS (SELECT 1 FROM public.agents WHERE name = 'Agent Johnson');

INSERT INTO public.agents (name, status) 
SELECT 'Agent Brown', 'online'  
WHERE NOT EXISTS (SELECT 1 FROM public.agents WHERE name = 'Agent Brown');

INSERT INTO public.products (name, description, price, category, stock_quantity) 
SELECT 'Premium Headphones', 'High-quality wireless headphones', 299.99, 'Electronics', 50
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

INSERT INTO public.products (name, description, price, category, stock_quantity) 
SELECT 'Smart Watch', 'Advanced fitness tracking smartwatch', 199.99, 'Electronics', 30
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Smart Watch');

INSERT INTO public.products (name, description, price, category, stock_quantity) 
SELECT 'Bluetooth Speaker', 'Portable wireless speaker', 79.99, 'Electronics', 25
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Bluetooth Speaker');