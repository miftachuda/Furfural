import { format, subDays } from 'date-fns';

export interface ApiPayload {
  SampleInterval: number;
  GetEnum: boolean;
  ResampleMethod: string;
  MinimumConfidence: number;
  MaxRows: number;
  TimeFormat: number;
  ReductionData: string;
  TagName: string[];
  StartTime: string;
  EndTime: string;
  OutputTimeFormat: number;
  EventSequence: number;
}

export interface DataSample {
  TimeStamp: string;
  Value: number;
}

export interface TagDataResponse {
  TagName: string;
  Samples: DataSample[];
}

export const fetchPlantData = async (tagNames: string[], sampleInterval: number = 900000, targetDateStr?: string): Promise<TagDataResponse[]> => {
  if (tagNames.length === 0) return [];

  let startTime: Date;
  let endTime: Date;

  if (targetDateStr) {
    const [year, month, day] = targetDateStr.split('-').map(Number);
    startTime = new Date(year, month - 1, day, 0, 0, 0, 0);
    endTime = new Date(year, month - 1, day, 23, 59, 59, 999);
  } else {
    const now = new Date();
    startTime = subDays(now, 1); // Get data for the last 24 hours
    endTime = now;
  }

  // Format: "MM/dd/yyyy HH:mm:ss.SSS"
  const startFormat = format(startTime, 'MM/dd/yyyy HH:mm:ss.SSS');
  const endFormat = format(endTime, 'MM/dd/yyyy HH:mm:ss.SSS');

  const payload: ApiPayload[] = [{
    SampleInterval: sampleInterval,
    GetEnum: false,
    ResampleMethod: "snapshot",
    MinimumConfidence: 40,
    MaxRows: 50000,
    TimeFormat: 6,
    ReductionData: "snapshot",
    TagName: tagNames,
    StartTime: startFormat,
    EndTime: endFormat,
    OutputTimeFormat: 6,
    EventSequence: 0
  }];

  try {
    const response = await fetch('https://apiv2.miftachuda.my.id/GetData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const rawData = await response.json();
    
    // Transform the raw API format into the expected TagDataResponse format
    const data: TagDataResponse[] = rawData.map((item: any) => {
      const samples: DataSample[] = [];
      
      // The API returns arrays of TimeStamps and Values
      const timeStamps = item.TimeStamp || [];
      const values = item.Value || [];
      
      const length = Math.min(timeStamps.length, values.length);
      const now = new Date();
      
      for (let i = 0; i < length; i++) {
        // Skip empty timestamps
        if (timeStamps[i] && timeStamps[i] !== "") {
          const sampleDate = new Date(timeStamps[i]);
          // Skip future timestamps (greater than now)
          if (!isNaN(sampleDate.getTime()) && sampleDate > now) {
            continue;
          }
          
          samples.push({
            TimeStamp: timeStamps[i],
            Value: values[i]
          });
        }
      }
      
      return {
        TagName: item.TagName,
        Samples: samples
      };
    });

    return data;
  } catch (error) {
    console.error("Failed to fetch from API, returning empty data:", error);
    return [];
  }
};