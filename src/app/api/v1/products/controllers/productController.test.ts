import { getProducts, addProduct, editProduct, removeProduct } from './productController';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';

// Mock the service layer to isolate the controller
jest.mock('../services/productService', () => ({
  getAllProducts: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
}));

describe('ProductController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should call getAllProducts service and return data', async () => {
      // Arrange
      const mockData = [{ id: '1', name: 'Product' }];
      (getAllProducts as jest.Mock).mockResolvedValue(mockData);

      // Act
      const result = await getProducts();

      // Assert
      expect(getAllProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });
  });

  describe('addProduct', () => {
    it('should call createProduct service with payload and return new product', async () => {
      // Arrange
      const payload = { name: 'New Product', price: 100 };
      const mockResponse = { id: '2', ...payload };
      (createProduct as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await addProduct(payload);

      // Assert
      expect(createProduct).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('editProduct', () => {
    it('should call updateProduct service with id and payload and return updated product', async () => {
      // Arrange
      const id = '1';
      const payload = { price: 150 };
      const mockResponse = { id, name: 'Product', ...payload };
      (updateProduct as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await editProduct(id, payload);

      // Assert
      expect(updateProduct).toHaveBeenCalledWith(id, payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('removeProduct', () => {
    it('should call deleteProduct service with id and return true', async () => {
      // Arrange
      const id = '1';
      (deleteProduct as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await removeProduct(id);

      // Assert
      expect(deleteProduct).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });
  });
});
