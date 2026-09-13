import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#e6ebf2] border-t border-[#cbd5e1] mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#4338ca] flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#0f172a]">LaxmanRekha AI</div>
              <div className="text-xs text-[#64748b]">Problem Statement: R1-02 — Trustworthy Banking Decisions</div>
            </div>
          </div>

          <div className="flex items-center text-xs text-[#64748b] space-x-4">
            <div className="flex items-center space-x-1 bg-[#f1f5f9] px-2.5 py-1 rounded-md border border-[#cbd5e1]">
              <Info className="w-3.5 h-3.5 text-[#4338ca]" />
              <span>Prototype Environment — Synthetic Trusted Registry Demonstration</span>
            </div>
          </div>

          <div className="text-xs text-[#64748b] text-center md:text-right">
            <div>“Don’t replace banking AI. Make banking AI trustworthy.”</div>
            <div className="text-[11px] text-[#94a3b8] mt-0.5">Gemini Assists · Deterministic Rules Evaluate · Humans Decide</div>
          </div>

        </div>
      </div>
    </footer>
  );
};
