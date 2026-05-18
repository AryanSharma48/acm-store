// src/app/api/v1/checkout/services/checkoutService.ts
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';

// Supabase admin client using service_role key
const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey || config.supabaseAnonKey
);

const razorpay = new Razorpay({
  key_id: config.razorpayKeyId,
  key_secret: config.razorpayKeySecret,
});

export const createOrder = async (amount: number, productId: string) => {
  const amountInPaisa = Math.round(amount * 100);
  const options = {
    amount: amountInPaisa,
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };
  const order = await razorpay.orders.create(options);
  // insert order record referencing product
  const { error } = await supabaseAdmin.from('orders').insert([
    {
      razorpay_order_id: order.id,
      amount,
      status: 'pending',
      product_id: productId,
    },
  ]);
  if (error) throw error;
  return order;
};
