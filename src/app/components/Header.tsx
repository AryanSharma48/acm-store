// src/app/components/Header.tsx
'use client';

import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full border-b border-royal-blue/10 bg-canvas sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-2xl font-bold text-royal-blue tracking-wide hover:text-gold transition-colors duration-300"
        >
          ACM Merch Collective
        </Link>

        {/* Navigation & Icons */}
        <nav className="flex items-center gap-10">
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
          <div className="flex gap-6 items-center">
            <Link href="/admin" className="text-gold hover:text-royal-blue transition-colors duration-300" title="Admin Archive">
              <User size={22} strokeWidth={1.5} />
            </Link>
            <Link href="/cart" className="text-gold hover:text-royal-blue transition-colors duration-300" title="Your Requisition">
              <ShoppingCart size={22} strokeWidth={1.5} />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
