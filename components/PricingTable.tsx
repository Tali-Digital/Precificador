
import React, { useState } from 'react';
import { Trash2, ChevronDown, FileText } from 'lucide-react';
import type { Tarefa } from '../types';

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

interface PricingTableProps {
    prices: SavedPrice[];
    markers: Marker[];
    onDelete: (id: number) => void;
    onUpdateMarker: (id: number, markerId: number | null) => void;
    formatCurrency: (value: number) => string;
}

const PriceCard: React.FC<{
    price: SavedPrice;
    markers: Marker[];
    onDelete: (id: number) => void;
    onUpdateMarker: (id: number, markerId: number | null) => void;
    formatCurrency: (value: number) => string;
}> = ({ price, markers, onDelete, onUpdateMarker, formatCurrency }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

    const totalHoras = price.tarefas.reduce((acc, task) => acc + task.horas, 0);
    const currentMarker = markers.find(m => m.id === price.markerId);

    return (
        <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden transition-all duration-300">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-2xl font-bold text-white">{price.nome}</h3>
                            <div className="relative">
                                <button
                                    onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                    className="px-2 py-0.5 rounded text-xs font-bold transition-all"
                                    style={{
                                        backgroundColor: currentMarker ? `${currentMarker.cor}20` : '#3f3f46',
                                        color: currentMarker ? currentMarker.cor : '#a1a1aa',
                                        border: `1px solid ${currentMarker ? currentMarker.cor : '#52525b'}`
                                    }}
                                >
                                    {currentMarker ? currentMarker.nome : 'Sem Status'}
                                </button>
                                {isStatusMenuOpen && (
                                    <div className="absolute left-0 mt-2 w-40 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl z-10 py-1">
                                        <button
                                            className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-zinc-700 transition-colors"
                                            onClick={() => {
                                                onUpdateMarker(price.id, null);
                                                setIsStatusMenuOpen(false);
                                            }}
                                        >
                                            Nenhum
                                        </button>
                                        {markers.map(m => (
                                            <button
                                                key={m.id}
                                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 transition-colors"
                                                style={{ color: m.cor }}
                                                onClick={() => {
                                                    onUpdateMarker(price.id, m.id);
                                                    setIsStatusMenuOpen(false);
                                                }}
                                            >
                                                {m.nome}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">{price.tarefas.length} tarefas • {totalHoras} horas totais</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-gray-400 hover:text-yellow-400 transition-colors p-2 rounded-full bg-zinc-800 hover:bg-zinc-700"
                            aria-label={isExpanded ? "Esconder detalhes" : "Mostrar detalhes"}
                        >
                            <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            onClick={() => onDelete(price.id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full bg-zinc-800 hover:bg-red-500/20"
                            aria-label={`Remover projeto ${price.nome}`}
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-center">
                    <div>
                        <p className="text-sm text-gray-400">Oportunidade</p>
                        <p className="text-xl font-semibold text-gray-200">{formatCurrency(price.valorOportunidade)}</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-3">
                        <p className="text-sm text-yellow-300">Sugerido</p>
                        <p className="text-2xl font-bold text-yellow-200">{formatCurrency(price.valorSugerido)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">Ganho</p>
                        <p className="text-xl font-semibold text-gray-200">{formatCurrency(price.valorGanho)}</p>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="bg-zinc-950/50 p-5 border-t border-zinc-800">
                    <h4 className="font-semibold text-gray-300 mb-3">Detalhamento de Tarefas</h4>
                    <ul className="space-y-2">
                        {price.tarefas.map(task => (
                            <li key={task.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-zinc-800/50">
                                <span className="text-gray-300">{task.nome}</span>
                                <span className="font-mono text-gray-400 bg-zinc-700/50 px-2 py-0.5 rounded">{task.horas}h</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}


export const PricingTable: React.FC<PricingTableProps> = ({ prices, markers, onDelete, onUpdateMarker, formatCurrency }) => {
    if (prices.length === 0) {
        return (
            <div className="text-center py-16 bg-zinc-900 rounded-lg shadow-lg">
                <FileText className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-xl font-medium text-white">Nenhum orçamento salvo</h3>
                <p className="mt-1 text-gray-400">Volte para a aba "Precificador" para salvar seu primeiro cálculo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {prices.map(price => (
                <PriceCard
                    key={price.id}
                    price={price}
                    markers={markers}
                    onDelete={onDelete}
                    onUpdateMarker={onUpdateMarker}
                    formatCurrency={formatCurrency}
                />
            ))}
        </div>
    );
};
