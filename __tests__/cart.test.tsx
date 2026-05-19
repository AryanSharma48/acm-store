import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/app/contexts/CartContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  it('should add an item to the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: '1',
        name: 'Test Product',
        price: 100,
        image_url: '/test.jpg'
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Test Product');
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.totalAmount).toBe(100);
  });

  it('should increase quantity when adding the same item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: '1', name: 'P1', price: 10, image_url: '' });
      result.current.addItem({ id: '1', name: 'P1', price: 10, image_url: '' });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalAmount).toBe(20);
  });

  it('should decrease quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: '1', name: 'P1', price: 10, image_url: '' });
      result.current.addItem({ id: '1', name: 'P1', price: 10, image_url: '' });
      result.current.decreaseQuantity('1');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);
  });

  it('should remove item when quantity reaches 0 via decreaseQuantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({ id: '1', name: 'P1', price: 10, image_url: '' });
      result.current.decreaseQuantity('1');
    });

    expect(result.current.items).toHaveLength(0);
  });
});
