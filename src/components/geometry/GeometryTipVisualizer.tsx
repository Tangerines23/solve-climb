import React from 'react';
import './GeometryTipVisualizer.css';
import { ManimLevel1Visualizer } from './ManimLevel1Visualizer';
import { ManimLevel2Visualizer } from './ManimLevel2Visualizer';
import { ManimLevel3Visualizer } from './ManimLevel3Visualizer';
import { ManimLevel4Visualizer } from './ManimLevel4Visualizer';
import { ManimLevel5Visualizer } from './ManimLevel5Visualizer';
import { ManimLevel6Visualizer } from './ManimLevel6Visualizer';
import { ManimLevel7Visualizer } from './ManimLevel7Visualizer';
import { ManimLevel8Visualizer } from './ManimLevel8Visualizer';
import { ManimLevel9Visualizer } from './ManimLevel9Visualizer';
import { ManimLevel10Visualizer } from './ManimLevel10Visualizer';
import { ManimLevel11Visualizer } from './ManimLevel11Visualizer';
import { ManimLevel12Visualizer } from './ManimLevel12Visualizer';
import { ManimLevel13Visualizer } from './ManimLevel13Visualizer';
import { ManimLevel14Visualizer } from './ManimLevel14Visualizer';
import { ManimLevel15Visualizer } from './ManimLevel15Visualizer';

interface GeometryTipVisualizerProps {
  level: number;
}

export const GeometryTipVisualizer: React.FC<GeometryTipVisualizerProps> = ({ level }) => {
  switch (level) {
    case 1:
      return <ManimLevel1Visualizer />;
    case 2:
      return <ManimLevel2Visualizer />;
    case 3:
      return <ManimLevel3Visualizer />;
    case 4:
      return <ManimLevel4Visualizer />;
    case 5:
      return <ManimLevel5Visualizer />;
    case 6:
      return <ManimLevel6Visualizer />;
    case 7:
      return <ManimLevel7Visualizer />;
    case 8:
      return <ManimLevel8Visualizer />;
    case 9:
      return <ManimLevel9Visualizer />;
    case 10:
      return <ManimLevel10Visualizer />;
    case 11:
      return <ManimLevel11Visualizer />;
    case 12:
      return <ManimLevel12Visualizer />;
    case 13:
      return <ManimLevel13Visualizer />;
    case 14:
      return <ManimLevel14Visualizer />;
    case 15:
      return <ManimLevel15Visualizer />;
    default:
      return <ManimLevel1Visualizer />;
  }
};
