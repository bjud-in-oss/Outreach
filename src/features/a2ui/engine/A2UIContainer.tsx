import React, { useState, useEffect } from 'react';
import { SwarmEventBus } from '@/shared/bus/swarmEventBus';
import { A2UIPayload } from '../model/types';
import { RenderA2UI } from './renderer';

interface A2UIContainerProps {
  bus: SwarmEventBus;
}

export const A2UIContainer: React.FC<A2UIContainerProps> = ({ bus }) => {
  const [currentUI, setCurrentUI] = useState<A2UIPayload | null>(null);

  useEffect(() => {
    const unbindRender = bus.subscribe('a2ui:render', (payload: A2UIPayload) => {
      setCurrentUI(payload);
    });

    const unbindClear = bus.subscribe('a2ui:clear', () => {
      setCurrentUI(null);
    });

    return () => {
      unbindRender();
      unbindClear();
    };
  }, [bus]);

  if (!currentUI) {
    return null;
  }

  return <>{RenderA2UI(currentUI)}</>;
};
