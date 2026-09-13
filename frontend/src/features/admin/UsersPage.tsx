import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { User, UserRole } from '../../types/api';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('bank_officer');
  const [message, setMessage] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data;
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const res = await apiClient.patch(`/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setTargetUser(null);
      setMessage(`Role updated to ${data.role} for ${data.email}.`);
    },
    onError: (err: any) => {
      setMessage(`Error: ${err.response?.data?.error?.message || 'Failed to update role.'}`);
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const res = await apiClient.patch(`/users/${userId}/status`, { is_active: isActive });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setMessage(`User ${data.email} is now ${data.is_active ? 'Active' : 'Deactivated'}.`);
    },
    onError: (err: any) => {
      setMessage(`Error: ${err.response?.data?.error?.message || 'Failed to update status.'}`);
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#0f172a] tracking-tight flex items-center space-x-2">
          <Users className="w-6 h-6 text-[#4338ca]" />
          <span>User Role & Access Management</span>
        </h1>
        <p className="text-xs text-[#64748b] mt-1">
          Administrator controls for role assignment and active session permissions.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-[#4338ca] flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] shadow-xs">
        <table className="min-w-full divide-y divide-[#cbd5e1] text-left text-xs">
          <thead className="bg-[#e6ebf2] text-[#475569] font-bold uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3.5">User</th>
              <th scope="col" className="px-4 py-3.5">Email</th>
              <th scope="col" className="px-4 py-3.5">Role</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5">Last Login</th>
              <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0f172a]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#64748b]">
                  Loading users...
                </td>
              </tr>
            ) : (
              (users || []).map((u) => (
                <tr key={u.id} className="hover:bg-[#f1f5f9] transition-colors">
                  <td className="px-4 py-3.5 font-bold flex items-center space-x-2">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#cbd5e1]" />
                    )}
                    <span>{u.full_name}</span>
                  </td>
                  <td className="px-4 py-3.5 text-[#64748b]">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe]">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[#64748b]">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => {
                        setTargetUser(u);
                        setSelectedRole(u.role);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] transition-colors"
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => statusMutation.mutate({ userId: u.id, isActive: !u.is_active })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        u.is_active ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {u.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Role Change Modal */}
      {targetUser && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-[#0f172a]">
              Change Role for {targetUser.full_name}
            </h3>
            <p className="text-xs text-[#64748b]">
              Assigning new permissions updates authorization guards immediately across the API and frontend.
            </p>

            <div className="space-y-2">
              {(['bank_officer', 'reviewer', 'admin'] as UserRole[]).map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === r ? 'bg-[#e0e7ff] border-[#4338ca] text-[#4338ca] font-bold' : 'bg-[#f1f5f9] border-[#cbd5e1] text-[#334155]'
                  }`}
                >
                  <span className="capitalize text-xs">{r.replace('_', ' ')}</span>
                  <input
                    type="radio"
                    name="role"
                    checked={selectedRole === r}
                    onChange={() => setSelectedRole(r)}
                    className="text-[#4338ca]"
                  />
                </label>
              ))}
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setTargetUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e2e8f0] text-[#475569] hover:bg-[#cbd5e1]"
              >
                Cancel
              </button>
              <button
                onClick={() => roleMutation.mutate({ userId: targetUser.id, role: selectedRole })}
                disabled={roleMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4338ca] text-white hover:bg-[#3730a3]"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
