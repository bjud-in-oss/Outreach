import React from 'react';

interface ListeningCardProps {
  intent?: string;
  [key: string]: any;
}

export const ListeningCard: React.FC<ListeningCardProps> = ({ intent }) => {
  return (
    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md shadow-sm">
      <h3 className="text-lg font-semibold text-blue-800">Agentens Intention</h3>
      <p className="text-blue-600 mt-1">
        {intent ? `Lyssnar och bearbetar: "${intent}"` : 'Lyssnar aktivt...'}
      </p>
    </div>
  );
};
