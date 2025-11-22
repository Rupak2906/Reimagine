import React, { useState } from 'react';
import { Shield, Check, ArrowRight } from 'lucide-react';
import { KeystrokeEvent, BehavioralBaseline } from './types';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [testInput, setTestInput] = useState('');
  const [keystrokePattern, setKeystrokePattern] = useState<KeystrokeEvent[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const testCardNumber = '4532 1234 5678 9010';

  const startTest = () => {
    setIsRecording(true);
    setTestInput('');
    setKeystrokePattern([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isRecording) return;

    const keystroke: KeystrokeEvent = {
      key: e.key,
      timestamp: Date.now(),
      duration: e.timeStamp
    };

    setKeystrokePattern(prev => [...prev, keystroke]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestInput(e.target.value);

    const typed = e.target.value.replace(/\s/g, '');
    const target = testCardNumber.replace(/\s/g, '');
    
    if (typed === target) {
      setIsRecording(false);
      setTimeout(() => setStep(3), 500);
    }
  };

  const saveBaseline = () => {
    if (keystrokePattern.length < 2) return;

    const timestamps = keystrokePattern.map(k => k.timestamp);
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgSpeed = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => 
      sum + Math.pow(val - avgSpeed, 2), 0
    ) / intervals.length;

    const baseline: BehavioralBaseline = {
      typingSpeed: avgSpeed,
      rhythm: Math.sqrt(variance),
      keystrokeCount: keystrokePattern.length,
      pattern: keystrokePattern
    };

    chrome.storage.local.set({ 
      behavioralBaseline: baseline,
      onboardingComplete: true,
      userId: 'user_' + Date.now(),
      stats: {
        transactionsProtected: 0,
        threatsBlocked: 0,
        protectionActive: true
      }
    }, () => {
      console.log('✅ Baseline saved:', baseline);
      onComplete();
    });
  };

  return (
    <div className="w-[400px] h-[500px] bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex flex-col">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Fraud Shield</h1>
        <p className="text-sm text-gray-600 mt-2">AI-Powered Card Protection</p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map(num => (
          <div
            key={num}
            className={`w-2 h-2 rounded-full ${
              step >= num ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Welcome! Let's Learn Your Typing Pattern
          </h2>
          <p className="text-gray-600 mb-6">
            To protect you from fraud, we need to learn how you naturally type. 
            This takes just 30 seconds.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Detects if someone else is using your card</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Warns you about scam websites</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Works on any website automatically</span>
            </li>
          </ul>
          <button
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Type This Card Number
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Type naturally, as if you're entering your real card. Don't worry, this is just practice!
          </p>
          
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
            <div className="text-center text-2xl font-mono text-gray-800 tracking-wider mb-4">
              {testCardNumber}
            </div>
            
            {!isRecording && (
              <button
                onClick={startTest}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
              >
                Start Typing Test
              </button>
            )}
            
            {isRecording && (
              <div>
                <input
                  type="text"
                  value={testInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type here..."
                  className="w-full px-4 py-3 border-2 border-blue-500 rounded-lg text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  maxLength={19}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {keystrokePattern.length} keystrokes recorded
                </p>
              </div>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              Recording your typing pattern...
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Pattern Learned!
          </h2>
          <p className="text-gray-600 text-center mb-8">
            We've learned your unique typing pattern. You're now protected from fraud!
          </p>
          
          <div className="bg-white rounded-lg p-4 w-full mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Your Pattern:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Keystrokes:</span>
                <span className="font-medium">{keystrokePattern.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Speed:</span>
                <span className="font-medium">
                  {keystrokePattern.length > 1
                    ? Math.round(
                        (keystrokePattern[keystrokePattern.length - 1].timestamp -
                          keystrokePattern[0].timestamp) /
                          keystrokePattern.length
                      )
                    : 0}
                  ms
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={saveBaseline}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Activate Protection
          </button>
        </div>
      )}
    </div>
  );
};
