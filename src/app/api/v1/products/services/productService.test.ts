import { getAllProducts, createProduct, updateProduct, deleteProduct } from './productService';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should successfully fetch all products in descending order', async () => {
      // Arrange
      const mockData = [{ id: '1', name: 'T-Shirt' }, { id: '2', name: 'Hoodie' }];
      const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      // Act
      const result = await getAllProducts();

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should throw an error when fetching products fails', async () => {
      // Arrange
      const mockError = new Error('Database connection failed');
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      // Act & Assert
      await expect(getAllProducts()).rejects.toThrow('Database connection failed');
    });
  });

  describe('createProduct', () => {
    it('should successfully create a product and return the inserted item', async () => {
      // Arrange
      const payload = { name: 'Cap', price: 15 };
      const mockData = [{ id: '3', ...payload }];
      const mockSelect = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      // Act
      const result = await createProduct(payload);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockInsert).toHaveBeenCalledWith([payload]);
      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual(mockData[0]);
    });

    it('should throw an error when creation fails', async () => {
      // Arrange
      const mockError = new Error('Insert constraint violation');
      const mockSelect = jest.fn().mockResolvedValue({ data: null, error: mockError });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      // Act & Assert
      await expect(createProduct({ name: '', price: 0 })).rejects.toThrow('Insert constraint violation');
    });
  });

  describe('updateProduct', () => {
    it('should successfully update a product and return the updated item', async () => {
      // Arrange
      const payload = { price: 20 };
      const mockData = [{ id: '1', name: 'T-Shirt', price: 20 }];
      const mockSelect = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      // Act
      const result = await updateProduct('1', payload);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockUpdate).toHaveBeenCalledWith(payload);
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockData[0]);
    });

    it('should throw an error when updating fails', async () => {
      // Arrange
      const mockError = new Error('Product not found');
      const mockSelect = jest.fn().mockResolvedValue({ data: null, error: mockError });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      // Act & Assert
      await expect(updateProduct('invalid-id', {})).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should successfully delete a product and return true', async () => {
      // Arrange
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

      // Act
      const result = await deleteProduct('1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toBe(true);
    });

    it('should throw an error when deletion fails', async () => {
      // Arrange
      const mockError = new Error('Permission denied');
      const mockEq = jest.fn().mockResolvedValue({ error: mockError });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

      // Act & Assert
      await expect(deleteProduct('1')).rejects.toThrow('Permission denied');
    });
  });
});
