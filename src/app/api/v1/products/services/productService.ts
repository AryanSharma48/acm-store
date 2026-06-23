// src/app/api/v1/products/services/productService.ts
import { supabase } from '@/lib/supabase';

export const getAllProducts = async () => {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createProduct = async (payload: {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  image_url?: string;
  chapter?: string;
}) => {
  const { data, error } = await supabase.from('products').insert([payload]).select();
  if (error) throw error;
  return data[0];
};

export const updateProduct = async (id: string, payload: Partial<{
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  chapter: string;
}>) => {
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
};
