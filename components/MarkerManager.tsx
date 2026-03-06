import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';

interface Marker {
    id: number;
    nome: string;
    cor: string;
}

interface MarkerManagerProps {
    estaAberto: boolean;
    markers: Marker[];
    onFechar: () => void;
    onSalvar: (nome: string, cor: string) => Promise<void>;
    onEditar: (id: number, nome: string, cor: string) => Promise<void>;
    onExcluir: (id: number) => Promise<void>;
}

export const MarkerManager: React.FC<MarkerManagerProps> = ({
    estaAberto,
    markers,
    onFechar,
    onSalvar,
    onEditar,
    onExcluir
}) => {
    const [novoNome, setNovoNome] = useState('');
    const [novaCor, setNovaCor] = useState('#3b82f6');
    const [editandoId, setEditandoId] = useState<number | null>(null);

    if (!estaAberto) return null;

    const handleSalvar = async () => {
        if (novoNome.trim()) {
            if (editandoId) {
                await onEditar(editandoId, novoNome, novaCor);
            } else {
                await onSalvar(novoNome, novaCor);
            }
            setNovoNome('');
            setEditandoId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
            <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-lg border border-zinc-700 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-zinc-700">
                    <h3 className="text-xl font-bold text-white">Gerenciar Marcadores</h3>
                    <button onClick={onFechar} className="text-gray-400 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={novoNome}
                            onChange={(e) => setNovoNome(e.target.value)}
                            placeholder="Nome do marcador..."
                            className="flex-1 bg-black border border-zinc-700 rounded-md p-2 text-white outline-none focus:border-yellow-500"
                        />
                        <input
                            type="color"
                            value={novaCor}
                            onChange={(e) => setNovaCor(e.target.value)}
                            className="w-12 h-10 bg-transparent border-none cursor-pointer"
                        />
                        <button
                            onClick={handleSalvar}
                            disabled={!novoNome.trim()}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md font-bold disabled:opacity-50"
                        >
                            {editandoId ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {markers.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-md border border-zinc-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: m.cor }}></div>
                                    <span className="text-white font-medium">{m.nome}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditandoId(m.id);
                                            setNovoNome(m.nome);
                                            setNovaCor(m.cor);
                                        }}
                                        className="text-gray-400 hover:text-blue-400 p-1"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onExcluir(m.id)}
                                        className="text-gray-400 hover:text-red-400 p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
