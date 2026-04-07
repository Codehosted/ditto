import React, { useState, useMemo } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db, collection, addDoc, Timestamp, updateDoc, doc } from '../firebase';
import { 
  Users, 
  UserPlus, 
  Mail, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Bell, 
  MessageSquare,
  ArrowRight,
  Shield,
  Zap,
  Heart
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export default function FamilySync() {
  const { familyData, user, tasks, profile } = useFirebase();
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState('');

  // Mock family members for the visualization (in a real app, these would come from a 'members' collection)
  const familyMembers = useMemo(() => [
    { uid: user?.uid, name: 'You', role: 'Admin', color: '#1c1917' },
    { uid: 'member1', name: 'Sarah (Sister)', role: 'Member', color: '#44403c' },
    { uid: 'member2', name: 'David (Brother)', role: 'Member', color: '#78716c' },
  ], [user]);

  // Calculate burden distribution
  const burdenData = useMemo(() => {
    const counts: Record<string, number> = {
      'You': tasks.filter(t => t.assignedTo === user?.uid || !t.assignedTo).length,
      'Sarah (Sister)': 2, // Mock data for demo
      'David (Brother)': 1, // Mock data for demo
    };
    
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      color: familyMembers.find(m => m.name === name)?.color || '#a8a29e'
    }));
  }, [tasks, user, familyMembers]);

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
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error sending invitation:', error);
      setMessage('Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleNudge = (name: string) => {
    alert(`Gently nudging ${name} about their pending tasks...`);
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="bg-stone-900 text-stone-50 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-800 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 mb-6">
            <Zap size={12} className="text-amber-400" />
            Premiere Tool
          </div>
          <h1 className="text-5xl font-serif mb-4 leading-tight">Family Sync</h1>
          <p className="text-stone-400 text-lg font-light leading-relaxed">
            Planning is a collective act of love. Family Sync ensures the burden is shared, 
            visibility is absolute, and no one person carries the weight alone.
          </p>
        </div>
        
        {/* Abstract background element */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-stone-800 rounded-full blur-[100px] opacity-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Burden Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-serif text-stone-900">Burden Distribution</h3>
              <p className="text-sm text-stone-500 font-light">Visualizing the balance of responsibilities.</p>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl text-stone-400">
              <BarChart3 size={20} />
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={burdenData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#78716c', fontWeight: 500 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#fafaf9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                  {burdenData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 p-4 bg-stone-50 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-stone-50">
              <Heart size={20} />
            </div>
            <p className="text-xs text-stone-600 font-light">
              <strong>Insight:</strong> Sarah has taken on 2 new tasks this week. Consider offering help with the "Obituary Draft" to balance the load.
            </p>
          </div>
        </div>

        {/* Family Status */}
        <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm">
          <h3 className="text-xl font-serif text-stone-900 mb-6">Sync Status</h3>
          <div className="space-y-6">
            {familyMembers.map((member) => (
              <div key={member.uid} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 font-serif text-lg">
                      {member.name[0]}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 text-sm">{member.name}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">{member.role}</p>
                  </div>
                </div>
                {member.uid !== user?.uid && (
                  <button 
                    onClick={() => handleNudge(member.name)}
                    className="p-2 text-stone-300 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Send a gentle nudge"
                  >
                    <Bell size={18} />
                  </button>
                )}
              </div>
            ))}
            
            <button className="w-full py-4 border border-dashed border-stone-200 rounded-2xl text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center justify-center gap-2 text-sm">
              <UserPlus size={16} />
              Add family member
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Invitation Panel */}
        <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-stone-50">
              <Mail size={20} />
            </div>
            <h3 className="text-xl font-serif text-stone-900">Expand the Circle</h3>
          </div>
          
          <p className="text-stone-500 font-light mb-8 text-sm leading-relaxed">
            Invite siblings, spouses, or trusted relatives. Shared access means shared peace of mind.
          </p>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 focus:ring-stone-200 transition-all font-light text-sm"
              />
            </div>
            <button 
              type="submit"
              disabled={isInviting}
              className="w-full py-4 bg-stone-900 text-stone-50 rounded-2xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-stone-200"
            >
              {isInviting ? 'Sending...' : 'Send Invitation'}
              <ArrowRight size={18} />
            </button>
          </form>
          {message && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-emerald-600 flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> {message}
            </motion.p>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-serif text-stone-900">Sync Activity</h3>
            <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Live</span>
          </div>
          
          <div className="space-y-6">
            {[
              { user: 'Sarah', action: 'uploaded a document', detail: 'Insurance Policy.pdf', time: '2h ago', icon: Shield },
              { user: 'David', action: 'completed a task', detail: 'Contact Florist', time: '4h ago', icon: CheckCircle2 },
              { user: 'You', action: 'scheduled a meeting', detail: 'Consultation with Director', time: '1d ago', icon: MessageSquare },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1">
                  <item.icon size={16} className="text-stone-400" />
                </div>
                <div>
                  <p className="text-sm text-stone-900">
                    <span className="font-bold">{item.user}</span> {item.action}
                  </p>
                  <p className="text-xs text-stone-400 font-light mt-0.5">{item.detail} • {item.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-8 py-3 text-stone-400 hover:text-stone-900 text-xs font-medium transition-all">
            View full history
          </button>
        </div>
      </div>
    </div>
  );
}
