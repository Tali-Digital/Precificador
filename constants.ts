
// FIX: The type 'Option' was not defined in './types'. Changed to 'Opcao' and updated
// all instances to use the correct type and its properties ('valor', 'rotulo')
// for consistency with the rest of the application.
import type { Opcao } from './types';

export const COMPLEXITY_OPTIONS: Opcao[] = [
  { valor: 1.0, rotulo: '1,0 = Simples' },
  { valor: 1.15, rotulo: '1,15 = Médio' },
  { valor: 1.3, rotulo: '1,3 = Complexo' },
];

export const RESPONSIBILITY_OPTIONS: Opcao[] = [
  { valor: 1.0, rotulo: '1,0 = Pequeno' },
  { valor: 1.1, rotulo: '1,1 = Médio' },
  { valor: 1.3, rotulo: '1,3 = Grande' },
];

export const DEADLINE_OPTIONS: Opcao[] = [
  { valor: 1.0, rotulo: '1,0 = Normal' },
  { valor: 1.1, rotulo: '1,1 = Ajustado' },
  { valor: 1.3, rotulo: '1,3 = Urgente' },
  { valor: 1.5, rotulo: '1,5 = Crítico' },
];

export const CONFIDENTIALITY_OPTIONS: Opcao[] = [
  { valor: 1.0, rotulo: '1,0 = Normal' },
  { valor: 1.02, rotulo: '1,02 = Restrito' },
  { valor: 1.05, rotulo: '1,05 = Confidencial' },
  { valor: 1.08, rotulo: '1,08 = Ultra' },
];
