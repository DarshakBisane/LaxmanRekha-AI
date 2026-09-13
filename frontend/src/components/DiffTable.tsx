import React from 'react';
import { SideBySideDiff } from '../types/api';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface DiffTableProps {
  diffs: SideBySideDiff[];
}

export const DiffTable: React.FC<DiffTableProps> = ({ diffs }) => {
  if (!diffs || diffs.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-[#64748b]">
        No registry comparison data available for this case.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MATCH':
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Match</span>
          </span>
        );
      case 'MISMATCH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Mismatch</span>
          </span>
        );
      case 'WARNING':
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Warning</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#cbd5e1] bg-[#f8fafc]">
      <table className="min-w-full divide-y divide-[#cbd5e1] text-left text-xs">
        <thead className="bg-[#e6ebf2] text-[#475569] font-bold uppercase tracking-wider">
          <tr>
            <th scope="col" className="px-4 py-3">Verification Field</th>
            <th scope="col" className="px-4 py-3">Uploaded Evidence</th>
            <th scope="col" className="px-4 py-3">Trusted Registry Record</th>
            <th scope="col" className="px-4 py-3 text-right">Match Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0] font-medium text-[#0f172a]">
          {diffs.map((d, index) => {
            const isMismatch = d.status === 'MISMATCH';
            return (
              <tr key={index} className={isMismatch ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-[#f1f5f9]'}>
                <td className="px-4 py-3.5 font-semibold text-[#334155]">{d.field_name}</td>
                <td className={`px-4 py-3.5 ${isMismatch ? 'text-rose-700 font-bold' : ''}`}>
                  {d.uploaded_value || '—'}
                </td>
                <td className="px-4 py-3.5 text-[#0f172a] font-semibold">
                  {d.trusted_value || '—'}
                </td>
                <td className="px-4 py-3.5 text-right">
                  {getStatusBadge(d.status)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
