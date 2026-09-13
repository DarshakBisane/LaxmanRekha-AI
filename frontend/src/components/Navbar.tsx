import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FolderKanban, 
  UserCheck, 
  BarChart3, 
  History, 
  Users, 
  Activity, 
  LogOut, 
  User as UserIcon,
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/api';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, role, logout, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Cases', path: '/cases', icon: FolderKanban },
    { name: 'Reviews', path: '/reviews', icon: UserCheck },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Audit Trail', path: '/audit', icon: History },
  ];

  const adminLinks = [
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'System Health', path: '/admin/health', icon: Activity },
  ];

  const handleRoleSwitch = async (newRole: UserRole) => {
    setIsRoleMenuOpen(false);
    await demoLogin(newRole);
    navigate('/dashboard');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#f1f5f9]/90 backdrop-blur-md border-b border-[#cbd5e1] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3730a3] to-[#4338ca] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-[#0f172a]">LaxmanRekha</span>
                <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe]">AI</span>
              </div>
              <p className="text-[10px] text-[#64748b] leading-none font-medium">Trust & Verification Layer</p>
            </div>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#e2e8f0] text-[#0f172a] shadow-xs font-semibold'
                        : 'text-[#475569] hover:bg-[#e2e8f0]/60 hover:text-[#0f172a]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#4338ca]' : 'text-[#64748b]'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              {/* Admin Links */}
              {role === 'admin' && (
                <div className="flex items-center space-x-1 pl-2 border-l border-[#cbd5e1]">
                  {adminLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.path);
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          active
                            ? 'bg-[#e2e8f0] text-[#0f172a] shadow-xs font-semibold'
                            : 'text-[#475569] hover:bg-[#e2e8f0]/60 hover:text-[#0f172a]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-[#4338ca]' : 'text-[#64748b]'}`} />
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </nav>
          )}

          {/* Right Area: Demo Role Switcher & User Profile / Login */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Role Switcher Pill */}
                <div className="relative">
                  <button
                    onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#e6ebf2] text-[#334155] border border-[#cbd5e1] hover:bg-[#dfe6f0] transition-colors"
                    title="Switch Demo Role"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#4338ca]" />
                    <span className="capitalize">{role?.replace('_', ' ')}</span>
                    <ChevronDown className="w-3 h-3 text-[#64748b]" />
                  </button>

                  {isRoleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[#f8fafc] rounded-xl shadow-lg border border-[#cbd5e1] py-1.5 z-50 text-xs">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider border-b border-[#e2e8f0]">
                        Demo Workspace Role
                      </div>
                      <button
                        onClick={() => handleRoleSwitch('bank_officer')}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#e2e8f0] transition-colors ${
                          role === 'bank_officer' ? 'text-[#4338ca] font-bold bg-[#e0e7ff]/40' : 'text-[#334155]'
                        }`}
                      >
                        <span>Bank Officer</span>
                        {role === 'bank_officer' && <span className="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('reviewer')}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#e2e8f0] transition-colors ${
                          role === 'reviewer' ? 'text-[#4338ca] font-bold bg-[#e0e7ff]/40' : 'text-[#334155]'
                        }`}
                      >
                        <span>Senior Reviewer</span>
                        {role === 'reviewer' && <span className="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>}
                      </button>
                      <button
                        onClick={() => handleRoleSwitch('admin')}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#e2e8f0] transition-colors ${
                          role === 'admin' ? 'text-[#4338ca] font-bold bg-[#e0e7ff]/40' : 'text-[#334155]'
                        }`}
                      >
                        <span>System Admin</span>
                        {role === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>}
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 pl-2 border-l border-[#cbd5e1] text-[#0f172a] hover:opacity-80 transition-opacity"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full border border-[#cbd5e1] object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#cbd5e1] flex items-center justify-center text-[#475569]">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-semibold max-w-[100px] truncate">{user?.full_name}</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-[#64748b] hover:text-[#be123c] hover:bg-[#fee2e2] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#4338ca] text-white hover:bg-[#3730a3] shadow-xs transition-colors flex items-center space-x-1"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
