import React, { useState } from 'react';
import type { PlantParameter } from '../config/parameters';
import { saveParameter, deleteParameter } from '../config/parameters';
import { Plus, Settings, X, Edit2, Save, AlertCircle } from 'lucide-react';

interface ParameterManagerProps {
  parameters: PlantParameter[];
  onParametersChange: (params: PlantParameter[]) => void;
}

export const ParameterManager: React.FC<ParameterManagerProps> = ({ parameters, onParametersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PlantParameter>>({});
  
  const [newParam, setNewParam] = useState<Partial<PlantParameter>>({
    color: '#3b82f6'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdd = async () => {
    if (newParam.tagNumber && newParam.name) {
      setIsSaving(true);
      setErrorMsg('');
      try {
        const paramToSave: PlantParameter = {
          tagNumber: newParam.tagNumber,
          name: newParam.name,
          description: newParam.description || '',
          limitLow: Number(newParam.limitLow) || 0,
          limitHigh: Number(newParam.limitHigh) || 100,
          color: newParam.color || '#3b82f6',
          unit: newParam.unit || ''
        };
        
        const savedParam = await saveParameter(paramToSave);
        onParametersChange([...parameters, savedParam]);
        setNewParam({ color: '#3b82f6' });
      } catch (e) {
        setErrorMsg('Failed to save parameter.');
      } finally {
        setIsSaving(false);
      }
    } else {
      setErrorMsg('Tag Number and Display Name are required.');
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this parameter?")) return;
    
    try {
      await deleteParameter(id);
      onParametersChange(parameters.filter(p => p.id !== id));
    } catch (e) {
      alert("Failed to delete parameter");
    }
  };

  const startEdit = (p: PlantParameter) => {
    setEditingId(p.id!);
    setEditForm({ ...p });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setIsSaving(true);
    
    try {
      const savedParam = await saveParameter(editForm as PlantParameter);
      onParametersChange(parameters.map(p => p.id === editingId ? savedParam : p));
      setEditingId(null);
      setEditForm({});
    } catch (e) {
       alert("Failed to update parameter");
    } finally {
      setIsSaving(false);
    }
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
          {isOpen ? 'Close Settings' : 'Settings'}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="flex flex-col gap-3 mb-4">
            {parameters.map(p => (
              <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-md border border-gray-200 text-sm shadow-sm bg-white gap-3" style={{ borderLeftColor: p.color, borderLeftWidth: '4px' }}>
                
                {editingId === p.id ? (
              // Edit Mode
              <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                <input 
                  type="text" 
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  value={editForm.tagNumber} 
                  onChange={e => setEditForm({...editForm, tagNumber: e.target.value})}
                  placeholder="Tag"
                />
                <input 
                  type="text" 
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Name"
                />
                <input 
                  type="text" 
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Description"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Low:</span>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={editForm.limitLow} 
                    onChange={e => setEditForm({...editForm, limitLow: Number(e.target.value)})}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">High:</span>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={editForm.limitHigh} 
                    onChange={e => setEditForm({...editForm, limitHigh: Number(e.target.value)})}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    className="w-8 h-8 p-0 border border-gray-300 rounded cursor-pointer"
                    value={editForm.color} 
                    onChange={e => setEditForm({...editForm, color: e.target.value})}
                  />
                  <button 
                    onClick={saveEdit} 
                    disabled={isSaving}
                    className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    title="Save"
                  >
                    <Save size={16} />
                  </button>
                  <button 
                    onClick={() => setEditingId(null)} 
                    className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-1">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{p.name}</span>
                    {p.description && <span className="text-xs text-gray-500 mt-0.5">{p.description}</span>}
                  </div>
                  <div className="text-sm text-gray-600 flex gap-4">
                    <span>Limit Low: <strong className={p.limitLow !== undefined ? "text-red-500" : ""}>{p.limitLow}</strong></span>
                    <span>Limit High: <strong className={p.limitHigh !== undefined ? "text-red-500" : ""}>{p.limitHigh}</strong></span>
                    {p.unit && <span className="text-gray-400">({p.unit})</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(p)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleRemove(p.id!)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                    <X size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 border border-blue-100 bg-blue-50/30 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Plus size={16} /> Add New Parameter
        </h3>
          
          {errorMsg && (
            <div className="mb-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <input 
              type="text" 
              placeholder="Tag Number" 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              value={newParam.tagNumber || ''}
              onChange={e => setNewParam({...newParam, tagNumber: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Display Name" 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              value={newParam.name || ''}
              onChange={e => setNewParam({...newParam, name: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Description" 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              value={newParam.description || ''}
              onChange={e => setNewParam({...newParam, description: e.target.value})}
            />
            <input 
              type="number" 
              step="0.01"
              placeholder="Low Limit" 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              value={newParam.limitLow || ''}
              onChange={e => setNewParam({...newParam, limitLow: Number(e.target.value)})}
            />
            <input 
              type="number" 
              step="0.01"
              placeholder="High Limit" 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              value={newParam.limitHigh || ''}
              onChange={e => setNewParam({...newParam, limitHigh: Number(e.target.value)})}
            />
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Unit" 
                className="w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                value={newParam.unit || ''}
                onChange={e => setNewParam({...newParam, unit: e.target.value})}
              />
              <input 
                type="color" 
                className="w-10 h-10 p-0.5 border border-gray-300 rounded-md bg-white cursor-pointer"
                value={newParam.color || '#3b82f6'}
                onChange={e => setNewParam({...newParam, color: e.target.value})}
              />
              <button 
                onClick={handleAdd}
                disabled={isSaving}
                className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center transition-colors ${isSaving ? 'opacity-50' : ''}`}
              >
                {isSaving ? '...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}