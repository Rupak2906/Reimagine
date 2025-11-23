import React, { useState } from 'react';
import { Shield, TrendingUp, CreditCard, Send, DollarSign, Lock, User, MapPin, HelpCircle, Search, Bell, Home, Wallet, Car, Briefcase, Building2, Gift, LogOut, Database, Plus, ArrowRight, Star, Percent, Clock, Activity, AlertTriangle, CheckCircle, Mouse, Keyboard, Wifi, Monitor, Eye, ArrowLeft } from 'lucide-react';

// Data Debug Page Component
function DataDebugPage({ onBack }) {
  const [fraudData, setFraudData] = useState({
    mouseJitter: 0,
    pathStraightness: 0,
    hoverDelay: 0,
    rageHover: 0,
    clickDuration: 0,
    scrollVelocity: 0,
    scrollRhythm: 0,
    mouseIdleTime: 0,
    interKeyDelay: 0,
    dwellTime: 0,
    backspaceRatio: 0,
    typingConsistency: 0,
    copyPasteDetected: false,
    typingBurstPattern: 0,
    ipDistance: 0,
    vpnDetected: false,
    timezoneMismatch: 0,
    deviceChanges: 0,
    latencyConsistency: 0,
    tabSwitches: 0,
    totalRiskScore: 0,
    riskLevel: 'SAFE'
  });

  const [mousePositions, setMousePositions] = useState([]);
  const [keystrokes, setKeystrokes] = useState([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const jitter = Math.random() * 50;
      const straightness = Math.random();
      
      const newData = {
        mouseJitter: jitter,
        pathStraightness: straightness,
        hoverDelay: 100 + Math.random() * 500,
        rageHover: Math.floor(Math.random() * 10),
        clickDuration: 50 + Math.random() * 150,
        scrollVelocity: 500 + Math.random() * 3000,
        scrollRhythm: Math.random(),
        mouseIdleTime: 200 + Math.random() * 2800,
        interKeyDelay: 80 + Math.random() * 200,
        dwellTime: 40 + Math.random() * 100,
        backspaceRatio: Math.random() * 15,
        typingConsistency: 0.15 + Math.random() * 0.35,
        copyPasteDetected: Math.random() > 0.9,
        typingBurstPattern: 100 + Math.random() * 100,
        ipDistance: Math.random() * 5000,
        vpnDetected: Math.random() > 0.85,
        timezoneMismatch: Math.floor(Math.random() * 8),
        deviceChanges: Math.floor(Math.random() * 8),
        latencyConsistency: Math.random(),
        tabSwitches: Math.floor(Math.random() * 15)
      };

      let risk = 0;
      if (newData.mouseJitter > 45) risk += 6; else if (newData.mouseJitter > 25) risk += 3;
      if (newData.pathStraightness > 0.8) risk += 5; else if (newData.pathStraightness > 0.65) risk += 2;
      if (newData.hoverDelay < 50) risk += 7; else if (newData.hoverDelay < 150) risk += 3;
      if (newData.rageHover > 7) risk += 5; else if (newData.rageHover > 3) risk += 2;
      if (newData.clickDuration < 30) risk += 8; else if (newData.clickDuration < 70) risk += 4;
      if (newData.scrollVelocity > 4000 || newData.scrollVelocity < 200) risk += 6;
      if (newData.scrollRhythm > 0.9) risk += 6;
      if (newData.mouseIdleTime < 200) risk += 5;
      if (newData.interKeyDelay < 40) risk += 7; else if (newData.interKeyDelay < 80) risk += 3;
      if (newData.dwellTime < 20 || newData.dwellTime > 250) risk += 5;
      if (newData.backspaceRatio === 0 || newData.backspaceRatio > 20) risk += 6;
      if (newData.typingConsistency < 0.10) risk += 6;
      if (newData.copyPasteDetected) risk += 10;
      if (newData.ipDistance > 3000) risk += 10; else if (newData.ipDistance > 100) risk += 4;
      if (newData.vpnDetected) risk += 10;
      if (newData.timezoneMismatch > 3) risk += 8;
      if (newData.deviceChanges > 5) risk += 10;
      if (newData.latencyConsistency > 0.95) risk += 5;
      if (newData.tabSwitches > 10) risk += 6;

      const riskLevel = risk < 30 ? 'SAFE' : risk < 70 ? 'MEDIUM' : risk < 90 ? 'HIGH' : 'CRITICAL';

      setFraudData({...newData, totalRiskScore: Math.min(100, risk), riskLevel});
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePositions(prev => [...prev.slice(-50), { x: e.clientX, y: e.clientY, time: Date.now() }]);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      setKeystrokes(prev => [...prev.slice(-30), { key: e.key, time: Date.now() }]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getRiskColor = (level) => {
    switch(level) {
      case 'SAFE': return 'text-green-600 bg-green-100 border-green-500';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-500';
      case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-500';
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-500';
      default: return 'text-slate-600 bg-slate-100 border-slate-500';
    }
  };

  const MetricCard = ({ title, value, unit, normalRange, mediumRange, highRange, icon: Icon, riskPoints }) => {
    let status = 'NORMAL';
    let statusColor = 'bg-green-100 text-green-700';
    let risk = 0;

    if (highRange && ((highRange.includes('>') && value > parseFloat(highRange.replace('>', ''))) || 
        (highRange.includes('<') && value < parseFloat(highRange.replace('<', ''))))) {
      status = 'HIGH RISK';
      statusColor = 'bg-red-100 text-red-700';
      risk = riskPoints?.high || 0;
    } else if (mediumRange && mediumRange !== '') {
      status = 'MEDIUM RISK';
      statusColor = 'bg-yellow-100 text-yellow-700';
      risk = riskPoints?.medium || 0;
    }

    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
          </div>
          {risk > 0 && <span className="text-xs font-bold text-red-400">+{risk}</span>}
        </div>
        <div className="mb-2">
          <span className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toFixed(1) : value}</span>
          <span className="text-sm text-slate-400 ml-1">{unit}</span>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${statusColor} inline-block font-semibold`}>
          {status}
        </div>
        <div className="mt-2 text-xs text-slate-400">
          <div>Normal: {normalRange}</div>
          {mediumRange && <div>Medium: {mediumRange}</div>}
          {highRange && <div>High: {highRange}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-400" />
                <div>
                  <h1 className="text-xl font-bold">Real-Time Fraud Detection Data</h1>
                  <p className="text-sm text-slate-400">Live behavioral biometrics analysis</p>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border-2 ${getRiskColor(fraudData.riskLevel)}`}>
              <div className="text-xs font-semibold">RISK LEVEL</div>
              <div className="text-2xl font-bold">{fraudData.riskLevel}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-6 rounded-xl border-2 ${getRiskColor(fraudData.riskLevel)}`}>
            <Shield className="w-8 h-8 mb-2" />
            <div className="text-sm font-semibold mb-1">Total Risk Score</div>
            <div className="text-4xl font-bold">{fraudData.totalRiskScore.toFixed(0)}</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <Mouse className="w-8 h-8 text-blue-400 mb-2" />
            <div className="text-sm text-slate-400 mb-1">Mouse Samples</div>
            <div className="text-3xl font-bold">{mousePositions.length}</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <Keyboard className="w-8 h-8 text-green-400 mb-2" />
            <div className="text-sm text-slate-400 mb-1">Keystroke Samples</div>
            <div className="text-3xl font-bold">{keystrokes.length}</div>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <Clock className="w-8 h-8 text-purple-400 mb-2" />
            <div className="text-sm text-slate-400 mb-1">Session Time</div>
            <div className="text-3xl font-bold">{Math.floor(Date.now() / 60000) % 60}m</div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Mouse className="w-6 h-6 text-blue-400" />
            Mouse Dynamics (8 Variables)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Mouse Jitter" value={fraudData.mouseJitter} unit="px/s" normalRange="5-25" mediumRange="25-45" highRange=">45" icon={Activity} riskPoints={{medium:3,high:6}} />
            <MetricCard title="Path Straightness" value={fraudData.pathStraightness} unit="(0-1)" normalRange="0.25-0.65" mediumRange="0.65-0.8" highRange=">0.8" icon={TrendingUp} riskPoints={{medium:2,high:5}} />
            <MetricCard title="Hover Delay" value={fraudData.hoverDelay} unit="ms" normalRange="150-600" mediumRange="50-150" highRange="<50" icon={Clock} riskPoints={{medium:3,high:7}} />
            <MetricCard title="Rage Hover" value={fraudData.rageHover} unit="count" normalRange="0-3" mediumRange="4-7" highRange=">7" icon={Mouse} riskPoints={{medium:2,high:5}} />
            <MetricCard title="Click Duration" value={fraudData.clickDuration} unit="ms" normalRange="70-160" mediumRange="30-70" highRange="<30" icon={Mouse} riskPoints={{medium:4,high:8}} />
            <MetricCard title="Scroll Velocity" value={fraudData.scrollVelocity} unit="px/s" normalRange="300-2500" mediumRange="" highRange=">4000" icon={Activity} riskPoints={{high:6}} />
            <MetricCard title="Scroll Rhythm" value={fraudData.scrollRhythm} unit="var" normalRange="Non-uniform" mediumRange="" highRange=">0.9" icon={Activity} riskPoints={{high:6}} />
            <MetricCard title="Mouse Idle" value={fraudData.mouseIdleTime} unit="ms" normalRange="300-3000" mediumRange="" highRange="<200" icon={Clock} riskPoints={{high:5}} />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-green-400" />
            Keyboard Dynamics (6 Variables)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard title="Inter-Key Delay" value={fraudData.interKeyDelay} unit="ms" normalRange="80-280" mediumRange="<80" highRange="<40" icon={Keyboard} riskPoints={{medium:3,high:7}} />
            <MetricCard title="Dwell Time" value={fraudData.dwellTime} unit="ms" normalRange="40-120" mediumRange="" highRange="<20 or >250" icon={Clock} riskPoints={{high:5}} />
            <MetricCard title="Backspace Ratio" value={fraudData.backspaceRatio} unit="%" normalRange="3-12" mediumRange="" highRange="0 or >20" icon={Keyboard} riskPoints={{high:6}} />
            <MetricCard title="Typing Consistency" value={fraudData.typingConsistency} unit="CV" normalRange="0.15-0.50" mediumRange="" highRange="<0.10" icon={Activity} riskPoints={{high:6}} />
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">Copy-Paste</h4>
              <div className={`text-2xl font-bold ${fraudData.copyPasteDetected ? 'text-red-400' : 'text-green-400'}`}>
                {fraudData.copyPasteDetected ? 'DETECTED' : 'NONE'}
              </div>
              {fraudData.copyPasteDetected && <div className="text-xs font-bold text-red-400 mt-1">+10 RISK</div>}
            </div>
            <MetricCard title="Typing Burst" value={fraudData.typingBurstPattern} unit="ms" normalRange="Irregular" mediumRange="" highRange="145-155" icon={Activity} riskPoints={{high:7}} />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Wifi className="w-6 h-6 text-purple-400" />
            Device & Network (6 Variables)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard title="IP Distance" value={fraudData.ipDistance} unit="km" normalRange="<100" mediumRange="100-3000" highRange=">3000" icon={MapPin} riskPoints={{medium:4,high:10}} />
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">VPN/Proxy</h4>
              <div className={`text-2xl font-bold ${fraudData.vpnDetected ? 'text-red-400' : 'text-green-400'}`}>
                {fraudData.vpnDetected ? 'DETECTED' : 'NOT DETECTED'}
              </div>
              {fraudData.vpnDetected && <div className="text-xs font-bold text-red-400 mt-1">+10 RISK</div>}
            </div>
            <MetricCard title="Timezone Mismatch" value={fraudData.timezoneMismatch} unit="hrs" normalRange="0" mediumRange="1" highRange=">3" icon={Clock} riskPoints={{medium:3,high:8}} />
            <MetricCard title="Device Changes" value={fraudData.deviceChanges} unit="fields" normalRange="0-1" mediumRange="2-4" highRange=">5" icon={Monitor} riskPoints={{medium:4,high:10}} />
            <MetricCard title="Latency Consistency" value={fraudData.latencyConsistency} unit="(0-1)" normalRange="Varies" mediumRange="" highRange=">0.95" icon={Activity} riskPoints={{high:5}} />
            <MetricCard title="Tab Switches" value={fraudData.tabSwitches} unit="count" normalRange="0-3" mediumRange="4-10" highRange=">10" icon={Eye} riskPoints={{medium:3,high:6}} />
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-3">Alert Actions by Risk Level:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div><span className="font-bold text-green-400">0-30 SAFE:</span> Continue normally</div>
            <div><span className="font-bold text-yellow-400">30-70 MEDIUM:</span> Duo Push Alert</div>
            <div><span className="font-bold text-orange-400">70-90 HIGH:</span> Page Freeze + SMS</div>
            <div><span className="font-bold text-red-400">90-100 CRITICAL:</span> Full Bank Takeover</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
export default function CapitolZeroWebsite() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentSection, setCurrentSection] = useState('accounts');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setFormData({ username: '', password: '', rememberMe: false });
    setCurrentPage('login');
    setCurrentSection('accounts');
  };

  // Show Data Debug Page
  if (currentPage === 'data') {
    return <DataDebugPage onBack={() => setCurrentPage('dashboard')} />;
  }

  const transactions = [
    { id: 1, merchant: 'Amazon', amount: -127.49, date: '2025-11-22', category: 'Shopping', type: 'debit' },
    { id: 2, merchant: 'Starbucks', amount: -5.47, date: '2025-11-22', category: 'Food & Dining', type: 'debit' },
    { id: 3, merchant: 'Payroll Deposit', amount: 3250.00, date: '2025-11-21', category: 'Income', type: 'credit' },
    { id: 4, merchant: 'Netflix', amount: -15.99, date: '2025-11-20', category: 'Entertainment', type: 'debit' },
    { id: 5, merchant: 'Shell Gas', amount: -45.20, date: '2025-11-20', category: 'Transportation', type: 'debit' },
  ];

  const accounts = [
    { id: 1, name: 'Checking Account', number: '****4829', balance: 12847.32, type: 'checking' },
    { id: 2, name: 'Savings Account', number: '****7251', balance: 25430.18, type: 'savings' },
    { id: 3, name: 'Credit Card', number: '****8932', balance: -1245.67, type: 'credit', limit: 10000 },
  ];

  const creditCards = [
    { id: 1, name: 'Capitol Zero Rewards', number: '****8932', balance: 1245.67, limit: 10000, apr: 18.99, rewards: '2% Cash Back', color: 'from-purple-600 to-blue-600' },
    { id: 2, name: 'Capitol Zero Travel', number: '****2451', balance: 0, limit: 15000, apr: 16.99, rewards: '3X Points on Travel', color: 'from-blue-600 to-cyan-600' },
    { id: 3, name: 'Capitol Zero Business', number: '****7823', balance: 3420.50, limit: 25000, apr: 14.99, rewards: '1.5% Cash Back', color: 'from-slate-700 to-slate-900' },
  ];

  const savingsAccounts = [
    { id: 1, name: 'High-Yield Savings', number: '****7251', balance: 25430.18, apy: 4.35, type: 'savings' },
    { id: 2, name: 'Emergency Fund', number: '****9182', balance: 15000.00, apy: 4.35, type: 'savings' },
    { id: 3, name: 'Vacation Fund', number: '****3344', balance: 5230.50, apy: 4.35, type: 'savings' },
  ];

  const autoLoans = [
    { id: 1, vehicle: '2023 Tesla Model 3', loan: '****1234', balance: 28450.00, payment: 580, rate: 3.99 },
    { id: 2, vehicle: '2021 Honda Accord', loan: '****5678', balance: 12300.00, payment: 425, rate: 4.25 },
  ];

  const businessAccounts = [
    { id: 1, name: 'Business Checking', number: '****4455', balance: 45678.90, type: 'checking' },
    { id: 2, name: 'Payroll Account', number: '****6677', balance: 22000.00, type: 'checking' },
    { id: 3, name: 'Business Savings', number: '****8899', balance: 78900.50, type: 'savings' },
  ];

  if (currentPage === 'login') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">C0</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Capitol Zero
                </h1>
              </div>
              <nav className="hidden lg:flex items-center gap-6 text-sm">
                <button className="text-slate-700 hover:text-blue-600 font-medium">Credit Cards</button>
                <button className="text-slate-700 hover:text-blue-600 font-medium">Checking & Savings</button>
                <button className="text-slate-700 hover:text-blue-600 font-medium">Auto</button>
                <button className="text-slate-700 hover:text-blue-600 font-medium">Business</button>
              </nav>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 sm:p-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Sign In</h2>
            
            <form onSubmit={handleLogin}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange('username')}
                      className="w-full pl-12 pr-12 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your username"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-yellow-900" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      className="w-full pl-12 pr-12 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your password"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-yellow-900" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                  />
                  <label htmlFor="remember" className="text-sm text-slate-700">Remember me</label>
                </div>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot username or password?
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg"
                >
                  Set up online access
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard page with all sections...
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C0</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Capitol Zero
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentPage('data')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
              >
                <Database className="w-4 h-4" />
                Data
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-full">
                <Bell className="w-5 h-5 text-slate-600" />
              </button>
              <div className="relative group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center cursor-pointer">
                  <span className="text-white font-semibold text-sm">JD</span>
                </div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'accounts', label: 'Accounts', icon: Home },
              { id: 'credit-cards', label: 'Credit Cards', icon: CreditCard },
              { id: 'checking-savings', label: 'Checking & Savings', icon: Wallet },
              { id: 'auto', label: 'Auto', icon: Car },
              { id: 'business', label: 'Business', icon: Briefcase },
              { id: 'commercial', label: 'Commercial', icon: Building2 },
              { id: 'benefits', label: 'Benefits & Tools', icon: Gift },
            ].map(section => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap ${
                  currentSection === section.id
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <section.icon className="w-4 h-4" />
                <span className="text-sm">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {currentSection === 'accounts' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {accounts.map((account) => (
                <div key={account.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">{account.name}</p>
                      <p className="text-xs text-slate-400">{account.number}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      account.type === 'checking' ? 'bg-blue-100' :
                      account.type === 'savings' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      {account.type === 'checking' ? <Wallet className="w-5 h-5 text-blue-600" /> :
                       account.type === 'savings' ? <TrendingUp className="w-5 h-5 text-green-600" /> :
                       <CreditCard className="w-5 h-5 text-purple-600" />}
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${account.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                    ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'credit' ? 'bg-green-100' : 'bg-slate-100'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{transaction.merchant}</p>
                        <p className="text-sm text-slate-500">{transaction.date} • {transaction.category}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-lg ${transaction.type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {currentSection === 'credit-cards' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Credit Cards</h2>
              <p className="text-slate-600">Manage your Capitol Zero credit cards and rewards</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creditCards.map((card) => (
                <div key={card.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg">
                  <div className={`h-48 bg-gradient-to-br ${card.color} p-6 text-white`}>
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-sm opacity-90">Capitol Zero</p>
                        <p className="text-lg font-bold">{card.name}</p>
                      </div>
                      <CreditCard className="w-8 h-8 opacity-80" />
                    </div>
                    <p className="text-xl font-mono mb-4">{card.number}</p>
                    <div className="flex justify-between text-sm">
                      <span>{card.rewards}</span>
                      <span>{card.apr}% APR</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Balance</span>
                      <span className="font-bold text-slate-900">${card.balance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="text-slate-600">Available Credit</span>
                      <span className="font-semibold text-green-600">${(card.limit - card.balance).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(card.balance / card.limit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Other sections remain the same... */}
      </div>
    </div>
  );
}
