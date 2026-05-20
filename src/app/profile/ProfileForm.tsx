'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProfileForm({ profile }: { profile: any }) {
  const [supabase] = useState(() => createClient());
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ phone, address })
      .eq('id', profile?.id);

    setIsSaving(false);

    if (error) {
      setMessage('Error updating profile');
    } else {
      setMessage('Profile updated successfully');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="space-y-6">
      <div className="bg-royal-blue/5 p-6 rounded-xl border border-royal-blue/10">
        <p className="text-sm text-royal-blue/70 mb-1">Name</p>
        <p className="font-semibold text-lg">{profile?.name || 'User'}</p>
        
        <p className="text-sm text-royal-blue/70 mt-4 mb-1">Email</p>
        <p className="font-semibold">{profile?.email || 'email@example.com'}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border border-royal-blue/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            placeholder="+91..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2 border border-royal-blue/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            rows={3}
            placeholder="Your full delivery address"
            required
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-gold hover:bg-gold/90 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Details'}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="w-full mt-4 bg-transparent border-2 border-royal-blue text-royal-blue hover:bg-royal-blue hover:text-white font-bold py-3 rounded-lg transition-colors"
      >
        Log Out
      </button>
    </div>
  );
}
