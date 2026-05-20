import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from './ProductCard';

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'A very cool test product',
    price: 999,
    image_url: '/test.jpg',
  };

  const mockAddToCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path: Rendering & Data Binding', () => {
    it('should correctly render all product details', () => {
      // Arrange & Act
      render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);

      // Assert
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Test Product');
      expect(screen.getByText('A very cool test product')).toBeInTheDocument();
      expect(screen.getByText('₹999')).toBeInTheDocument();
      
      const image = screen.getByRole('img', { name: 'Test Product' });
      expect(image).toHaveAttribute('src', '/test.jpg');
    });

    it('should trigger onAddToCart callback precisely once with correct product on click', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
      const button = screen.getByRole('button', { name: /add to cart/i });

      // Act
      await user.click(button);

      // Assert
      expect(mockAddToCart).toHaveBeenCalledTimes(1);
      expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('Boundary Violations & Edge Cases', () => {
    it('should handle missing description gracefully (Null Matrix)', () => {
      // Arrange
      const edgeProduct = { ...mockProduct, description: '' };
      
      // Act
      render(<ProductCard product={edgeProduct} onAddToCart={mockAddToCart} />);

      // Assert
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Test Product');
      // Description is empty but should not crash
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });

    it('should render zero price correctly', () => {
      // Arrange
      const edgeProduct = { ...mockProduct, price: 0 };
      
      // Act
      render(<ProductCard product={edgeProduct} onAddToCart={mockAddToCart} />);

      // Assert
      expect(screen.getByText('₹0')).toBeInTheDocument();
    });
  });
});
