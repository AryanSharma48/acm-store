// src/app/checkout/page.tsx
// Premium Checkout Page
//
// Flow:
//  1. Auth-gated — redirects to / if user is not logged in.
//  2. Pre-populates shipping form from `public.profiles` (name, email, phone, address).
//  3. Displays a full order summary of items in the cart.
//  4. On submit: validates fields → calls POST /api/checkout → shows a
//     premium "Order Confirmed" success screen with the Razorpay Order ID.
//  5. The Razorpay payment modal is deliberately NOT launched (mockup stop-point).

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/contexts/CartContext';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, ShoppingBag, User, MapPin, Phone, Mail, ChevronRight, Loader2, AlertCircle, Package } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface FieldError {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface OrderResult {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

// ---------------------------------------------------------------------------
// Small decorative corner-bracket component that matches the brand style
// ---------------------------------------------------------------------------
function CornerBrackets() {
  return (
    <>
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold -translate-x-px -translate-y-px pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold translate-x-px -translate-y-px pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold -translate-x-px translate-y-px pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold translate-x-px translate-y-px pointer-events-none" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Labelled form field — shared between every input in the shipping form
// ---------------------------------------------------------------------------
interface FormFieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

function FormField({ id, label, icon, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-royal-blue/60"
      >
        {icon}
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success Screen shown after the order is registered (Razorpay NOT launched)
// ---------------------------------------------------------------------------
function OrderSuccessScreen({
  order,
  total,
  onContinue,
}: {
  order: OrderResult;
  total: number;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-24 text-center">
      {/* Animated check icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border border-gold/30 flex items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-royal-blue/5 flex items-center justify-center">
            <CheckCircle size={40} className="text-gold" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="w-16 h-px bg-gold mb-8" />

      <h1 className="font-serif text-3xl md:text-4xl font-bold text-royal-blue tracking-widest uppercase mb-4">
        Order Placed
      </h1>

      <p className="text-royal-blue/60 text-sm tracking-wide max-w-sm mb-12">
        Your order has been registered. When payment is connected, you will be redirected to complete the transaction.
      </p>

      {/* Order details card */}
      <div className="relative w-full max-w-md bg-canvas border border-royal-blue/10 p-8 mb-12 text-left">
        <CornerBrackets />

        <p className="text-xs font-bold tracking-widest uppercase text-royal-blue/40 mb-6">
          Order Details
        </p>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-royal-blue/10 pb-4">
            <span className="text-xs font-bold tracking-widest uppercase text-royal-blue/60">
              Order ID
            </span>
            <span className="font-mono text-xs text-royal-blue font-bold break-all text-right ml-4">
              {order.razorpayOrderId}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-royal-blue/10 pb-4">
            <span className="text-xs font-bold tracking-widest uppercase text-royal-blue/60">
              Status
            </span>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 border border-amber-200">
              Pending Payment
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold tracking-widest uppercase text-royal-blue/60">
              Total Amount
            </span>
            <span className="font-serif text-2xl font-bold text-royal-blue">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onContinue}
          className="bg-royal-blue text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300"
        >
          Continue Shopping
        </button>
        <Link
          href="/profile"
          className="border border-royal-blue text-royal-blue px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-royal-blue hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
        >
          View Orders
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Checkout Page
// ---------------------------------------------------------------------------
export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  const [supabase] = useState(() => createClient());

  // Auth & profile state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Shipping form state — pre-filled once profile loads
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // UI state
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  // ------------------------------------------------------------------
  // Fetch authenticated user and their profile
  // ------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // Not logged in — send back to homepage
        router.push('/');
        return;
      }

      setUser(session.user);

      // Fetch profile to pre-fill the form
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setName(profileData.name ?? '');
        setEmail(profileData.email ?? session.user.email ?? '');
        setPhone(profileData.phone ?? '');
        setAddress(profileData.address ?? '');
      } else {
        // Fallback to auth metadata
        setEmail(session.user.email ?? '');
        setName(session.user.user_metadata?.full_name ?? '');
      }

      setIsAuthLoading(false);
    };

    init();
  }, [supabase, router]);

  // Redirect if cart is empty (and auth has resolved)
  useEffect(() => {
    if (!isAuthLoading && items.length === 0 && !orderResult) {
      router.push('/cart');
    }
  }, [isAuthLoading, items, orderResult, router]);

  // ------------------------------------------------------------------
  // Validation
  // ------------------------------------------------------------------
  const validate = (): boolean => {
    const errors: FieldError = {};

    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!/^\+?[\d\s\-()]{7,15}$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number.';
    }

    if (!address.trim()) {
      errors.address = 'Delivery address is required.';
    } else if (address.trim().length < 10) {
      errors.address = 'Please enter a complete delivery address.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ------------------------------------------------------------------
  // Submit handler — calls the secure checkout API
  // ------------------------------------------------------------------
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Get the current session token to pass as Authorization header
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setApiError('Session expired — please refresh and try again.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        items: items.map(({ id, quantity }) => ({ id, quantity })),
        shippingDetails: { name, email, phone, address },
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? 'Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Success — store order result and clear the cart
      setOrderResult(data);
      clearCart();
    } catch {
      setApiError('Network error — please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------------
  // Loading skeleton while auth is resolving
  // ------------------------------------------------------------------
  if (isAuthLoading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-24 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="text-gold animate-spin" strokeWidth={1.5} />
          <p className="text-xs font-bold tracking-widest uppercase text-royal-blue/40 animate-pulse">
            Preparing Checkout…
          </p>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------------
  // Success screen (shown after the API call succeeds)
  // ------------------------------------------------------------------
  if (orderResult) {
    return (
      <main>
        <OrderSuccessScreen
          order={orderResult}
          total={orderResult.amount}
          onContinue={() => router.push('/')}
        />
      </main>
    );
  }

  // ------------------------------------------------------------------
  // Main checkout layout
  // ------------------------------------------------------------------
  return (
    <main className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      {/* Page header */}
      <div className="flex flex-col items-center mb-14">
        <div className="w-16 h-px bg-gold mb-10" />
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-royal-blue tracking-widest uppercase text-center">
          Checkout
        </h1>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mt-6 text-xs tracking-widest uppercase text-royal-blue/40">
          <Link href="/" className="hover:text-gold transition-colors duration-200">
            Store
          </Link>
          <ChevronRight size={12} />
          <Link href="/cart" className="hover:text-gold transition-colors duration-200">
            Cart
          </Link>
          <ChevronRight size={12} />
          <span className="text-royal-blue/70 font-bold">Checkout</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 xl:gap-16 items-start">
        {/* ============================================================
            Left column — Shipping details form
        ============================================================ */}
        <form onSubmit={handleCheckout} noValidate className="flex flex-col gap-8">
          {/* Shipping details panel */}
          <section className="relative bg-canvas border border-royal-blue/10 p-8 md:p-10">
            <CornerBrackets />

            <div className="flex items-center gap-3 mb-8">
              <MapPin size={16} className="text-gold" strokeWidth={1.5} />
              <h2 className="font-serif text-lg font-bold text-royal-blue tracking-widest uppercase">
                Shipping Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <FormField
                  id="checkout-name"
                  label="Full Name"
                  icon={<User size={11} />}
                  error={fieldErrors.name}
                >
                  <input
                    id="checkout-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                    }}
                    placeholder="Your full name"
                    className={`w-full px-4 py-3 bg-canvas border text-sm text-royal-blue placeholder:text-royal-blue/30 outline-none transition-colors duration-200 focus:border-gold ${
                      fieldErrors.name ? 'border-red-400' : 'border-royal-blue/20'
                    }`}
                    autoComplete="name"
                  />
                </FormField>
              </div>

              {/* Email */}
              <FormField
                id="checkout-email"
                label="Email Address"
                icon={<Mail size={11} />}
                error={fieldErrors.email}
              >
                <input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 bg-canvas border text-sm text-royal-blue placeholder:text-royal-blue/30 outline-none transition-colors duration-200 focus:border-gold ${
                    fieldErrors.email ? 'border-red-400' : 'border-royal-blue/20'
                  }`}
                  autoComplete="email"
                />
              </FormField>

              {/* Phone */}
              <FormField
                id="checkout-phone"
                label="Phone Number"
                icon={<Phone size={11} />}
                error={fieldErrors.phone}
              >
                <input
                  id="checkout-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  placeholder="+91 98765 43210"
                  className={`w-full px-4 py-3 bg-canvas border text-sm text-royal-blue placeholder:text-royal-blue/30 outline-none transition-colors duration-200 focus:border-gold ${
                    fieldErrors.phone ? 'border-red-400' : 'border-royal-blue/20'
                  }`}
                  autoComplete="tel"
                />
              </FormField>

              {/* Delivery Address */}
              <div className="sm:col-span-2">
                <FormField
                  id="checkout-address"
                  label="Delivery Address"
                  icon={<MapPin size={11} />}
                  error={fieldErrors.address}
                >
                  <textarea
                    id="checkout-address"
                    rows={3}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (fieldErrors.address) setFieldErrors((p) => ({ ...p, address: undefined }));
                    }}
                    placeholder="Building, Street, City, State, PIN"
                    className={`w-full px-4 py-3 bg-canvas border text-sm text-royal-blue placeholder:text-royal-blue/30 outline-none transition-colors duration-200 focus:border-gold resize-none ${
                      fieldErrors.address ? 'border-red-400' : 'border-royal-blue/20'
                    }`}
                    autoComplete="street-address"
                  />
                </FormField>
              </div>
            </div>

            {/* Profile pre-fill notice */}
            {(profile?.name || profile?.phone || profile?.address) && (
              <p className="mt-6 text-xs text-royal-blue/40 tracking-wide">
                <span className="text-gold mr-1">✦</span>
                Pre-filled from your saved profile — edit freely before confirming.
              </p>
            )}
          </section>

          {/* API-level error message */}
          {apiError && (
            <div className="flex items-start gap-3 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Submit button — visible only on mobile below the form,
              on desktop it lives inside the order summary card */}
          <button
            type="submit"
            id="checkout-submit"
            disabled={isSubmitting}
            className="lg:hidden w-full bg-royal-blue text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing Order…
              </>
            ) : (
              <>
                <Package size={16} strokeWidth={1.5} />
                Confirm &amp; Place Order
              </>
            )}
          </button>
        </form>

        {/* ============================================================
            Right column — Order Summary (sticky on desktop)
        ============================================================ */}
        <aside className="lg:sticky lg:top-28">
          <div className="relative bg-canvas border border-royal-blue/10 p-8">
            <CornerBrackets />

            {/* Panel header */}
            <div className="flex items-center gap-3 mb-8">
              <ShoppingBag size={16} className="text-gold" strokeWidth={1.5} />
              <h2 className="font-serif text-lg font-bold text-royal-blue tracking-widest uppercase">
                Order Summary
              </h2>
            </div>

            {/* Item list */}
            <div className="flex flex-col divide-y divide-royal-blue/10">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-5">
                  {/* Product image */}
                  <div className="relative w-14 h-14 shrink-0 overflow-hidden border border-royal-blue/10">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>

                  {/* Name & price */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-royal-blue truncate">{item.name}</p>
                    <p className="text-xs text-royal-blue/50 mt-0.5">
                      ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                    </p>
                  </div>

                  {/* Line total */}
                  <p className="text-sm font-bold text-royal-blue shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-royal-blue/10 mt-2 pt-6 space-y-3">
              <div className="flex justify-between text-sm text-royal-blue/60">
                <span className="font-medium">Subtotal</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-royal-blue/60">
                <span className="font-medium">Shipping</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-royal-blue/10 pt-4 mt-4">
                <span className="text-xs font-bold tracking-widest uppercase text-royal-blue/60">
                  Total
                </span>
                <span className="font-serif text-2xl font-bold text-royal-blue">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* CTA — desktop only (mobile button lives in the form above) */}
            <button
              type="submit"
              form="checkout-submit"
              disabled={isSubmitting}
              onClick={handleCheckout}
              className="hidden lg:flex mt-8 w-full bg-royal-blue text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing Order…
                </>
              ) : (
                <>
                  <Package size={16} strokeWidth={1.5} />
                  Confirm &amp; Place Order
                </>
              )}
            </button>

            {/* Security note */}
            <p className="mt-5 text-center text-[11px] text-royal-blue/30 tracking-wide leading-relaxed">
              Your information is encrypted and stored securely.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
