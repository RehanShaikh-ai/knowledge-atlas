import React from 'react';
import { ConstellationGraph, ConstellationGraphProps } from './ConstellationGraph';

export interface GraphViewProps extends Omit<ConstellationGraphProps, 'onSelectEntity'> {
  onNodeClick?: (nodeId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ onNodeClick, ...props }) => {
  return (
    <ConstellationGraph
      onSelectEntity={onNodeClick}
      {...props}
    />
  );
};

