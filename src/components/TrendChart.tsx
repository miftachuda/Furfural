import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { TagDataResponse } from '../services/api';
import type { PlantParameter } from '../config/parameters';
import { format, parseISO } from 'date-fns';

interface TrendChartProps {
  data: TagDataResponse[];
  parameters: PlantParameter[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, parameters }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Assuming all tags have identical timestamps in the mock,
    // if not, we would need to merge them by timestamp.
    // For simplicity, let's group by TimeStamp.
    const mergedData: Record<string, any> = {};

    data.forEach((tagData) => {
      tagData.Samples.forEach((sample) => {
        const timeKey = sample.TimeStamp;
        if (!mergedData[timeKey]) {
          // parse to display nicely
          let displayTime = timeKey;
          try {
             displayTime = format(parseISO(timeKey.replace(' ', 'T')), 'HH:mm');
          } catch(e) {}
          
          mergedData[timeKey] = {
            timestamp: timeKey,
            displayTime: displayTime
          };
        }
        mergedData[timeKey][tagData.TagName] = sample.Value;
      });
    });

    return Object.values(mergedData).sort((a, b) => 
      a.timestamp.localeCompare(b.timestamp)
    );
  }, [data]);

  if (chartData.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>;
  }

  return (
    <div className="w-full h-96 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="displayTime" stroke="#888" fontSize={12} />
          <YAxis stroke="#888" fontSize={12} domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {parameters.map((param) => (
            <React.Fragment key={param.id}>
              <Line
                type="monotone"
                dataKey={param.tagNumber}
                name={param.name}
                stroke={param.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              {/* Optional: Add reference lines for limits. 
                  Can be cluttered with multiple tags, but requested by user. */}
              <ReferenceLine y={param.limitHigh} stroke={param.color} strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: `${param.name} High`, fill: param.color, fontSize: 10 }} />
              <ReferenceLine y={param.limitLow} stroke={param.color} strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: `${param.name} Low`, fill: param.color, fontSize: 10 }} />
            </React.Fragment>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
