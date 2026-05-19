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
  const { items, addItem, decreaseQuantity } = useCart();
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
          <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl font-bold text-royal-blue tracking-wider leading-snug mb-4">
            CURATED EXCLUSIVES FOR <br/> THE ELITE ACADEMIC
          </h2>
          <div className="w-16 h-[1px] bg-gold mt-2"></div>
        </div>
      </section>

      {/* Shopping Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Product Grid */}
        <div className="w-full">
          <div className="flex justify-between items-end mb-8 border-b border-royal-blue/10 pb-4">
            <h3 className="font-serif text-2xl font-bold text-royal-blue">Available Collections</h3>
            <span className="text-xs uppercase tracking-widest font-bold text-royal-blue/50">{products.length} Items</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-2 border-royal-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10">
              {products.map((product) => (
                <div key={product.id} className="group flex flex-col bg-canvas border border-royal-blue relative p-4 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(10,25,47,0.08)]">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold z-10 -translate-x-[1px] -translate-y-[1px]"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold z-10 translate-x-[1px] -translate-y-[1px]"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold z-10 -translate-x-[1px] translate-y-[1px]"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold z-10 translate-x-[1px] translate-y-[1px]"></div>

                  {/* Image */}
                  <div className="aspect-[4/5] overflow-hidden mb-3 sm:mb-6 bg-gray-50 relative">
                    <img src={product.image_url} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-grow px-2 pb-2 text-center">
                    <h4 className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-black mb-1 sm:mb-3 line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed mb-4 sm:mb-8 flex-grow line-clamp-2 sm:line-clamp-none">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between border-t border-royal-blue/10 pt-3 sm:pt-4 mt-auto min-h-[40px] sm:min-h-[48px] gap-2">
                      <span className="font-serif text-sm sm:text-lg font-bold text-royal-blue">₹{product.price}</span>
                      
                      {(() => {
                        const cartItem = items.find(i => i.id === product.id);
                        return cartItem ? (
                          <div className="flex items-center border border-royal-blue h-[28px] sm:h-[32px] w-[90px] sm:w-[100px]">
                            <button onClick={() => decreaseQuantity(product.id)} className="flex-1 h-full text-royal-blue hover:bg-royal-blue/10 transition-colors font-bold flex items-center justify-center">-</button>
                            <span className="flex-1 h-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-royal-blue border-x border-royal-blue/10">{cartItem.quantity}</span>
                            <button onClick={() => handleAddToCart(product)} className="flex-1 h-full text-royal-blue hover:bg-royal-blue/10 transition-colors font-bold flex items-center justify-center">+</button>
                          </div>
                        ) : (
                          <button onClick={() => handleAddToCart(product)} className="bg-royal-blue text-white px-2 sm:px-6 py-1 sm:py-2 text-[8px] sm:text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300 h-[28px] sm:h-[32px] whitespace-nowrap">
                            Add to Cart
                          </button>
                        );
                      })()}
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
