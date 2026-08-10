import { pb } from './pb';

export interface FurfuralLossRecord {
  id?: string;
  date: string;
  loss: number;
}

export const COLLECTION_NAME = 'loss_furfural';

export const fetchFurfuralLosses = async (monthStr?: string): Promise<FurfuralLossRecord[]> => {
  try {
    let filter = '';
    
    if (monthStr) {
      const startDate = `${monthStr}-01 00:00:00`;
      const [year, month] = monthStr.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${monthStr}-${lastDay} 23:59:59`;
      filter = `date >= "${startDate}" && date <= "${endDate}"`;
    }

    const records = await pb.collection(COLLECTION_NAME).getFullList<FurfuralLossRecord>({
      sort: '-date',
      filter: filter || undefined,
    });
    return records;
  } catch (error) {
    console.error('Failed to fetch furfural losses:', error);
    return [];
  }
};

export const fetchFurfuralLossByDate = async (dateStr: string): Promise<FurfuralLossRecord | null> => {
  try {
    // dateStr is 'YYYY-MM-DD'
    // pocketbase date is stored as 'YYYY-MM-DD HH:mm:ss.SSSZ'
    // We can do a string match using >= and <= or ~
    const startDate = `${dateStr} 00:00:00`;
    const endDate = `${dateStr} 23:59:59`;
    
    const records = await pb.collection(COLLECTION_NAME).getList<FurfuralLossRecord>(1, 1, {
      filter: `date >= "${startDate}" && date <= "${endDate}"`,
    });
    
    return records.items.length > 0 ? records.items[0] : null;
  } catch (error) {
    console.error(`Failed to fetch furfural loss for ${dateStr}:`, error);
    return null;
  }
};

export const saveFurfuralLoss = async (data: FurfuralLossRecord): Promise<FurfuralLossRecord | null> => {
  try {
    if (data.id) {
      return await pb.collection(COLLECTION_NAME).update<FurfuralLossRecord>(data.id, data);
    } else {
      return await pb.collection(COLLECTION_NAME).create<FurfuralLossRecord>(data);
    }
  } catch (error) {
    console.error('Failed to save furfural loss:', error);
    return null;
  }
};
