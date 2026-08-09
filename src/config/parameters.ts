import { pb } from '../services/pb';

export interface PlantParameter {
  id?: string;
  tagNumber: string;
  name: string;
  description: string;
  limitLow: number;
  limitHigh: number;
  color: string;
  unit: string;
}

// Initial configuration that will be used if PocketBase is empty or unavailable
export const defaultParameters: PlantParameter[] = [
  {
    tagNumber: '023LT_008.PV',
    name: 'Level 023V103 Decanter',
    description: 'Level 023V103 Decanter',
    limitLow: 20, // Default assumed
    limitHigh: 80, // Default assumed
    color: '#3b82f6', // Blue
    unit: '%'
  },
  {
    tagNumber: '023TI_032.pv',
    name: 'Temperature 023V103 Decanter',
    description: 'Temperature 023V103 Decanter',
    limitLow: 58,
    limitHigh: 62,
    color: '#ef4444', // Red
    unit: '°C'
  },
  {
    tagNumber: '023TI_010.pv',
    name: 'Temperature bottom 023C-104 (023P-105)',
    description: 'Temperature bottom 023C-104 (023P-105)',
    limitLow: 155,
    limitHigh: 158,
    color: '#f59e0b', // Amber/Orange
    unit: '°C'
  },
  {
    tagNumber: '023PI_005.pv',
    name: 'Pressure Vacuum 023',
    description: 'Pressure Vacuum 023 (023C-106, 023C-107, 023C-108)',
    limitLow: 0.15,
    limitHigh: 0.25,
    color: '#10b981', // Green
    unit: 'kg/cm²A'
  }
];

// Helper functions for PocketBase
const COLLECTION_NAME = 'parameters';

export const fetchParameters = async (): Promise<PlantParameter[]> => {
  try {
    const records = await pb.collection(COLLECTION_NAME).getFullList({
      sort: 'created',
    });
    
    if (records.length === 0) {
      return defaultParameters;
    }
    
    return records.map(record => ({
      id: record.id,
      tagNumber: record.tagNumber,
      name: record.name,
      description: record.description,
      limitLow: record.limitLow,
      limitHigh: record.limitHigh,
      color: record.color,
      unit: record.unit,
    }));
  } catch (error) {
    console.error("Error fetching parameters from PocketBase. Using defaults.", error);
    return defaultParameters;
  }
};

export const saveParameter = async (param: PlantParameter): Promise<PlantParameter> => {
  try {
    if (param.id && !param.id.startsWith('p_')) {
      // Update existing record
      const record = await pb.collection(COLLECTION_NAME).update(param.id, param);
      return { ...param, id: record.id };
    } else {
      // Create new record
      // Remove temporary frontend ID if it exists
      const { id, ...dataToSave } = param;
      const record = await pb.collection(COLLECTION_NAME).create(dataToSave);
      return { ...param, id: record.id };
    }
  } catch (error) {
    console.error("Error saving parameter to PocketBase:", error);
    // Return with a temporary ID so UI can still update if PB is down
    return { ...param, id: param.id || `p_${Date.now()}` };
  }
};

export const deleteParameter = async (id: string): Promise<boolean> => {
  try {
    if (!id.startsWith('p_')) {
      await pb.collection(COLLECTION_NAME).delete(id);
    }
    return true;
  } catch (error) {
    console.error("Error deleting parameter from PocketBase:", error);
    return false;
  }
};
