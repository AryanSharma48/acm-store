import type { Metadata } from 'next';
import { Playfair_Display, Montserrat } from 'next/font/google';
import Script from 'next/script';
import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';
import './globals.css';

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair'
});

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat'
});

export const metadata: Metadata = {
  title: 'ACM Merch Collective',
  description: 'High-end university bookstore carrying bespoke goods for the elite academic.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={`${playfair.variable} ${montserrat.variable} min-h-screen bg-canvas text-royal-blue flex flex-col relative`}>
        
        {/* Header Navigation Bar */}
        <header className="w-full border-b border-royal-blue/10 bg-canvas sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="font-serif text-2xl font-bold text-royal-blue tracking-wide hover:text-gold transition-colors duration-300">
              ACM Merch Collective
            </Link>

            {/* Navigation & Icons */}
            <nav className="flex items-center gap-10">
              <div className="hidden md:flex gap-8 text-sm font-medium tracking-widest uppercase">
                <Link href="/" className="text-royal-blue/70 hover:text-royal-blue transition-colors duration-300">Collection</Link>
                <Link href="/about" className="text-royal-blue/70 hover:text-royal-blue transition-colors duration-300">About Us</Link>
                <Link href="/perks" className="text-royal-blue/70 hover:text-royal-blue transition-colors duration-300">Member Perks</Link>
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

        {/* Main Content */}
        <div className="flex-grow">
          {children}
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-royal-blue/10 bg-canvas py-12 mt-24">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-6">
            <div className="flex gap-8 text-sm font-medium tracking-wide">
              <a href="#" className="text-royal-blue hover:text-gold transition-colors duration-300">Contact Us</a>
              <a href="#" className="text-royal-blue hover:text-gold transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-royal-blue hover:text-gold transition-colors duration-300">Terms of Service</a>
            </div>
            <p className="text-xs text-royal-blue/50 tracking-widest uppercase">
              © {new Date().getFullYear()} ACM Club. All rights reserved.
            </p>
          </div>
        </footer>
        
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js" 
          strategy="lazyOnload" 
        />
      </body>
    </html>
  );
}
