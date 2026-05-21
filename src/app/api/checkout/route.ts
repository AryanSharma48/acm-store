// src/app/api/checkout/route.ts
// POST /api/checkout
//
// Accepts: { items: CartItem[], shippingDetails: ShippingDetails }
// Behaviour:
//   1. Guards against unconfigured Razorpay credentials (returns 503 with
//      error code RAZORPAY_NOT_CONFIGURED so the frontend can show a
//      user-friendly "integration coming soon" notice).
//   2. Authenticates the calling user via their Supabase session (Bearer token).
//   3. Re-prices every cart item from the `products` DB table (prevents price spoofing).
//   4. Creates a Razorpay order for the server-calculated total.
//   5. Inserts a `pending` order row in the `orders` table linked to the user.
//   6. Returns the Razorpay order details — the payment modal is NOT launched here.

import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single item from the client-side cart. Only `id` and `quantity` are
 *  trusted — the price is always re-fetched from the database. */
interface ClientCartItem {
  id: string;
  quantity: number;
  // These are passed for convenience but are NOT used for price calculation.
  name?: string;
  price?: number;
  image_url?: string;
}

interface ShippingDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

// ---------------------------------------------------------------------------
// Supabase admin client (uses service-role key for unrestricted DB access)
// ---------------------------------------------------------------------------
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Razorpay client is intentionally NOT instantiated at module level.
// Creating it with empty/placeholder keys causes the SDK to emit a
// 'Using DEFAULT root logger' warning on every server cold-start.
// Instead it is constructed inside the handler, after the guard that
// confirms the keys are properly configured.

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // ------------------------------------------------------------------
    // 0. Guard — Razorpay must be configured before anything else.
    //    Missing or placeholder keys produce a 401 deep inside the SDK
    //    which would otherwise surface as a confusing 500 to the client.
    // ------------------------------------------------------------------
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    const isRazorpayConfigured =
      razorpayKeyId &&
      razorpayKeySecret &&
      !razorpayKeyId.startsWith('your_') &&
      !razorpayKeySecret.startsWith('your_');

    if (!isRazorpayConfigured) {
      return NextResponse.json(
        {
          error: 'Payment gateway is not yet configured.',
          code: 'RAZORPAY_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Construct the Razorpay client only after we know the keys are valid.
    const razorpay = new Razorpay({
      key_id: razorpayKeyId as string,
      key_secret: razorpayKeySecret as string,
    });

    // ------------------------------------------------------------------
    // 1. Authenticate — extract the Supabase access token from the
    //    Authorization header so we can identify the user server-side.
    // ------------------------------------------------------------------
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '').trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized — no access token provided.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized — invalid or expired session.' },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------
    // 2. Parse and validate the request body
    // ------------------------------------------------------------------
    const body = await req.json();
    const { items, shippingDetails } = body as {
      items: ClientCartItem[];
      shippingDetails: ShippingDetails;
    };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty — cannot create an order.' },
        { status: 400 }
      );
    }

    const { name, email, phone, address } = shippingDetails ?? {};
    if (!name || !email || !phone || !address) {
      return NextResponse.json(
        { error: 'All shipping details (name, email, phone, address) are required.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // 3. Re-price every item from the DB — never trust the client price.
    // ------------------------------------------------------------------
    const productIds = items.map((i) => i.id);

    const { data: dbProducts, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, stock')
      .in('id', productIds);

    if (productError || !dbProducts) {
      console.error('Product fetch error:', productError);
      return NextResponse.json(
        { error: 'Failed to validate product details.' },
        { status: 500 }
      );
    }

    // Build a lookup map for O(1) access
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Validate every cart item and compute the authoritative total
    let totalAmountINR = 0;

    for (const cartItem of items) {
      const dbProduct = productMap.get(cartItem.id);

      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product with id "${cartItem.id}" not found.` },
          { status: 404 }
        );
      }

      if (dbProduct.stock < cartItem.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} left.` },
          { status: 409 }
        );
      }

      totalAmountINR += dbProduct.price * cartItem.quantity;
    }

    // ------------------------------------------------------------------
    // 4. Create a Razorpay order (amount in paise = INR × 100)
    // ------------------------------------------------------------------
    const amountInPaise = Math.round(totalAmountINR * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        customerName: name,
        customerEmail: email,
      },
    });

    if (!razorpayOrder?.id) {
      return NextResponse.json(
        { error: 'Failed to create payment order. Please try again.' },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // 5. Insert a pending order row in the `orders` table
    // ------------------------------------------------------------------
    const { error: dbError } = await supabaseAdmin.from('orders').insert([
      {
        razorpay_order_id: razorpayOrder.id,
        amount: totalAmountINR,
        status: 'pending',
        user_id: user.id,
      },
    ]);

    if (dbError) {
      console.error('Order DB insert error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save order. Please try again.' },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // 6. Return order details — the Razorpay payment modal is NOT
    //    launched from here. The frontend decides what to do next.
    // ------------------------------------------------------------------
    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmountINR,
      amountInPaise,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
    });
  } catch (error) {
    console.error('Checkout route error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
