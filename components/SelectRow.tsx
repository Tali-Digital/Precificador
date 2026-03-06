
import React from 'react';
import type { Opcao } from '../types';

interface SelectRowProps {
  rotulo: string;
  nome: string;
  valor: number;
  aoMudar: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  opcoes: Opcao[];
  descricao?: string;
}

export const SelectRow: React.FC<SelectRowProps> = ({ rotulo, nome, valor, aoMudar, opcoes, descricao }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center py-3 border-b border-slate-800">
      <label htmlFor={nome} className="font-medium text-slate-300">
        {rotulo}
      </label>
      <span className="text-slate-400 text-sm md:text-base col-span-1">{descricao}</span>
      <select
        id={nome}
        name={nome}
        value={valor}
        onChange={aoMudar}
        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
      >
        {opcoes.map(opcao => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
};