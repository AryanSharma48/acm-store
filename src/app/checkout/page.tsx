// src/app/checkout/page.tsx
// Premium Checkout Page
//
// Address is stored in DB as a newline-delimited string (5 lines):
//   line 0 — Flat / Building
//   line 1 — Street / Area
//   line 2 — City
//   line 3 — State
//   line 4 — PIN Code
//
// Flow:
//   Auth-gated → pre-fill from profiles → validate → POST /api/checkout
//   → Razorpay coming-soon modal (integration pending) OR success screen.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/contexts/CartContext';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle, ShoppingBag, User, MapPin, Phone, Mail,
  ChevronRight, Loader2, AlertCircle, Package, Hash,
  Building2, Navigation, Map, X, CreditCard, Clock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface AddressFields {
  building: string;
  street: string;
  city: string;
  state: string;
  pin: string;
}

interface FieldError {
  name?: string;
  email?: string;
  phone?: string;
  building?: string;
  street?: string;
  city?: string;
  state?: string;
  pin?: string;
}

interface OrderResult {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

const EMPTY_ADDR: AddressFields = { building: '', street: '', city: '', state: '', pin: '' };

// ─── Address helpers ──────────────────────────────────────────────────────────

/** Join 5 sub-fields into the newline-delimited string stored in DB. */
export function serializeAddress(a: AddressFields): string {
  return [a.building, a.street, a.city, a.state, a.pin].join('\n');
}

/**
 * Parse a stored address string back into sub-fields.
 * Legacy single-line addresses (saved before the split-field change) fall back
 * gracefully — the whole string goes into `building` so the user can see it.
 */
export function parseAddress(raw: string | null | undefined): AddressFields {
  if (!raw) return { ...EMPTY_ADDR };
  const parts = raw.split('\n');
  if (parts.length >= 5) {
    return {
      building: parts[0] ?? '',
      street:   parts[1] ?? '',
      city:     parts[2] ?? '',
      state:    parts[3] ?? '',
      pin:      parts[4] ?? '',
    };
  }
  return { ...EMPTY_ADDR, building: raw };
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

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

interface FormFieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function FormField({ id, label, icon, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-royal-blue/50"
      >
        {icon}{label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[10px] text-red-500">
          <AlertCircle size={10} />{error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError?: string) {
  return `w-full px-3 py-2.5 bg-canvas border text-sm text-royal-blue placeholder:text-royal-blue/25 outline-none transition-colors duration-200 focus:border-gold ${
    hasError ? 'border-red-400' : 'border-royal-blue/15'
  }`;
}

// ─── Razorpay Coming-Soon Modal ───────────────────────────────────────────────

function RazorpayComingSoonModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-royal-blue/40 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-canvas border border-royal-blue/10 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CornerBrackets />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-royal-blue/30 hover:text-royal-blue transition-colors"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.5} />
        </button>

        <div className="flex items-center justify-center w-12 h-12 rounded-full border border-gold/30 bg-royal-blue/5 mb-5 mx-auto">
          <CreditCard size={20} className="text-gold" strokeWidth={1.5} />
        </div>

        <h3 className="font-serif text-lg font-bold text-royal-blue tracking-widest uppercase text-center mb-2">
          Payment Coming Soon
        </h3>
        <p className="text-xs text-royal-blue/55 text-center leading-relaxed mb-5">
          Razorpay integration is not yet configured. Your order has been saved and
          we&apos;ll notify you once payments go live.
        </p>

        <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 px-4 py-1.5 mb-6">
          <Clock size={12} className="text-amber-500" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-600">
            Integration Pending
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-royal-blue text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300"
        >
          Got It
        </button>
      </div>
    </div>
  );
}

// ─── Order Success Screen ─────────────────────────────────────────────────────

function OrderSuccessScreen({
  order, total, onContinue,
}: {
  order: OrderResult; total: number; onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-20 text-center">
      <div className="w-20 h-20 rounded-full border border-gold/30 flex items-center justify-center animate-pulse mb-7">
        <div className="w-14 h-14 rounded-full bg-royal-blue/5 flex items-center justify-center">
          <CheckCircle size={34} className="text-gold" strokeWidth={1.5} />
        </div>
      </div>

      <div className="w-12 h-px bg-gold mb-7" />

      <h1 className="font-serif text-3xl font-bold text-royal-blue tracking-widest uppercase mb-3">
        Order Placed
      </h1>
      <p className="text-royal-blue/55 text-sm tracking-wide max-w-xs mb-10">
        Your order has been registered. Payment will be completed once Razorpay is live.
      </p>

      <div className="relative w-full max-w-sm bg-canvas border border-royal-blue/10 p-7 mb-10 text-left">
        <CornerBrackets />
        <p className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/35 mb-5">Order Details</p>
        <div className="space-y-3.5">
          <div className="flex justify-between items-start border-b border-royal-blue/10 pb-3.5">
            <span className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/50 shrink-0 mr-4">Order ID</span>
            <span className="font-mono text-xs text-royal-blue font-bold break-all text-right">{order.razorpayOrderId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-royal-blue/10 pb-3.5">
            <span className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/50">Status</span>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-1 border border-amber-200">Pending Payment</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/50">Total</span>
            <span className="font-serif text-xl font-bold text-royal-blue">₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onContinue}
          className="bg-royal-blue text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300"
        >
          Continue Shopping
        </button>
        <Link
          href="/profile"
          className="border border-royal-blue text-royal-blue px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-royal-blue hover:text-white transition-colors duration-300 flex items-center justify-center"
        >
          View Orders
        </Link>
      </div>
    </div>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  const [supabase] = useState(() => createClient());

  // Auth & profile
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Contact fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Address sub-fields
  const [addr, setAddr] = useState<AddressFields>({ ...EMPTY_ADDR });

  const setAddrField = (key: keyof AddressFields, value: string) => {
    setAddr((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((p) => ({ ...p, [key]: undefined }));
  };

  // UI state
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  // ── Bootstrap ──
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/'); return; }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single();

      if (profileData) {
        setProfile(profileData);
        setName(profileData.name ?? '');
        setEmail(profileData.email ?? session.user.email ?? '');
        setPhone(profileData.phone ?? '');
        setAddr(parseAddress(profileData.address));
      } else {
        setEmail(session.user.email ?? '');
        setName(session.user.user_metadata?.full_name ?? '');
      }
      setIsAuthLoading(false);
    };
    init();
  }, [supabase, router]);

  useEffect(() => {
    if (!isAuthLoading && items.length === 0 && !orderResult) router.push('/cart');
  }, [isAuthLoading, items, orderResult, router]);

  // ── Validation ──
  const validate = (): boolean => {
    const e: FieldError = {};
    if (!name.trim())  e.name  = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email address.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(phone))      e.phone = 'Invalid phone number.';
    if (!addr.building.trim()) e.building = 'Flat / building is required.';
    if (!addr.street.trim())   e.street   = 'Street / area is required.';
    if (!addr.city.trim())     e.city     = 'City is required.';
    if (!addr.state.trim())    e.state    = 'State is required.';
    if (!addr.pin.trim())      e.pin      = 'PIN code is required.';
    else if (!/^\d{6}$/.test(addr.pin.trim())) e.pin = 'Enter a valid 6-digit PIN.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setApiError('Session expired — please refresh and try again.');
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: items.map(({ id, quantity }) => ({ id, quantity })),
          shippingDetails: { name, email, phone, address: serializeAddress(addr) },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'RAZORPAY_NOT_CONFIGURED') {
          setShowRazorpayModal(true);
          return;
        }
        setApiError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setOrderResult(data);
      clearCart();
    } catch {
      setApiError('Network error — please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ──
  if (isAuthLoading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-24 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-gold animate-spin" strokeWidth={1.5} />
          <p className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/40 animate-pulse">
            Preparing Checkout…
          </p>
        </div>
      </main>
    );
  }

  // ── Success ──
  if (orderResult) {
    return (
      <main>
        <OrderSuccessScreen order={orderResult} total={orderResult.amount} onContinue={() => router.push('/')} />
      </main>
    );
  }

  // ── Main layout ──
  return (
    <>
      {showRazorpayModal && <RazorpayComingSoonModal onClose={() => setShowRazorpayModal(false)} />}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-20">

        {/* Header */}
        <div className="flex flex-col items-center mb-10 md:mb-14">
          <div className="w-12 h-px bg-gold mb-7" />
          <h1 className="font-serif text-2xl md:text-4xl font-bold text-royal-blue tracking-widest uppercase text-center">
            Checkout
          </h1>
          <nav className="flex items-center gap-2 mt-4 text-[10px] tracking-widest uppercase text-royal-blue/40">
            <Link href="/" className="hover:text-gold transition-colors">Store</Link>
            <ChevronRight size={10} />
            <Link href="/cart" className="hover:text-gold transition-colors">Cart</Link>
            <ChevronRight size={10} />
            <span className="text-royal-blue/70 font-bold">Checkout</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 xl:gap-14 items-start">

          {/* ── Left: Form ── */}
          <form onSubmit={handleCheckout} noValidate id="checkout-form" className="flex flex-col gap-5">

            {/* Contact */}
            <section className="relative bg-canvas border border-royal-blue/10 p-5 sm:p-7">
              <CornerBrackets />
              <div className="flex items-center gap-2 mb-5">
                <User size={14} className="text-gold" strokeWidth={1.5} />
                <h2 className="font-serif text-base font-bold text-royal-blue tracking-widest uppercase">
                  Contact Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="co-name" label="Full Name" icon={<User size={10} />} error={fieldErrors.name} className="sm:col-span-2">
                  <input id="co-name" type="text" value={name} autoComplete="name"
                    placeholder="Your full name" className={inputCls(fieldErrors.name)}
                    onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }} />
                </FormField>

                <FormField id="co-email" label="Email" icon={<Mail size={10} />} error={fieldErrors.email}>
                  <input id="co-email" type="email" value={email} autoComplete="email"
                    placeholder="you@example.com" className={inputCls(fieldErrors.email)}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }} />
                </FormField>

                <FormField id="co-phone" label="Phone" icon={<Phone size={10} />} error={fieldErrors.phone}>
                  <input id="co-phone" type="tel" value={phone} autoComplete="tel"
                    placeholder="+91 98765 43210" className={inputCls(fieldErrors.phone)}
                    onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: undefined })); }} />
                </FormField>
              </div>

              {(profile?.name || profile?.phone) && (
                <p className="mt-4 text-[10px] text-royal-blue/35 tracking-wide">
                  <span className="text-gold mr-1">✦</span>Pre-filled from your profile — edit freely.
                </p>
              )}
            </section>

            {/* Delivery Address */}
            <section className="relative bg-canvas border border-royal-blue/10 p-5 sm:p-7">
              <CornerBrackets />
              <div className="flex items-center gap-2 mb-5">
                <MapPin size={14} className="text-gold" strokeWidth={1.5} />
                <h2 className="font-serif text-base font-bold text-royal-blue tracking-widest uppercase">
                  Delivery Address
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="co-building" label="Flat / Building" icon={<Building2 size={10} />} error={fieldErrors.building} className="sm:col-span-2">
                  <input id="co-building" type="text" value={addr.building} autoComplete="address-line1"
                    placeholder="Flat no., apartment or building name" className={inputCls(fieldErrors.building)}
                    onChange={(e) => setAddrField('building', e.target.value)} />
                </FormField>

                <FormField id="co-street" label="Street / Area" icon={<Navigation size={10} />} error={fieldErrors.street} className="sm:col-span-2">
                  <input id="co-street" type="text" value={addr.street} autoComplete="address-line2"
                    placeholder="Street name, locality or area" className={inputCls(fieldErrors.street)}
                    onChange={(e) => setAddrField('street', e.target.value)} />
                </FormField>

                <FormField id="co-city" label="City" icon={<Map size={10} />} error={fieldErrors.city}>
                  <input id="co-city" type="text" value={addr.city} autoComplete="address-level2"
                    placeholder="e.g. Jaipur" className={inputCls(fieldErrors.city)}
                    onChange={(e) => setAddrField('city', e.target.value)} />
                </FormField>

                <FormField id="co-state" label="State" icon={<MapPin size={10} />} error={fieldErrors.state}>
                  <input id="co-state" type="text" value={addr.state} autoComplete="address-level1"
                    placeholder="e.g. Rajasthan" className={inputCls(fieldErrors.state)}
                    onChange={(e) => setAddrField('state', e.target.value)} />
                </FormField>

                <FormField id="co-pin" label="PIN Code" icon={<Hash size={10} />} error={fieldErrors.pin}>
                  <input id="co-pin" type="text" inputMode="numeric" maxLength={6}
                    value={addr.pin} autoComplete="postal-code"
                    placeholder="6-digit PIN" className={inputCls(fieldErrors.pin)}
                    onChange={(e) => setAddrField('pin', e.target.value.replace(/\D/g, ''))} />
                </FormField>
              </div>

              {profile?.address && (
                <p className="mt-4 text-[10px] text-royal-blue/35 tracking-wide">
                  <span className="text-gold mr-1">✦</span>Pre-filled from your profile — edit freely.
                </p>
              )}
            </section>

            {/* API error */}
            {apiError && (
              <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Mobile CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="lg:hidden w-full bg-royal-blue text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" />Processing…</>
                : <><Package size={14} strokeWidth={1.5} />Confirm &amp; Place Order</>}
            </button>
          </form>

          {/* ── Right: Order Summary ── */}
          <aside className="lg:sticky lg:top-24">
            <div className="relative bg-canvas border border-royal-blue/10 p-5 sm:p-7">
              <CornerBrackets />

              <div className="flex items-center gap-2 mb-6">
                <ShoppingBag size={14} className="text-gold" strokeWidth={1.5} />
                <h2 className="font-serif text-base font-bold text-royal-blue tracking-widest uppercase">
                  Order Summary
                </h2>
              </div>

              {/* Items */}
              <div className="flex flex-col divide-y divide-royal-blue/10">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3.5">
                    <div className="relative w-12 h-12 shrink-0 overflow-hidden border border-royal-blue/10">
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-royal-blue truncate">{item.name}</p>
                      <p className="text-[11px] text-royal-blue/45 mt-0.5">
                        ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-royal-blue shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-royal-blue/10 mt-1 pt-5 space-y-2.5">
                <div className="flex justify-between text-xs text-royal-blue/55">
                  <span>Subtotal</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-royal-blue/55">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>
                <div className="flex justify-between items-baseline border-t border-royal-blue/10 pt-3 mt-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/50">Total</span>
                  <span className="font-serif text-xl font-bold text-royal-blue">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Desktop CTA */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                onClick={handleCheckout}
                className="hidden lg:flex mt-6 w-full bg-royal-blue text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
              >
                {isSubmitting
                  ? <><Loader2 size={14} className="animate-spin" />Processing…</>
                  : <><Package size={14} strokeWidth={1.5} />Confirm &amp; Place Order</>}
              </button>

              <p className="mt-4 text-center text-[10px] text-royal-blue/25 tracking-wide">
                Your information is encrypted and stored securely.
              </p>
            </div>
          </aside>

        </div>
      </main>
    </>
  );
}
