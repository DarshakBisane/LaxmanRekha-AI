import React from 'react';
import { Bot, FileText, CheckCircle2, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

interface DecisionVisualProps {
  recommendation?: string;
  verdict?: string;
  score?: number;
  routing?: string;
}

export const DecisionVisual: React.FC<DecisionVisualProps> = ({
  recommendation = 'APPROVE LOAN',
  verdict = 'NOT SUPPORTED',
  score = 38,
  routing = 'HUMAN REVIEW REQUIRED'
}) => {
  const isHighRisk = score < 60;
  const isLowRisk = score >= 80;

  return (
    <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs">
      <div className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center justify-between">
        <span>Decision Verification Pipeline</span>
        <span className="text-[11px] font-semibold text-[#4338ca] bg-[#e0e7ff] px-2 py-0.5 rounded border border-[#c7d2fe]">
          Core Architecture
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
        
        {/* Step 1: Upstream AI */}
        <div className="bg-[#e8edf5] border border-[#cbd5e1] rounded-xl p-3.5 text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-[#334155] text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-[10px] font-bold text-[#64748b] uppercase">AI Recommendation</div>
          <div className="text-xs font-extrabold text-[#0f172a] mt-0.5 truncate">{recommendation}</div>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex justify-center text-[#94a3b8]">
          <ArrowRight className="w-5 h-5" />
        </div>

        {/* Step 2: Evidence Layer */}
        <div className="bg-[#e8edf5] border border-[#cbd5e1] rounded-xl p-3.5 text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-[#0f766e] text-white flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-[10px] font-bold text-[#64748b] uppercase">Evidence Layer</div>
          <div className="text-xs font-semibold text-[#0f172a] mt-0.5">Multi-Document OCR & Registry</div>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex justify-center text-[#94a3b8]">
          <ArrowRight className="w-5 h-5" />
        </div>

        {/* Step 3: LaxmanRekha Verification & Routing */}
        <div className={`border rounded-xl p-3.5 text-center ${
          isHighRisk 
            ? 'bg-rose-50/80 border-rose-300 text-rose-900' 
            : isLowRisk 
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900' 
            : 'bg-amber-50/80 border-amber-300 text-amber-900'
        }`}>
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center text-white" style={{
            backgroundColor: isHighRisk ? '#be123c' : isLowRisk ? '#047857' : '#b45309'
          }}>
            {isHighRisk ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wide">
            {isHighRisk ? 'Verdict: NOT TRUSTED' : isLowRisk ? 'Verdict: TRUSTED' : 'Verdict: REVIEW'}
          </div>
          <div className="text-xs font-black mt-0.5">
            {routing}
          </div>
        </div>

      </div>

      <div className="mt-4 pt-3 border-t border-[#cbd5e1] text-xs text-[#475569] flex items-center justify-between">
        <div>
          <span className="font-semibold text-[#0f172a]">Core Principle: </span>
          AI makes the recommendation. LaxmanRekha verifies if evidence supports it.
        </div>
        <div className="font-bold text-xs">
          Trust Score: <span className={isHighRisk ? 'text-rose-700' : isLowRisk ? 'text-emerald-700' : 'text-amber-700'}>{score}/100</span>
        </div>
      </div>
    </div>
  );
};
