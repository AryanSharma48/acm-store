'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/app/contexts/CartContext';



type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
};

export default function StoreFront() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });
    alert('Added to cart');
  };

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[70vh] bg-gray-100 flex items-center justify-center overflow-hidden border-b border-royal-blue/10">
        <img
          src="https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=2070&auto=format&fit=crop"
          alt="ACM Minimalist Apparel"
          className="absolute inset-0 w-full h-full object-cover opacity-90 object-center"
        />
        <div className="absolute inset-0 bg-canvas/30 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-16 h-[1px] bg-gold mb-6"></div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-royal-blue tracking-wider leading-snug mb-4">
            CURATED EXCLUSIVES FOR <br/> THE ELITE ACADEMIC
          </h2>
          <div className="w-16 h-[1px] bg-gold mt-2"></div>
        </div>
      </section>

      {/* Shopping Area */}
      <section className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row gap-16">
        {/* Sidebar Filter */}
        <aside className="w-full md:w-64 shrink-0">
          <h3 className="font-serif text-2xl font-bold mb-8 text-royal-blue border-b border-royal-blue/10 pb-4">
            Curriculum
          </h3>
          <ul className="space-y-6">
            {['Apparel', 'Accessories', 'Stationery'].map((category) => (
              <li key={category} className="flex items-center gap-4 group cursor-pointer">
                <input type="checkbox" className="gold-checkbox" />
                <span className="text-sm font-medium tracking-wide text-royal-blue/80 group-hover:text-royal-blue transition-colors uppercase">
                  {category}
                </span>
              </li>
            ))}
            <li className="flex items-center gap-4 group cursor-pointer pt-6 border-t border-royal-blue/10">
              <input type="checkbox" className="gold-checkbox" />
              <span className="text-sm font-bold tracking-wide text-gold group-hover:text-gold/80 transition-colors uppercase">
                Limited Editions
              </span>
            </li>
          </ul>
        </aside>

        {/* Product Grid */}
        <div className="flex-grow">
          <div className="flex justify-between items-end mb-8 border-b border-royal-blue/10 pb-4">
            <h3 className="font-serif text-2xl font-bold text-royal-blue">Available Collections</h3>
            <span className="text-xs uppercase tracking-widest font-bold text-royal-blue/50">{products.length} Items</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-2 border-royal-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10">
              {products.map((product) => (
                <div key={product.id} className="group flex flex-col bg-canvas border border-royal-blue relative p-4 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(10,25,47,0.08)]">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold z-10 -translate-x-[1px] -translate-y-[1px]"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold z-10 translate-x-[1px] -translate-y-[1px]"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold z-10 -translate-x-[1px] translate-y-[1px]"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold z-10 translate-x-[1px] translate-y-[1px]"></div>

                  {/* Image */}
                  <div className="aspect-[4/5] overflow-hidden mb-6 bg-gray-50 relative">
                    <img src={product.image_url} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-grow px-2 pb-2 text-center">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-black mb-3">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed mb-8 flex-grow">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between border-t border-royal-blue/10 pt-4 mt-auto">
                      <span className="font-serif text-lg font-bold text-royal-blue">₹{product.price}</span>
                      <button onClick={() => handleAddToCart(product)} className="bg-royal-blue text-white px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && !loading && (
                <div className="col-span-full text-center py-32 text-royal-blue/50 font-serif text-lg">
                  The archive is currently empty.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
