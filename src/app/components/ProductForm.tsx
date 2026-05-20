// src/app/components/ProductForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '@/app/api/v1/products/services/productService';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
};

type Props = {
  product?: Product;
  onSaved: () => void;
};

export default function ProductForm({ product, onSaved }: Props) {
  const [newName, setNewName] = useState(product?.name || '');
  const [newDesc, setNewDesc] = useState(product?.description || '');
  const [newPrice, setNewPrice] = useState(product?.price?.toString() || '');
  const [newImg, setNewImg] = useState(product?.image_url || '');

  useEffect(() => {
    if (product) {
      setNewName(product.name);
      setNewDesc(product.description);
      setNewPrice(product.price.toString());
      setNewImg(product.image_url);
    } else {
      setNewName('');
      setNewDesc('');
      setNewPrice('');
      setNewImg('');
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    
    try {
      if (product) {
        await updateProduct(product.id, {
          name: newName,
          description: newDesc,
          price: Number(newPrice),
          image_url: newImg || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
        });
        alert('Product successfully updated.');
      } else {
        await createProduct({
          name: newName,
          description: newDesc,
          price: Number(newPrice),
          image_url: newImg || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
          stock: 100
        });
        alert('Product successfully added.');
      }
      onSaved();
      
      if (!product) {
        setNewName('');
        setNewDesc('');
        setNewPrice('');
        setNewImg('');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    }
  };

  return (
    <div className="bg-canvas border border-royal-blue p-10 relative max-w-4xl mx-auto">
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold"></div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <label htmlFor="product-name" className="text-xs font-bold uppercase tracking-widest text-royal-blue">Product Name</label>
          <input 
            id="product-name"
            type="text" 
            value={newName} 
            onChange={e => setNewName(e.target.value)}
            className="bg-transparent border-b border-royal-blue/30 px-2 py-3 focus:border-gold outline-none transition-colors rounded-none"
            required
          />
        </div>
        <div className="flex flex-col gap-3">
          <label htmlFor="product-price" className="text-xs font-bold uppercase tracking-widest text-royal-blue">Price (₹)</label>
          <input 
            id="product-price"
            type="number" 
            value={newPrice} 
            onChange={e => setNewPrice(e.target.value)}
            className="bg-transparent border-b border-royal-blue/30 px-2 py-3 focus:border-gold outline-none transition-colors rounded-none"
            required
          />
        </div>
        <div className="flex flex-col gap-3 md:col-span-2">
          <label htmlFor="product-desc" className="text-xs font-bold uppercase tracking-widest text-royal-blue">Description</label>
          <textarea 
            id="product-desc"
            value={newDesc} 
            onChange={e => setNewDesc(e.target.value)}
            className="bg-transparent border-b border-royal-blue/30 px-2 py-3 focus:border-gold outline-none transition-colors rounded-none h-20 resize-none"
          />
        </div>
        <div className="flex flex-col gap-3 md:col-span-2">
          <label htmlFor="product-image" className="text-xs font-bold uppercase tracking-widest text-royal-blue">Image URL</label>
          <input 
            id="product-image"
            type="url" 
            value={newImg} 
            onChange={e => setNewImg(e.target.value)}
            placeholder="https://..."
            className="bg-transparent border-b border-royal-blue/30 px-2 py-3 focus:border-gold outline-none transition-colors rounded-none"
          />
        </div>
        <div className="md:col-span-2 flex justify-center mt-6 flex-col items-center gap-4">
          <button type="submit" className="bg-royal-blue text-white px-12 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300">
            {product ? 'Update Product' : 'Add Product'}
          </button>
          {product && (
             <button type="button" onClick={() => onSaved()} className="text-xs text-royal-blue/70 hover:text-royal-blue uppercase tracking-widest font-bold">
               Cancel Editing
             </button>
          )}
        </div>
      </form>
    </div>
  );
}
