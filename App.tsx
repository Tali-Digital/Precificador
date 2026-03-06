
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  Check,
  Share2,
  Save,
  Info,
  FileText,
  Settings
} from 'lucide-react';
import type { Tarefa, Recurso } from './types';
import { InputRow } from './components/InputRow';
import { ResultRow } from './components/ResultRow';
import { Section } from './components/Section';
import { FormulaEditorModal } from './components/FormulaEditorModal';
import { TextEditorModal } from './components/TextEditorModal';
import { useUndoableState } from './hooks/useUndoableState';
import { SavePriceModal } from './components/SavePriceModal';
import { PricingTable } from './components/PricingTable';
import { SelectRow } from './components/SelectRow';
import { MarkerManager } from './components/MarkerManager';
import { COMPLEXITY_OPTIONS, RESPONSIBILITY_OPTIONS, DEADLINE_OPTIONS, CONFIDENTIALITY_OPTIONS } from './constants';

interface Marker {
  id: number;
  nome: string;
  cor: string;
}

interface SavedPrice {
  id: number;
  nome: string;
  tarefas: Tarefa[];
  valorSugerido: number;
  valorOportunidade: number;
  valorGanho: number;
  markerId?: number;
  markerNome?: string;
  markerCor?: string;
}

interface Template {
  id: number;
  nome: string;
  conteudo: string; // JSON string of the state
  createdAt: string;
}

interface AppState {
  entradasValorHora: {
    recursos: Recurso[];
    custoEmpresa: number;
  };
  entradasTrabalho: {
    custosDiretos: number;
    complexidade: number;
    responsabilidade: number;
    prazo: number;
    sigilo: number;
  };
  tarefas: Tarefa[];
  formulas: {
    precoHora: string;
    valorBase: string;
  };
  porcentagens: {
    margemErro: number;
    oportunidade: number;
    ganho: number;
  };
  descricoes: {
    precoHoraCalculo: string;
    precoHoraUso: string;
    horasTotais: string;
    custosDiretos: string;
    complexidade: string;
    responsabilidade: string;
    prazo: string;
    sigilo: string;
  };
  savedPrices: SavedPrice[];
  markers: Marker[];
  templates: Template[];
}

const initialState: AppState = {
  entradasValorHora: {
    recursos: [
      { id: Date.now(), nome: 'Diogo', custo: 5000, horas: 160, salario: 5000 },
      { id: Date.now() + 1, nome: 'Helenilton', custo: 5000, horas: 160, salario: 5000 },
    ],
    custoEmpresa: 500,
  },
  entradasTrabalho: {
    custosDiretos: 0,
    complexidade: 1.0,
    responsabilidade: 1.0,
    prazo: 1.0,
    sigilo: 1.0,
  },
  tarefas: [
    { id: Date.now() + 4, nome: 'Exemplo: Reunião de Briefing', horas: 2 },
    { id: Date.now() + 5, nome: 'Exemplo: Design da Interface', horas: 10 },
    { id: Date.now() + 6, nome: 'Exemplo: Desenvolvimento', horas: 6 },
  ],
  formulas: {
    precoHora: '(totalCustosFixos + custoEmpresa + totalSalarios) / totalHorasProdutivas',
    valorBase: 'precoHora * horasTotais * complexidade * responsabilidade * prazo * sigilo + custosDiretos',
  },
  porcentagens: {
    margemErro: 10,
    oportunidade: 25,
    ganho: 20,
  },
  descricoes: {
    precoHoraCalculo: "Valor da hora ->",
    precoHoraUso: "Valor da sua hora calculada previamente",
    horasTotais: "Número estimado de horas do projeto",
    custosDiretos: "Ferramentas, plugins, tráfego, etc.",
    complexidade: "Ex: 1,0 (simples), 1,15 (médio), 1,3 (complexo)",
    responsabilidade: "Ex: 1,0 (pequeno), 1,1 (médio), 1,3 (grande)",
    prazo: "Ex: 1,0 (normal), 1,3 (urgente), 1,5 (crítico)",
    sigilo: "Ex: 1,0 (normal), 1,05 (confidencial), 1,08 (ultra)",
  },
  savedPrices: [],
  markers: [],
  templates: [],
};

type Tab = 'precificador' | 'orçamentos' | 'modelos';

