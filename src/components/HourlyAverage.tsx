import React, { useMemo } from 'react';
import type { TagDataResponse } from '../services/api';
import type { PlantParameter } from '../config/parameters';

interface HourlyAverageProps {
  data: TagDataResponse[];
  parameters: PlantParameter[];
}

export const HourlyAverage: React.FC<HourlyAverageProps> = ({ data, parameters }) => {
  const hourlyData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Group samples by hour
    const hourlyGroups: Record<string, Record<string, { sum: number; count: number }>> = {};

    data.forEach((tagData) => {
      tagData.Samples.forEach((sample) => {
        // sample.TimeStamp is "yyyy-MM-dd HH:mm:ss"
        const hour = sample.TimeStamp.substring(0, 13) + ":00"; // get up to hour
        
        if (!hourlyGroups[hour]) {
          hourlyGroups[hour] = {};
        }
        if (!hourlyGroups[hour][tagData.TagName]) {
          hourlyGroups[hour][tagData.TagName] = { sum: 0, count: 0 };
        }
        
        hourlyGroups[hour][tagData.TagName].sum += sample.Value;
        hourlyGroups[hour][tagData.TagName].count += 1;
      });
    });

    // Calculate averages and format
    const rows = Object.keys(hourlyGroups).sort().map((hour) => {
      const row: any = { hour };
      parameters.forEach(param => {
        const stats = hourlyGroups[hour][param.tagNumber];
        if (stats && stats.count > 0) {
          row[param.tagNumber] = (stats.sum / stats.count).toFixed(2);
        } else {
          row[param.tagNumber] = '-';
        }
      });
      return row;
    });

    return rows;
  }, [data, parameters]);

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
              <th className="px-6 py-3 font-medium">Time (Hour)</th>
              {parameters.map((param) => (
                <th key={param.id} className="px-6 py-3 font-medium" style={{ color: param.color }}>
                  {param.name} ({param.unit})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourlyData.map((row, index) => (
              <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 whitespace-nowrap text-gray-600 font-medium">
                  {row.hour.split(' ')[1]}
                </td>
                {parameters.map((param) => {
                  const val = row[param.tagNumber];
                  const numVal = parseFloat(val);
                  
                  // Check if out of bounds
                  let isOut = false;
                  if (!isNaN(numVal)) {
                    isOut = numVal < param.limitLow || numVal > param.limitHigh;
                  }

                  return (
                    <td 
                      key={param.id} 
                      className={`px-6 py-3 font-semibold ${isOut ? 'text-red-600 bg-red-50/50' : 'text-gray-700'}`}
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
