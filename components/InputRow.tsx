import React from 'react';

interface InputRowProps {
  rotulo: string;
  nome: string;
  valor: number;
  aoMudar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  descricao?: string;
  eMoeda?: boolean;
  passo?: string | number;
  aoEditarDescricao?: () => void;
}

export const InputRow: React.FC<InputRowProps> = ({ rotulo, nome, valor, aoMudar, descricao, eMoeda = true, passo, aoEditarDescricao }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center py-3 border-b border-zinc-800">
      <label htmlFor={nome} className="font-medium text-gray-300">
        {rotulo}
      </label>
      <div className="flex items-center gap-2">
        {aoEditarDescricao ? (
          <button
            onClick={aoEditarDescricao}
            className="text-gray-400 text-sm md:text-base flex-grow hover:text-yellow-400 transition-colors cursor-pointer text-left p-0 bg-transparent border-none"
            aria-label={`Editar descrição: ${descricao}`}
          >
            {descricao}
          </button>
        ) : (
          <span className="text-gray-400 text-sm md:text-base flex-grow">{descricao}</span>
        )}
      </div>
      <div className="relative">
        {eMoeda && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>}
        <input
          type="number"
          id={nome}
          name={nome}
          value={valor}
          onChange={aoMudar}
          className={`w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 text-right pr-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition ${eMoeda ? 'pl-9' : 'pl-3'}`}
          step={passo ?? (eMoeda ? "100" : "1")}
        />
      </div>
    </div>
  );
};