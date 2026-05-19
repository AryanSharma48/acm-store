import type { Metadata } from 'next';
import { Playfair_Display, Montserrat } from 'next/font/google';
import Script from 'next/script';
import Link from 'next/link';
import './globals.css';
import { CartProvider } from '@/app/contexts/CartContext';
import Header from '@/app/components/Header';

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
    <html lang="en" className="light" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${playfair.variable} ${montserrat.variable} min-h-screen bg-canvas text-royal-blue flex flex-col relative`}>
        <CartProvider>
          <Header />

          {/* Main Content */}
          <div className="flex-grow">
            {children}
          </div>
        </CartProvider>

        {/* Footer */}
        <footer className="w-full border-t border-royal-blue/10 bg-canvas py-12 mt-24">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-6">
            <div className="flex gap-8 text-sm font-medium tracking-wide">
              <a href="#" className="text-royal-blue hover:text-gold transition-colors duration-300">Contact Us</a>
              <a href="#" className="text-royal-blue hover:text-gold transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-royal-blue hover:text-gold transition-colors duration-300">Terms of Service</a>
            </div>
            <p className="text-xs text-royal-blue/50 tracking-widest uppercase">
              © {new Date().getFullYear()} MUJ ACM CHAPTER. All rights reserved.
            </p>
          </div>
        </footer>
        
        
      </body>
    </html>
  );
}
