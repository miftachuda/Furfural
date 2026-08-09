import { addMinutes, format, parse } from 'date-fns';

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

// Generate mock data for the requested tags
export const fetchPlantData = async (payload: ApiPayload[]): Promise<TagDataResponse[]> => {
  // In a real scenario:
  // const response = await fetch('YOUR_API_ENDPOINT', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload)
  // });
  // return response.json();

  console.log("Mock API call with payload:", payload);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const request = payload[0];
      const result: TagDataResponse[] = [];

      // Parse start time "08/02/2026 12:12:03.727"
      // date-fns parse format: MM/dd/yyyy HH:mm:ss.SSS
      let start: Date;
      try {
        start = parse(request.StartTime.split('.')[0], 'MM/dd/yyyy HH:mm:ss', new Date());
      } catch (e) {
        start = new Date();
      }

      request.TagName.forEach((tag) => {
        const samples: DataSample[] = [];
        let current = start;
        let baseValue = tag.toLowerCase().includes('level') ? 50 : 65;

        // Generate about 96 samples (15 min intervals for 24 hours) as an example
        for (let i = 0; i < 96; i++) {
          // Random walk for values
          baseValue = baseValue + (Math.random() - 0.5) * 5;
          // Keep it somewhat within bounds to show limit crossing occasionally
          if (baseValue < 10) baseValue = 15;
          if (baseValue > 95) baseValue = 90;

          samples.push({
            TimeStamp: format(current, 'yyyy-MM-dd HH:mm:ss'),
            Value: parseFloat(baseValue.toFixed(2))
          });
          current = addMinutes(current, 15);
        }
        
        result.push({
          TagName: tag,
          Samples: samples
        });
      });

      resolve(result);
    }, 1000); // simulate network delay
  });
};