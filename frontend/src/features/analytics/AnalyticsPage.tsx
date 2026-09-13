import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, ShieldAlert, CheckCircle2, PieChart as PieIcon, Activity } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { apiClient } from '../../lib/api';
import { DashboardSummary } from '../../types/api';

export const AnalyticsPage: React.FC = () => {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['analytics-full-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/summary');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const highRiskPct = summary && summary.total_cases > 0
    ? Math.round((summary.high_risk_cases / summary.total_cases) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#0f172a] tracking-tight flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-[#4338ca]" />
          <span>Decision Risk & Verification Analytics</span>
        </h1>
        <p className="text-xs text-[#64748b] mt-1">
          Aggregated decision intelligence and trust distribution metrics derived directly from PostgreSQL.
        </p>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Total Cases Evaluated</div>
          <div className="text-3xl font-black text-[#0f172a] mt-2">{summary?.total_cases || 0}</div>
          <div className="text-[11px] text-[#64748b] mt-1">Multi-factor verified</div>
        </div>

        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748b]">High Risk Escalation Rate</div>
          <div className="text-3xl font-black text-rose-700 mt-2">{highRiskPct}%</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">Blocked / Escalated</div>
        </div>

        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Average Trust Score</div>
          <div className="text-3xl font-black text-[#4338ca] mt-2">{summary?.avg_trust_score || 0}/100</div>
          <div className="text-[11px] text-[#64748b] mt-1">Deterministic scale</div>
        </div>

        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Review Approvals</div>
          <div className="text-3xl font-black text-emerald-700 mt-2">{summary?.approved_cases || 0}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Signed off by officer</div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Risk Distribution */}
        <div className="lg:col-span-6 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
            Trust Score Distribution
          </h3>
          <div className="h-56">
            {summary?.risk_distribution && summary.risk_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.risk_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {summary.risk_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-[#cbd5e1]">
            <div>
              <div className="font-bold text-emerald-700">{summary?.low_risk_cases || 0}</div>
              <div className="text-[10px] text-[#64748b]">Low Risk (80-100)</div>
            </div>
            <div>
              <div className="font-bold text-amber-700">{summary?.medium_risk_cases || 0}</div>
              <div className="text-[10px] text-[#64748b]">Medium Risk (60-79)</div>
            </div>
            <div>
              <div className="font-bold text-rose-700">{summary?.high_risk_cases || 0}</div>
              <div className="text-[10px] text-[#64748b]">High Risk (0-59)</div>
            </div>
          </div>
        </div>

        {/* High Risk Discrepancy Reasons */}
        <div className="lg:col-span-6 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
            Primary Causes of High-Risk Flags
          </h3>
          <div className="space-y-3 pt-2">
            {(summary?.high_risk_reasons || []).map((r, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#334155]">{r.reason}</span>
                  <span className="text-[#4338ca]">{r.percentage}%</span>
                </div>
                <div className="w-full bg-[#cbd5e1] h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4338ca] rounded-full" style={{ width: `${r.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#64748b] pt-2 border-t border-[#cbd5e1]">
            Name mismatches and cross-document contradictions account for the vast majority of AI recommendation blocks.
          </p>
        </div>

      </div>

    </div>
  );
};
