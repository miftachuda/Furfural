export interface PlantParameter {
  id: string;
  tagNumber: string;
  name: string;
  description: string;
  limitLow: number;
  limitHigh: number;
  color: string;
  unit: string;
}

// Initial configuration that can be modified or extended
export const initialParameters: PlantParameter[] = [
  {
    id: 'p1',
    tagNumber: '41T101_P_LEVEL.pv',
    name: 'Tank 101 Level',
    description: 'Level of Furfural in Tank 101',
    limitLow: 20,
    limitHigh: 80,
    color: '#3b82f6', // Blue
    unit: '%'
  },
  {
    id: 'p2',
    tagNumber: '41T101_P_TEMP.PV',
    name: 'Tank 101 Temperature',
    description: 'Temperature of Furfural in Tank 101',
    limitLow: 40,
    limitHigh: 90,
    color: '#ef4444', // Red
    unit: '°C'
  }
];