'use client';

import { useState, useEffect } from 'react';
import ProductForm from '@/app/components/ProductForm';
import ProductCard from '@/app/components/ProductCard';
import { getAllProducts, deleteProduct } from '@/app/api/v1/products/services/productService';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock?: number;
};

export default function AdminPage() {
  // ----- State -------------------------------------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);

  // ----- Helpers ------------------------------------------------
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data ?? []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    }
  };

  // ----- Load once ------------------------------------------------
  useEffect(() => {
    fetchProducts();
  }, []);

  // ----- Render -------------------------------------------------
  return (
    <main className="max-w-7xl mx-auto px-6 py-24">
      <h2 className="font-serif text-3xl font-bold text-royal-blue mb-10 text-center uppercase tracking-widest">
        Product Management
      </h2>

      {/* ----- Product List ----- */}
      <section className="mb-20">
        <h3 className="text-xl font-bold uppercase tracking-widest text-royal-blue mb-8 border-b border-royal-blue/10 pb-4">
          Existing Products
        </h3>

        {loading ? (
          <p className="text-royal-blue/60 uppercase tracking-widest text-sm font-bold text-center py-10">Loading Products...</p>
        ) : products.length === 0 ? (
          <p className="text-royal-blue/60 uppercase tracking-widest text-sm font-bold text-center py-10">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(p => (
              <div key={p.id} className="flex flex-col gap-4">
                <ProductCard
                  product={p}
                  onAddToCart={() => {
                    /* Admin page does not use cart – ignore */
                  }}
                />
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setEditing(p);
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }}
                    className="text-gold uppercase tracking-widest text-xs font-bold hover:text-royal-blue transition-colors"
                  >
                    Edit
                  </button>
                  <span className="text-royal-blue/30">|</span>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500/80 uppercase tracking-widest text-xs font-bold hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ----- Add / Edit Form ----- */}
      <section>
        <h3 className="text-xl font-bold uppercase tracking-widest text-royal-blue mb-8 text-center">
          {editing ? 'Edit Product' : 'Add New Product'}
        </h3>

        <ProductForm
          product={editing ?? undefined}
          onSaved={async () => {
            setEditing(null);
            await fetchProducts();
          }}
        />
      </section>
    </main>
  );
}
