
export interface Tarefa {
  id: number;
  nome: string;
  horas: number;
}

export interface Opcao {
  valor: number;
  rotulo: string;
}

export interface Recurso {
  id: number;
  nome: string;
  custo: number;
  horas: number;
  salario: number;
}