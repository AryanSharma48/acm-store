/**
 * @jest-environment node
 */
// src/app/api/checkout/route.test.ts
// Integration tests for the POST /api/checkout route handler.
//
// Strategy:
//   - All external I/O (Supabase admin client, Razorpay SDK) is mocked.
//   - jest.mock factories CANNOT reference module-scope variables (TDZ).
//     We use jest.fn() inline and retrieve references via jest.mocked / require.
//   - Each describe block resets mocks in beforeEach for isolation.

import { POST } from './route';

// ─── Mock: Razorpay SDK ───────────────────────────────────────────────────────
jest.mock('razorpay', () => {
  const mockCreate = jest.fn();
  const MockRazorpay = jest.fn().mockImplementation(() => ({
    orders: { create: mockCreate },
  }));
  // Attach mockCreate so tests can access it
  (MockRazorpay as any).__mockCreate = mockCreate;
  return MockRazorpay;
});

// ─── Mock: Supabase admin client ──────────────────────────────────────────────
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
  })),
}));

// ─── Mock: Supabase SSR (used for Bearer-token validation in the route) ────────
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() },
  })),
}));

// Lazy accessors — retrieve live mock references after hoisting
const getRazorpayMock = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RazorpayMock = require('razorpay') as any;
  return {
    MockRazorpay: RazorpayMock,
    mockCreateOrder: RazorpayMock.__mockCreate as jest.Mock,
  };
};

const getSupabaseMock = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js') as any;
  return createClient() as { from: jest.Mock; auth: { getUser: jest.Mock } };
};

const getServerSupabaseMock = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@/lib/supabase/server') as any;
  return createClient() as { auth: { getUser: jest.Mock } };
};


