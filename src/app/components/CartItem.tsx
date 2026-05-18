// src/app/components/CartItem.tsx
'use client';



type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
};

type Props = {
  item: CartItem;
  onRemove: (id: string) => void;
};

export default function CartItem({ item, onRemove }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-royal-blue/10 pb-4">
      <div className="flex items-center gap-4">
        <img src={item.image_url} alt={item.name} width={64} height={64} className="object-cover" />
        <div>
          <p className="font-medium text-royal-blue">{item.name}</p>
          <p className="text-sm text-royal-blue/70">₹{item.price} × {item.quantity}</p>
        </div>
      </div>
      <button onClick={() => onRemove(item.id)} className="text-gold hover:text-royal-blue transition-colors">
        Remove
      </button>
    </div>
  );
}
