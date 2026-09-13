import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ShieldCheck, Search, Filter, Lock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { AuditLogItem } from '../../types/api';

export const AuditPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery<AuditLogItem[]>({
    queryKey: ['audit-logs', actionFilter],
    queryFn: async () => {
      let url = '/audit?limit=100';
      if (actionFilter !== 'ALL') url += `&action=${actionFilter}`;
      const res = await apiClient.get(url);
      return res.data;
    },
    refetchInterval: 10000,
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] tracking-tight flex items-center space-x-2">
            <History className="w-6 h-6 text-[#4338ca]" />
            <span>Tamper-Evident Audit Trail</span>
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Append-only cryptographic hash-chained audit records of all verification operations.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>SHA-256 Hash Chaining Active</span>
        </div>
      </div>

      {/* Action Filter */}
      <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-[#475569]">Filter by Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] font-semibold focus:ring-2 focus:ring-[#4338ca] focus:outline-hidden"
          >
            <option value="ALL">All Actions</option>
            <option value="USER_LOGIN_OAUTH">User Login (OAuth)</option>
            <option value="USER_LOGIN_DEMO">User Login (Demo)</option>
            <option value="CASE_CREATED">Case Created</option>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="ANALYSIS_COMPLETED">Analysis Completed</option>
            <option value="CASE_APPROVE">Case Approved</option>
            <option value="CASE_REJECT">Case Rejected</option>
            <option value="ROLE_CHANGED">Role Changed</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-[#64748b]">
          Showing {logs?.length || 0} events
        </span>
      </div>

      {/* Audit Log Stream */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-[#64748b]">
            Loading audit records from PostgreSQL...
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#64748b]">
            No audit logs recorded yet.
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div key={log.id} className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 shadow-xs transition-all hover:border-[#94a3b8]">
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe]">
                      {log.action}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#0f172a]">
                        {log.user_name || 'System Actor'} {log.case_number ? `· Case ${log.case_number}` : ''}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        Entity: {log.entity_type} · IP: {log.ip_hash_or_masked_ip}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-[#64748b] font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="p-1 rounded-lg hover:bg-[#e2e8f0] text-[#475569] transition-colors"
                      title="Inspect Hash & Metadata"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                </div>

                {/* Expanded Details: Hashes and Metadata JSON */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-[#cbd5e1] space-y-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                      <div className="bg-[#e8edf5] p-2 rounded-lg border border-[#cbd5e1] break-all">
                        <span className="font-bold text-[#64748b]">Prev Hash: </span>
                        <span className="text-[#334155]">{log.prev_hash || 'GENESIS'}</span>
                      </div>
                      <div className="bg-[#e8edf5] p-2 rounded-lg border border-[#cbd5e1] break-all">
                        <span className="font-bold text-[#64748b]">Current Hash: </span>
                        <span className="text-[#4338ca] font-bold">{log.current_hash || 'CALCULATED'}</span>
                      </div>
                    </div>

                    {log.metadata_json && (
                      <div className="bg-[#0f172a] text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                        <pre>{JSON.stringify(log.metadata_json, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