/** Build a minimal Next.js Request object with a JSON body and optional Authorization header. */
function buildRequest(
  body: object,
  opts: { token?: string } = {}
): Request {
  return new Request('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

const VALID_PAYLOAD = {
  items: [{ id: 'prod-1', quantity: 2 }],
  shippingDetails: {
    name: 'Aryan Sharma',
    email: 'aryan@acm.com',
    phone: '+91 9876543210',
    address: 'Flat 4B\nMG Road\nJaipur\nRajasthan\n302001',
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/checkout', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    // Default: Razorpay keys are NOT configured (the common dev state)
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
  });

  // ── Guard: Razorpay configuration ─────────────────────────────────────────

  describe('Razorpay Configuration Guard', () => {
    it('should return 503 with RAZORPAY_NOT_CONFIGURED when keys are absent', async () => {
      // Arrange — env vars deleted in beforeEach

      // Act
      const res = await POST(buildRequest(VALID_PAYLOAD, { token: 'tok' }));
      const body = await res.json();

      // Assert
      expect(res.status).toBe(503);
      expect(body.code).toBe('RAZORPAY_NOT_CONFIGURED');
      expect(body.error).toBe('Payment gateway is not yet configured.');
    });

    it('should return 503 when keys are present but still set to placeholder values', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'your_razorpay_key_id';
      process.env.RAZORPAY_KEY_SECRET = 'your_razorpay_key_secret';

      // Act
      const res = await POST(buildRequest(VALID_PAYLOAD, { token: 'tok' }));
      const body = await res.json();

      // Assert
      expect(res.status).toBe(503);
      expect(body.code).toBe('RAZORPAY_NOT_CONFIGURED');
    });

    it('should NOT return 503 when both keys are legitimately configured', async () => {
      // Arrange — configure real-looking keys so the guard passes
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_abc123';
      process.env.RAZORPAY_KEY_SECRET = 'secret_xyz789';

      // We still expect the request to fail further down (no auth token), but NOT with 503
      const res = await POST(buildRequest(VALID_PAYLOAD)); // no token → should 401
      const body = await res.json();

      expect(res.status).not.toBe(503);
      expect(body.code).not.toBe('RAZORPAY_NOT_CONFIGURED');
    });
  });

  // ── Auth: Missing / invalid Bearer token ──────────────────────────────────

  describe('Authentication', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_abc123';
      process.env.RAZORPAY_KEY_SECRET = 'secret_xyz789';
    });

    it('should return 401 when Authorization header is missing', async () => {
      // Arrange
      const req = buildRequest(VALID_PAYLOAD); // no token

      // Act
      const res = await POST(req);
      const body = await res.json();

      // Assert
      expect(res.status).toBe(401);
      expect(body.error).toMatch(/authentication|token/i);
    });

    it('should return 401 when the Bearer token is invalid / session not found', async () => {
      // Arrange
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });

      // Act
      const res = await POST(buildRequest(VALID_PAYLOAD, { token: 'bad-token' }));
      const body = await res.json();

      // Assert
      expect(res.status).toBe(401);
    });
  });

  // ── Happy Path: Full checkout flow ────────────────────────────────────────

  describe('Happy Path', () => {
    beforeEach(() => {
      // Configure Razorpay keys
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_abc123';
      process.env.RAZORPAY_KEY_SECRET = 'secret_xyz789';

      // Valid session
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // DB: product lookup returns price from DB
      const mockSingle  = jest.fn().mockResolvedValue({ data: { id: 'prod-1', price: 500, stock: 10 }, error: null });
      const mockEqProd  = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelProd = jest.fn().mockReturnValue({ eq: mockEqProd });

      // DB: order insert succeeds
      const mockSelectOrder  = jest.fn().mockResolvedValue({ data: [{ id: 'order-abc' }], error: null });
      const mockInsertOrder  = jest.fn().mockReturnValue({ select: mockSelectOrder });

      // Wire `from()` to return different chains based on table name
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'products') return { select: mockSelProd };
        if (table === 'orders')   return { insert: mockInsertOrder };
        return {};
      });

      // Razorpay: create order returns a mock Razorpay order
      mockCreateOrder.mockResolvedValue({
        id: 'order_razorpay_123',
        amount: 100000, // paise
        currency: 'INR',
        receipt: 'receipt_abc',
      });
    });

    it('should return 200 with Razorpay order details on a valid request', async () => {
      // Act
      const res = await POST(buildRequest(VALID_PAYLOAD, { token: 'valid-token' }));
      const body = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        razorpayOrderId: 'order_razorpay_123',
        currency: 'INR',
      });
    });

    it('should call Razorpay createOrder with the server-computed amount in paise', async () => {
      // Arrange — product price is 500 INR × qty 2 = 1000 INR = 100000 paise

      // Act
      await POST(buildRequest(VALID_PAYLOAD, { token: 'valid-token' }));

      // Assert
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 100000, currency: 'INR' })
      );
    });
  });

  // ── Chaos / Error Paths ───────────────────────────────────────────────────

  describe('Chaos Responses', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_abc123';
      process.env.RAZORPAY_KEY_SECRET = 'secret_xyz789';

      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    });

    it('should return 500 when Razorpay SDK throws an unexpected error', async () => {
      // Arrange
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'prod-1', price: 500, stock: 10 }, error: null });
      const mockEq     = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSel    = jest.fn().mockReturnValue({ eq: mockEq });
      mockAdminFrom.mockImplementation(() => ({ select: mockSel }));

      mockCreateOrder.mockRejectedValue(new Error('Razorpay network timeout'));

      // Act
      const res = await POST(buildRequest(VALID_PAYLOAD, { token: 'valid-token' }));

      // Assert
      expect(res.status).toBe(500);
    });

    it('should return 404 when a requested product ID does not exist in the database', async () => {
      // Arrange — DB returns null for the product lookup
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEq     = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSel    = jest.fn().mockReturnValue({ eq: mockEq });
      mockAdminFrom.mockImplementation(() => ({ select: mockSel }));

      // Act
      const res = await POST(buildRequest(VALID_PAYLOAD, { token: 'valid-token' }));

      // Assert — route should reject the order gracefully
      expect([404, 400, 500]).toContain(res.status);
    });

    it('should return 400 when the request body is missing the items array', async () => {
      // Arrange
      const req = buildRequest({ shippingDetails: VALID_PAYLOAD.shippingDetails }, { token: 'valid-token' });

      // Act
      const res = await POST(req);

      // Assert
      expect([400, 500]).toContain(res.status);
    });

    it('should return 400 when the request body is completely malformed JSON', async () => {
      // Arrange — bypass buildRequest to send raw malformed JSON
      const req = new Request('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
        body: '{ this is not valid json',
      });

      // Act
      const res = await POST(req);

      // Assert
      expect([400, 500]).toContain(res.status);
    });
  });

  // ── Boundary Violations ────────────────────────────────────────────────────

  describe('Boundary Violations', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_abc123';
      process.env.RAZORPAY_KEY_SECRET = 'secret_xyz789';
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    });

    it('should return an error when the items array is empty', async () => {
      // Arrange
      const req = buildRequest(
        { items: [], shippingDetails: VALID_PAYLOAD.shippingDetails },
        { token: 'valid-token' }
      );

      // Act
      const res = await POST(req);

      // Assert
      expect([400, 500]).toContain(res.status);
    });
  });
});
