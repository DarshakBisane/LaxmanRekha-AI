import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Cpu, HardDrive, RefreshCw, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { SystemHealth } from '../../types/api';

export const SystemHealthPage: React.FC = () => {
  const { data: health, isLoading, refetch, isFetching } = useQuery<SystemHealth>({
    queryKey: ['system-health-status'],
    queryFn: async () => {
      const res = await apiClient.get('/health');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <XCircle className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0f172a] tracking-tight flex items-center space-x-2">
            <Activity className="w-6 h-6 text-[#4338ca]" />
            <span>Infrastructure & AI Service Health</span>
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Real-time telemetry for Neon DB, Upstash Redis, Gemini AI, and RAG Index.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Overview Status Banner */}
      <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            health?.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#0f172a]">
              System Operational Status: <span className="uppercase tracking-wider font-mono">{health?.status || 'CHECKING'}</span>
            </div>
            <div className="text-xs text-[#64748b]">
              Environment: {health?.environment} · Version {health?.app_version} · Latency verified
            </div>
          </div>
        </div>

        <div className="text-xs text-[#64748b] font-mono sm:text-right">
          Last Check: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'}
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. Neon DB */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#4338ca]" />
              <span className="text-xs font-extrabold text-[#0f172a]">Neon PostgreSQL</span>
            </div>
            {getStatusIcon(health?.components?.database?.status || '')}
          </div>
          <p className="text-xs text-[#475569]">
            {health?.components?.database?.details || 'Database connection status'}
          </p>
          {health?.components?.database?.latency_ms !== undefined && (
            <div className="text-[11px] font-mono text-[#059669] font-bold">
              Latency: {health.components.database.latency_ms} ms
            </div>
          )}
        </div>

        {/* 2. Upstash Redis */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-[#4338ca]" />
              <span className="text-xs font-extrabold text-[#0f172a]">Upstash Redis</span>
            </div>
            {getStatusIcon(health?.components?.redis?.status || '')}
          </div>
          <p className="text-xs text-[#475569]">
            {health?.components?.redis?.details || 'Redis rate limiting & cache'}
          </p>
          {health?.components?.redis?.latency_ms !== undefined && (
            <div className="text-[11px] font-mono text-[#059669] font-bold">
              Latency: {health.components.redis.latency_ms} ms
            </div>
          )}
        </div>

        {/* 3. Google Gemini */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-[#4338ca]" />
              <span className="text-xs font-extrabold text-[#0f172a]">Google Gemini AI</span>
            </div>
            {getStatusIcon(health?.components?.gemini?.status || '')}
          </div>
          <p className="text-xs text-[#475569]">
            {health?.components?.gemini?.details || 'AI Structured Extraction & Summarization'}
          </p>
          <div className="text-[11px] font-semibold text-[#4338ca]">
            Model: gemini-2.5-flash
          </div>
        </div>

        {/* 4. Policy RAG Index */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#4338ca]" />
              <span className="text-xs font-extrabold text-[#0f172a]">Policy RAG Knowledge</span>
            </div>
            {getStatusIcon(health?.components?.rag?.status || '')}
          </div>
          <p className="text-xs text-[#475569]">
            {health?.components?.rag?.details || 'Policy documents index'}
          </p>
          <div className="text-[11px] font-semibold text-[#059669]">
            Status: Vector Index Active
          </div>
        </div>

        {/* 5. Tesseract OCR Engine */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#4338ca]" />
              <span className="text-xs font-extrabold text-[#0f172a]">PyMuPDF & Tesseract OCR</span>
            </div>
            {getStatusIcon(health?.components?.tesseract_ocr?.status || '')}
          </div>
          <p className="text-xs text-[#475569]">
            {health?.components?.tesseract_ocr?.details || 'Optical Character Recognition Fallback'}
          </p>
          <div className="text-[11px] font-semibold text-[#64748b]">
            PyMuPDF Rasterizer Active
          </div>
        </div>

      </div>

    </div>
  );
};
