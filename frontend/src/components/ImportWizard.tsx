import React, { useState, useRef } from 'react';
import { previewImport, commitImport } from '@/api/sources';
import { SourcePreviewResult, SourceImportResult } from '@/types/source';
import { ImportPreview } from './ImportPreview';
import { ImportResults } from './ImportResults';
import { UploadCloud, FileType2, Loader2, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportWizardProps {
  workspaceId: string;
  userId: string;
  onClose: () => void;
  onImportComplete?: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ workspaceId, userId, onClose, onImportComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SourcePreviewResult | null>(null);
  const [results, setResults] = useState<SourceImportResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
      setError(null);
    }
  };

  const createFormData = () => {
    const formData = new FormData();
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
    }
    return formData;
  };

  const handlePreview = async () => {
    if (!files || files.length === 0) {
      setError("Please select files or a vault archive to import.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await previewImport(workspaceId, createFormData());
      setPreview(data);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = createFormData();
      formData.append('created_by', userId);
      const data = await commitImport(workspaceId, formData);
      setResults(data);
      setStep(3);
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0c1017]/95 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-w-2xl max-h-[85vh]">
      <header className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <UploadCloud className="text-sky-400" />
          Import Knowledge
        </h2>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", step >= 1 ? "bg-sky-400" : "bg-slate-700")} />
          <div className={cn("w-6 h-px", step >= 2 ? "bg-sky-400/50" : "bg-slate-700")} />
          <div className={cn("w-2 h-2 rounded-full", step >= 2 ? "bg-sky-400" : "bg-slate-700")} />
          <div className={cn("w-6 h-px", step >= 3 ? "bg-sky-400/50" : "bg-slate-700")} />
          <div className={cn("w-2 h-2 rounded-full", step >= 3 ? "bg-sky-400" : "bg-slate-700")} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-6 p-3 bg-rose-950/40 border border-rose-800/50 text-rose-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-8 text-center flex flex-col items-center justify-center border-dashed">
              <div className="bg-slate-800/80 p-4 rounded-full mb-4">
                <FileType2 size={32} className="text-sky-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Select files or a vault</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                Upload Markdown files, plain text, PDFs, or a complete Obsidian vault archive (.zip).
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
                accept=".md,.markdown,.txt,.pdf,.zip" 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                Browse Files
              </button>
              
              {files && files.length > 0 && (
                <div className="mt-6 w-full max-w-sm text-left bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-slate-300 truncate">
                    {files.length === 1 ? files[0].name : `${files.length} files selected`}
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-xs text-slate-500 space-y-1 bg-slate-900/30 p-4 rounded-lg">
              <p className="font-semibold text-slate-400 mb-2">Supported Formats & Limits:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>.md, .markdown, .txt, .pdf, .zip (Vault)</li>
                <li>Max file size: 25 MB</li>
                <li>Max batch size: 500 files</li>
              </ul>
            </div>
          </div>
        )}

        {step === 2 && preview && (
          <ImportPreview preview={preview} />
        )}

        {step === 3 && results && (
          <ImportResults results={results} />
        )}
      </main>

      <footer className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
        {step < 3 ? (
          <>
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={step === 1 ? handlePreview : handleCommit}
              disabled={isLoading || (step === 1 && (!files || files.length === 0))}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {step === 1 ? 'Preview Import' : 'Confirm & Import'}
              {!isLoading && step === 1 && <ArrowRight size={16} />}
            </button>
          </>
        ) : (
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2 rounded-lg transition-colors"
          >
            <Check size={16} />
            Done
          </button>
        )}
      </footer>
    </div>
  );
};
