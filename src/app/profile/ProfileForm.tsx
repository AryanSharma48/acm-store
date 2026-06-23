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
  const [name, setName] = useState<string>(profile?.name ?? '');
  const [phone, setPhone] = useState<string>(profile?.phone ?? '');
  const [chapter, setChapter] = useState<string>(profile?.chapter ?? 'SCHAP');
  const [position, setPosition] = useState<string>(profile?.position ?? 'Chairperson');
  const [committee, setCommittee] = useState<string>(profile?.committee ?? 'Events');

  // UI state
  const [isSaving,  setIsSaving]  = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Field-level errors
  const [nameErr, setNameErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');

  const validate = () => {
    let ok = true;
    if (!name.trim()) { setNameErr('Name is required.'); ok = false; }
    else setNameErr('');

    if (!phone.trim()) { setPhoneErr('Phone number is required.'); ok = false; }
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(phone)) { setPhoneErr('Invalid phone number.'); ok = false; }
    else setPhoneErr('');

    return ok;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setSaveStatus('idle');

    const { error } = await supabase
      .from('profiles')
      .update({ name, phone, chapter, position, committee: position === 'Team Head' ? committee : null })
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
            <Mail size={10} className="text-royal-blue/40" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-royal-blue/40">Email</span>
          </div>
          <p className="text-sm text-royal-blue/70">{profile?.email || '—'}</p>
        </div>
      </div>

      {/* ── Editable form ── */}
      <form onSubmit={handleSave} noValidate className="space-y-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name */}
          <div className="sm:col-span-2">
            <Label htmlFor="pf-name">
              <span className="inline-flex items-center gap-1"><User size={9} />Full Name</span>
            </Label>
            <input
              id="pf-name" type="text" value={name} autoComplete="name"
              placeholder="Your full name"
              className={inputCls(nameErr)}
              onChange={(e) => { setName(e.target.value); setNameErr(''); }}
            />
            <FieldError msg={nameErr} />
          </div>

          {/* Chapter */}
          <div>
            <Label htmlFor="pf-chapter">
              <span className="inline-flex items-center gap-1"><Building2 size={9} />Chapter</span>
            </Label>
            <select id="pf-chapter" value={chapter} className={inputCls()} onChange={(e) => setChapter(e.target.value)}>
              <option value="SCHAP">Student Chapter (SCHAP)</option>
              <option value="SIGAI">SIGAI</option>
              <option value="SIGBED">SIGBED</option>
            </select>
          </div>

          {/* Position */}
          <div>
            <Label htmlFor="pf-position">
              <span className="inline-flex items-center gap-1"><User size={9} />Position</span>
            </Label>
            <select id="pf-position" value={position} className={inputCls()} onChange={(e) => setPosition(e.target.value)}>
              <option value="Technical Head">Technical Head</option>
              <option value="Deputy Secretary">Deputy Secretary</option>
              <option value="Membership Chair">Membership Chair</option>
              <option value="Head of Operations">Head of Operations</option>
              <option value="Team Head">Team Head</option>
              <option value="Chairperson">Chairperson</option>
              <option value="Vice Chairperson">Vice Chairperson</option>
              <option value="Technical Secretary">Technical Secretary</option>
              <option value="Human Resource Director">Human Resource Director</option>
              <option value="Treasurer">Treasurer</option>
              <option value="Creative Director">Creative Director</option>
              <option value="Secretary">Secretary</option>
            </select>
          </div>

          {/* Committee */}
          {position === 'Team Head' && (
            <div className="sm:col-span-2">
              <Label htmlFor="pf-committee">
                <span className="inline-flex items-center gap-1"><User size={9} />Committee</span>
              </Label>
              <select id="pf-committee" value={committee} className={inputCls()} onChange={(e) => setCommittee(e.target.value)}>
                <option value="Events">Events</option>
                <option value="Marketing">Marketing</option>
                <option value="Logistics">Logistics</option>
                <option value="Sponsorship & Curations">Sponsorship & Curations</option>
                <option value="Finance & Registration">Finance & Registration</option>
                <option value="Project & Research">Project & Research</option>
                <option value="Web Development">Web Development</option>
                <option value="Social Media">Social Media</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Editorial">Editorial</option>
              </select>
            </div>
          )}

          {/* Phone */}
          <div className={position !== 'Team Head' ? 'sm:col-span-2' : 'sm:col-span-2'}>
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
