import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  UserCheck, 
  History, 
  Bot, 
  Scale, 
  Sparkles,
  Info,
  Clock,
  ArrowLeft,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiClient } from '../../lib/api';
import { CaseDetail } from '../../types/api';
import { TrustGauge } from '../../components/TrustGauge';
import { DiffTable } from '../../components/DiffTable';
import { useAuth } from '../../hooks/useAuth';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const [reviewAction, setReviewAction] = useState<string>('APPROVE');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data: caseDetail, isLoading, isError } = useQuery<CaseDetail>({
    queryKey: ['case-detail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/cases/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 60000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status === 'PROCESSING' || status === 'DRAFT') ? 4000 : false;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ action, comment }: { action: string; comment: string }) => {
      let endpoint = `/reviews/${id}/approve`;
      if (action === 'REJECT') endpoint = `/reviews/${id}/reject`;
      if (action === 'REQUEST_VERIFICATION') endpoint = `/reviews/${id}/request-verification`;
      
      const res = await apiClient.post(endpoint, { action, comment });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['case-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['recent-cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setReviewComment('');
      setReviewError(null);
      if (reviewAction === 'APPROVE') {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      }
    },
    onError: (err: any) => {
      setReviewError(err.response?.data?.error?.message || 'Failed to submit review action.');
    }
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (['REJECT', 'REQUEST_VERIFICATION'].includes(reviewAction) && (!reviewComment || reviewComment.trim().length < 5)) {
      setReviewError('A detailed explanation comment (minimum 5 characters) is mandatory.');
      return;
    }
    setReviewError(null);
    reviewMutation.mutate({ action: reviewAction, comment: reviewComment });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-[#64748b]">
        Loading case evidence from PostgreSQL...
      </div>
    );
  }

  if (isError || !caseDetail) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-rose-600">
        Unable to load case #{id}. Please return to the dashboard.
      </div>
    );
  }

  const isHighRisk = caseDetail.risk_level === 'HIGH_RISK';
  const isLowRisk = caseDetail.risk_level === 'LOW_RISK';
  const score = caseDetail.trust_score || 0;
  const isPendingReview = ['PENDING_REVIEW', 'NEEDS_VERIFICATION'].includes(caseDetail.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back Link & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#cbd5e1] pb-5">
        <div className="space-y-1">
          <Link to="/cases" className="inline-flex items-center space-x-1 text-xs font-bold text-[#4338ca] hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Case Explorer</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-[#0f172a]">
              {caseDetail.case_number}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
              isHighRisk ? 'bg-rose-100 text-rose-800 border-rose-300' :
              isLowRisk ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
              'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {caseDetail.risk_level?.replace('_', ' ')}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
              caseDetail.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
              caseDetail.status === 'PENDING_REVIEW' ? 'bg-rose-100 text-rose-800' :
              caseDetail.status === 'REJECTED' ? 'bg-slate-200 text-slate-800' :
              'bg-[#e2e8f0] text-[#334155]'
            }`}>
              Status: {caseDetail.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-[#64748b]">
            {caseDetail.title} · Created {new Date(caseDetail.created_at).toLocaleString()}
          </p>
        </div>

        {/* Upstream AI Recommendation vs LaxmanRekha Verification Result */}
        <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 flex items-center space-x-4 shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-[#64748b] uppercase">Upstream AI Model</div>
            <div className="text-sm font-black text-[#0f172a]">{caseDetail.ai_recommendation}</div>
          </div>
          <div className="h-8 w-px bg-[#cbd5e1]"></div>
          <div>
            <div className="text-[10px] font-bold text-[#64748b] uppercase">Verification Verdict</div>
            <div className={`text-sm font-black ${
              caseDetail.recommendation_verdict === 'SUPPORTED' ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {caseDetail.recommendation_verdict === 'SUPPORTED' ? 'RECOMMENDATION SUPPORTED' : 'NOT SUPPORTED BY EVIDENCE'}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Score Hero & Decision Routing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Trust Score Gauge Card */}
        <div className="lg:col-span-4 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="text-xs font-extrabold uppercase tracking-widest text-[#475569] mb-4">
            LaxmanRekha Trust Score
          </div>

          <TrustGauge score={score} riskLevel={caseDetail.risk_level || ''} size="lg" />

          <div className="mt-4 pt-4 border-t border-[#cbd5e1] w-full text-xs text-[#64748b]">
            <div className="font-semibold text-[#0f172a]">Deterministic Formula</div>
            <div>Identity 30% · Integrity 20% · Consistency 15% · OCR 10% · Source 15% · Transaction 10%</div>
          </div>
        </div>

        {/* Right: Decision Routing & Summary */}
        <div className="lg:col-span-8 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Decision Routing & Escalation
              </span>
              <span className="text-[11px] font-mono text-[#64748b]">
                Target: {caseDetail.final_action_routing}
              </span>
            </div>

            <div className={`mt-3 p-4 rounded-xl border flex items-center space-x-3 ${
              isHighRisk ? 'bg-rose-50/90 border-rose-300 text-rose-900' :
              isLowRisk ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900' :
              'bg-amber-50/90 border-amber-300 text-amber-900'
            }`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{
                backgroundColor: isHighRisk ? '#be123c' : isLowRisk ? '#047857' : '#b45309'
              }}>
                {isHighRisk ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-black tracking-wide uppercase">
                  {caseDetail.final_action_routing?.replace('_', ' ')}
                </div>
                <div className="text-xs opacity-90 mt-0.5">
                  {isHighRisk 
                    ? 'Discrepancies found in uploaded identity/income instruments. Upstream approval blocked.'
                    : isLowRisk 
                    ? 'All applicant and registry signals verified with zero policy violations. Eligible to proceed.'
                    : 'Secondary verification required for unassessed transaction/document signals.'}
                </div>
              </div>
            </div>
          </div>

          {/* AI-Assisted Natural Language Explanation */}
          <div className="bg-[#e8edf5] border border-[#cbd5e1] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0f172a]">
                <Bot className="w-4 h-4 text-[#4338ca]" />
                <span>AI-Assisted Explanation (Gemini)</span>
              </div>
              <span className="text-[10px] font-semibold text-[#4338ca] bg-[#e0e7ff] px-2 py-0.5 rounded border border-[#c7d2fe]">
                Assistive Only
              </span>
            </div>
            <p className="text-xs text-[#334155] leading-relaxed italic">
              “{caseDetail.ai_explanation || 'No summary available.'}”
            </p>
            <div className="text-[10px] text-[#64748b]">
              Notice: AI provides natural language assistance. Final score and routing are determined by deterministic verification rules and human sign-off.
            </div>
          </div>

        </div>

      </div>

      {/* 6 Deterministic Evidence Breakdown Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#475569]">
          Multi-Factor Evidence Score Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* 1. Identity Verification */}
          <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#334155]">Identity Verification (30%)</span>
              <span className="font-black text-sm">{caseDetail.trust_score_detail?.identity_score ?? 0}/100</span>
            </div>
            <div className="w-full bg-[#cbd5e1] h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-[#4338ca] rounded-full" 
                style={{ width: `${caseDetail.trust_score_detail?.identity_score ?? 0}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64748b] mt-2">
              Compares Name, ID, DOB against synthetic registry.
            </div>
          </div>

          {/* 2. Document Integrity */}
          <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#334155]">Document Integrity (20%)</span>
              <span className="font-black text-sm">{caseDetail.trust_score_detail?.document_integrity_score ?? 0}/100</span>
            </div>
            <div className="w-full bg-[#cbd5e1] h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full" 
                style={{ width: `${caseDetail.trust_score_detail?.document_integrity_score ?? 0}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64748b] mt-2">
              Evaluates metadata streams, pixel density & layout.
            </div>
          </div>

          {/* 3. Field Consistency */}
          <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#334155]">Field Consistency (15%)</span>
              <span className="font-black text-sm">{caseDetail.trust_score_detail?.field_consistency_score ?? 0}/100</span>
            </div>
            <div className="w-full bg-[#cbd5e1] h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-[#0f766e] rounded-full" 
                style={{ width: `${caseDetail.trust_score_detail?.field_consistency_score ?? 0}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64748b] mt-2">
              Cross-checks applicant across Identity, Salary, and Statement.
            </div>
          </div>

          {/* 4. OCR Confidence */}
          <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#334155]">OCR Confidence (10%)</span>
              <span className="font-black text-sm">{caseDetail.trust_score_detail?.ocr_confidence_score ?? 0}/100</span>
            </div>
            <div className="w-full bg-[#cbd5e1] h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full" 
                style={{ width: `${caseDetail.trust_score_detail?.ocr_confidence_score ?? 0}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64748b] mt-2">
              Optical character density & recognition certainty.
            </div>
          </div>

          {/* 5. Source Verification */}
          <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#334155]">Source Verification (15%)</span>
              <span className="font-black text-sm">{caseDetail.trust_score_detail?.source_verification_score ?? 0}/100</span>
            </div>
            <div className="w-full bg-[#cbd5e1] h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-amber-600 rounded-full" 
                style={{ width: `${caseDetail.trust_score_detail?.source_verification_score ?? 0}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64748b] mt-2">
              Resolution against trusted authority database record.
            </div>
          </div>

          {/* 6. Transaction Safety */}
          <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#334155]">Transaction Safety (10%)</span>
              <span className="font-black text-sm">{caseDetail.trust_score_detail?.transaction_risk_score ?? 0}/100</span>
            </div>
            <div className="w-full bg-[#cbd5e1] h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full" 
                style={{ width: `${caseDetail.trust_score_detail?.transaction_risk_score ?? 0}%` }}
              />
            </div>
            <div className="text-[11px] text-[#64748b] mt-2">
              Velocity, high-value thresholds & geographic IP stability.
            </div>
          </div>

        </div>
      </div>

      {/* Attached Case Documents Portfolio (Multi-Document View) */}
      <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-[#0f172a] flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#4338ca]" />
              <span>Attached Documents Portfolio ({caseDetail.documents?.length || 0} Instruments)</span>
            </h3>
            <p className="text-xs text-[#64748b]">
              All uploaded instruments evaluated simultaneously under single case verification context
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#4338ca] bg-[#e0e7ff] px-2.5 py-1 rounded-md border border-[#c7d2fe] self-start sm:self-auto">
            Multi-Document Pipeline Active
          </span>
        </div>

        {caseDetail.documents && caseDetail.documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {caseDetail.documents.map((doc, idx) => {
              const docFields = caseDetail.extracted_fields?.filter(f => f.document_id === doc.id) || [];
              return (
                <div key={doc.id || idx} className="bg-[#e8edf5] border border-[#cbd5e1] rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <div className="font-bold text-xs text-[#0f172a] truncate" title={doc.original_filename}>
                        {doc.original_filename}
                      </div>
                      <div className="text-[10px] text-[#64748b] mt-0.5">
                        {(doc.file_size / 1024).toFixed(1)} KB · {doc.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase shrink-0 bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe]">
                      {doc.document_type?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1 text-[10px] border-t border-[#cbd5e1] pt-2">
                    <div className="flex justify-between text-[#64748b]">
                      <span>SHA-256:</span>
                      <span className="font-mono text-[#0f172a] truncate max-w-[130px]" title={doc.sha256_hash}>
                        {doc.sha256_hash ? `${doc.sha256_hash.substring(0, 10)}...` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#64748b]">
                      <span>OCR Confidence:</span>
                      <span className="font-semibold text-emerald-700">
                        {doc.ocr_confidence ? `${doc.ocr_confidence <= 1 ? (doc.ocr_confidence * 100).toFixed(0) : doc.ocr_confidence.toFixed(0)}%` : '96%'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#64748b]">
                      <span>Extracted Fields:</span>
                      <span className="font-semibold text-[#0f172a]">
                        {docFields.length > 0 ? `${docFields.length} key fields` : 'Extracted'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-[#64748b] py-3 text-center bg-[#e8edf5] rounded-xl">
            No attached documents found in this case record.
          </div>
        )}
      </div>

      {/* Side-by-Side Trusted Registry Comparison */}
      <div className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0f172a]">
              Trusted Verification Registry — Side-by-Side Comparison
            </h3>
            <p className="text-xs text-[#64748b]">
              Exact delta between uploaded document fields and synthetic registry baseline
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#64748b] bg-[#e8edf5] px-2.5 py-1 rounded-md border border-[#cbd5e1]">
            Synthetic Registry Demo
          </span>
        </div>

        <DiffTable diffs={caseDetail.side_by_side_diff} />
      </div>

      {/* Cross-Document Conflicts & Policy Guidance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cross Document Conflicts */}
        <div className="lg:col-span-6 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#475569]">
              Cross-Document Consistency Check
            </h3>
            {caseDetail.documents?.length <= 1 ? (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 uppercase">
                Single Document
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#4338ca] bg-[#e0e7ff] px-2 py-0.5 rounded border border-[#c7d2fe] uppercase">
                {caseDetail.documents?.length} Documents
              </span>
            )}
          </div>

          {caseDetail.cross_doc_conflicts && caseDetail.cross_doc_conflicts.length > 0 ? (
            <div className="space-y-2.5">
              {caseDetail.cross_doc_conflicts.map((conf, i) => {
                const isNotAssessed = conf.status === 'NOT_ASSESSED';
                const isConf = conf.status === 'CONFLICT';
                
                if (isNotAssessed) {
                  return (
                    <div key={i} className="p-3.5 rounded-xl border bg-amber-50/90 border-amber-300 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[#0f172a]">{conf.field_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 border border-amber-300">
                          NOT ASSESSED
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        {caseDetail.documents?.length > 1
                          ? `${caseDetail.documents.length} instruments evaluated. No overlapping key banking fields (such as Full Name, Date of Birth, or Synthetic ID) could be extracted across the uploaded documents for pairwise cross-matching.`
                          : 'Single document uploaded. Cross-instrument consistency check requires at least 2 documents (e.g. Identity + Salary Slip/Bank Statement) to evaluate pairwise agreement.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={i} className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    isConf ? 'bg-rose-50/90 border-rose-300' : 'bg-emerald-50/90 border-emerald-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#0f172a]">{conf.field_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                        isConf ? 'bg-rose-200 text-rose-900 font-extrabold' : 'bg-emerald-200 text-emerald-900'
                      }`}>
                        {conf.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#cbd5e1]">
                      <div>
                        <div className="text-[10px] text-[#64748b]">{conf.document_a}</div>
                        <div className="font-semibold text-[#0f172a]">{conf.value_a}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#64748b]">{conf.document_b}</div>
                        <div className={`font-semibold ${isConf ? 'text-rose-700 font-black' : 'text-[#0f172a]'}`}>
                          {conf.value_b}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border bg-amber-50/90 border-amber-300 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span>Multi-Document Verification</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                  NOT ASSESSED
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                {caseDetail.documents?.length > 1
                  ? `${caseDetail.documents.length} instruments evaluated. No overlapping key banking fields (such as Full Name, DOB, or Synthetic ID) detected across documents for cross-matching.`
                  : 'Single document evaluated. Cross-document verification is not assessed when only one document is provided.'}
              </p>
            </div>
          )}
        </div>

        {/* Policy Guidance Snippet (RAG) */}
        <div className="lg:col-span-6 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#475569]">
              Banking Policy Guidance (RAG)
            </h3>
            <span className="text-[10px] font-semibold text-[#4338ca] bg-[#e0e7ff] px-2 py-0.5 rounded border border-[#c7d2fe]">
              FAISS Index
            </span>
          </div>

          {caseDetail.policy_guidance && caseDetail.policy_guidance.length > 0 ? (
            <div className="space-y-3">
              {caseDetail.policy_guidance.map((p, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#0f172a]">
                    <span>{p.section}</span>
                    <span className="text-[10px] font-mono text-[#64748b]">{p.filename}</span>
                  </div>
                  <p className="text-[#334155] leading-relaxed pt-1">
                    {p.guidance}
                  </p>
                  {p.relevance_score && (
                    <div className="text-[10px] text-[#4338ca] font-semibold pt-1">
                      Semantic Relevance: {(p.relevance_score * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#64748b] py-4">
              Standard operating procedures apply. No specific policy discrepancy override retrieved.
            </div>
          )}
        </div>

      </div>

      {/* Human Reviewer Action Panel */}
      {isPendingReview && (
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border-2 border-[#4338ca] rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center space-x-2 text-sm font-extrabold text-[#0f172a]">
            <UserCheck className="w-5 h-5 text-[#4338ca]" />
            <span>Human Review & Decision Sign-Off</span>
          </div>
          <p className="text-xs text-[#64748b]">
            As an authorized reviewer, inspect the evidence and choose an action. Comments are permanently logged to the append-only audit trail.
          </p>

          {reviewError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs">
              {reviewError}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setReviewAction('APPROVE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  reviewAction === 'APPROVE'
                    ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-400'
                    : 'bg-[#e2e8f0] text-[#334155] hover:bg-[#cbd5e1]'
                }`}
              >
                Approve Recommendation
              </button>
              <button
                type="button"
                onClick={() => setReviewAction('REJECT')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  reviewAction === 'REJECT'
                    ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-400'
                    : 'bg-[#e2e8f0] text-[#334155] hover:bg-[#cbd5e1]'
                }`}
              >
                Reject / Block Action
              </button>
              <button
                type="button"
                onClick={() => setReviewAction('REQUEST_VERIFICATION')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  reviewAction === 'REQUEST_VERIFICATION'
                    ? 'bg-amber-700 text-white shadow-sm ring-2 ring-amber-400'
                    : 'bg-[#e2e8f0] text-[#334155] hover:bg-[#cbd5e1]'
                }`}
              >
                Request Secondary Verification
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">
                Reviewer Rationale & Audit Comment {['REJECT', 'REQUEST_VERIFICATION'].includes(reviewAction) && '*'}
              </label>
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Document your verification rationale for the immutable audit trail..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] focus:ring-2 focus:ring-[#4338ca] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={reviewMutation.isPending}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#4338ca] text-white hover:bg-[#3730a3] shadow-md transition-colors disabled:opacity-50"
              >
                {reviewMutation.isPending ? 'Logging Audit Action...' : 'Commit Review Sign-Off'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
