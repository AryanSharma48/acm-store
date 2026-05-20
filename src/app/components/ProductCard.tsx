// src/app/components/ProductCard.tsx
'use client';



type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
};

type Props = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

  export default function ProductCard({ product, onAddToCart }: Props) {
    return (
      <div className="group flex flex-col bg-canvas border border-royal-blue relative p-4 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(10,25,47,0.08)] h-full">
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
        <h4 className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-black mb-1 sm:mb-3 line-clamp-1">{product.name}</h4>
        <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed mb-4 sm:mb-8 flex-grow line-clamp-2 sm:line-clamp-none">{product.description}</p>
        <div className="flex items-center justify-between border-t border-royal-blue/10 pt-3 sm:pt-4 mt-auto min-h-[40px] sm:min-h-[48px] gap-2">
          <span className="font-serif text-sm sm:text-lg font-bold text-royal-blue">₹{product.price}</span>
          <button
            onClick={() => onAddToCart(product)}
            className="bg-royal-blue text-white px-2 sm:px-6 py-1 sm:py-2 text-[8px] sm:text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300 h-[28px] sm:h-[32px] whitespace-nowrap"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
    );
  }
