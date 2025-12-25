-- Enable RLS on all new tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agents
CREATE POLICY "Anyone can view agents" 
ON public.agents 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage agents" 
ON public.agents 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for customer_profiles
CREATE POLICY "Anyone can view customer profiles" 
ON public.customer_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage customer profiles" 
ON public.customer_profiles 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for calls
CREATE POLICY "Anyone can view calls" 
ON public.calls 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage calls" 
ON public.calls 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for products
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage products" 
ON public.products 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid()::text = customer_id::text);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid()::text = customer_id::text);

CREATE POLICY "Authenticated users can manage all orders" 
ON public.orders 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for order_items
CREATE POLICY "Users can view order items for their orders" 
ON public.order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = order_items.order_id 
  AND orders.customer_id::text = auth.uid()::text
));

CREATE POLICY "Authenticated users can manage order items" 
ON public.order_items 
FOR ALL 
USING (auth.uid() IS NOT NULL);