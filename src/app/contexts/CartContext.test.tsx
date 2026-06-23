import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/app/contexts/CartContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext Unit Tests', () => {
  beforeEach(() => {
    // Isolate state by wiping localStorage
    window.localStorage.clear();
    
    // Clear all mocks for pure determinism
    jest.clearAllMocks();
  });

  describe('Initialization & Constraints', () => {
    it('should throw an error when useCart is called outside of CartProvider', () => {
      // Arrange
      const originalError = console.error;
      console.error = jest.fn(); // Suppress React error logging for this expected throw

      // Act & Assert
      expect(() => {
        renderHook(() => useCart());
      }).toThrow('useCart must be used within CartProvider');

      // Teardown
      console.error = originalError;
    });

    it('should initialize with an empty array when localStorage is empty', () => {
      // Arrange (handled by beforeEach clearing)

      // Act
      const { result } = renderHook(() => useCart(), { wrapper });

      // Assert
      expect(result.current.items).toEqual([]);
      expect(result.current.totalAmount).toBe(0);
    });
  });

  describe('Happy Path: Standard Interactions', () => {
    it('should successfully add a new item to the cart', () => {
      // Arrange
      const { result } = renderHook(() => useCart(), { wrapper });
      const newItem = { productId: '1', size: 'M', name: 'Hoodie', price: 50, image_url: '/hoodie.jpg' };

      // Act
      act(() => {
        result.current.addItem(newItem);
      });

      // Assert
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toStrictEqual({ ...newItem, id: '1-M', quantity: 1 });
      expect(result.current.totalAmount).toBe(50);
    });

    it('should increment quantity when adding an identical item', () => {
      // Arrange
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = { productId: '2', size: 'M', name: 'Mug', price: 15, image_url: '/mug.jpg' };

      // Act
      act(() => {
        result.current.addItem(item);
        result.current.addItem(item);
      });

      // Assert
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.totalAmount).toBe(30);
    });

    it('should successfully decrease the quantity of an existing item', () => {
      // Arrange
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = { productId: '3', size: 'M', name: 'Sticker', price: 5, image_url: '/sticker.jpg' };
      
      act(() => {
        result.current.addItem(item);
        result.current.addItem(item);
      });

      // Act
      act(() => {
        result.current.decreaseQuantity('3-M');
      });

      // Assert
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.totalAmount).toBe(5);
    });

    it('should completely remove an item when decreaseQuantity drops it to zero', () => {
      // Arrange
      const { result } = renderHook(() => useCart(), { wrapper });
      const item = { productId: '4', size: 'M', name: 'Pen', price: 2, image_url: '/pen.jpg' };
      
      act(() => {
        result.current.addItem(item);
      });

      // Act
      act(() => {
        result.current.decreaseQuantity('4-M');
      });

      // Assert
      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalAmount).toBe(0);
    });

    it('should fully clear the cart and reset total amount', () => {
      // Arrange
      const { result } = renderHook(() => useCart(), { wrapper });
      act(() => {
        result.current.addItem({ productId: '1', size: 'M', name: 'P1', price: 10, image_url: '' });
        result.current.addItem({ productId: '2', size: 'M', name: 'P2', price: 20, image_url: '' });
      });

      // Act
      act(() => {
        result.current.clearCart();
      });

      // Assert
      expect(result.current.items).toEqual([]);
      expect(result.current.totalAmount).toBe(0);
    });
  });

  describe('Boundary Violations & Edge Cases', () => {
    it('should handle zero-price items correctly', () => {
      // Arrange
      const { result } = renderHook(() => useCart(), { wrapper });
      const zeroPriceItem = { productId: 'free-item', size: 'M', name: 'Free Promo', price: 0, image_url: '/promo.jpg' };

      // Act
      act(() => {
        result.current.addItem(zeroPriceItem);
        result.current.addItem(zeroPriceItem);
      });

      // Assert
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.totalAmount).toBe(0);
    });

    it('should silently ignore removing an item ID that does not exist', () => {
      // Arrange
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem({ productId: 'valid-id', size: 'M', name: 'Valid', price: 10, image_url: '' });
      });

      // Act
      act(() => {
        result.current.removeItem('ghost-id');
      });

      // Assert
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('valid-id-M');
    });

    it('should silently ignore decreaseQuantity on an item ID that does not exist', () => {
      // Arrange
      const { result } = renderHook(() => useCart(), { wrapper });

      // Act
      act(() => {
        result.current.decreaseQuantity('non-existent');
      });

      // Assert
      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalAmount).toBe(0);
    });

    it('should calculate extreme pricing sums correctly (integer boundaries)', () => {
      // Arrange
      const { result } = renderHook(() => useCart(), { wrapper });
      const expensiveItem = { productId: 'expensive', size: 'M', name: 'Gold Laptop', price: 9999999, image_url: '' };

      // Act
      act(() => {
        result.current.addItem(expensiveItem);
        result.current.addItem(expensiveItem);
      });

      // Assert
      expect(result.current.totalAmount).toBe(19999998);
    });
  });
});
