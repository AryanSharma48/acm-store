import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductForm from './ProductForm';
import { createProduct, updateProduct } from '@/app/api/v1/products/services/productService';

// Mock the backend services
jest.mock('@/app/api/v1/products/services/productService', () => ({
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
}));

// Mock window.alert
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('ProductForm Component', () => {
  const mockOnSaved = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path: Creating a Product', () => {
    it('should successfully submit form and call createProduct', async () => {
      // Arrange
      const user = userEvent.setup();
      (createProduct as jest.Mock).mockResolvedValue({});
      render(<ProductForm onSaved={mockOnSaved} />);

      const nameInput = screen.getByLabelText('Product Name');
      const priceInput = screen.getByLabelText('Price (₹)');
      const submitButton = screen.getByRole('button', { name: /add product/i });

      // Act
      await user.type(nameInput, 'New Shirt');
      await user.type(priceInput, '599');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(createProduct).toHaveBeenCalledTimes(1);
        expect(createProduct).toHaveBeenCalledWith({
          name: 'New Shirt',
          description: '',
          price: 599,
          image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
          stock: 100,
        });
        expect(mockOnSaved).toHaveBeenCalledTimes(1);
        expect(mockAlert).toHaveBeenCalledWith('Product successfully added.');
      });
    });
  });

  describe('Happy Path: Updating a Product', () => {
    const existingProduct = {
      id: '1',
      name: 'Old Shirt',
      description: 'Old Description',
      price: 200,
      image_url: 'https://test.com/img.jpg',
    };

    it('should successfully submit form and call updateProduct', async () => {
      // Arrange
      const user = userEvent.setup();
      (updateProduct as jest.Mock).mockResolvedValue({});
      render(<ProductForm product={existingProduct} onSaved={mockOnSaved} />);

      const priceInput = screen.getByLabelText('Price (₹)');
      const submitButton = screen.getByRole('button', { name: /update product/i });

      // Act
      await user.clear(priceInput);
      await user.type(priceInput, '300');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(updateProduct).toHaveBeenCalledTimes(1);
        expect(updateProduct).toHaveBeenCalledWith('1', {
          name: 'Old Shirt',
          description: 'Old Description',
          price: 300,
          image_url: 'https://test.com/img.jpg',
        });
        expect(mockOnSaved).toHaveBeenCalledTimes(1);
        expect(mockAlert).toHaveBeenCalledWith('Product successfully updated.');
      });
    });
  });

  describe('Boundary Violations & Edge Cases', () => {
    it('should not submit if required fields are missing', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<ProductForm onSaved={mockOnSaved} />);
      const submitButton = screen.getByRole('button', { name: /add product/i });

      // Act
      await user.click(submitButton);

      // Assert
      expect(createProduct).not.toHaveBeenCalled();
      expect(mockOnSaved).not.toHaveBeenCalled();
    });

    it('should handle API errors robustly during submission', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (createProduct as jest.Mock).mockRejectedValue(new Error('Server Down'));
      
      render(<ProductForm onSaved={mockOnSaved} />);
      
      const nameInput = screen.getByLabelText('Product Name');
      const priceInput = screen.getByLabelText('Price (₹)');
      const submitButton = screen.getByRole('button', { name: /add product/i });

      // Act
      await user.type(nameInput, 'Faulty Product');
      await user.type(priceInput, '100');
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(createProduct).toHaveBeenCalledTimes(1);
        expect(mockOnSaved).not.toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('Failed to save product');
        expect(mockConsoleError).toHaveBeenCalled();
      });

      // Teardown
      mockConsoleError.mockRestore();
    });
  });
});
