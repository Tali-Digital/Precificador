import React from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: string;
  isLoading: boolean;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, analysis, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Análise da Talí AI</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 text-yellow-500 animate-spin" />
              <p className="text-gray-400 animate-pulse">Analisando sua estratégia de precificação...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-gray-300">
              <Markdown>{analysis}</Markdown>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-zinc-950/50 rounded-b-lg flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-md transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
