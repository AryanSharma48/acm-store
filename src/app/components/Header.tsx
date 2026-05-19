// src/app/components/Header.tsx
'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/app/contexts/CartContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="w-full border-b border-royal-blue/10 bg-canvas sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center relative">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-xl sm:text-2xl font-bold text-royal-blue tracking-wide hover:text-gold transition-colors duration-300"
        >
          ACM Merch Collective
        </Link>

        {/* Navigation & Icons */}
        <nav className="flex items-center gap-6 sm:gap-10">
          <div className="hidden md:flex gap-8 text-sm font-medium tracking-widest uppercase">
            <Link href="/" className="text-royal-blue/70 hover:text-royal-blue transition-colors duration-300">
              Collection
            </Link>
            <Link href="/about" className="text-royal-blue/70 hover:text-royal-blue transition-colors duration-300">
              About Us
            </Link>
            <Link href="/perks" className="text-royal-blue/70 hover:text-royal-blue transition-colors duration-300">
              Member Perks
            </Link>
          </div>
          <div className="flex gap-4 sm:gap-6 items-center">
            <Link href="/admin" className="text-gold hover:text-royal-blue transition-colors duration-300" title="Admin Archive">
              <User size={22} strokeWidth={1.5} />
            </Link>
            <Link href="/cart" className="relative text-gold hover:text-royal-blue transition-colors duration-300" title="Your Requisition">
              <ShoppingCart size={22} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-royal-blue text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
            <button 
              className="md:hidden text-royal-blue hover:text-gold transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav className="md:hidden flex flex-col items-center gap-6 py-8 border-t border-royal-blue/10 bg-canvas absolute top-full left-0 w-full shadow-lg">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-royal-blue/70 hover:text-royal-blue transition-colors duration-300 uppercase tracking-widest text-sm font-bold">
            Collection
          </Link>
          <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-royal-blue/70 hover:text-royal-blue transition-colors duration-300 uppercase tracking-widest text-sm font-bold">
            About Us
          </Link>
          <Link href="/perks" onClick={() => setIsMobileMenuOpen(false)} className="text-royal-blue/70 hover:text-royal-blue transition-colors duration-300 uppercase tracking-widest text-sm font-bold">
            Member Perks
          </Link>
        </nav>
      )}
    </header>
  );
}
