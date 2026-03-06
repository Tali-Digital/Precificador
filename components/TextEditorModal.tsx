import React, { useState, useEffect } from 'react';

interface TextEditorModalProps {
  estaAberto: boolean;
  aoFechar: () => void;
  aoSalvar: (novoTexto: string) => void;
  titulo: string;
  textoInicial: string;
}

export const TextEditorModal: React.FC<TextEditorModalProps> = ({
  estaAberto,
  aoFechar,
  aoSalvar,
  titulo,
  textoInicial,
}) => {
  const [texto, setTexto] = useState(textoInicial);

  useEffect(() => {
    if (estaAberto) {
      setTexto(textoInicial);
    }
  }, [estaAberto, textoInicial]);

  if (!estaAberto) {
    return null;
  }

  const manipularSalvar = () => {
    aoSalvar(texto);
    aoFechar();
  };

  const manipularCliqueFundo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      aoFechar();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4" onClick={manipularCliqueFundo}>
      <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-zinc-700">
          <h3 className="text-xl font-bold text-white">{titulo}</h3>
          <button onClick={aoFechar} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <label htmlFor="text-editor" className="block mb-2 font-medium text-gray-300">
            Descrição
          </label>
          <input
            id="text-editor"
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-md p-3 text-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
          />
        </div>
        <div className="flex justify-end gap-4 p-4 bg-zinc-950/50 rounded-b-lg">
          <button onClick={aoFechar} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-md transition-colors">
            Cancelar
          </button>
          <button onClick={manipularSalvar} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-md transition-colors">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};