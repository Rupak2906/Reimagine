import React, { useState, useEffect } from 'react';
import { Shield, Activity, Globe, Settings } from 'lucide-react';
import { Stats } from './types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    transactionsProtected: 0,
    threatsBlocked: 0,
    protectionActive: true
  });

  useEffect(() => {
    chrome.storage.local.get(['stats'], (result) => {
      if (result.stats) {
        setStats(result.stats);
      }
    });
  }, []);

  const resetOnboarding = () => {
    if (window.confirm('This will delete your learned pattern. Continue?')) {
      chrome.storage.local.clear(() => {
        window.location.reload();
      });
    }
  };

  return (
    <div className="w-[400px] h-[500px] bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Fraud Shield</h1>
              <p className="text-sm text-blue-100">AI Protection Active</p>
            </div>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 bg-green-500/20 border border-green-300/30 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Protected</span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Transactions Protected */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Protected</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.transactionsProtected}
            </p>
            <p className="text-xs text-gray-600 mt-1">Transactions</p>
          </div>

          {/* Threats Blocked */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-600 font-medium">Blocked</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.threatsBlocked}
            </p>
            <p className="text-xs text-gray-600 mt-1">Threats</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Recent Activity
          </h3>
          <div className="text-sm text-gray-500 text-center py-4">
            No recent activity. Browse to a website with a payment form to test!
          </div>
        </div>

        {/* Protection Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Learns your typing pattern</li>
            <li>• Checks website reputation</li>
            <li>• Blocks suspicious activity</li>
          </ul>
        </div>

        {/* Reset Button */}
        <button 
          onClick={resetOnboarding}
          className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
        >
          Reset & Retrain Pattern
        </button>
      </div>
    </div>
  );
};
