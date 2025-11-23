import React, { useState } from 'react';
import SignUpPage from './components/SignUpPage';
import { Shield, TrendingUp, CreditCard, Lock, User, Bell, Home, Wallet, Car, Briefcase, Building2, Gift, LogOut, Database, Plus } from 'lucide-react';

export default function CapitolZeroApp() {
  const [currentView, setCurrentView] = useState('landing'); // landing, signup, login, dashboard, data
  const [currentSection, setCurrentSection] = useState('accounts');
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('🔐 Switching to DYNAMIC model - continuous monitoring active');
    setCurrentView('dashboard');
  };

  const handleSignUpComplete = (newUserData) => {
    console.log('✅ User created with behavioral baseline');
    setUserData(newUserData);
    setCurrentView('login');
  };

  const handleLogout = () => {
    setFormData({ username: '', password: '', rememberMe: false });
    setCurrentView('landing');
    setCurrentSection('accounts');
  };

  // Mock data
  const transactions = [
    { id: 1, merchant: 'Amazon', amount: -127.49, date: '2025-11-22', category: 'Shopping', type: 'debit' },
    { id: 2, merchant: 'Starbucks', amount: -5.47, date: '2025-11-22', category: 'Food & Dining', type: 'debit' },
    { id: 3, merchant: 'Payroll Deposit', amount: 3250.00, date: '2025-11-21', category: 'Income', type: 'credit' },
  ];

  const accounts = [
    { id: 1, name: 'Checking Account', number: '****4829', balance: 12847.32, type: 'checking' },
    { id: 2, name: 'Savings Account', number: '****7251', balance: 25430.18, type: 'savings' },
    { id: 3, name: 'Credit Card', number: '****8932', balance: -1245.67, type: 'credit', limit: 10000 },
  ];

  const creditCards = [
    { id: 1, name: 'Capitol Zero Rewards', number: '****8932', balance: 1245.67, limit: 10000, apr: 18.99, rewards: '2% Cash Back', color: 'from-purple-600 to-blue-600' },
    { id: 2, name: 'Capitol Zero Travel', number: '****2451', balance: 0, limit: 15000, apr: 16.99, rewards: '3X Points on Travel', color: 'from-blue-600 to-cyan-600' },
  ];

  // Show signup page
  if (currentView === 'signup') {
    return (
      <SignUpPage
        onSignUpComplete={handleSignUpComplete}
        onBackToLogin={() => setCurrentView('login')}
      />
    );
  }

  // Landing/Login Page
  if (currentView === 'landing' || currentView === 'login') {
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
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h2>
            <p className="text-slate-600 mb-8">
              Don't have an account?{' '}
              <button
                onClick={() => setCurrentView('signup')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up now
              </button>
            </p>
            
            <form onSubmit={handleLogin}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                  onClick={() => setCurrentView('signup')}
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

  // Dashboard (simplified - add full version from previous code)
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
                onClick={() => setCurrentView('data')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {creditCards.map((card) => (
              <div key={card.id} className="bg-white rounded-xl shadow-md overflow-hidden">
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
                    <span className="text-slate-600">Available</span>
                    <span className="font-semibold text-green-600">${(card.limit - card.balance).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
