import React, { useState, useEffect } from "react";
import { fetchParameters } from "../config/parameters";
import type { PlantParameter } from "../config/parameters";
import { fetchPlantData } from "../services/api";
import type { TagDataResponse } from "../services/api";
import { TrendChart } from "./TrendChart";
import { HourlyAverage } from "./HourlyAverage";
import { ParameterManager } from "./ParameterManager";
import { Activity, RefreshCcw } from "lucide-react";

export const Dashboard: React.FC = () => {
  const [parameters, setParameters] = useState<PlantParameter[]>([]);
  const [trendData, setTrendData] = useState<TagDataResponse[]>([]);
  const [hourlyData, setHourlyData] = useState<TagDataResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [paramsLoading, setParamsLoading] = useState(true);

  // Load parameters from PocketBase on mount
  useEffect(() => {
    const loadParams = async () => {
      setParamsLoading(true);
      const params = await fetchParameters();
      // Ensure params have IDs for React keys
      const paramsWithIds = params.map((p) => ({
        ...p,
        id:
          p.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }));
      setParameters(paramsWithIds);
      setParamsLoading(false);
    };
    loadParams();
  }, []);

  const loadData = async () => {
    if (parameters.length === 0) return;

    setLoading(true);
    try {
      const tagNames = parameters.map((p) => p.tagNumber);

      // Fetch trend data (15 min interval = 900000ms)
      // We will use this same 15-min data to calculate hourly averages locally
      const responseData = await fetchPlantData(tagNames, 900000);
      
      setTrendData(responseData);
      setHourlyData(responseData);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when parameters change (and are loaded)
  useEffect(() => {
    if (!paramsLoading) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameters, paramsLoading]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-blue-600" />
              Furfural Close Look
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time trending and hourly averages
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading || paramsLoading}
            className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${loading || paramsLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </header>

        {/* Settings/Manager */}
        {!paramsLoading && (
          <ParameterManager
            parameters={parameters}
            onParametersChange={setParameters}
          />
        )}

        {/* Charts & Tables */}
        {(loading || paramsLoading) && trendData.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-lg border border-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Parameter Trending
              </h2>
              <TrendChart data={trendData} parameters={parameters} />
            </section>

            <section>
              <HourlyAverage data={hourlyData} parameters={parameters} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