const App: React.FC = () => {
  const { state, setState, undo, redo } = useUndoableState<AppState>(initialState);
  const { entradasValorHora, entradasTrabalho, tarefas, formulas, porcentagens, descricoes, savedPrices } = state;
  const [activeTab, setActiveTab] = useState<Tab>('precificador');

  const [formulaEmEdicao, setFormulaEmEdicao] = useState<{
    chave: keyof typeof formulas;
    titulo: string;
    variaveis: string[];
  } | null>(null);

  const [descricaoEmEdicao, setDescricaoEmEdicao] = useState<{
    chave: keyof typeof descricoes;
    titulo: string;
  } | null>(null);

  const [isSavePriceModalOpen, setIsSavePriceModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isMarkerManagerOpen, setIsMarkerManagerOpen] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pricesRes, markersRes, templatesRes] = await Promise.all([
          fetch('/api/prices'),
          fetch('/api/markers'),
          fetch('/api/templates')
        ]);

        if (pricesRes.ok && markersRes.ok && templatesRes.ok) {
          const prices = await pricesRes.json();
          const markers = await markersRes.json();
          const templates = await templatesRes.json();
          setState(prev => ({
            ...prev,
            savedPrices: prices,
            markers: markers,
            templates: templates
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setIsLoadingPrices(false);
      }
    };
    fetchData();
  }, [setState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z') {
          event.preventDefault();
          undo();
        } else if (event.key === 'y') {
          event.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  const manipularEditarFormula = useCallback((chave: keyof typeof formulas, titulo: string, variaveis: string[]) => {
    setFormulaEmEdicao({ chave, titulo, variaveis });
  }, []);

  const manipularSalvarFormula = useCallback((novaFormula: string) => {
    if (formulaEmEdicao) {
      setState(prev => ({
        ...prev,
        formulas: { ...prev.formulas, [formulaEmEdicao.chave]: novaFormula }
      }));
      setFormulaEmEdicao(null);
    }
  }, [formulaEmEdicao, setState]);

  const manipularFecharModalFormula = useCallback(() => {
    setFormulaEmEdicao(null);
  }, []);

  const manipularEditarDescricao = useCallback((chave: keyof typeof descricoes, titulo: string) => {
    setDescricaoEmEdicao({ chave, titulo });
  }, []);

  const manipularSalvarDescricao = useCallback((novoTexto: string) => {
    if (descricaoEmEdicao) {
      setState(prev => ({
        ...prev,
        descricoes: { ...prev.descricoes, [descricaoEmEdicao.chave]: novoTexto }
      }));
      setDescricaoEmEdicao(null);
    }
  }, [descricaoEmEdicao, setState]);

  const manipularFecharModalDescricao = useCallback(() => {
    setDescricaoEmEdicao(null);
  }, []);

  const avaliarFormula = useCallback((formula: string, escopo: Record<string, number>): number => {
    try {
      const chaves = Object.keys(escopo);
      const valores = Object.values(escopo);
      const func = new Function(...chaves, `"use strict"; return ${formula}; `);
      const resultado = func(...valores);
      if (typeof resultado !== 'number' || !isFinite(resultado)) {
        return 0;
      }
      return resultado;
    } catch (error) {
      console.error(`Erro ao avaliar a fórmula "${formula}": `, error);
      return 0;
    }
  }, []);

  const manipularMudancaCustoEmpresa = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      entradasValorHora: { ...prev.entradasValorHora, [name]: parseFloat(value) || 0 }
    }));
  }, [setState]);

  const manipularMudancaRecurso = useCallback((id: number, campo: 'nome' | 'custo' | 'horas' | 'salario', valor: string | number) => {
    setState(prev => ({
      ...prev,
      entradasValorHora: {
        ...prev.entradasValorHora,
        recursos: prev.entradasValorHora.recursos.map(r =>
          r.id === id ? { ...r, [campo]: (campo !== 'nome') ? parseFloat(valor as string) || 0 : valor } : r
        )
      }
    }));
  }, [setState]);

  const adicionarRecurso = useCallback(() => {
    setState(prev => ({
      ...prev,
      entradasValorHora: {
        ...prev.entradasValorHora,
        recursos: [...prev.entradasValorHora.recursos, { id: Date.now(), nome: 'Novo Membro', custo: 0, horas: 0, salario: 0 }]
      }
    }));
  }, [setState]);

  const removerRecurso = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      entradasValorHora: {
        ...prev.entradasValorHora,
        recursos: prev.entradasValorHora.recursos.filter(r => r.id !== id)
      }
    }));
  }, [setState]);

  const manipularMudancaEntradaTrabalho = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      entradasTrabalho: { ...prev.entradasTrabalho, [name]: parseFloat(value) || 0 }
    }));
  }, [setState]);

  const manipularMudancaPorcentagem = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      porcentagens: { ...prev.porcentagens, [name]: parseFloat(value) || 0 }
    }));
  }, [setState]);

  const manipularMudancaTarefa = useCallback((id: number, campo: 'nome' | 'horas', valor: string | number) => {
    setState(prev => ({
      ...prev,
      tarefas: prev.tarefas.map(tarefa =>
        tarefa.id === id ? { ...tarefa, [campo]: campo === 'horas' ? parseFloat(valor as string) || 0 : valor } : tarefa
      )
    }));
  }, [setState]);

  const adicionarTarefa = useCallback(() => {
    setState(prev => ({
      ...prev,
      tarefas: [...prev.tarefas, { id: Date.now(), nome: '', horas: 0 }]
    }));
  }, [setState]);

  const removerTarefa = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      tarefas: prev.tarefas.filter(tarefa => tarefa.id !== id)
    }));
  }, [setState]);

  const handleSaveTemplate = async (nome: string) => {
    const templateData = {
      nome,
      conteudo: {
        entradasValorHora,
        entradasTrabalho,
        tarefas,
        formulas,
        porcentagens,
        descricoes
      }
    };

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setState(prev => ({
          ...prev,
          templates: [newTemplate, ...prev.templates]
        }));
      }
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
    }
  };

  const loadTemplate = (template: Template) => {
    try {
      const data = JSON.parse(template.conteudo);
      setState(prev => ({
        ...prev,
        ...data
      }));
      setActiveTab('precificador');
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
    }
  };

  const handleShare = () => {
    const text = `Precificação de Projeto - Talí
--------------------------------
  Valor da Hora: ${formatarMoeda(precoHora)}
Horas Totais: ${horasTotais} h
Custos Diretos: ${formatarMoeda(entradasTrabalho.custosDiretos)}
--------------------------------
  VALOR SUGERIDO: ${formatarMoeda(valorSugerido)}
Cenário Oportunidade: ${formatarMoeda(valorOportunidade)}
Cenário Ganho: ${formatarMoeda(valorGanho)}
--------------------------------
  Gerado via Precificador Talí`;

    navigator.clipboard.writeText(text).then(() => {
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    });
  };

  const handleSavePrice = async (nome: string, markerId: number | null) => {
    const priceData = {
      nome,
      valorSugerido,
      valorOportunidade,
      valorGanho,
      tarefas: tarefas.map(t => ({ nome: t.nome, horas: t.horas })),
      markerId
    };

    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priceData),
      });

      if (response.ok) {
        const savedPrice = await response.json();
        const currentMarker = state.markers.find(m => m.id === markerId);
        const savedPriceWithMarker = {
          ...savedPrice,
          markerNome: currentMarker?.nome,
          markerCor: currentMarker?.cor
        };
        setState(prev => ({
          ...prev,
          savedPrices: [savedPriceWithMarker, ...prev.savedPrices]
        }));
        setIsSavePriceModalOpen(false);
        setActiveTab('orçamentos');
      }
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
    }
  };

  const handleSaveMarker = async (nome: string, cor: string) => {
    try {
      const response = await fetch('/api/markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cor }),
      });
      if (response.ok) {
        const newMarker = await response.json();
        setState(prev => ({ ...prev, markers: [...prev.markers, newMarker] }));
      }
    } catch (error) {
      console.error('Erro ao salvar marcador:', error);
    }
  };

  const handleEditMarker = async (id: number, nome: string, cor: string) => {
    try {
      const response = await fetch(`/ api / markers / ${id} `, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cor }),
      });
      if (response.ok) {
        setState(prev => ({
          ...prev,
          markers: prev.markers.map(m => m.id === id ? { ...m, nome, cor } : m),
          savedPrices: prev.savedPrices.map(p => p.markerId === id ? { ...p, markerNome: nome, markerCor: cor } : p)
        }));
      }
    } catch (error) {
      console.error('Erro ao editar marcador:', error);
    }
  };

  const handleDeleteMarker = async (id: number) => {
    if (!confirm('Excluir este marcador? Orçamentos associados ficarão sem status.')) return;
    try {
      const response = await fetch(`/ api / markers / ${id} `, { method: 'DELETE' });
      if (response.ok) {
        setState(prev => ({
          ...prev,
          markers: prev.markers.filter(m => m.id !== id),
          savedPrices: prev.savedPrices.map(p => p.markerId === id ? { ...p, markerId: undefined, markerNome: undefined, markerCor: undefined } : p)
        }));
      }
    } catch (error) {
      console.error('Erro ao excluir marcador:', error);
    }
  };

  const handleDeletePrice = async (id: number) => {
    try {
      const response = await fetch(`/ api / prices / ${id} `, {
        method: 'DELETE',
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          savedPrices: prev.savedPrices.filter(p => p.id !== id)
        }));
      }
    } catch (error) {
      console.error('Erro ao excluir preço:', error);
    }
  };

  const totalCustosFixos = useMemo(() => {
    return entradasValorHora.recursos.reduce((soma, recurso) => soma + recurso.custo, 0);
  }, [entradasValorHora.recursos]);

  const totalSalarios = useMemo(() => {
    return entradasValorHora.recursos.reduce((soma, recurso) => soma + recurso.salario, 0);
  }, [entradasValorHora.recursos]);

  const totalHorasProdutivas = useMemo(() => {
    return entradasValorHora.recursos.reduce((soma, recurso) => soma + recurso.horas, 0);
  }, [entradasValorHora.recursos]);

  const precoHora = useMemo(() => {
    const escopo = {
      totalCustosFixos,
      totalHorasProdutivas,
      custoEmpresa: entradasValorHora.custoEmpresa,
      totalSalarios,
    };
    return avaliarFormula(formulas.precoHora, escopo);
  }, [entradasValorHora, totalCustosFixos, totalHorasProdutivas, totalSalarios, formulas.precoHora, avaliarFormula]);

  const horasTotais = useMemo(() => {
    return tarefas.reduce((soma, tarefa) => soma + tarefa.horas, 0);
  }, [tarefas]);

  const valorBase = useMemo(() => {
    const escopo = { precoHora, horasTotais, ...entradasTrabalho };
    return avaliarFormula(formulas.valorBase, escopo);
  }, [precoHora, horasTotais, entradasTrabalho, formulas.valorBase, avaliarFormula]);

  const valorSugerido = useMemo(() => {
    return valorBase * (1 + porcentagens.margemErro / 100);
  }, [valorBase, porcentagens.margemErro]);

  const valorOportunidade = useMemo(() => {
    return valorSugerido * (1 - porcentagens.oportunidade / 100);
  }, [valorSugerido, porcentagens.oportunidade]);

  const valorGanho = useMemo(() => {
    return valorSugerido * (1 + porcentagens.ganho / 100);
  }, [valorSugerido, porcentagens.ganho]);

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const TabButton: React.FC<{ tabId: Tab, children: React.ReactNode }> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px - 4 py - 2 text - sm font - medium rounded - md transition - colors ${activeTab === tabId ? 'bg-yellow-500 text-black' : 'text-gray-300 hover:bg-zinc-800'} `}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
            Precificador Talí
          </h1>
          <p className="mt-2 text-lg text-gray-400">Calcule o valor dos seus projetos com precisão.</p>
        </header>

        <nav className="flex justify-center mb-8 bg-zinc-900 p-2 rounded-lg shadow-md space-x-2">
          <TabButton tabId="precificador">Precificador</TabButton>
          <TabButton tabId="orçamentos">
            Orçamentos {savedPrices.length > 0 && <span className="ml-2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">{savedPrices.length}</span>}
          </TabButton>
          <TabButton tabId="modelos">Modelos</TabButton>
        </nav>

        <main>
          {activeTab === 'precificador' && (
            <>
              <Section titulo="1. Qual o valor da hora?">
                <div className="space-y-4">
                  <div className="space-y-3">
                    {entradasValorHora.recursos.map((recurso) => (
                      <div key={recurso.id} className="flex items-end gap-4 p-3 bg-zinc-800/50 rounded-md">
                        <div className="flex-grow">
                          <label htmlFor={`recurso - nome - ${recurso.id} `} className="block text-xs font-medium text-gray-400 mb-1">Nome do Membro</label>
                          <input
                            id={`recurso - nome - ${recurso.id} `}
                            type="text"
                            placeholder="Nome"
                            value={recurso.nome}
                            onChange={(e) => manipularMudancaRecurso(recurso.id, 'nome', e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
                          />
                        </div>
                        <div>
                          <label htmlFor={`recurso - custo - ${recurso.id} `} className="block text-xs font-medium text-gray-400 mb-1">Custo Fixo Mensal</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                            <input
                              id={`recurso - custo - ${recurso.id} `}
                              type="number"
                              title={`Custo fixo de ${recurso.nome} `}
                              value={recurso.custo}
                              onChange={(e) => manipularMudancaRecurso(recurso.id, 'custo', e.target.value)}
                              className="w-32 bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-right pl-9 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor={`recurso - salario - ${recurso.id} `} className="block text-xs font-medium text-gray-400 mb-1">Salário Desejado</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                            <input
                              id={`recurso - salario - ${recurso.id} `}
                              type="number"
                              title={`Salário desejado de ${recurso.nome} `}
                              value={recurso.salario}
                              onChange={(e) => manipularMudancaRecurso(recurso.id, 'salario', e.target.value)}
                              className="w-32 bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-right pl-9 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor={`recurso - horas - ${recurso.id} `} className="block text-xs font-medium text-gray-400 mb-1">Horas Produtivas/Mês</label>
                          <div className="relative">
                            <input
                              id={`recurso - horas - ${recurso.id} `}
                              type="number"
                              title={`Horas produtivas de ${recurso.nome} `}
                              value={recurso.horas}
                              onChange={(e) => manipularMudancaRecurso(recurso.id, 'horas', e.target.value)}
                              className="w-28 bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-right pr-14 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">h/mês</span>
                          </div>
                        </div>
                        <button onClick={() => removerRecurso(recurso.id)} className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full bg-zinc-800 hover:bg-red-500/20" aria-label={`Remover ${recurso.nome} `}>
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={adicionarRecurso} className="mt-4 w-full text-sm bg-zinc-800 hover:bg-zinc-700/80 text-yellow-400 font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Membro
                  </button>
                </div>
                <div className="mt-6 pt-6 border-t border-zinc-800 space-y-2">
                  <InputRow rotulo="Custo Fixo da Empresa (R$)" nome="custoEmpresa" valor={entradasValorHora.custoEmpresa} aoMudar={manipularMudancaCustoEmpresa} />
                  <ResultRow rotulo="Preço Hora" valor={formatarMoeda(precoHora)} descricao={descricoes.precoHoraCalculo} aoEditar={() => manipularEditarFormula('precoHora', 'Editar Fórmula do Preço Hora', ['totalCustosFixos', 'totalHorasProdutivas', 'custoEmpresa', 'totalSalarios'])} aoEditarDescricao={() => manipularEditarDescricao('precoHoraCalculo', 'Editar Descrição Preço Hora')} />
                </div>
              </Section>

              <Section titulo="2. Calculador de Horas por trabalho">
                <div className="space-y-3">
                  {tarefas.map((tarefa, index) => (
                    <div key={tarefa.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-md">
                      <span className="text-gray-400 font-mono">{index + 1}.</span>
                      <input
                        type="text"
                        placeholder="Nome da tarefa"
                        value={tarefa.nome}
                        onChange={(e) => manipularMudancaTarefa(tarefa.id, 'nome', e.target.value)}
                        className="flex-grow bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
                      />
                      <input
                        type="number"
                        value={tarefa.horas}
                        onChange={(e) => manipularMudancaTarefa(tarefa.id, 'horas', e.target.value)}
                        className="w-24 bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-right focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
                      />
                      <span className="text-gray-400">horas</span>
                      <button onClick={() => removerTarefa(tarefa.id)} className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full bg-zinc-800 hover:bg-red-500/20">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={adicionarTarefa} className="mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" />
                  Adicionar Tarefa
                </button>
              </Section>

              <Section titulo="3. Quanto cobrar por um trabalho?">
                <ResultRow rotulo="Preço Hora" valor={formatarMoeda(precoHora)} descricao={descricoes.precoHoraUso} aoEditarDescricao={() => manipularEditarDescricao('precoHoraUso', 'Editar Descrição Preço Hora (Uso)')} />
                <ResultRow rotulo="Horas Previstas" valor={`${horasTotais} h`} descricao={descricoes.horasTotais} aoEditarDescricao={() => manipularEditarDescricao('horasTotais', 'Editar Descrição Horas Previstas')} />
                <InputRow rotulo="Custos Diretos (R$)" nome="custosDiretos" valor={entradasTrabalho.custosDiretos} aoMudar={manipularMudancaEntradaTrabalho} descricao={descricoes.custosDiretos} aoEditarDescricao={() => manipularEditarDescricao('custosDiretos', 'Editar Descrição Custos Diretos')} />
                <SelectRow rotulo="Complexidade" nome="complexidade" valor={entradasTrabalho.complexidade} aoMudar={manipularMudancaEntradaTrabalho} opcoes={COMPLEXITY_OPTIONS} descricao={descricoes.complexidade} />
                <SelectRow rotulo="Responsabilidade" nome="responsabilidade" valor={entradasTrabalho.responsabilidade} aoMudar={manipularMudancaEntradaTrabalho} opcoes={RESPONSIBILITY_OPTIONS} descricao={descricoes.responsabilidade} />
                <SelectRow rotulo="Prazo" nome="prazo" valor={entradasTrabalho.prazo} aoMudar={manipularMudancaEntradaTrabalho} opcoes={DEADLINE_OPTIONS} descricao={descricoes.prazo} />
                <SelectRow rotulo="Sigilo" nome="sigilo" valor={entradasTrabalho.sigilo} aoMudar={manipularMudancaEntradaTrabalho} opcoes={CONFIDENTIALITY_OPTIONS} descricao={descricoes.sigilo} />
              </Section>

              <Section titulo="Cálculos">
                <div className="flex flex-col gap-2">
                  <ResultRow rotulo="Valor Base" valor={formatarMoeda(valorBase)} destaque aoEditar={() => manipularEditarFormula('valorBase', 'Editar Fórmula do Valor Base', ['precoHora', 'horasTotais', ...Object.keys(entradasTrabalho)])} />
                  <ResultRow
                    rotulo="Valor Sugerido"
                    valor={formatarMoeda(valorSugerido)}
                    destaqueLinha={true}
                    descricao={
                      <div className="flex items-center justify-center md:justify-start gap-1 text-sm">
                        <span>(+</span>
                        <input
                          type="number"
                          name="margemErro"
                          value={porcentagens.margemErro}
                          onChange={manipularMudancaPorcentagem}
                          className="w-16 bg-transparent text-center focus:ring-1 focus:ring-yellow-500 focus:outline-none focus:bg-zinc-700/50 rounded-md py-0.5"
                          aria-label="Porcentagem da margem de erro"
                        />
                        <span>% Margem de erro)</span>
                      </div>
                    }
                  />
                  <ResultRow
                    rotulo="Valor de Oportunidade"
                    valor={formatarMoeda(valorOportunidade)}
                    descricao={
                      <div className="flex items-center justify-center md:justify-start gap-1 text-sm">
                        <span>(-</span>
                        <input
                          type="number"
                          name="oportunidade"
                          value={porcentagens.oportunidade}
                          onChange={manipularMudancaPorcentagem}
                          className="w-16 bg-transparent text-center focus:ring-1 focus:ring-yellow-500 focus:outline-none focus:bg-zinc-700/50 rounded-md py-0.5"
                          aria-label="Porcentagem de oportunidade"
                        />
                        <span>%)</span>
                      </div>
                    }
                  />
                  <ResultRow
                    rotulo="Valor de Ganho"
                    valor={formatarMoeda(valorGanho)}
                    descricao={
                      <div className="flex items-center justify-center md:justify-start gap-1 text-sm">
                        <span>(+</span>
                        <input
                          type="number"
                          name="ganho"
                          value={porcentagens.ganho}
                          onChange={manipularMudancaPorcentagem}
                          className="w-16 bg-transparent text-center focus:ring-1 focus:ring-yellow-500 focus:outline-none focus:bg-zinc-700/50 rounded-md py-0.5"
                          aria-label="Porcentagem de ganho"
                        />
                        <span>%)</span>
                      </div>
                    }
                  />
                </div>
                <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      const nome = prompt('Nome do Modelo:');
                      if (nome) handleSaveTemplate(nome);
                    }}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-lg border border-yellow-500/30"
                  >
                    <Save className="h-6 w-6" />
                    Salvar Modelo
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-blue-400 font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-lg border border-blue-500/30"
                  >
                    {showCopySuccess ? <Check className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
                    {showCopySuccess ? 'Copiado!' : 'Compartilhar'}
                  </button>
                  <button
                    onClick={() => setIsSavePriceModalOpen(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-lg"
                  >
                    <Save className="h-6 w-6" />
                    Salvar
                  </button>
                </div>
              </Section>
            </>
          )}

          {activeTab === 'orçamentos' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsMarkerManagerOpen(true)}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 px-4 py-2 rounded-md transition-colors text-sm border border-zinc-700"
                >
                  <Settings className="h-4 w-4" />
                  Gerenciar Marcadores
                </button>
              </div>
              <PricingTable
                prices={savedPrices}
                markers={state.markers}
                onDelete={handleDeletePrice}
                onUpdateMarker={async (id, markerId) => {
                  try {
                    await fetch(`/ api / prices / ${id} `, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ markerId })
                    });
                    const currentMarker = state.markers.find(m => m.id === markerId);
                    setState(prev => ({
                      ...prev,
                      savedPrices: prev.savedPrices.map(p => p.id === id ? {
                        ...p,
                        markerId: markerId || undefined,
                        markerNome: currentMarker?.nome,
                        markerCor: currentMarker?.cor
                      } : p)
                    }));
                  } catch (error) {
                    console.error('Erro ao atualizar marcador:', error);
                  }
                }}
                formatCurrency={formatarMoeda}
              />
            </div>
          )}

          {activeTab === 'modelos' && (
            <div className="space-y-4">
              {state.templates.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900 rounded-lg">
                  <p className="text-gray-400">Nenhum modelo salvo ainda.</p>
                </div>
              ) : (
                state.templates.map(tmp => (
                  <div key={tmp.id} className="p-4 bg-zinc-900 rounded-lg flex justify-between items-center border border-zinc-800">
                    <div>
                      <h3 className="text-lg font-bold text-white">{tmp.nome}</h3>
                      <p className="text-xs text-gray-500">{new Date(tmp.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadTemplate(tmp)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold py-2 px-4 rounded transition-colors"
                      >
                        Carregar
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Excluir modelo?')) {
                            await fetch(`/ api / templates / ${tmp.id} `, { method: 'DELETE' });
                            setState(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== tmp.id) }));
                          }
                        }}
                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        <footer className="text-center mt-10 py-4 text-gray-500 text-sm">
          <p>Todos os direitos reservados a Tali Digital</p>
        </footer>
      </div>

      <FormulaEditorModal
        estaAberto={!!formulaEmEdicao}
        aoFechar={manipularFecharModalFormula}
        aoSalvar={manipularSalvarFormula}
        titulo={formulaEmEdicao?.titulo || ''}
        formulaInicial={formulaEmEdicao ? formulas[formulaEmEdicao.chave] : ''}
        variaveisDisponiveis={formulaEmEdicao?.variaveis || []}
      />

      <TextEditorModal
        estaAberto={!!descricaoEmEdicao}
        aoFechar={manipularFecharModalDescricao}
        aoSalvar={manipularSalvarDescricao}
        titulo={descricaoEmEdicao?.titulo || ''}
        textoInicial={descricaoEmEdicao ? descricoes[descricaoEmEdicao.chave] : ''}
      />

      <SavePriceModal
        estaAberto={isSavePriceModalOpen}
        markers={state.markers}
        aoFechar={() => setIsSavePriceModalOpen(false)}
        aoSalvar={handleSavePrice}
      />

      <MarkerManager
        estaAberto={isMarkerManagerOpen}
        markers={state.markers}
        onFechar={() => setIsMarkerManagerOpen(false)}
        onSalvar={handleSaveMarker}
        onEditar={handleEditMarker}
        onExcluir={handleDeleteMarker}
      />
    </div>
  );
};

export default App;
