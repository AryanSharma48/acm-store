-- Database Schema for ACM Store

-- Products Table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  stock INT DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'captured', 'failed')) DEFAULT 'pending',
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

-- Allow backend service to manage orders (since orders are created/updated in the backend route handlers using service_role or similar)
-- Actually, we'll probably use service_role key for backend operations. 
-- For client reads, maybe we don't need it.

-- Seed Dummy Data
INSERT INTO products (name, description, price, stock, image_url)
VALUES 
  ('ACM Hoodie', 'Premium quality, ultra-soft ACM branded hoodie perfect for coding sessions.', 1499, 50, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'),
  ('ACM T-Shirt', 'Classic 100% cotton T-shirt featuring the ACM logo.', 699, 100, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop');
