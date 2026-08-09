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

export const fetchPlantData = async (tagNames: string[]): Promise<TagDataResponse[]> => {
  if (tagNames.length === 0) return [];

  const now = new Date();
  const startTime = subDays(now, 1); // Get data for the last 24 hours

  // Format: "MM/dd/yyyy HH:mm:ss.SSS"
  const startFormat = format(startTime, 'MM/dd/yyyy HH:mm:ss.SSS');
  const endFormat = format(now, 'MM/dd/yyyy HH:mm:ss.SSS');

  const payload: ApiPayload[] = [{
    SampleInterval: 900000,
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
      
      for (let i = 0; i < length; i++) {
        // Skip empty timestamps
        if (timeStamps[i] && timeStamps[i] !== "") {
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