'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newImg, setNewImg] = useState('');

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    
    const { data, error } = await supabase.from('products').insert([
      {
        name: newName,
        description: newDesc,
        price: Number(newPrice),
        image_url: newImg || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
        stock: 100
      }
    ]).select();

    if (error) {
      console.error('Insert error:', error);
      alert('Failed to add product');
    } else {
      setNewName('');
      setNewDesc('');
      setNewPrice('');
      setNewImg('');
      alert('Product successfully injected into the Archive.');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-24">
      <div className="bg-canvas border border-royal-blue p-10 relative max-w-4xl mx-auto">
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold"></div>

        <h2 className="font-serif text-3xl font-bold mb-10 text-center uppercase tracking-widest text-royal-blue">
          Archive Administration
        </h2>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-widest text-royal-blue">Nomenclature</label>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              className="bg-transparent border-b border-royal-blue/30 px-2 py-3 focus:border-gold outline-none transition-colors rounded-none"
              required
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-widest text-royal-blue">Value (₹)</label>
            <input 
              type="number" 
              value={newPrice} 
              onChange={e => setNewPrice(e.target.value)}
              className="bg-transparent border-b border-royal-blue/30 px-2 py-3 focus:border-gold outline-none transition-colors rounded-none"
              required
            />
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-royal-blue">Details</label>
            <textarea 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)}
              className="bg-transparent border-b border-royal-blue/30 px-2 py-3 focus:border-gold outline-none transition-colors rounded-none h-20 resize-none"
            />
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-royal-blue">Visual Reference (URL)</label>
            <input 
              type="url" 
              value={newImg} 
              onChange={e => setNewImg(e.target.value)}
              placeholder="https://..."
              className="bg-transparent border-b border-royal-blue/30 px-2 py-3 focus:border-gold outline-none transition-colors rounded-none"
            />
          </div>
          <div className="md:col-span-2 flex justify-center mt-6">
            <button type="submit" className="bg-royal-blue text-white px-12 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300">
              Inject into Archive
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
