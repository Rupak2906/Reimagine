import React, { useState } from 'react';
import { Shield, TrendingUp, CreditCard, DollarSign, Lock, User, MapPin, Phone, Mail, Calendar, Building, Wallet, Activity } from 'lucide-react';
import { useBehavioralTracking } from '../hooks/useBehavioralTracking';

// Sign Up Page Component
export default function SignUpPage({ onSignUpComplete, onBackToLogin }) {
  const [step, setStep] = useState(1);
  const [securityStep, setSecurityStep] = useState(1); // For security questions sub-steps
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ssn: '',
    
    // Account
    accountType: 'checking',
    username: '',
    password: '',
    
    // Security Questions
    securityQ1: '', // First childhood friend
    securityQ2: '', // Childhood nickname
    securityQ3: '', // First concert/event
    securityQ4: '', // Favorite relative's street
    securityQ5: '', // First travel destination
    securityQ6: '', // First family vehicle model
  });

  const { behaviorData, analyzeBehavior } = useBehavioralTracking();

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Analyze behavioral data
    const analysis = analyzeBehavior();
    
    console.log('📊 Behavioral Profile Created:', analysis.profile);
    console.log('🔒 Raw Training Data Captured');
    
    // In production, this would:
    // 1. Send to ML model for training
    // 2. Create user baseline profile
    // 3. Store in database
    
    const userData = {
      ...formData,
      behavioralProfile: analysis.profile,
      createdAt: new Date().toISOString()
    };
    
    alert('✅ Account Created!\n\n📊 Behavioral Profile Established:\n' +
          `- Typing Speed: ${analysis.profile.avgTypingSpeed}ms avg\n` +
          `- Mouse Movements: ${analysis.profile.mouseMovementCount}\n` +
          `- Paste Detected: ${analysis.profile.pasteCount > 0 ? 'Yes ⚠️' : 'No ✓'}\n\n` +
          'This baseline will be used for fraud detection.');
    
    onSignUpComplete(userData);
  };

  const nextStep = () => {
    if (step === 3 && securityStep < 6) {
      setSecurityStep(prev => prev + 1);
    } else {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };
  
  const prevStep = () => {
    if (step === 3 && securityStep > 1) {
      setSecurityStep(prev => prev - 1);
    } else {
      setStep(prev => Math.max(prev - 1, 1));
      if (step === 3) {
        setSecurityStep(6); // Go to last security question if going back from step 3
      }
    }
  };

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
            <button 
              onClick={onBackToLogin}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Step {step === 3 ? `3.${securityStep}` : step} of 3
            </span>
            <span className="text-sm text-slate-500">
              {step === 3 
                ? `Security Question ${securityStep} of 6`
                : `${Math.round((step / 3) * 100)}% Complete`}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: step === 3 
                  ? `${66 + ((securityStep / 6) * 34)}%`
                  : `${(step / 3) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange('fullName')}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        onPaste={(e) => console.log('⚠️ Paste detected in email field')}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange('phone')}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange('dateOfBirth')}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Social Security Number *</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={formData.ssn}
                        onChange={handleInputChange('ssn')}
                        onPaste={(e) => {
                          e.preventDefault();
                          alert('⚠️ For security, pasting is not allowed in SSN field');
                        }}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="XXX-XX-XXXX"
                        maxLength="11"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Paste disabled for security</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Account Setup */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Account Setup</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Account Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'checking', label: 'Checking', icon: Wallet },
                      { value: 'savings', label: 'Savings', icon: TrendingUp },
                      { value: 'both', label: 'Both', icon: CreditCard }
                    ].map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, accountType: type.value }))}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.accountType === type.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                          formData.accountType === type.value ? 'text-blue-600' : 'text-slate-400'
                        }`} />
                        <p className="font-semibold text-center">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Username *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange('username')}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      onPaste={(e) => {
                        e.preventDefault();
                        alert('⚠️ For security, pasting is not allowed in password field');
                      }}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Create a strong password"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Security Questions - One at a time */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Security Questions</h2>
              <p className="text-slate-600 mb-8">Help us verify your identity in the future</p>
              
              <div className="space-y-4">
                {securityStep === 1 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What was the name of your first childhood friend? *
                    </label>
                    <input
                      type="text"
                      value={formData.securityQ1}
                      onChange={handleInputChange('securityQ1')}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                      placeholder="Your answer"
                      autoFocus
                      required
                    />
                  </div>
                )}

                {securityStep === 2 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What is the nickname your family used to call you growing up? *
                    </label>
                    <input
                      type="text"
                      value={formData.securityQ2}
                      onChange={handleInputChange('securityQ2')}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                      placeholder="Your answer"
                      autoFocus
                      required
                    />
                  </div>
                )}

                {securityStep === 3 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What was the first concert or live event you ever attended? *
                    </label>
                    <input
                      type="text"
                      value={formData.securityQ3}
                      onChange={handleInputChange('securityQ3')}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                      placeholder="Your answer"
                      autoFocus
                      required
                    />
                  </div>
                )}

                {securityStep === 4 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What is the name of the street where your favorite childhood relative lived? *
                    </label>
                    <input
                      type="text"
                      value={formData.securityQ4}
                      onChange={handleInputChange('securityQ4')}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                      placeholder="Your answer"
                      autoFocus
                      required
                    />
                  </div>
                )}

                {securityStep === 5 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What is the first place you remember traveling to outside your home city? *
                    </label>
                    <input
                      type="text"
                      value={formData.securityQ5}
                      onChange={handleInputChange('securityQ5')}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                      placeholder="Your answer"
                      autoFocus
                      required
                    />
                  </div>
                )}

                {securityStep === 6 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What was the model of the first vehicle your family owned? *
                    </label>
                    <input
                      type="text"
                      value={formData.securityQ6}
                      onChange={handleInputChange('securityQ6')}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                      placeholder="Your answer"
                      autoFocus
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200"
            >
              Previous
            </button>
            
            {(step < 3 || (step === 3 && securityStep < 6)) ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700"
              >
                Create Account
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
