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
  chapter?: string;
};

export default function StoreFront() {
  const { items, addItem, decreaseQuantity } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const SIZES = ['S', 'M', 'L', 'XL'];
  const [isZoomed, setIsZoomed] = useState(false);

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

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProduct]);

  const handleAddToCartModal = () => {
    if (!selectedProduct) return;
    addItem({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      image_url: selectedProduct.image_url,
      size: selectedSize,
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
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-32 text-royal-blue/50 font-serif text-lg">
              The archive is currently empty.
            </div>
          ) : (
            <div className="flex flex-col gap-12 sm:gap-16">
              {Array.from(new Set(products.map(p => p.chapter || 'General')))
                .filter(chapter => chapter !== 'General')
                .sort((a, b) => {
                  const order = ['SCHAP', 'SIGBED', 'SIGAI'];
                  const indexA = order.indexOf(a);
                  const indexB = order.indexOf(b);
                  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                })
                .map(chapter => (
                <div key={chapter} className="w-full">
                  <h4 className="font-serif text-xl sm:text-2xl font-bold text-royal-blue mb-4 sm:mb-6 pb-2 inline-block relative">
                    {chapter === 'SCHAP' ? 'Student Chapter' : chapter} Collection
                    <div className="absolute bottom-0 left-0 w-1/2 h-[2px] bg-gold"></div>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
                    {products.filter(p => (p.chapter || 'General') === chapter).map((product) => (
                      <div key={product.id} className="group flex flex-col bg-canvas border border-royal-blue relative p-5 sm:p-4 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(10,25,47,0.08)] h-full cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold z-10 -translate-x-[1px] -translate-y-[1px]"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold z-10 translate-x-[1px] -translate-y-[1px]"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold z-10 -translate-x-[1px] translate-y-[1px]"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold z-10 translate-x-[1px] translate-y-[1px]"></div>

                        {/* Image */}
                        <div className="aspect-[4/3] overflow-hidden mb-4 sm:mb-6 bg-gray-50 relative flex items-center justify-center">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-grow px-2 pb-2 text-center">
                          <div className="min-h-[44px] flex items-center justify-center mb-2 sm:mb-3">
                            <h4 className="text-sm sm:text-base font-bold uppercase tracking-widest text-black break-words">
                              {product.name}
                            </h4>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6 sm:mb-8 break-words">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between border-t border-royal-blue/10 pt-4 sm:pt-5 mt-auto min-h-[48px] gap-3">
                            <span className="font-serif text-lg sm:text-xl font-bold text-royal-blue">₹{product.price}</span>
                            
                            <button className="bg-royal-blue text-white px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300 h-[36px] sm:h-[40px] whitespace-nowrap">
                              Select Options
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedProduct(null); setIsZoomed(false); }}>
          <div className="bg-canvas w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto flex flex-col md:flex-row relative border-2 border-royal-blue shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 sm:top-4 sm:right-4 text-royal-blue hover:text-gold z-10 bg-white/50 backdrop-blur rounded-full p-1" onClick={() => { setSelectedProduct(null); setIsZoomed(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-4 sm:p-8 min-h-[250px] sm:min-h-[300px] overflow-hidden">
              <img 
                src={selectedProduct.image_url} 
                alt={selectedProduct.name} 
                onClick={() => setIsZoomed(!isZoomed)}
                className={`transition-transform duration-500 ease-in-out ${isZoomed ? 'scale-[2] cursor-zoom-out' : 'max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain cursor-zoom-in'}`} 
              />
            </div>
            <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center">
              <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-royal-blue mb-2 sm:mb-4 uppercase tracking-widest">{selectedProduct.name}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">{selectedProduct.description}</p>
              <div className="text-xl sm:text-2xl font-serif font-bold text-royal-blue mb-6 sm:mb-8">₹{selectedProduct.price}</div>
              
              <div className="mb-6 sm:mb-8">
                <span className="block text-xs font-bold uppercase tracking-widest text-royal-blue mb-3">Select Size</span>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(s => (
                    <button 
                      key={s} 
                      onClick={() => setSelectedSize(s)}
                      className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border font-bold text-sm transition-colors ${selectedSize === s ? 'border-royal-blue bg-royal-blue text-white' : 'border-royal-blue/30 text-royal-blue hover:border-royal-blue'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const cartItem = items.find(i => i.id === `${selectedProduct.id}-${selectedSize}`);
                return cartItem ? (
                  <div className="flex items-center border border-royal-blue h-12 w-32">
                    <button onClick={() => decreaseQuantity(cartItem.id)} className="flex-1 h-full text-royal-blue hover:bg-royal-blue/10 transition-colors font-bold flex items-center justify-center text-lg">-</button>
                    <span className="flex-1 h-full flex items-center justify-center text-sm font-bold text-royal-blue border-x border-royal-blue/10">{cartItem.quantity}</span>
                    <button onClick={() => addItem({
                      productId: selectedProduct.id,
                      name: selectedProduct.name,
                      price: selectedProduct.price,
                      image_url: selectedProduct.image_url,
                      size: selectedSize,
                    })} className="flex-1 h-full text-royal-blue hover:bg-royal-blue/10 transition-colors font-bold flex items-center justify-center text-lg">+</button>
                  </div>
                ) : (
                  <button onClick={handleAddToCartModal} className="bg-royal-blue text-white px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300 w-full sm:w-auto">
                    Add to Cart - ₹{selectedProduct.price}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
