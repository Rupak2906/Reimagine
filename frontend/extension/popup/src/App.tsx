import React, { useState, useEffect } from 'react';
import { Onboarding } from './Onboarding';
import { Dashboard } from './Dashboard';

function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    chrome.storage.local.get(['onboardingComplete'], (result) => {
      setOnboardingComplete(result.onboardingComplete || false);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="w-[400px] h-[500px] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Fraud Shield...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {onboardingComplete ? (
        <Dashboard />
      ) : (
        <Onboarding onComplete={() => setOnboardingComplete(true)} />
      )}
    </div>
  );
}

export default App;
