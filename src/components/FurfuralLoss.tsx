import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  fetchFurfuralLosses, 
  saveFurfuralLoss, 
} from '../services/furfuralLoss';
import type { FurfuralLossRecord } from '../services/furfuralLoss';
import { Activity, Edit2, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const FurfuralLoss: React.FC = () => {
  const [records, setRecords] = useState<FurfuralLossRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [editValue, setEditValue] = useState<string>('');
  const [currentRecord, setCurrentRecord] = useState<FurfuralLossRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchFurfuralLosses(selectedMonth);
    setRecords(data);
    
    // Find if the selected date already has a record
    const recordForDate = data.find(r => r.date.startsWith(selectedDate));
    setCurrentRecord(recordForDate || null);
    if (recordForDate) {
      setEditValue(recordForDate.loss.toString());
    } else {
      setEditValue('');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // When date changes, update the input field with the existing record if any
  useEffect(() => {
    const recordForDate = records.find(r => r.date.startsWith(selectedDate));
    setCurrentRecord(recordForDate || null);
    if (recordForDate) {
      setEditValue(recordForDate.loss.toString());
    } else {
      setEditValue('');
    }
  }, [selectedDate, records]);

  const handleSave = async () => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      alert("Please enter a valid number for loss");
      return;
    }

    setIsSaving(true);
    const dataToSave: FurfuralLossRecord = {
      id: currentRecord?.id,
      date: `${selectedDate} 12:00:00.000Z`, // Use midday UTC for the date
      loss: numValue
    };

    const saved = await saveFurfuralLoss(dataToSave);
    if (saved) {
      await loadData();
    } else {
      alert("Failed to save. Please check your PocketBase collection settings (ensure 'loss_furfural' exists with 'date' and 'loss' fields).");
    }
    setIsSaving(false);
  };

  // Prepare chart data (reverse to show chronological order)
  const chartData = [...records].reverse().map(r => ({
    date: r.date.split(' ')[0],
    loss: r.loss
  }));

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-orange-600" />
              Furfural Loss Trending
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track and manage daily furfural loss in kg/day
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-600">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                const newMonth = e.target.value;
                setSelectedMonth(newMonth);
                setSelectedDate(`${newMonth}-01`);
              }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Editor Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:col-span-1 h-fit">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {currentRecord ? 'Edit Loss Record' : 'Add Loss Record'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setSelectedDate(newDate);
                    const newMonth = newDate.substring(0, 7);
                    if (newMonth !== selectedMonth) {
                      setSelectedMonth(newMonth);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loss (kg/day)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter loss value"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || loading || editValue === ''}
                className={`w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 transition-colors ${
                  isSaving || loading || editValue === '' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {currentRecord ? <Edit2 size={16} /> : <Plus size={16} />}
                {isSaving ? 'Saving...' : currentRecord ? 'Update Record' : 'Add Record'}
              </button>
            </div>
          </div>

          {/* Chart Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Loss Trending</h3>
            
            {loading && records.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No loss data available. Add a record to see the trend.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickFormatter={(val) => {
                        const parts = val.split('-');
                        if(parts.length === 3) return `${parts[2]}/${parts[1]}`;
                        return val;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value} kg/day`, 'Loss']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="loss" 
                      stroke="#ea580c" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#ea580c' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Historical Data</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-600 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Loss (kg/day)</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => {
                    const datePart = record.date.split(' ')[0];
                    return (
                      <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-gray-700 font-medium">
                          {datePart}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-orange-600 font-semibold">
                          {record.loss.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setSelectedDate(datePart);
                              const newMonth = datePart.substring(0, 7);
                              if (newMonth !== selectedMonth) {
                                setSelectedMonth(newMonth);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
