import React from 'react';

interface SectionProps {
  titulo: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ titulo, children }) => {
  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-2">{titulo}</h2>
        <hr className="border-t border-yellow-500/30 mb-6" />
        {children}
      </div>
    </div>
  );
};