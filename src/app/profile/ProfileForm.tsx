'use client';

// src/app/profile/ProfileForm.tsx
// Editable profile form with split delivery address sub-fields.
//
// Address is stored in `profiles.address` as a newline-delimited string
// (same format as the checkout page):
//   line 0 — Flat / Building
//   line 1 — Street / Area
//   line 2 — City
//   line 3 — State
//   line 4 — PIN Code

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseAddress, serializeAddress } from '@/app/checkout/page';
import {
  User, Mail, Phone, MapPin, Building2, Navigation,
  Map, Hash, Loader2, CheckCircle, AlertCircle, LogOut,
} from 'lucide-react';

// ─── Shared input / label primitives ─────────────────────────────────────────

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10px] font-bold tracking-widest uppercase text-royal-blue/50 mb-1"
    >
      {children}
    </label>
  );
}

function inputCls(err?: string) {
  return `w-full px-3 py-2.5 bg-canvas border text-sm text-royal-blue placeholder:text-royal-blue/25 outline-none transition-colors duration-200 focus:border-gold ${
    err ? 'border-red-400' : 'border-royal-blue/15'
  }`;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5">
      <AlertCircle size={10} />{msg}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileForm({ profile }: { profile: any }) {
  const [supabase] = useState(() => createClient());

  // Editable fields
  const [phone,    setPhone]    = useState<string>(profile?.phone    ?? '');
  const [addr, setAddr] = useState(() => parseAddress(profile?.address));

  // UI state
  const [isSaving,  setIsSaving]  = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Field-level errors
  const [phoneErr, setPhoneErr]       = useState('');
  const [buildingErr, setBuildingErr] = useState('');
  const [streetErr,   setStreetErr]   = useState('');
  const [cityErr,     setCityErr]     = useState('');
  const [stateErr,    setStateErr]    = useState('');
  const [pinErr,      setPinErr]      = useState('');

  const setAddrField = (key: keyof typeof addr, value: string) => {
    setAddr((prev) => ({ ...prev, [key]: value }));
    // Clear that field's error on change
    if (key === 'building') setBuildingErr('');
    if (key === 'street')   setStreetErr('');
    if (key === 'city')     setCityErr('');
    if (key === 'state')    setStateErr('');
    if (key === 'pin')      setPinErr('');
  };

  const validate = () => {
    let ok = true;
    if (!phone.trim()) { setPhoneErr('Phone number is required.'); ok = false; }
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(phone)) { setPhoneErr('Invalid phone number.'); ok = false; }
    else setPhoneErr('');

    if (!addr.building.trim()) { setBuildingErr('Required.'); ok = false; } else setBuildingErr('');
    if (!addr.street.trim())   { setStreetErr('Required.');   ok = false; } else setStreetErr('');
    if (!addr.city.trim())     { setCityErr('Required.');     ok = false; } else setCityErr('');
    if (!addr.state.trim())    { setStateErr('Required.');    ok = false; } else setStateErr('');
    if (!addr.pin.trim())      { setPinErr('Required.');      ok = false; }
    else if (!/^\d{6}$/.test(addr.pin.trim())) { setPinErr('Enter a valid 6-digit PIN.'); ok = false; }
    else setPinErr('');

    return ok;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setSaveStatus('idle');

    const { error } = await supabase
      .from('profiles')
      .update({ phone, address: serializeAddress(addr) })
      .eq('id', profile?.id);

    setIsSaving(false);
    setSaveStatus(error ? 'error' : 'success');

    if (!error) {
      // Auto-clear success banner after 3 s
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="space-y-6">

      {/* ── Read-only identity block ── */}
      <div className="relative bg-royal-blue/[0.03] border border-royal-blue/8 p-5 space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <User size={10} className="text-royal-blue/40" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/40">Name</span>
          </div>
          <p className="text-sm font-semibold text-royal-blue">{profile?.name || '—'}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Mail size={10} className="text-royal-blue/40" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/40">Email</span>
          </div>
          <p className="text-sm text-royal-blue/70">{profile?.email || '—'}</p>
        </div>
      </div>

      {/* ── Editable form ── */}
      <form onSubmit={handleSave} noValidate className="space-y-5">

        {/* Phone */}
        <div>
          <Label htmlFor="pf-phone">
            <span className="inline-flex items-center gap-1"><Phone size={9} />Phone Number</span>
          </Label>
          <input
            id="pf-phone" type="tel" value={phone} autoComplete="tel"
            placeholder="+91 98765 43210"
            className={inputCls(phoneErr)}
            onChange={(e) => { setPhone(e.target.value); setPhoneErr(''); }}
          />
          <FieldError msg={phoneErr} />
        </div>

        {/* Delivery Address — header */}
        <div>
          <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-royal-blue/8">
            <MapPin size={12} className="text-gold" strokeWidth={1.5} />
            <span className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/50">
              Delivery Address
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Flat / Building — full width */}
            <div className="sm:col-span-2">
              <Label htmlFor="pf-building">
                <span className="inline-flex items-center gap-1"><Building2 size={9} />Flat / Building</span>
              </Label>
              <input
                id="pf-building" type="text" value={addr.building} autoComplete="address-line1"
                placeholder="Flat no., apartment or building name"
                className={inputCls(buildingErr)}
                onChange={(e) => setAddrField('building', e.target.value)}
              />
              <FieldError msg={buildingErr} />
            </div>

            {/* Street / Area — full width */}
            <div className="sm:col-span-2">
              <Label htmlFor="pf-street">
                <span className="inline-flex items-center gap-1"><Navigation size={9} />Street / Area</span>
              </Label>
              <input
                id="pf-street" type="text" value={addr.street} autoComplete="address-line2"
                placeholder="Street name, locality or area"
                className={inputCls(streetErr)}
                onChange={(e) => setAddrField('street', e.target.value)}
              />
              <FieldError msg={streetErr} />
            </div>

            {/* City */}
            <div>
              <Label htmlFor="pf-city">
                <span className="inline-flex items-center gap-1"><Map size={9} />City</span>
              </Label>
              <input
                id="pf-city" type="text" value={addr.city} autoComplete="address-level2"
                placeholder="e.g. Jaipur"
                className={inputCls(cityErr)}
                onChange={(e) => setAddrField('city', e.target.value)}
              />
              <FieldError msg={cityErr} />
            </div>

            {/* State */}
            <div>
              <Label htmlFor="pf-state">
                <span className="inline-flex items-center gap-1"><MapPin size={9} />State</span>
              </Label>
              <input
                id="pf-state" type="text" value={addr.state} autoComplete="address-level1"
                placeholder="e.g. Rajasthan"
                className={inputCls(stateErr)}
                onChange={(e) => setAddrField('state', e.target.value)}
              />
              <FieldError msg={stateErr} />
            </div>

            {/* PIN Code */}
            <div>
              <Label htmlFor="pf-pin">
                <span className="inline-flex items-center gap-1"><Hash size={9} />PIN Code</span>
              </Label>
              <input
                id="pf-pin" type="text" inputMode="numeric" maxLength={6}
                value={addr.pin} autoComplete="postal-code"
                placeholder="6-digit PIN"
                className={inputCls(pinErr)}
                onChange={(e) => setAddrField('pin', e.target.value.replace(/\D/g, ''))}
              />
              <FieldError msg={pinErr} />
            </div>

          </div>
        </div>

        {/* Save feedback */}
        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 px-4 py-2.5">
            <CheckCircle size={13} />Profile saved successfully.
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-4 py-2.5">
            <AlertCircle size={13} />Failed to save. Please try again.
          </div>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-royal-blue text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-royal-blue transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving
            ? <><Loader2 size={13} className="animate-spin" />Saving…</>
            : 'Save Details'}
        </button>
      </form>

      {/* Log out */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full border border-royal-blue/30 text-royal-blue/60 py-3 text-xs font-bold uppercase tracking-widest hover:border-royal-blue hover:text-royal-blue transition-colors duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoggingOut
          ? <><Loader2 size={13} className="animate-spin" />Signing out…</>
          : <><LogOut size={13} strokeWidth={1.5} />Sign Out</>}
      </button>
    </div>
  );
}
