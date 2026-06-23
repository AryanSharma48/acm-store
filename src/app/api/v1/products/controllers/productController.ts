// src/app/api/v1/products/controllers/productController.ts
import { createProduct, deleteProduct, getAllProducts, updateProduct } from '../services/productService';

export const getProducts = async () => {
  return await getAllProducts();
};

export const addProduct = async (payload: {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  image_url?: string;
  chapter?: string;
}) => {
  return await createProduct(payload);
};

export const editProduct = async (id: string, payload: Partial<{
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  chapter: string;
}>) => {
  return await updateProduct(id, payload);
};

export const removeProduct = async (id: string) => {
  return await deleteProduct(id);
};
