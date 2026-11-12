import React from 'react';
import { A2UIPayload } from '../model/types';
import { ListeningCard } from '../catalog/ListeningCard';
import { ActionPrompt } from '../catalog/ActionPrompt';

const FallbackComponent: React.FC<{ componentId: string }> = ({ componentId }) => (
  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-md shadow-sm">
    <h3 className="text-lg font-semibold text-yellow-800">Komponent Saknas</h3>
    <p className="text-yellow-600 mt-1">
      Komponenten "{componentId}" hittades inte i A2UI-katalogen.
    </p>
  </div>
);

export const RenderA2UI = (payload?: A2UIPayload | null) => {
  if (!payload || !payload.componentId) {
    return null;
  }

  const { componentId, dataModel } = payload;

  switch (componentId) {
    case 'ListeningCard':
      return <ListeningCard {...dataModel} />;
    case 'ActionPrompt':
      return <ActionPrompt {...dataModel} />;
    default:
      return <FallbackComponent componentId={componentId} />;
  }
};
