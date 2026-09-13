import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Search, Plus, ChevronRight, Filter } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { CaseDetail } from '../../types/api';

export const CasesListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const { data: cases, isLoading } = useQuery<CaseDetail[]>({
    queryKey: ['cases-list', statusFilter, riskFilter],
    queryFn: async () => {
      let url = '/cases?limit=50';
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (riskFilter !== 'ALL') url += `&risk_level=${riskFilter}`;
      const res = await apiClient.get(url);
      return res.data;
    },
    refetchInterval: 10000,
  });

  const filtered = (cases || []).filter(c => 
    c.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ai_recommendation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">Verification Case Directory</h1>
          <p className="text-xs text-[#64748b]">Explore all banking decision records evaluated by LaxmanRekha AI.</p>
        </div>

        <Link
          to="/cases/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#4338ca] text-white hover:bg-[#3730a3] shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Verification Case</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by case #, title, or recommendation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] focus:ring-2 focus:ring-[#4338ca] focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] font-semibold focus:ring-2 focus:ring-[#4338ca] focus:outline-hidden"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW_RISK">Low Risk (80-100)</option>
            <option value="MEDIUM_RISK">Medium Risk (60-79)</option>
            <option value="HIGH_RISK">High Risk (0-59)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] font-semibold focus:ring-2 focus:ring-[#4338ca] focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="NEEDS_VERIFICATION">Needs Verification</option>
            <option value="REJECTED">Rejected</option>
            <option value="ANALYZED">Analyzed</option>
          </select>

        </div>

      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] shadow-xs">
        <table className="min-w-full divide-y divide-[#cbd5e1] text-left text-xs">
          <thead className="bg-[#e6ebf2] text-[#475569] font-bold uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3.5">Case Number</th>
              <th scope="col" className="px-4 py-3.5">Case Title & Type</th>
              <th scope="col" className="px-4 py-3.5">AI Recommendation</th>
              <th scope="col" className="px-4 py-3.5">Trust Score</th>
              <th scope="col" className="px-4 py-3.5">Risk Level</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0f172a]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#64748b]">
                  Loading cases from Neon PostgreSQL...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[#64748b]">
                  No verification cases found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isHigh = c.risk_level === 'HIGH_RISK';
                const isLow = c.risk_level === 'LOW_RISK';

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
                      <span className="inline-block px-2.5 py-0.5 rounded-md font-extrabold bg-[#e2e8f0] text-[#0f172a] text-[11px]">
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
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
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
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
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
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#e0e7ff] text-[#4338ca] hover:bg-[#c7d2fe] transition-colors"
                      >
                        <span>Inspect Evidence</span>
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
  );
};
