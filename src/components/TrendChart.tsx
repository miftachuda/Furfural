import React, { useMemo, useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { TagDataResponse } from '../services/api';
import type { PlantParameter } from '../config/parameters';
import { format } from 'date-fns';

interface TrendChartProps {
  data: TagDataResponse[];
  parameters: PlantParameter[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, parameters }) => {
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  // Auto-select the first tab if none is selected
  useEffect(() => {
    if (parameters.length > 0) {
      if (!activeTagId || !parameters.find(p => p.id === activeTagId)) {
        setActiveTagId(parameters[0].id || null);
      }
    }
  }, [parameters, activeTagId]);

  const activeParam = parameters.find(p => p.id === activeTagId) || parameters[0];

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const mergedData: Record<string, any> = {};

    data.forEach((tagData) => {
      tagData.Samples.forEach((sample) => {
        const timeKey = sample.TimeStamp;
        if (!mergedData[timeKey]) {
          let displayTime = timeKey;
          try {
             const dt = new Date(timeKey);
             if (!isNaN(dt.getTime())) {
               displayTime = format(dt, 'HH:mm');
             } else {
               const timePart = timeKey.split(' ')[1];
               if (timePart) {
                 const timeParts = timePart.split(':');
                 if (timeParts.length >= 2) {
                   displayTime = `${timeParts[0]}:${timeParts[1]}`;
                 }
               }
             }
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

  // Calculate min and max ONLY for the active parameter to determine exact Y-Axis boundaries
  const { chartMin, chartMax, dataMax, dataMin } = useMemo(() => {
    if (!activeParam) return { chartMin: 0, chartMax: 100, dataMax: 100, dataMin: 0 };
    
    let dMin = Infinity;
    let dMax = -Infinity;
    
    chartData.forEach(row => {
      let val = row[activeParam.tagNumber];
      if (val !== undefined && val !== null) {
        val = Number(val);
        if (!isNaN(val)) {
          if (val < dMin) dMin = val;
          if (val > dMax) dMax = val;
        }
      }
    });

    const limitLow = Number(activeParam.limitLow);
    const limitHigh = Number(activeParam.limitHigh);

    let axisMin = dMin;
    let axisMax = dMax;

    // Make sure limits are visible within the chart boundaries
    if (limitLow < axisMin) axisMin = limitLow;
    if (limitHigh > axisMax) axisMax = limitHigh;

    if (axisMin === Infinity) return { chartMin: 0, chartMax: 100, dataMax: 100, dataMin: 0 };

    // Add padding so lines don't hug the very edge of the chart
    const padding = (axisMax - axisMin) * 0.1 || 10;
    return {
      chartMin: Math.floor(axisMin - padding),
      chartMax: Math.ceil(axisMax + padding),
      dataMax: dMax === -Infinity ? 100 : dMax,
      dataMin: dMin === Infinity ? 0 : dMin
    };
  }, [chartData, activeParam]);

  const getGradientOffsets = (limitHigh: number | string, limitLow: number | string, boxTop: number, boxBottom: number) => {
    if (boxTop <= boxBottom) return { high: 0, low: 100 };
    
    const high = Number(limitHigh);
    const low = Number(limitLow);
    
    // In SVG gradients, 0% is the top of the shape, 100% is the bottom of the shape.
    let highPercent = ((boxTop - high) / (boxTop - boxBottom)) * 100;
    let lowPercent = ((boxTop - low) / (boxTop - boxBottom)) * 100;
    
    return {
      high: Math.max(0, Math.min(100, highPercent)),
      low: Math.max(0, Math.min(100, lowPercent))
    };
  };

  if (chartData.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>;
  }

  // The stroke (line) and the fill (area under line) have different SVG bounding boxes!
  // The stroke bounding box goes from dataMax to dataMin.
  // The fill bounding box goes from dataMax down to chartMin (the bottom axis).
  const fillOffsets = activeParam ? getGradientOffsets(activeParam.limitHigh, activeParam.limitLow, dataMax, chartMin) : { high: 0, low: 100 };
  const strokeOffsets = activeParam ? getGradientOffsets(activeParam.limitHigh, activeParam.limitLow, dataMax, dataMin) : { high: 0, low: 100 };

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 mb-4 overflow-x-auto pb-1">
        {parameters.map(param => (
          <button
            key={param.id}
            onClick={() => setActiveTagId(param.id || null)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
              activeTagId === param.id
                ? 'bg-blue-50 text-blue-700 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'
            }`}
          >
            {param.tagNumber}
          </button>
        ))}
      </div>

      <div className="h-96 w-full relative flex flex-col">
        {activeParam ? (
          <>
            <div className="mb-2 px-1">
              <h3 className="text-md font-semibold text-gray-800 flex items-baseline gap-2">
                {activeParam.description || activeParam.name} 
                <span className="text-xs font-normal text-gray-500">({activeParam.unit})</span>
              </h3>
            </div>
            
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
              <defs>
                <linearGradient id={`fillSplitColor-${activeParam.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset={`${fillOffsets.high}%`} stopColor="#ef4444" />
                  <stop offset={`${fillOffsets.high}%`} stopColor="#10b981" />
                  <stop offset={`${fillOffsets.low}%`} stopColor="#10b981" />
                  <stop offset={`${fillOffsets.low}%`} stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id={`strokeSplitColor-${activeParam.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset={`${strokeOffsets.high}%`} stopColor="#ef4444" />
                  <stop offset={`${strokeOffsets.high}%`} stopColor="#10b981" />
                  <stop offset={`${strokeOffsets.low}%`} stopColor="#10b981" />
                  <stop offset={`${strokeOffsets.low}%`} stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="displayTime" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[chartMin, chartMax]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => Math.abs(Number(value)) < 1 ? Number(value).toFixed(3) : Number(value).toFixed(2)}
                />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
                  <Area
                    key={activeParam.id}
                    type="monotone"
                    dataKey={activeParam.tagNumber}
                    name={activeParam.name}
                    stroke={`url(#strokeSplitColor-${activeParam.id})`}
                    strokeWidth={2}
                    fill={`url(#fillSplitColor-${activeParam.id})`}
                    fillOpacity={0.2}
                    dot={false}
                    activeDot={{ r: 6, fill: activeParam.color }}
                    baseValue={chartMin}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">Please select a parameter</div>
        )}
      </div>
    </div>
  );
};
