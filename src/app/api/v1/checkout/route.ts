// src/app/api/v1/checkout/route.ts
import { NextResponse } from 'next/server';
import { createOrder } from './services/checkoutService';

export async function POST(request: Request) {
  try {
    const { amount, productId } = await request.json();
    if (!amount || !productId) {
      return NextResponse.json({ error: 'amount and productId required' }, { status: 400 });
    }
    const order = await createOrder(Number(amount), productId);
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err: any) {
    console.error('Checkout route error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
