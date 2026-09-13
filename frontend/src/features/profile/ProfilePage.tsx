import React from 'react';
import { User as UserIcon, Shield, LogOut, CheckCircle2, Clock, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ProfilePage: React.FC = () => {
  const { user, role, logout, demoLogin } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Profile Card */}
      <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-3xl p-8 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-[#cbd5e1]">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-20 h-20 rounded-full border-2 border-[#4338ca] shadow-md object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#cbd5e1] flex items-center justify-center text-[#475569]">
              <UserIcon className="w-10 h-10" />
            </div>
          )}

          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-xl font-black text-[#0f172a]">{user.full_name}</h1>
            <div className="text-xs text-[#64748b] flex items-center justify-center sm:justify-start space-x-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </div>
            <div className="pt-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe]">
                {role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Account Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#e8edf5] p-4 rounded-xl border border-[#cbd5e1]">
            <div className="text-[10px] font-bold text-[#64748b] uppercase">Account Identifier</div>
            <div className="font-mono text-[#0f172a] mt-0.5 truncate">{user.id}</div>
          </div>

          <div className="bg-[#e8edf5] p-4 rounded-xl border border-[#cbd5e1]">
            <div className="text-[10px] font-bold text-[#64748b] uppercase">Last Active Session</div>
            <div className="font-semibold text-[#0f172a] mt-0.5">
              {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Active Now'}
            </div>
          </div>
        </div>

        {/* Evaluation Role Switcher */}
        <div className="bg-[#e8edf5] border border-[#cbd5e1] rounded-2xl p-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">
            Demo Role Switcher (Judge Evaluation)
          </div>
          <p className="text-xs text-[#64748b]">
            Instantly switch roles to test Bank Officer, Senior Reviewer, and Admin permission boundaries.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => demoLogin('bank_officer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'bank_officer' ? 'bg-[#4338ca] text-white shadow-xs' : 'bg-[#f1f5f9] text-[#334155] hover:bg-[#cbd5e1]'
              }`}
            >
              Bank Officer
            </button>
            <button
              onClick={() => demoLogin('reviewer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'reviewer' ? 'bg-[#4338ca] text-white shadow-xs' : 'bg-[#f1f5f9] text-[#334155] hover:bg-[#cbd5e1]'
              }`}
            >
              Senior Reviewer
            </button>
            <button
              onClick={() => demoLogin('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === 'admin' ? 'bg-[#4338ca] text-white shadow-xs' : 'bg-[#f1f5f9] text-[#334155] hover:bg-[#cbd5e1]'
              }`}
            >
              System Admin
            </button>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-700 text-white hover:bg-rose-800 shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Session</span>
          </button>
        </div>

      </div>

    </div>
  );
};
