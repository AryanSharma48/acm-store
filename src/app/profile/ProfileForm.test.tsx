// src/app/profile/ProfileForm.test.tsx
// Unit tests for the ProfileForm component.
//
// Strategy:
//   - Supabase client is fully mocked — no real network calls.
//   - user-event (v14) is used for all DOM interactions (realistic events).
//   - Assertions use accessibility roles and labels, not CSS selectors.
//   - State is isolated via beforeEach resets.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileForm from './ProfileForm';
import { createClient } from '@/lib/supabase/client';

// ─── Mock: Supabase client ────────────────────────────────────────────────────
const mockUpdate  = jest.fn();
const mockEq      = jest.fn();
const mockSignOut = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// ─── Mock: next/navigation (router not used in ProfileForm but guard against import crashes) ──
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FULL_PROFILE = {
  id: 'user-123',
  name: 'Aryan Sharma',
  email: 'aryan@acm.com',
  phone: '+91 9876543210',
  // Serialised address — 5 newline-delimited lines
  address: 'Flat 4B, Sunrise Towers\nMG Road\nJaipur\nRajasthan\n302001',
};

const EMPTY_PROFILE = {
  id: 'user-456',
  name: null,
  email: null,
  phone: null,
  address: null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default Supabase mock wiring
    mockEq.mockReturnValue(Promise.resolve({ error: null }));
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockSignOut.mockResolvedValue({});

    (createClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({ update: mockUpdate }),
      auth: { signOut: mockSignOut },
    });
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('should render the name and email from the profile as read-only text', () => {
      // Arrange & Act
      render(<ProfileForm profile={FULL_PROFILE} />);

      // Assert
      expect(screen.getByText('Aryan Sharma')).toBeInTheDocument();
      expect(screen.getByText('aryan@acm.com')).toBeInTheDocument();
    });

    it('should pre-populate the phone input from the profile', () => {
      // Arrange & Act
      render(<ProfileForm profile={FULL_PROFILE} />);

      // Assert
      expect(screen.getByPlaceholderText('+91 98765 43210')).toHaveValue('+91 9876543210');
    });

    it('should pre-populate all five address sub-fields from the serialised profile address', () => {
      // Arrange & Act
      render(<ProfileForm profile={FULL_PROFILE} />);

      // Assert
      expect(screen.getByPlaceholderText(/flat no\./i)).toHaveValue('Flat 4B, Sunrise Towers');
      expect(screen.getByPlaceholderText(/street name/i)).toHaveValue('MG Road');
      expect(screen.getByPlaceholderText(/e\.g\. jaipur/i)).toHaveValue('Jaipur');
      expect(screen.getByPlaceholderText(/e\.g\. rajasthan/i)).toHaveValue('Rajasthan');
      expect(screen.getByPlaceholderText(/6-digit pin/i)).toHaveValue('302001');
    });

    it('should render empty inputs when the profile has no address or phone', () => {
      // Arrange & Act
      render(<ProfileForm profile={EMPTY_PROFILE} />);

      // Assert — no pre-fill, all empty
      expect(screen.getByPlaceholderText('+91 98765 43210')).toHaveValue('');
      expect(screen.getByPlaceholderText(/flat no\./i)).toHaveValue('');
    });

    it('should render the Save Details and Sign Out buttons', () => {
      // Arrange & Act
      render(<ProfileForm profile={FULL_PROFILE} />);

      // Assert
      expect(screen.getByRole('button', { name: /save details/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });
  });

  // ── Happy Path: Saving ─────────────────────────────────────────────────────

  describe('Happy Path: Saving Profile', () => {
    it('should call supabase update with serialised address and show success banner', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<ProfileForm profile={FULL_PROFILE} />);

      // Act — change the city and save
      const cityInput = screen.getByPlaceholderText(/e\.g\. jaipur/i);
      await user.clear(cityInput);
      await user.type(cityInput, 'Mumbai');
      await user.click(screen.getByRole('button', { name: /save details/i }));

      // Assert
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            address: expect.stringContaining('Mumbai'),
          })
        );
        expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
        expect(screen.getByText(/profile saved successfully/i)).toBeInTheDocument();
      });
    });

    it('should strip non-digit characters from PIN code input', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<ProfileForm profile={EMPTY_PROFILE} />);
      const pinInput = screen.getByPlaceholderText(/6-digit pin/i);

      // Act
      await user.type(pinInput, '30abc2001');

      // Assert — only digits should remain
      expect(pinInput).toHaveValue('302001');
    });
  });

  // ── Validation ─────────────────────────────────────────────────────────────

  describe('Validation', () => {
    it('should show a phone error and NOT call update when phone is empty', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<ProfileForm profile={{ ...FULL_PROFILE, phone: '' }} />);

      // Clear the phone field
      const phoneInput = screen.getByPlaceholderText('+91 98765 43210');
      await user.clear(phoneInput);

      // Act
      await user.click(screen.getByRole('button', { name: /save details/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
        expect(mockUpdate).not.toHaveBeenCalled();
      });
    });

    it('should show an error and NOT call update when the PIN code is not 6 digits', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<ProfileForm profile={FULL_PROFILE} />);

      const pinInput = screen.getByPlaceholderText(/6-digit pin/i);
      await user.clear(pinInput);
      await user.type(pinInput, '123'); // only 3 digits

      // Act
      await user.click(screen.getByRole('button', { name: /save details/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/valid 6-digit pin/i)).toBeInTheDocument();
        expect(mockUpdate).not.toHaveBeenCalled();
      });
    });

    it('should show required errors for all empty address sub-fields on submit', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<ProfileForm profile={EMPTY_PROFILE} />);

      // Add a valid phone so only address fields fail
      await user.type(screen.getByPlaceholderText('+91 98765 43210'), '+91 9876543210');

      // Act
      await user.click(screen.getByRole('button', { name: /save details/i }));

      // Assert — all 5 address fields should show "Required."
      await waitFor(() => {
        const requiredMessages = screen.getAllByText('Required.');
        expect(requiredMessages.length).toBeGreaterThanOrEqual(4); // building, street, city, state, pin
        expect(mockUpdate).not.toHaveBeenCalled();
      });
    });
  });

  // ── Chaos: Supabase error ──────────────────────────────────────────────────

  describe('Chaos Responses', () => {
    it('should show an error banner when supabase update returns an error', async () => {
      // Arrange
      mockEq.mockReturnValue(Promise.resolve({ error: { message: 'DB write failed' } }));
      const user = userEvent.setup();
      render(<ProfileForm profile={FULL_PROFILE} />);

      // Act
      await user.click(screen.getByRole('button', { name: /save details/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
      });
    });
  });

  // ── Log Out ────────────────────────────────────────────────────────────────

  describe('Sign Out', () => {
    it('should call supabase.auth.signOut when the Sign Out button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();

      // jsdom does not support navigation — delete and stub location on global window
      delete (global as any).window.location;
      (global as any).window.location = { href: '' } as any;

      render(<ProfileForm profile={FULL_PROFILE} />);

      // Act
      await user.click(screen.getByRole('button', { name: /sign out/i }));

      // Assert
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });
  });
});
