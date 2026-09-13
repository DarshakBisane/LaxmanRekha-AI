import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  FileSearch, 
  Scale, 
  UserCheck, 
  Lock, 
  Cpu, 
  ShieldAlert, 
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  Layers
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DecisionVisual } from '../../components/DecisionVisual';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoLaunch = async (role: 'bank_officer' | 'reviewer' | 'admin') => {
    await demoLogin(role);
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#cbd5e1] bg-gradient-to-b from-[#edf2f7] to-[#e6ebf2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe] shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Problem Statement: R1-02 — Trustworthy Banking Decisions</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0f172a] tracking-tight leading-[1.1]">
                Don’t replace banking AI. <br />
                <span className="text-[#4338ca] bg-clip-text text-transparent bg-gradient-to-r from-[#3730a3] via-[#4338ca] to-[#6366f1]">
                  Make banking AI trustworthy.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-[#475569] font-normal leading-relaxed max-w-2xl">
                LaxmanRekha AI is the **evidence-first verification layer** placed between upstream AI recommendations and irreversible financial actions.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/login"
                  className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#3730a3] to-[#4338ca] text-white hover:opacity-95 shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4 text-emerald-300" />
                  <span>Bank Officer Secure Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => handleDemoLaunch('bank_officer')}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1] border border-[#cbd5e1] shadow-xs hover:shadow-sm transition-all flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-[#4338ca]" />
                  <span>Launch Demo Case (#DEMO-001)</span>
                </button>
              </div>

              {/* Security Banner */}
              <div className="pt-3 flex items-center space-x-2 text-xs text-[#64748b]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Internal banking verification system · Authorized bank personnel only</span>
              </div>


            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#4338ca] to-[#059669] opacity-20 blur-xl"></div>
                <div className="relative bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xl space-y-4">
                  
                  <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#64748b]">SIGNATURE CASE #DEMO-001</span>
                  </div>

                  {/* AI Recommendation vs Verification */}
                  <div className="bg-[#e8edf5] border border-[#cbd5e1] rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748b] font-medium">Upstream Model Verdict:</span>
                      <span className="font-extrabold text-[#0f172a] bg-[#e2e8f0] px-2 py-0.5 rounded">APPROVE LOAN</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748b] font-medium">LaxmanRekha Trust Score:</span>
                      <span className="font-black text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded">38 / 100 (HIGH RISK)</span>
                    </div>
                  </div>

                  {/* Evidence Checks */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200 p-2 rounded-lg text-rose-900">
                      <span className="font-medium">Synthetic Registry Match</span>
                      <span className="font-bold text-rose-700">Name Mismatch (Rahul vs Amit)</span>
                    </div>
                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200 p-2 rounded-lg text-rose-900">
                      <span className="font-medium">Cross-Doc Consistency</span>
                      <span className="font-bold text-rose-700">Salary vs Statement Conflict</span>
                    </div>
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-emerald-900">
                      <span className="font-medium">OCR Confidence</span>
                      <span className="font-bold text-emerald-700">91.5% (High Clarity)</span>
                    </div>
                  </div>

                  {/* Decision Routing Banner */}
                  <div className="bg-gradient-to-r from-rose-900 to-[#0f172a] text-white p-3 rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-rose-300">Action Routing</div>
                    <div className="text-sm font-extrabold tracking-wide mt-0.5">HUMAN REVIEW REQUIRED</div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-16 bg-[#edf2f7] border-b border-[#cbd5e1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-[#4338ca] uppercase tracking-widest mb-2">The Critical Banking Problem</h2>
            <p className="text-3xl font-extrabold text-[#0f172a]">Why Upstream AI Recommendations Require Verification</p>
            <p className="text-sm text-[#64748b] mt-3">
              Modern banking AI models are fast and predictive, but they cannot independently confirm whether customer-submitted evidence is genuine, consistent, and policy-compliant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs hover:border-[#94a3b8] transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a]">Unreliable Evidence</h3>
              <p className="text-sm text-[#475569] mt-2 leading-relaxed">
                Manipulated applicant names, mismatching salary slips, or altered bank statements deceive credit algorithms that assume clean input.
              </p>
            </div>

            <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs hover:border-[#94a3b8] transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[#4338ca] mb-4">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a]">Multi-Source Verification</h3>
              <p className="text-sm text-[#475569] mt-2 leading-relaxed">
                LaxmanRekha cross-examines evidence across the Trusted Verification Registry, cross-document field diffs, and heuristic integrity indicators.
              </p>
            </div>

            <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs hover:border-[#94a3b8] transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a]">Human Escalation</h3>
              <p className="text-sm text-[#475569] mt-2 leading-relaxed">
                Decisions with insufficient evidentiary support are automatically routed to human reviewers with explainable side-by-side diffs and policy guidance.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Decision Visual Flow */}
      <section className="py-16 bg-[#e6ebf2] border-b border-[#cbd5e1]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <DecisionVisual 
            recommendation="APPROVE LOAN (Rs. 4,50,000)" 
            verdict="NOT SUPPORTED" 
            score={38} 
            routing="HUMAN REVIEW REQUIRED" 
          />
        </div>
      </section>

      {/* Responsible AI Framework */}
      <section className="py-16 bg-[#edf2f7] border-b border-[#cbd5e1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl p-8 sm:p-12 text-white shadow-xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-[#4338ca] text-indigo-100 mb-4">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>Responsible AI Architecture</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Gemini assists. Rules evaluate. Humans decide.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
                LaxmanRekha AI enforces strict architectural separation of concerns. Gemini provides structured field extraction and explainability; deterministic rules calculate the mathematical Trust Score; and certified human bank officers execute final approvals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-700">
                <div>
                  <div className="text-emerald-400 font-black text-xl">01. Assist</div>
                  <div className="text-xs text-slate-300 mt-1">Gemini AI parses unstructured OCR and synthesizes policy guidance.</div>
                </div>
                <div>
                  <div className="text-indigo-400 font-black text-xl">02. Evaluate</div>
                  <div className="text-xs text-slate-300 mt-1">Deterministic formula weights 6 key signals into a 0–100 Trust Score.</div>
                </div>
                <div>
                  <div className="text-amber-400 font-black text-xl">03. Decide</div>
                  <div className="text-xs text-slate-300 mt-1">Reviewers inspect evidence diffs and sign off with tamper-evident audit logs.</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
