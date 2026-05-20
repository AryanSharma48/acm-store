import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/contexts/CartContext';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/contexts/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('Header Component', () => {
  const mockRouterPush = jest.fn();
  const mockSupabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithOAuth: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    (useCart as jest.Mock).mockReturnValue({ items: [] });
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('Happy Path: Unauthenticated User', () => {
    it('should render the login button and standard cart icon', () => {
      // Arrange & Act
      render(<Header />);

      // Assert
      expect(screen.getByRole('link', { name: /acm store/i })).toBeInTheDocument();
      expect(screen.getByTitle('Sign In')).toBeInTheDocument();
      expect(screen.getByTitle('Your Requisition')).toBeInTheDocument();
      expect(screen.queryByTitle('Product Management')).not.toBeInTheDocument();
    });

    it('should trigger login flow when clicking user icon', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<Header />);
      const loginButton = screen.getByTitle('Sign In');

      // Act
      await user.click(loginButton);

      // Assert
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: expect.any(String) },
      });
    });
  });

  describe('Boundary Violations & Edge Cases', () => {
    it('should display the correct cart total badge when items are present', () => {
      // Arrange
      (useCart as jest.Mock).mockReturnValue({
        items: [
          { quantity: 2 },
          { quantity: 3 }
        ]
      });

      // Act
      render(<Header />);

      // Assert
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should toggle mobile menu correctly on click', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<Header />);
      // In a real browser this button is only visible on mobile, but RTL sees it.
      const menuButton = screen.getByRole('button', { name: '' }); // We don't have aria-label, but we can query by icon or just grab the last button.
      // Better to query by a specific selector. We'll add a quick wrapper check.
      const buttons = screen.getAllByRole('button');
      const mobileToggle = buttons[buttons.length - 1]; // the menu toggle is the last button

      // Act
      await user.click(mobileToggle);

      // Assert
      // The mobile nav contains identical links, so querying by role will return multiple.
      const collectionLinks = screen.getAllByText(/collection/i);
      expect(collectionLinks.length).toBeGreaterThan(1);
    });
  });
});
