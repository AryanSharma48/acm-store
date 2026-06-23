-- Database Schema for ACM Store

-- Products Table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  stock INT DEFAULT 0,
  image_url TEXT,
  chapter VARCHAR(50) DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'captured', 'failed')) DEFAULT 'pending',
  user_id UUID, -- Foreign key added later to public.profiles
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row-Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
CREATE POLICY "Public read access for products"
ON products FOR SELECT
USING (true);

-- Allow authenticated/admin mutate access to products (assuming anon can't, but for this demo, we might want to let the admin panel work)
-- NOTE: In a real app, you'd restrict this to auth.uid() or an admin role. For the sake of the exercise (Admin Panel toggle),
-- if we are using the Anon key from the client, we might need a public insert policy OR we use the service_role key on the backend.
-- The prompt states: "interactive form fields setup... executing real-time DB .insert() mutations".
-- Client-side insert means we need an insert policy. We'll allow public insert for the demo, but warn about it.
CREATE POLICY "Public insert access for products (Demo Only)"
ON products FOR INSERT
WITH CHECK (true);

-- Allow public update access to products (Demo Only)
CREATE POLICY "Public update access for products (Demo Only)"
ON products FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete access to products (Demo Only)
CREATE POLICY "Public delete access for products (Demo Only)"
ON products FOR DELETE
USING (true);

-- Allow backend service to manage orders (since orders are created/updated in the backend route handlers using service_role or similar)
-- Actually, we'll probably use service_role key for backend operations. 
-- For client reads, maybe we don't need it.

INSERT INTO products (name, description, price, stock, image_url, chapter)
VALUES 
  ('SCHAP Jacket + Polo Combo', 'Premium quality SCHAP branded jacket and polo combo.', 1800, 50, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop', 'SCHAP'),
  ('SCHAP Polo', 'Classic 100% cotton SCHAP Polo T-shirt.', 1000, 100, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', 'SCHAP'),
  ('SIGAI Jacket + Polo Combo', 'Premium quality SIGAI branded jacket and polo combo.', 1800, 50, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop', 'SIGAI'),
  ('SIGAI Polo', 'Classic 100% cotton SIGAI Polo T-shirt.', 1000, 100, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', 'SIGAI'),
  ('SIGBED Jacket + Polo Combo', 'Premium quality SIGBED branded jacket and polo combo.', 1800, 50, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop', 'SIGBED'),
  ('SIGBED Polo', 'Classic 100% cotton SIGBED Polo T-shirt.', 1000, 100, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', 'SIGBED');


CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update orders to reference profiles
ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


CREATE TABLE public.admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed your initial admin email here!
-- INSERT INTO public.admin_users (email) VALUES ('your_email@example.com');

-- Google Auth Trigger (Auto-create profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger to call the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--Security Policies (RLS) for new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to check if their own email is in the admin table
CREATE POLICY "Users can check admin status" 
ON public.admin_users FOR SELECT 
USING (auth.jwt() ->> 'email' = email);

-- Admins table is strictly internal, so no public policies.
-- The backend Service Role will query it.

-- Migration to add extra profile details from checkout
-- RUN THIS IN SUPABASE SQL EDITOR
-- ALTER TABLE public.profiles 
-- ADD COLUMN chapter TEXT, 
-- ADD COLUMN position TEXT, 
-- ADD COLUMN committee TEXT;
