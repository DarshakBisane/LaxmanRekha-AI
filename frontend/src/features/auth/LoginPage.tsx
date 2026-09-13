import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Building2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your bank officer email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (!err.response) {
        setErrorMsg('Cannot connect to LaxmanRekha backend server (http://localhost:8000). Please ensure the backend FastAPI service is running.');
      } else {
        setErrorMsg(
          err.response?.data?.error?.message || 
          'Invalid bank officer email or password. Please verify your credentials.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmail('darshak@gmail.com');
    setPassword('123321123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3730a3] to-[#4338ca] text-white shadow-lg mb-2">
            <ShieldCheck className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0f172a]">
            LaxmanRekha AI
          </h1>
          <p className="text-xs font-semibold text-[#4338ca] uppercase tracking-wider">
            Trust Layer for AI-Assisted Banking Decisions
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-3xl p-7 sm:p-8 shadow-xl space-y-6">
          
          <div className="space-y-1 text-center sm:text-left border-b border-[#cbd5e1] pb-4">
            <h2 className="text-lg font-extrabold text-[#0f172a] flex items-center justify-center sm:justify-start space-x-2">
              <Building2 className="w-5 h-5 text-[#4338ca]" />
              <span>Bank Officer Secure Login</span>
            </h2>
            <p className="text-xs text-[#64748b]">
              Secure AI verification and decision-risk analysis for banking operations.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1.5">
                Bank Officer Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748b]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@bank.internal"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#4338ca] focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748b]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] placeholder-[#94a3b8] focus:ring-2 focus:ring-[#4338ca] focus:bg-white focus:outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748b] hover:text-[#0f172a]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#3730a3] to-[#4338ca] text-white hover:opacity-95 shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Demo Credential Quick-Fill Helpers for Evaluation */}
          <div className="pt-3 border-t border-[#cbd5e1] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] text-center">
              Quick-Fill Seeded Bank Roles (Judge Evaluation)
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                type="button"
                onClick={() => {
                  setEmail('darshak@gmail.com');
                  setPassword('123321123');
                  setErrorMsg(null);
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#e0e7ff] text-[#4338ca] hover:bg-[#c7d2fe] border border-[#c7d2fe] transition-colors"
              >
                Officer: Darshak
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('reviewer@laxmanrekha.ai');
                  setPassword('123321123');
                  setErrorMsg(null);
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#f1f5f9] text-[#334155] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
              >
                Reviewer: Ananya
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@laxmanrekha.ai');
                  setPassword('123321123');
                  setErrorMsg(null);
                }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#f1f5f9] text-[#334155] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
              >
                Admin: System
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-center">
            <p className="text-[11px] font-medium text-[#475569]">
              Authorized bank personnel only. Audit logging active.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
