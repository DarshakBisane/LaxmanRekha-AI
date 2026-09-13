import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  FileText, 
  UploadCloud, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Trash2, 
  Sparkles, 
  Bot, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  FileCheck,
  Plus
} from 'lucide-react';
import { apiClient } from '../../lib/api';

const caseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  case_type: z.string(),
  ai_recommendation: z.string(),
  transaction_amount: z.number().optional(),
  transaction_currency: z.string(),
  transaction_type: z.string(),
  transaction_count_24h: z.number(),
  is_new_device: z.boolean(),
  is_unusual_location: z.boolean(),
});

type CaseFormData = z.infer<typeof caseSchema>;

interface UploadedFileItem {
  file: File;
  doc_type: string;
}

export const CreateCasePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: 'Personal Credit Facility Application',
      description: 'Retail loan application for prime applicant seeking Rs. 4,50,000 credit line.',
      case_type: 'LOAN_APPLICATION',
      ai_recommendation: 'APPROVE LOAN',
      transaction_amount: 450000,
      transaction_currency: 'INR',
      transaction_type: 'LOAN_DISBURSEMENT',
      transaction_count_24h: 1,
      is_new_device: false,
      is_unusual_location: false,
    }
  });

  const selectedAiRec = watch('ai_recommendation');

  const processIncomingFiles = (filesList: FileList | File[], defaultDocType?: string) => {
    setErrorMsg(null);
    const newItems: UploadedFileItem[] = [];

    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const maxMb = 10;

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const lowerName = file.name.toLowerCase();
      const hasValidExt = allowedExtensions.some(ext => lowerName.endsWith(ext));

      if (!hasValidExt) {
        setErrorMsg(`Unsupported file type: ${file.name}. Allowed: PDF, JPG, JPEG, PNG.`);
        continue;
      }

      if (file.size > maxMb * 1024 * 1024) {
        setErrorMsg(`File ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 10 MB limit.`);
        continue;
      }

      // Infer initial document type from filename if not specified
      let detectedType = defaultDocType || 'UNKNOWN';
      if (!defaultDocType) {
        if (lowerName.includes('id') || lowerName.includes('pan') || lowerName.includes('kyc') || lowerName.includes('synth')) {
          detectedType = 'IDENTITY';
        } else if (lowerName.includes('salary') || lowerName.includes('pay') || lowerName.includes('income')) {
          detectedType = 'SALARY_SLIP';
        } else if (lowerName.includes('statement') || lowerName.includes('bank') || lowerName.includes('passbook')) {
          detectedType = 'BANK_STATEMENT';
        } else if (lowerName.includes('address') || lowerName.includes('utility') || lowerName.includes('bill')) {
          detectedType = 'ADDRESS_PROOF';
        }
      }

      newItems.push({ file, doc_type: detectedType });
    }

    setUploadedFiles(prev => {
      const total = [...prev, ...newItems];
      if (total.length > 5) {
        setErrorMsg('Maximum limit is 5 documents per case. Retaining first 5 documents.');
        return total.slice(0, 5);
      }
      return total;
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateDocType = (index: number, newType: string) => {
    setUploadedFiles(prev => prev.map((item, i) => i === index ? { ...item, doc_type: newType } : item));
  };

  const executePipeline = async (data: CaseFormData) => {
    if (uploadedFiles.length === 0) {
      setErrorMsg('Please upload at least one verification document before analyzing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Step 1: Create Case in PostgreSQL
      setAnalysisStage('Creating case record in database...');
      const caseRes = await apiClient.post('/cases', data);
      const caseId = caseRes.data.id;

      // Step 2: Upload all documents in one case
      setAnalysisStage(`Uploading & hashing ${uploadedFiles.length} case documents...`);
      const formData = new FormData();
      for (const item of uploadedFiles) {
        formData.append('files', item.file);
      }

      await apiClient.post(`/cases/${caseId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Step 3: Execute full verification analysis pipeline
      setAnalysisStage('Running Trusted Registry & Multi-Document cross-consistency verification...');
      await new Promise(r => setTimeout(r, 400));
      setAnalysisStage('Querying Policy RAG knowledge base & synthesizing deterministic Trust Score...');
      await apiClient.post(`/cases/${caseId}/analyze`);
      
      setAnalysisStage('Verification complete! Opening case results...');
      await new Promise(r => setTimeout(r, 300));
      navigate(`/cases/${caseId}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Error occurred during case processing. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Step Indicators */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">New Verification Case</h1>
            <p className="text-xs text-[#64748b]">LaxmanRekha AI — Multi-Instrument Verification Pipeline</p>
          </div>
          <div className="text-xs font-bold text-[#4338ca] bg-[#e0e7ff] px-3 py-1 rounded-full border border-[#c7d2fe]">
            Step {currentStep} of 3
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className={`h-2 rounded-full transition-colors ${currentStep >= 1 ? 'bg-[#4338ca]' : 'bg-[#cbd5e1]'}`}></div>
          <div className={`h-2 rounded-full transition-colors ${currentStep >= 2 ? 'bg-[#4338ca]' : 'bg-[#cbd5e1]'}`}></div>
          <div className={`h-2 rounded-full transition-colors ${currentStep >= 3 ? 'bg-[#4338ca]' : 'bg-[#cbd5e1]'}`}></div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Wizard */}
      <form onSubmit={handleSubmit(executePipeline)} className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Step 1: Case Details & Upstream Recommendation */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-[#cbd5e1] pb-3">
              <h2 className="text-base font-extrabold text-[#0f172a]">01. Case Information & Upstream AI Context</h2>
              <p className="text-xs text-[#64748b]">Specify the case title and the banking AI recommendation to be verified.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Case Title / Reference</label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] focus:ring-2 focus:ring-[#4338ca] focus:bg-white focus:outline-hidden"
              />
              {errors.title && <p className="text-rose-600 text-[11px] mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Case Type</label>
                <select
                  {...register('case_type')}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] focus:ring-2 focus:ring-[#4338ca] focus:bg-white focus:outline-hidden"
                >
                  <option value="LOAN_APPLICATION">Personal Loan Application</option>
                  <option value="TRANSACTION_VERIFICATION">High-Value Transaction Verification</option>
                  <option value="KYC_ONBOARDING">Customer Due Diligence / KYC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Banking AI Recommendation</label>
                <div className="grid grid-cols-2 gap-2">
                  {['APPROVE LOAN', 'REJECT LOAN', 'APPROVE TRANSACTION', 'FLAG TRANSACTION'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setValue('ai_recommendation', preset)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedAiRec === preset
                          ? 'bg-[#0f172a] text-white shadow-xs'
                          : 'bg-[#e8edf5] text-[#334155] hover:bg-[#cbd5e1]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Underwriter Notes / Context</label>
              <textarea
                rows={2}
                {...register('description')}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] focus:ring-2 focus:ring-[#4338ca] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#4338ca] text-white hover:bg-[#3730a3] transition-colors flex items-center space-x-1.5"
              >
                <span>Continue to Transaction Safety Parameters</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Transaction Context */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-[#cbd5e1] pb-3">
              <h2 className="text-base font-extrabold text-[#0f172a]">02. Transaction Safety Parameters</h2>
              <p className="text-xs text-[#64748b]">Parameters evaluated against velocity and risk rules.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Requested Amount (INR)</label>
                <input
                  type="number"
                  {...register('transaction_amount', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] focus:ring-2 focus:ring-[#4338ca] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">24h Transaction Velocity</label>
                <input
                  type="number"
                  {...register('transaction_count_24h', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-[#0f172a] focus:ring-2 focus:ring-[#4338ca] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center space-x-3 p-3.5 rounded-xl bg-[#e8edf5] border border-[#cbd5e1] cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_new_device')}
                  className="w-4 h-4 rounded text-[#4338ca] focus:ring-[#4338ca]"
                />
                <div>
                  <div className="text-xs font-bold text-[#0f172a]">New Client Device</div>
                  <div className="text-[10px] text-[#64748b]">Unrecognized browser or device signature</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3.5 rounded-xl bg-[#e8edf5] border border-[#cbd5e1] cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_unusual_location')}
                  className="w-4 h-4 rounded text-[#4338ca] focus:ring-[#4338ca]"
                />
                <div>
                  <div className="text-xs font-bold text-[#0f172a]">Unusual Geographic Location</div>
                  <div className="text-[10px] text-[#64748b]">Geo-IP distance anomaly detected</div>
                </div>
              </label>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#e2e8f0] text-[#334155] hover:bg-[#cbd5e1] transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#4338ca] text-white hover:bg-[#3730a3] transition-colors flex items-center space-x-1.5"
              >
                <span>Continue to Multiple Document Upload</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Multiple Document Upload & Pipeline Execution */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-[#cbd5e1] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#0f172a]">03. Upload Case Documents</h2>
                <p className="text-xs text-[#64748b]">Select up to 5 documents (Identity card, Salary slip, Bank statement, Address proof, etc.).</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e8edf5] text-[#334155] border border-[#cbd5e1]">
                {uploadedFiles.length} / 5 Selected
              </span>
            </div>

            {/* Unified Drag & Drop Multiple Documents Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-[#4338ca] bg-[#e0e7ff]/60 scale-[1.01]' 
                  : 'border-[#cbd5e1] hover:border-[#4338ca] bg-[#e8edf5]/80 hover:bg-[#e8edf5]'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-[#4338ca] mx-auto mb-3" />
              <h3 className="text-sm font-extrabold text-[#0f172a]">
                Drag & drop multiple documents here
              </h3>
              <p className="text-xs text-[#64748b] mt-1">
                or click to browse from your device
              </p>
              <div className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#4338ca] text-white shadow-xs hover:bg-[#3730a3]">
                <Plus className="w-4 h-4" />
                <span>Select Documents</span>
              </div>
              <p className="text-[10px] text-[#64748b] mt-3">
                Accepted: PDF, JPG, JPEG, PNG · Maximum: 10 MB per file · Up to 5 documents per case
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Selected Documents List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#475569] uppercase tracking-wider">
                  <span>Selected Documents ({uploadedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFiles([])}
                    className="text-rose-600 hover:underline normal-case font-semibold text-[11px]"
                  >
                    Clear all
                  </button>
                </div>

                <div className="space-y-2">
                  {uploadedFiles.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-[#e8edf5] border border-[#cbd5e1] text-xs">
                      <div className="flex items-center space-x-3 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <div className="font-bold text-[#0f172a] truncate">{item.file.name}</div>
                          <div className="text-[10px] text-[#64748b]">
                            {(item.file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <select
                          value={item.doc_type}
                          onChange={(e) => updateDocType(idx, e.target.value)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-[#cbd5e1] text-[#334155] focus:outline-hidden"
                        >
                          <option value="IDENTITY">Identity Document</option>
                          <option value="SALARY_SLIP">Salary Slip</option>
                          <option value="BANK_STATEMENT">Bank Statement</option>
                          <option value="ADDRESS_PROOF">Address Proof</option>
                          <option value="FINANCIAL_DOCUMENT">Financial Doc</option>
                          <option value="SUPPORTING_DOCUMENT">Supporting Doc</option>
                          <option value="UNKNOWN">Uncertain / Auto</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-[#64748b] hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Progress Banner */}
            {isSubmitting && (
              <div className="p-4 rounded-xl bg-[#e0e7ff] border border-[#c7d2fe] space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#4338ca]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#4338ca]" />
                  <span>Executing LaxmanRekha Verification Pipeline...</span>
                </div>
                <div className="text-xs font-mono text-[#334155]">{analysisStage}</div>
              </div>
            )}

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#e2e8f0] text-[#334155] hover:bg-[#cbd5e1] transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || uploadedFiles.length === 0}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#3730a3] to-[#4338ca] text-white hover:opacity-95 shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Case...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Analyze Case ({uploadedFiles.length} Documents)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </form>

    </div>
  );
};

