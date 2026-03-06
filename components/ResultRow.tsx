import React from 'react';

interface ResultRowProps {
  rotulo: string;
  valor: string;
  descricao?: React.ReactNode;
  destaque?: boolean;
  destaqueLinha?: boolean;
  aoEditar?: () => void;
  aoEditarDescricao?: () => void;
}

export const ResultRow: React.FC<ResultRowProps> = ({ rotulo, valor, descricao, destaque = false, destaqueLinha = false, aoEditar, aoEditarDescricao }) => {
  const isDescricaoEditavel = aoEditarDescricao && typeof descricao === 'string';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center py-3 border-b border-zinc-800 last:border-b-0 ${destaqueLinha ? 'bg-yellow-500/10 rounded-md px-3 -mx-3' : ''}`}>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${destaqueLinha ? 'text-gray-100' : 'text-gray-300'}`}>{rotulo}</span>
        {aoEditar && (
          <button onClick={aoEditar} className="text-gray-500 hover:text-yellow-400 transition-colors" aria-label={`Editar fórmula de ${rotulo}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
      </div>
      <div className={`text-sm md:text-base col-span-1 flex items-center gap-2 ${destaqueLinha ? 'text-gray-300' : 'text-gray-400'}`}>
        {isDescricaoEditavel ? (
          <button
            onClick={aoEditarDescricao}
            className="flex-grow text-left p-0 bg-transparent border-none text-current hover:text-yellow-400 transition-colors cursor-pointer"
            aria-label={`Editar descrição: ${descricao}`}
          >
            {descricao}
          </button>
        ) : (
          <div className="flex-grow">{descricao}</div>
        )}
      </div>
      <div className="text-right">
        <span className={`font-bold text-lg ${destaque ? 'bg-yellow-500/20 text-yellow-300 px-4 py-1.5 rounded-md' : (destaqueLinha ? 'text-yellow-200' : 'text-gray-200')}`}>
          {valor}
        </span>
      </div>
    </div>
  );
};