'use client';

import { useCart } from '@/app/contexts/CartContext';
import CartItemComponent from '@/app/components/CartItem';
import Link from 'next/link';

export default function CartPage() {
  const { items, totalAmount, removeItem, clearCart } = useCart();

  return (
    <main className="max-w-4xl mx-auto px-6 py-24 flex flex-col min-h-[50vh]">
      <div className="flex flex-col items-center justify-center mb-10">
        <div className="w-16 h-[1px] bg-gold mb-10"></div>
        <h1 className="font-serif text-3xl font-bold text-royal-blue tracking-widest uppercase text-center">
          Your Cart
        </h1>
      </div>
      
      {items.length === 0 ? (
        <div className="flex flex-col items-center">
          <p className="text-royal-blue/60 text-sm tracking-wide uppercase text-center mb-12">
            Your cart is currently empty.
          </p>
          <Link 
            href="/" 
            className="border border-royal-blue text-royal-blue px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-royal-blue hover:text-white transition-colors duration-300"
          >
            Return to Collection
          </Link>
          <div className="w-16 h-[1px] bg-gold mt-16"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-8 w-full bg-canvas border border-royal-blue p-8 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold -translate-x-[1px] -translate-y-[1px]"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold translate-x-[1px] -translate-y-[1px]"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold -translate-x-[1px] translate-y-[1px]"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold translate-x-[1px] translate-y-[1px]"></div>

          <div className="flex flex-col gap-6">
            {items.map(item => (
              <CartItemComponent key={item.id} item={item} onRemove={removeItem} />
            ))}
          </div>

          <div className="border-t border-royal-blue/10 pt-8 mt-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 text-royal-blue font-serif text-2xl font-bold">
              <span>Total:</span>
              <span>₹{totalAmount}</span>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row gap-4 w-full sm:w-auto">
              <button 
                onClick={clearCart}
                className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-royal-blue/60 hover:text-red-500 border border-royal-blue/10 sm:border-none transition-colors"
              >
                Clear Cart
              </button>
              <button 
                className="bg-royal-blue text-white px-10 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300"
                onClick={() => alert("Checkout flow is not fully implemented yet!")}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
