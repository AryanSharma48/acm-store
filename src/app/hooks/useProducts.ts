// src/app/hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
import api from '@/app/services/api';

export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = async (payload: any) => {
    const { data } = await api.post('/products', payload);
    setProducts((prev) => [...prev, data]);
  };

  const update = async (id: string, payload: any) => {
    const { data } = await api.patch(`/products/${id}`, payload);
    setProducts((prev) => prev.map((p) => (p.id === id ? data : p)));
  };

  const remove = async (id: string) => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { products, loading, error, fetch, create, update, remove };
};
