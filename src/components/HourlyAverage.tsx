import React, { useMemo } from 'react';
import type { TagDataResponse } from '../services/api';
import type { PlantParameter } from '../config/parameters';
import { format } from 'date-fns';

interface HourlyAverageProps {
  data: TagDataResponse[];
  parameters: PlantParameter[];
  selectedDate?: string;
}

export const HourlyAverage: React.FC<HourlyAverageProps> = ({ data, parameters, selectedDate }) => {
  const hourlyData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Group samples by hour to calculate the hourly average from the 15-min data
    const hourlyGroups: Record<string, Record<string, { sum: number; count: number }>> = {};

    // Pre-populate all 24 hours for the selected date
    const targetDateStr = selectedDate || format(new Date(), 'yyyy-MM-dd');
    for (let i = 0; i < 24; i++) {
      const hourString = i.toString().padStart(2, '0');
      const hourBucket = `${targetDateStr} ${hourString}:00`;
      hourlyGroups[hourBucket] = {};
    }

    data.forEach((tagData) => {
      tagData.Samples.forEach((sample) => {
        // Parse the exact time and round it down to the current hour
        let hourBucket = sample.TimeStamp;
        try {
          const dt = new Date(sample.TimeStamp);
          if (!isNaN(dt.getTime())) {
            hourBucket = format(dt, 'yyyy-MM-dd HH:00');
          } else {
            const parts = sample.TimeStamp.split(' ');
            if (parts.length >= 2) {
              const datePart = parts[0];
              const timePart = parts[1];
              const timeParts = timePart.split(':');
              if (timeParts.length >= 2) {
                hourBucket = `${datePart} ${timeParts[0]}:00`;
              }
            }
          }
        } catch (e) {
          // Keep original if parsing fails
        }
        
        if (!hourlyGroups[hourBucket]) {
          hourlyGroups[hourBucket] = {};
        }
        
        if (!hourlyGroups[hourBucket][tagData.TagName]) {
          hourlyGroups[hourBucket][tagData.TagName] = { sum: 0, count: 0 };
        }
        
        hourlyGroups[hourBucket][tagData.TagName].sum += sample.Value;
        hourlyGroups[hourBucket][tagData.TagName].count += 1;
      });
    });

    // Calculate averages and format
    const rows = Object.keys(hourlyGroups).sort().map((hour) => {
      const row: any = { hour };
      parameters.forEach(param => {
        const stats = hourlyGroups[hour][param.tagNumber];
        if (stats && stats.count > 0) {
          const val = stats.sum / stats.count;
          // Show 3 digits if it's a "0." value (between -1 and 1)
          row[param.tagNumber] = Math.abs(val) < 1 ? val.toFixed(3) : val.toFixed(2);
        } else {
          row[param.tagNumber] = '-';
        }
      });
      return row;
    });

    return rows;
  }, [data, parameters, selectedDate]);

  if (hourlyData.length === 0) {
    return <div className="p-4 text-center text-gray-500">No data available for hourly average</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-700">Hourly Average</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-600 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-medium align-top">Date & Time</th>
              {parameters.map((param) => (
                <th key={param.id} className="px-6 py-4 font-medium align-top" style={{ color: param.color }}>
                  <div className="flex flex-col gap-1">
                    <span>{param.name} ({param.unit})</span>
                    {param.description && (
                      <span className="text-[10px] text-gray-500 font-normal normal-case leading-tight">
                        {param.description}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourlyData.map((row, index) => (
              <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 whitespace-nowrap text-gray-600 font-medium">
                  {(() => {
                    const parts = row.hour.split(' ');
                    if (parts.length === 2) {
                      const dateParts = parts[0].split('-');
                      if (dateParts.length === 3) {
                        const yy = dateParts[0].slice(-2);
                        return `${dateParts[2]}/${dateParts[1]}/${yy} ${parts[1]}`;
                      }
                      return `${parts[0]} ${parts[1]}`;
                    }
                    return row.hour;
                  })()}
                </td>
                {parameters.map((param) => {
                  const val = row[param.tagNumber];
                  const numVal = parseFloat(val);
                  
                  let cellClass = 'text-gray-500';
                  
                  if (!isNaN(numVal) && val !== '-') {
                    const isOut = numVal < Number(param.limitLow) || numVal > Number(param.limitHigh);
                    cellClass = isOut 
                      ? 'text-red-600 bg-red-50/50' 
                      : 'text-emerald-600 bg-emerald-50/50';
                  }

                  return (
                    <td 
                      key={param.id} 
                      className={`px-6 py-3 font-semibold transition-colors ${cellClass}`}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
