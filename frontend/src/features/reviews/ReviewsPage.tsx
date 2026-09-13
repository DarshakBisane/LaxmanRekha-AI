import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserCheck, AlertTriangle, ChevronRight, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { CaseDetail } from '../../types/api';

export const ReviewsPage: React.FC = () => {
  const { data: pendingCases, isLoading } = useQuery<CaseDetail[]>({
    queryKey: ['pending-reviews'],
    queryFn: async () => {
      const res = await apiClient.get('/reviews/pending');
      return res.data;
    },
    refetchInterval: 8000,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#0f172a] tracking-tight flex items-center space-x-2">
          <UserCheck className="w-6 h-6 text-[#4338ca]" />
          <span>Human Review & Escalation Queue</span>
        </h1>
        <p className="text-xs text-[#64748b] mt-1">
          High-risk cases flagged by the LaxmanRekha verification layer for certified officer review.
        </p>
      </div>

      {/* Grid of Pending Cases */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-[#64748b]">
          Loading pending reviews from database...
        </div>
      ) : !pendingCases || pendingCases.length === 0 ? (
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0f172a]">All Escalations Cleared</h3>
          <p className="text-xs text-[#64748b] max-w-md mx-auto">
            There are currently no cases in the pending review queue. New high-risk decisions will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingCases.map((c) => {
            const isHigh = c.risk_level === 'HIGH_RISK';
            return (
              <div key={c.id} className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#94a3b8] transition-all">
                
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-[#4338ca]">{c.case_number}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    isHigh ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {c.risk_level?.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-[#0f172a]">{c.title}</h3>
                  <p className="text-xs text-[#64748b] mt-0.5">{c.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#e8edf5] border border-[#cbd5e1] rounded-xl p-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-[#64748b] uppercase">AI Recommendation</div>
                    <div className="font-extrabold text-[#0f172a] mt-0.5">{c.ai_recommendation}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#64748b] uppercase">Trust Score</div>
                    <div className={`font-black mt-0.5 ${isHigh ? 'text-rose-700' : 'text-amber-700'}`}>
                      {c.trust_score !== null && c.trust_score !== undefined ? `${c.trust_score} / 100` : 'Pending'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-[11px] text-[#64748b] flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>

                  <Link
                    to={`/cases/${c.id}`}
                    className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold bg-[#4338ca] text-white hover:bg-[#3730a3] shadow-xs transition-all"
                  >
                    <span>Inspect Evidence & Sign Off</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
