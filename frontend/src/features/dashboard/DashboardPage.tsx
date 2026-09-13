import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FolderKanban, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Plus, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Filter, 
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { apiClient } from '../../lib/api';
import { DashboardSummary, CaseDetail } from '../../types/api';
import { TrustGauge } from '../../components/TrustGauge';

export const DashboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');

  // Fetch summary analytics
  const { data: summary, isLoading: isSummaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/summary');
      return res.data;
    },
    staleTime: 30000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Fetch recent cases
  const { data: cases, isLoading: isCasesLoading } = useQuery<CaseDetail[]>({
    queryKey: ['recent-cases'],
    queryFn: async () => {
      const res = await apiClient.get('/cases?limit=10');
      return res.data;
    },
    staleTime: 30000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const filteredCases = (cases || []).filter((c) => {
    const matchesSearch = 
      c.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ai_recommendation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = selectedRisk === 'ALL' || c.risk_level === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
            Banking Verification Operations
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Real-time evidence verification and decision trust intelligence.
          </p>
        </div>

        <Link
          to="/cases/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#4338ca] text-white hover:bg-[#3730a3] shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Verification Case</span>
        </Link>
      </div>

      {/* Pending Reviews Alert Banner */}
      {summary && summary.pending_reviews > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-900">
                {summary.pending_reviews} Case{summary.pending_reviews > 1 ? 's' : ''} Require Human Escalation Review
              </div>
              <div className="text-xs text-amber-700">
                AI recommendations blocked due to identity or document discrepancies.
              </div>
            </div>
          </div>
          <Link
            to="/reviews"
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors flex items-center space-x-1"
          >
            <span>Review Queue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Cases */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Cases</span>
            <FolderKanban className="w-4 h-4 text-[#4338ca]" />
          </div>
          <div className="mt-3 text-2xl font-black text-[#0f172a]">
            {isSummaryLoading ? '...' : summary?.total_cases || 0}
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">Persistent in PostgreSQL</div>
        </div>

        {/* Low Risk */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-xs font-bold uppercase tracking-wider">Low Risk (80-100)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-700">
            {isSummaryLoading ? '...' : summary?.low_risk_cases || 0}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">Eligible to Proceed</div>
        </div>

        {/* Medium Risk */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-xs font-bold uppercase tracking-wider">Medium Risk (60-79)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-amber-700">
            {isSummaryLoading ? '...' : summary?.medium_risk_cases || 0}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 font-semibold">Secondary Verification</div>
        </div>

        {/* High Risk */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-xs font-bold uppercase tracking-wider">High Risk (0-59)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-rose-700">
            {isSummaryLoading ? '...' : summary?.high_risk_cases || 0}
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-semibold">Blocked / Escalated</div>
        </div>

        {/* Avg Trust Score */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Trust Score</span>
            <TrendingUp className="w-4 h-4 text-[#4338ca]" />
          </div>
          <div className="mt-3 text-2xl font-black text-[#0f172a]">
            {isSummaryLoading ? '...' : `${summary?.avg_trust_score || 0}/100`}
          </div>
          <div className="mt-1 text-[11px] text-[#64748b]">Deterministic Calculation</div>
        </div>

      </div>

      {/* Analytics Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-4 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-4">
            Risk Classification Distribution
          </h3>
          <div className="h-48 flex items-center justify-center">
            {summary?.risk_distribution && summary.risk_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.risk_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
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
            ) : (
              <div className="text-xs text-[#64748b]">No distribution data yet.</div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#cbd5e1] text-center text-xs">
            <div>
              <div className="font-bold text-emerald-700">{summary?.low_risk_cases || 0}</div>
              <div className="text-[10px] text-[#64748b]">Low Risk</div>
            </div>
            <div>
              <div className="font-bold text-amber-700">{summary?.medium_risk_cases || 0}</div>
              <div className="text-[10px] text-[#64748b]">Medium Risk</div>
            </div>
            <div>
              <div className="font-bold text-rose-700">{summary?.high_risk_cases || 0}</div>
              <div className="text-[10px] text-[#64748b]">High Risk</div>
            </div>
          </div>
        </div>

        {/* 7-Day Case Activity Area Chart */}
        <div className="lg:col-span-8 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
              7-Day Case Verification Velocity
            </h3>
            <span className="text-[11px] font-semibold text-[#64748b]">PostgreSQL Timeline</span>
          </div>
          <div className="h-48">
            {summary?.daily_case_activity && summary.daily_case_activity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.daily_case_activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4338ca" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4338ca" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="cases" stroke="#4338ca" strokeWidth={2} fillOpacity={1} fill="url(#colorCases)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#64748b]">
                Activity chart initialized.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Cases Section */}
      <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#0f172a]">Recent Verification Cases</h3>
            <p className="text-xs text-[#64748b]">Inspect upstream recommendations and Trust Scores</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search case # or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] focus:outline-hidden focus:ring-2 focus:ring-[#4338ca]"
              />
            </div>

            {/* Risk filter */}
            <div className="flex items-center space-x-1 text-xs">
              <button
                onClick={() => setSelectedRisk('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedRisk === 'ALL' ? 'bg-[#4338ca] text-white' : 'bg-[#e8edf5] text-[#475569] hover:bg-[#cbd5e1]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRisk('LOW_RISK')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedRisk === 'LOW_RISK' ? 'bg-emerald-600 text-white' : 'bg-[#e8edf5] text-[#475569] hover:bg-[#cbd5e1]'
                }`}
              >
                Low
              </button>
              <button
                onClick={() => setSelectedRisk('HIGH_RISK')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedRisk === 'HIGH_RISK' ? 'bg-rose-600 text-white' : 'bg-[#e8edf5] text-[#475569] hover:bg-[#cbd5e1]'
                }`}
              >
                High
              </button>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="overflow-x-auto rounded-xl border border-[#cbd5e1] bg-[#f8fafc]">
          <table className="min-w-full divide-y divide-[#cbd5e1] text-left text-xs">
            <thead className="bg-[#e6ebf2] text-[#475569] font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Case ID</th>
                <th scope="col" className="px-4 py-3">Title & Type</th>
                <th scope="col" className="px-4 py-3">AI Recommendation</th>
                <th scope="col" className="px-4 py-3">Trust Score</th>
                <th scope="col" className="px-4 py-3">Risk Level</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0f172a]">
              {isCasesLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#64748b]">
                    Loading cases from PostgreSQL...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#64748b]">
                    No cases match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const isHigh = c.risk_level === 'HIGH_RISK' || (c.trust_score !== null && c.trust_score !== undefined && c.trust_score < 60);
                  const isLow = c.risk_level === 'LOW_RISK' || (c.trust_score !== null && c.trust_score !== undefined && c.trust_score >= 80);

                  return (
                    <tr key={c.id} className="hover:bg-[#f1f5f9] transition-colors">
                      <td className="px-4 py-3.5 font-bold font-mono text-[#4338ca]">
                        {c.case_number}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#0f172a]">{c.title}</div>
                        <div className="text-[11px] text-[#64748b]">{c.case_type.replace('_', ' ')}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-md font-extrabold bg-[#e2e8f0] text-[#0f172a] text-[11px]">
                          {c.ai_recommendation}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-black">
                        {c.trust_score !== null && c.trust_score !== undefined ? (
                          <span className={isHigh ? 'text-rose-700 font-extrabold' : isLow ? 'text-emerald-700 font-extrabold' : 'text-amber-700 font-extrabold'}>
                            {c.trust_score} / 100
                          </span>
                        ) : (
                          <span className="text-[#94a3b8] font-normal">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {c.risk_level ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            isHigh ? 'bg-rose-100 text-rose-800 border-rose-300' :
                            isLow ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {c.risk_level.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          c.status === 'PENDING_REVIEW' ? 'bg-rose-100 text-rose-800' :
                          c.status === 'REJECTED' ? 'bg-slate-200 text-slate-800' :
                          'bg-[#e2e8f0] text-[#334155]'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/cases/${c.id}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e0e7ff] text-[#4338ca] hover:bg-[#c7d2fe] transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
