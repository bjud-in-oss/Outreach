import React from 'react';

interface ActionPromptProps {
  actionLabel?: string;
  onConfirm?: () => void;
  [key: string]: any;
}

export const ActionPrompt: React.FC<ActionPromptProps> = ({ actionLabel, onConfirm }) => {
  return (
    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-md shadow-sm">
      <h3 className="text-lg font-semibold text-green-800">Kräver Bekräftelse</h3>
      <button 
        onClick={onConfirm}
        className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        {actionLabel || 'Bekräfta'}
      </button>
    </div>
  );
};
