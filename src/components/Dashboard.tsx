import React, { useState, useEffect } from 'react';
import { initialParameters } from '../config/parameters';
import type { PlantParameter } from '../config/parameters';
import { fetchPlantData } from '../services/api';
import type { TagDataResponse } from '../services/api';
import { TrendChart } from './TrendChart';
import { HourlyAverage } from './HourlyAverage';
import { ParameterManager } from './ParameterManager';
import { Activity, RefreshCcw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [parameters, setParameters] = useState<PlantParameter[]>(initialParameters);
  const [data, setData] = useState<TagDataResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const tagNames = parameters.map(p => p.tagNumber);
      
      // Simulated payload according to user's requirements
      const payload = [{
        "SampleInterval": 900000,
        "GetEnum": false,
        "ResampleMethod": "snapshot",
        "MinimumConfidence": 40,
        "MaxRows": 50000,
        "TimeFormat": 6,
        "ReductionData": "snapshot",
        "TagName": tagNames,
        "StartTime": "08/02/2026 12:12:03.727",
        "EndTime": "08/09/2026 12:12:03.728",
        "OutputTimeFormat": 6,
        "EventSequence": 0
      }];

      const responseData = await fetchPlantData(payload);
      setData(responseData);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameters]); // reload data when parameters change

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-blue-600" />
              Plant Operations Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">Real-time trending and hourly averages</p>
          </div>
          
          <button 
            onClick={loadData}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </header>

        {/* Settings/Manager */}
        <ParameterManager parameters={parameters} onParametersChange={setParameters} />

        {/* Charts & Tables */}
        {loading && data.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-lg border border-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Parameter Trending</h2>
              <TrendChart data={data} parameters={parameters} />
            </section>
            
            <section>
              <HourlyAverage data={data} parameters={parameters} />
            </section>
          </div>
        )}

      </div>
    </div>
  );
};
