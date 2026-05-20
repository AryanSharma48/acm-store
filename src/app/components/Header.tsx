// src/app/components/Header.tsx
'use client';

import Link from 'next/link';
import { ShoppingCart, User, Menu, X, LogIn, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/app/contexts/CartContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Check if admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', session.user.email)
          .maybeSingle();
          
        if (adminData) setIsAdmin(true);
      }
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Would normally re-check admin here, but reload is usually fine for login
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      handleLogin();
    } else {
      router.push('/profile');
    }
  };



  return (
    <header className="w-full border-b border-royal-blue/10 bg-canvas sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center relative">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-xl sm:text-2xl font-bold text-royal-blue tracking-wide hover:text-gold transition-colors duration-300"
        >
          ACM STORE
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
            
            <button 
              onClick={handleProfileClick}
              className="text-gold hover:text-royal-blue transition-colors duration-300" 
              title={user ? "Profile" : "Sign In"}
            >
              {user ? <User size={22} strokeWidth={1.5} /> : <LogIn size={22} strokeWidth={1.5} />}
            </button>
            
            {isAdmin ? (
              <Link 
                href="/admin/products" 
                className="relative text-gold hover:text-royal-blue transition-colors duration-300" 
                title="Product Management"
              >
                <Package size={22} strokeWidth={1.5} />
              </Link>
            ) : (
              <Link 
                href="/cart" 
                className="relative text-gold hover:text-royal-blue transition-colors duration-300" 
                title="Your Requisition"
              >
                <ShoppingCart size={22} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-royal-blue text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}
            
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
