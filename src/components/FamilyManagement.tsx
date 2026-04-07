import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, collection, addDoc, Timestamp } from '../firebase';
import { Mail, UserPlus, CheckCircle2, Clock } from 'lucide-react';

export default function FamilyManagement() {
  const { familyData, user } = useFirebase();
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyData || !user) return;

    setIsInviting(true);
    try {
      await addDoc(collection(db, 'invitations'), {
        familyId: familyData.id,
        email: email.toLowerCase(),
        role: 'member',
        invitedBy: user.uid,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      setEmail('');
      setMessage('Invitation sent successfully.');
    } catch (error) {
      console.error('Error sending invitation:', error);
      setMessage('Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
        <h3 className="text-2xl font-serif text-stone-900 mb-4">Invite Family Members</h3>
        <p className="text-stone-500 font-light mb-6">
          Collaborate with your siblings, spouse, or other relatives. They will have access to the document vault and task list.
        </p>
        
        <form onSubmit={handleInvite} className="flex gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="family@example.com"
              required
              className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:ring-2 focus:ring-stone-200 transition-all font-light"
            />
          </div>
          <button 
            type="submit"
            disabled={isInviting}
            className="px-8 py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <UserPlus size={20} />
            {isInviting ? 'Sending...' : 'Invite'}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-stone-600">{message}</p>}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
        <h3 className="text-xl font-serif text-stone-900 mb-6">Family Members</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-200" />
              <div>
                <p className="font-medium text-stone-900">You (Owner)</p>
                <p className="text-xs text-stone-400">{user?.email}</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest bg-stone-900 text-stone-50 px-2 py-1 rounded-full font-medium">Admin</span>
          </div>
          {/* This would be populated by a real query in a production app */}
          <div className="flex items-center justify-between p-4 border border-stone-100 rounded-2xl opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <Clock size={20} />
              </div>
              <div>
                <p className="font-medium text-stone-900">Pending Invitation</p>
                <p className="text-xs text-stone-400">Example family member</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest bg-stone-100 text-stone-400 px-2 py-1 rounded-full font-medium">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
