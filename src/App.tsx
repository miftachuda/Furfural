import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { FurfuralLoss } from './components/FurfuralLoss';

function App() {
  const [activeTab, setActiveTab] = useState<'kondisi' | 'loss'>('kondisi');

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8 h-16">
            <button
              onClick={() => setActiveTab('kondisi')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'kondisi'
                  ? 'border-blue-600 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kondisi Operasi
            </button>
            <button
              onClick={() => setActiveTab('loss')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'loss'
                  ? 'border-blue-600 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Furfural Loss
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {activeTab === 'kondisi' ? <Dashboard /> : <FurfuralLoss />}
      </main>
    </div>
  );
}

export default App;
