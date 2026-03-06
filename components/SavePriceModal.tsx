
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Marker {
  id: number;
  nome: string;
  cor: string;
}

interface SavePriceModalProps {
  estaAberto: boolean;
  markers: Marker[];
  aoFechar: () => void;
  aoSalvar: (nomeDoProjeto: string, markerId: number | null) => void;
}

export const SavePriceModal: React.FC<SavePriceModalProps> = ({ estaAberto, markers, aoFechar, aoSalvar }) => {
  const [nome, setNome] = useState('');
  const [markerId, setMarkerId] = useState<number | null>(null);

  useEffect(() => {
    if (estaAberto) {
      setNome('');
      setMarkerId(null);
    }
  }, [estaAberto]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && estaAberto && nome.trim()) {
        manipularSalvar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [estaAberto, nome]);

  if (!estaAberto) {
    return null;
  }

  const manipularSalvar = () => {
    if (nome.trim()) {
      aoSalvar(nome.trim(), markerId);
    }
  };

  const manipularCliqueFundo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      aoFechar();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4" onClick={manipularCliqueFundo}>
      <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-zinc-700">
          <h3 className="text-xl font-bold text-white">Salvar na Tabela</h3>
          <button onClick={aoFechar} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="project-name" className="block mb-2 font-medium text-gray-300">
              Nome do Projeto
            </label>
            <input
              id="project-name"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-md p-3 text-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
              placeholder="Ex: Website Institucional"
              autoFocus
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-300">Status Inicial</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMarkerId(null)}
                className={`text-xs font-bold py-2 rounded border transition-all ${markerId === null ? 'bg-zinc-700 border-zinc-500 text-white' : 'bg-transparent border-zinc-800 text-gray-500 hover:border-zinc-700'}`}
              >
                Sem Status
              </button>
              {markers.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMarkerId(m.id)}
                  className={`text-xs font-bold py-2 rounded border transition-all`}
                  style={{
                    backgroundColor: markerId === m.id ? `${m.cor}40` : 'transparent',
                    borderColor: markerId === m.id ? m.cor : '#27272a',
                    color: markerId === m.id ? '#ffffff' : m.cor
                  }}
                >
                  {m.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 p-4 bg-zinc-950/50 rounded-b-lg">
          <button onClick={aoFechar} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-md transition-colors">
            Cancelar
          </button>
          <button
            onClick={manipularSalvar}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-md transition-colors disabled:bg-yellow-800/50 disabled:cursor-not-allowed"
            disabled={!nome.trim()}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
