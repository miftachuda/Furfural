import React, { useState } from 'react';
import type { PlantParameter } from '../config/parameters';
import { Plus, Settings, X } from 'lucide-react';

interface ParameterManagerProps {
  parameters: PlantParameter[];
  onParametersChange: (params: PlantParameter[]) => void;
}

export const ParameterManager: React.FC<ParameterManagerProps> = ({ parameters, onParametersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newParam, setNewParam] = useState<Partial<PlantParameter>>({
    color: '#000000'
  });

  const handleAdd = () => {
    if (newParam.tagNumber && newParam.name) {
      const param: PlantParameter = {
        id: `p_${Date.now()}`,
        tagNumber: newParam.tagNumber,
        name: newParam.name,
        description: newParam.description || '',
        limitLow: Number(newParam.limitLow) || 0,
        limitHigh: Number(newParam.limitHigh) || 100,
        color: newParam.color || '#000000',
        unit: newParam.unit || ''
      };
      
      onParametersChange([...parameters, param]);
      setNewParam({ color: '#000000' });
    }
  };

  const handleRemove = (id: string) => {
    onParametersChange(parameters.filter(p => p.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Settings size={20} className="text-gray-500" />
          Monitored Parameters
        </h2>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-md transition-colors"
        >
          {isOpen ? 'Close Manager' : 'Manage Parameters'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {parameters.map(p => (
          <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-sm shadow-sm" style={{ borderLeftColor: p.color, borderLeftWidth: '4px' }}>
            <div>
              <span className="font-semibold text-gray-700">{p.name}</span>
              <span className="text-xs text-gray-500 ml-2">({p.tagNumber})</span>
            </div>
            {isOpen && (
              <button onClick={() => handleRemove(p.id)} className="text-gray-400 hover:text-red-500 ml-2">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="mt-4 p-4 border border-gray-100 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Parameter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input 
              type="text" 
              placeholder="Tag Number (e.g. 41T101_P_LEVEL.pv)" 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={newParam.tagNumber || ''}
              onChange={e => setNewParam({...newParam, tagNumber: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Display Name" 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={newParam.name || ''}
              onChange={e => setNewParam({...newParam, name: e.target.value})}
            />
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="Low Limit" 
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={newParam.limitLow || ''}
                onChange={e => setNewParam({...newParam, limitLow: Number(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="High Limit" 
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={newParam.limitHigh || ''}
                onChange={e => setNewParam({...newParam, limitHigh: Number(e.target.value)})}
              />
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Unit" 
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={newParam.unit || ''}
                onChange={e => setNewParam({...newParam, unit: e.target.value})}
              />
              <input 
                type="color" 
                className="w-12 h-9 p-0.5 border border-gray-300 rounded-md"
                value={newParam.color || '#000000'}
                onChange={e => setNewParam({...newParam, color: e.target.value})}
              />
              <button 
                onClick={handleAdd}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center transition-colors"
                title="Add Parameter"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}