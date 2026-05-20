import { renderHook, act } from '@testing-library/react';
import { useProducts } from './useProducts';
import api from '@/app/services/api';

// Isolate by mocking the API service
jest.mock('@/app/services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

describe('useProducts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization and Fetching', () => {
    it('should fetch products on mount and update state correctly', async () => {
      // Arrange
      const mockProducts = [{ id: '1', name: 'Hoodie' }];
      (api.get as jest.Mock).mockResolvedValue({ data: mockProducts });

      // Act
      const { result } = renderHook(() => useProducts());

      // Assert Initial State (Loading)
      expect(result.current.loading).toBe(true);

      // Await the effect
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Assert Final State
      expect(api.get).toHaveBeenCalledWith('/products');
      expect(result.current.products).toEqual(mockProducts);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Network error';
      (api.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      const { result } = renderHook(() => useProducts());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Assert
      expect(result.current.products).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Mutations', () => {
    it('should create a product and append it to state', async () => {
      // Arrange
      (api.get as jest.Mock).mockResolvedValue({ data: [] });
      const { result } = renderHook(() => useProducts());
      
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const newProduct = { id: '2', name: 'Mug' };
      (api.post as jest.Mock).mockResolvedValue({ data: newProduct });

      // Act
      await act(async () => {
        await result.current.create({ name: 'Mug' });
      });

      // Assert
      expect(api.post).toHaveBeenCalledWith('/products', { name: 'Mug' });
      expect(result.current.products).toEqual([newProduct]);
    });

    it('should update an existing product in state', async () => {
      // Arrange
      const initialProduct = { id: '1', name: 'Old Name' };
      (api.get as jest.Mock).mockResolvedValue({ data: [initialProduct] });
      const { result } = renderHook(() => useProducts());
      
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const updatedProduct = { id: '1', name: 'New Name' };
      (api.patch as jest.Mock).mockResolvedValue({ data: updatedProduct });

      // Act
      await act(async () => {
        await result.current.update('1', { name: 'New Name' });
      });

      // Assert
      expect(api.patch).toHaveBeenCalledWith('/products/1', { name: 'New Name' });
      expect(result.current.products).toEqual([updatedProduct]);
    });

    it('should remove a product from state', async () => {
      // Arrange
      const initialProduct = { id: '1', name: 'Hoodie' };
      (api.get as jest.Mock).mockResolvedValue({ data: [initialProduct] });
      const { result } = renderHook(() => useProducts());
      
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      (api.delete as jest.Mock).mockResolvedValue({});

      // Act
      await act(async () => {
        await result.current.remove('1');
      });

      // Assert
      expect(api.delete).toHaveBeenCalledWith('/products/1');
      expect(result.current.products).toEqual([]);
    });
  });
});
