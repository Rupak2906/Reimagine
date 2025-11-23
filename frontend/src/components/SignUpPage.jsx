import React, { useState, useEffect, useRef } from 'react';
import { Shield, TrendingUp, CreditCard, DollarSign, Lock, User, MapPin, Phone, Mail, Calendar, Building, Wallet, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { useBehavioralTracking } from '../hooks/useBehavioralTracking';
import { supabase } from '../lib/supabase';

// Helper functions
function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  if (!arr.length) return null;
  const mean = avg(arr);
  const variance = arr.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(variance);
}

function curvatureRatio(curvatureSamples) {
  if (!curvatureSamples.length) return null;
  const ratios = curvatureSamples.map(c => c.actual / Math.max(c.straight, 1));
  return avg(ratios);
}

function typingSpeed(totalKeystrokes, durationMs) {
  const durationMin = durationMs / 60000;
  return totalKeystrokes / Math.max(durationMin, 0.01);
}

// Map question numbers to dtype values
const getDtypeForStep = (step, securityStep) => {
  if (step === 2) return 'account'; // Username/password step
  if (step === 3) {
    switch(securityStep) {
      case 1: return 'childhood'; // First childhood friend
      case 2: return 'nickname'; // Childhood nickname
      case 3: return 'concert'; // First concert
      case 4: return 'street'; // Street of childhood relative
      case 5: return 'travelling'; // First travel destination
      case 6: return 'vehicle'; // First vehicle model
      default: return null;
    }
  }
  return null;
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Behavioral tracking state
  const pageLoadTime = useRef(performance.now());
  const trackingState = useRef({
    // Keystrokes
    keyDownTimes: {},
    dwellTimes: [],
    flightTimes: [],
    lastKeyDownTime: null,
    backspaceCount: 0,
    totalKeystrokes: 0,
    copyPasteUsed: false,
    // Mouse
    lastMousePos: null,
    lastMouseTime: null,
    totalMouseDistance: 0,
    microCorrections: 0,
    mouseVelocities: [],
    curvatureSamples: [],
    // Scroll
    lastScrollTime: null,
    lastScrollY: window.scrollY,
    scrollVelocities: [],
    // Interaction timing
    firstInteractionTime: null,
    lastEventTime: performance.now(),
    idleTimeTotal: 0,
    // Device
    fingerprintHash: '',
    screenResolution: `${window.screen.width}x${window.screen.height}`
  });

  const collectedBehavioralData = useRef([]); // Store all behavioral data until account is created

  // Generate device fingerprint
  const generateFingerprint = async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText("fingerprinting test", 2, 2);
    const canvasHash = btoa(canvas.toDataURL());
    const gpu = navigator.gpu?.adapter?.name || "unknown";
    const raw = [
      canvasHash,
      navigator.userAgent,
      trackingState.current.screenResolution,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      gpu
    ].join("::");
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hash = await crypto.subtle.digest("SHA-256", data);
    trackingState.current.fingerprintHash = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  };

  // Collect behavioral data
  const collectMHacksData = async () => {
    await generateFingerprint();
    const now = performance.now();
    const state = trackingState.current;
    const duration = now - pageLoadTime.current;

    return {
      session_id: crypto.randomUUID(),
      user_agent: navigator.userAgent,
      dwell_time_mean_ms: avg(state.dwellTimes),
      dwell_time_std_ms: std(state.dwellTimes),
      flight_time_mean_ms: avg(state.flightTimes),
      typing_speed_cpm: typingSpeed(state.totalKeystrokes, duration),
      backspace_rate: state.backspaceCount / Math.max(state.totalKeystrokes, 1),
      copy_paste_used: state.copyPasteUsed,
      avg_velocity_px_ms: avg(state.mouseVelocities),
      path_curvature_ratio: curvatureRatio(state.curvatureSamples),
      click_precision_px: null,
      micro_corrections_per_movement: state.microCorrections,
      total_distance_px: state.totalMouseDistance,
      mouse_idle_time_ms: state.idleTimeTotal,
      scroll_velocity_px_s: avg(state.scrollVelocities) * 1000, // Convert to px/s
      fingerprint_hash: state.fingerprintHash,
      device_browser_id: navigator.userAgentData?.brands?.[0]?.brand || "unknown",
      device_os: navigator.platform,
      screen_resolution: state.screenResolution,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      gpu: navigator.gpu?.adapter?.name || "unknown",
      ip_address: null,
      is_datacenter: null,
      country_code: null,
      form_completion_time_ms: duration,
      time_to_first_interaction_ms: state.firstInteractionTime 
        ? state.firstInteractionTime - pageLoadTime.current 
        : null,
      idle_time_percentage: state.idleTimeTotal / duration,
      raw_json: {
        dwellTimes: state.dwellTimes,
        flightTimes: state.flightTimes,
        mouseVelocities: state.mouseVelocities,
        curvatureSamples: state.curvatureSamples,
        scrollVelocities: state.scrollVelocities
      }
    };
  };

  // Collect behavioral data for a step (store it, don't save yet)
  const collectBehavioralDataForStep = async () => {
    try {
      const dtype = getDtypeForStep(step, securityStep);
      if (!dtype) {
        console.log('⚠️ No dtype mapping for step', step, 'securityStep', securityStep);
        return; // Skip if no dtype mapping
      }

      console.log(`📊 Collecting behavioral data for dtype: ${dtype} (step ${step}, securityStep ${securityStep})`);
      const data = await collectMHacksData();
      console.log(`📊 Collected data sample:`, {
        totalKeystrokes: trackingState.current.totalKeystrokes,
        mouseDistance: trackingState.current.totalMouseDistance,
        dwellTimes: trackingState.current.dwellTimes.length,
        flightTimes: trackingState.current.flightTimes.length
      });
      
      const record = {
        dtype: dtype,
        questionNumber: step === 2 ? null : securityStep,
        session_id: data.session_id,
        user_id: null,
        dwell_time_mean_ms: data.dwell_time_mean_ms,
        dwell_time_std_ms: data.dwell_time_std_ms,
        flight_time_mean_ms: data.flight_time_mean_ms,
        typing_speed_cpm: data.typing_speed_cpm,
        backspace_rate: data.backspace_rate,
        copy_paste_used: data.copy_paste_used,
        avg_velocity_px_ms: data.avg_velocity_px_ms,
        path_curvature_ratio: data.path_curvature_ratio,
        click_precision_px: data.click_precision_px,
        micro_corrections_per_movement: data.micro_corrections_per_movement,
        total_distance_px: data.total_distance_px,
        mouse_idle_time_ms: data.mouse_idle_time_ms,
        scroll_velocity_px_s: data.scroll_velocity_px_s,
        fingerprint_hash: data.fingerprint_hash,
        device_browser_id: data.device_browser_id,
        device_os: data.device_os,
        screen_resolution: data.screen_resolution,
        timezone: data.timezone,
        gpu: data.gpu,
        ip_address: data.ip_address,
        is_datacenter: data.is_datacenter,
        country_code: data.country_code,
        form_completion_time_ms: data.form_completion_time_ms,
        time_to_first_interaction_ms: data.time_to_first_interaction_ms,
        idle_time_percentage: data.idle_time_percentage,
        user_agent: data.user_agent,
        raw_json: data.raw_json
      };

      collectedBehavioralData.current.push(record);
      console.log(`✅ Behavioral data collected and stored for dtype: ${dtype}`);
      console.log(`📦 Total records collected so far: ${collectedBehavioralData.current.length}`);

      resetTrackingState();
    } catch (err) {
      console.error('Error collecting behavioral data:', err);
    }
  };

  // Save all collected behavioral data to Supabase (after account is created)
  const saveAllBehavioralData = async (username) => {
    if (collectedBehavioralData.current.length === 0) {
      console.log('No behavioral data to save');
      return;
    }

    try {
      const recordsToSave = collectedBehavioralData.current.map(record => ({
        username: username,
        dtype: record.dtype,
        session_id: record.session_id,
        user_id: record.user_id,
        dwell_time_mean_ms: record.dwell_time_mean_ms,
        dwell_time_std_ms: record.dwell_time_std_ms,
        flight_time_mean_ms: record.flight_time_mean_ms,
        typing_speed_cpm: record.typing_speed_cpm,
        backspace_rate: record.backspace_rate,
        copy_paste_used: record.copy_paste_used,
        avg_velocity_px_ms: record.avg_velocity_px_ms,
        path_curvature_ratio: record.path_curvature_ratio,
        click_precision_px: record.click_precision_px,
        micro_corrections_per_movement: record.micro_corrections_per_movement,
        total_distance_px: record.total_distance_px,
        mouse_idle_time_ms: record.mouse_idle_time_ms,
        scroll_velocity_px_s: record.scroll_velocity_px_s,
        fingerprint_hash: record.fingerprint_hash,
        device_browser_id: record.device_browser_id,
        device_os: record.device_os,
        screen_resolution: record.screen_resolution,
        timezone: record.timezone,
        gpu: record.gpu,
        ip_address: record.ip_address,
        is_datacenter: record.is_datacenter,
        country_code: record.country_code,
        form_completion_time_ms: record.form_completion_time_ms,
        time_to_first_interaction_ms: record.time_to_first_interaction_ms,
        idle_time_percentage: record.idle_time_percentage,
        user_agent: record.user_agent,
        raw_json: record.raw_json
      }));

      const { data, error } = await supabase
        .from('mhacksdata')
        .insert(recordsToSave);

      if (error) {
        console.error('Error saving behavioral data:', error);
        throw error;
      } else {
        console.log(`✅ Saved ${recordsToSave.length} behavioral data records to mhacksdata`);
        collectedBehavioralData.current = [];
      }
    } catch (err) {
      console.error('Error saving all behavioral data:', err);
      throw err;
    }
  };

  // Reset tracking state (keep device info, reset interaction data)
  const resetTrackingState = () => {
    const state = trackingState.current;
    state.keyDownTimes = {};
    state.dwellTimes = [];
    state.flightTimes = [];
    state.lastKeyDownTime = null;
    state.backspaceCount = 0;
    state.totalKeystrokes = 0;
    state.copyPasteUsed = false;
    state.lastMousePos = null;
    state.lastMouseTime = null;
    state.totalMouseDistance = 0;
    state.microCorrections = 0;
    state.mouseVelocities = [];
    state.curvatureSamples = [];
    state.lastScrollTime = null;
    state.lastScrollY = window.scrollY;
    state.scrollVelocities = [];
    state.firstInteractionTime = null;
    state.lastEventTime = performance.now();
    state.idleTimeTotal = 0;
    pageLoadTime.current = performance.now();
  };

  // Event listeners for tracking
  useEffect(() => {
    const state = trackingState.current;

    const handleKeyDown = (e) => {
      if (!state.firstInteractionTime) state.firstInteractionTime = performance.now();
      state.totalKeystrokes++;
      if (e.key === "Backspace") state.backspaceCount++;
      state.keyDownTimes[e.key] = performance.now();
      if (state.lastKeyDownTime !== null) {
        state.flightTimes.push(performance.now() - state.lastKeyDownTime);
      }
      state.lastKeyDownTime = performance.now();
      state.lastEventTime = performance.now();
    };

    const handleKeyUp = (e) => {
      const downTime = state.keyDownTimes[e.key];
      if (downTime) {
        state.dwellTimes.push(performance.now() - downTime);
        delete state.keyDownTimes[e.key];
      }
      state.lastEventTime = performance.now();
    };

    const handlePaste = () => { state.copyPasteUsed = true; };
    const handleCopy = () => { state.copyPasteUsed = true; };

    const handleMouseMove = (e) => {
      if (!state.firstInteractionTime) state.firstInteractionTime = performance.now();
      const now = performance.now();
      if (state.lastMousePos) {
        const dx = e.clientX - state.lastMousePos.x;
        const dy = e.clientY - state.lastMousePos.y;
        const dt = now - state.lastMouseTime;
        const dist = Math.sqrt(dx * dx + dy * dy);
        state.totalMouseDistance += dist;
        if (dist < 2) state.microCorrections++;
        if (dt > 0) {
          const velocity = dist / dt;
          state.mouseVelocities.push(velocity);
        }
        state.curvatureSamples.push({
          actual: dist,
          straight: Math.abs(dx) + Math.abs(dy)
        });
      }
      state.lastMousePos = { x: e.clientX, y: e.clientY };
      state.lastMouseTime = now;
      state.lastEventTime = now;
    };

    const handleScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - state.lastScrollY);
      const dt = now - (state.lastScrollTime || now);
      if (dt > 0) {
        const v = dy / dt;
        state.scrollVelocities.push(v);
      }
      state.lastScrollTime = now;
      state.lastScrollY = window.scrollY;
      state.lastEventTime = now;
    };

    const detectIdle = () => {
      const now = performance.now();
      if (now - state.lastEventTime > 2000) {
        state.idleTimeTotal += now - state.lastEventTime;
      }
      state.lastEventTime = now;
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);
    setIsSubmitting(true);
    
    try {
      // Collect behavioral data for the last security question (question 6)
      if (formData.username && formData.securityQ6) {
        await collectBehavioralDataForStep();
      }

      // Analyze behavioral data
      const analysis = analyzeBehavior();
      
      // Format date of birth for database
      const dob = formData.dateOfBirth ? formData.dateOfBirth : null;
      
      // Prepare data for Supabase (excluding SSN)
      const userDataToSave = {
        username: formData.username,
        passwd: formData.password,
        email: formData.email,
        dob: dob,
        phone_num: formData.phone
      };

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('madhacks')
        .select('username')
        .eq('username', formData.username)
        .single();

      if (existingUser) {
        setSubmitError('Username already exists. Please choose a different username.');
        setIsSubmitting(false);
        return;
      }

      // Insert into Supabase - CREATE ACCOUNT FIRST
      const { data, error } = await supabase
        .from('madhacks')
        .insert([userDataToSave])
        .select()
        .single();

      if (error) {
        console.error('Sign up error:', error);
        setSubmitError(error.message || 'Failed to create account. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (data) {
        console.log('✅ Account Created in Supabase:', data);
        console.log('📊 Behavioral Profile Created:', analysis.profile);
        
        // NOW save all collected behavioral data (account exists, foreign key will work)
        try {
          await saveAllBehavioralData(formData.username);
        } catch (behaviorError) {
          console.error('Warning: Failed to save some behavioral data:', behaviorError);
          // Don't fail the whole signup if behavioral data fails
        }
        
        setSubmitSuccess(true);
        
        // Prepare user data for callback (excluding SSN)
        const userData = {
          id: data.id,
          username: data.username,
          email: data.email,
          phone: data.phone_num,
          dob: data.dob,
          behavioralProfile: analysis.profile,
          createdAt: data.created_at
        };
        
        // Wait a moment to show success message, then proceed
        setTimeout(() => {
          onSignUpComplete(userData);
        }, 1500);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    // Collect behavioral data when moving from step 2 to step 3 (username/password)
    if (step === 2 && formData.username) {
      await collectBehavioralDataForStep();
    }
    
    // Collect behavioral data for each security question when moving to next
    if (step === 3 && securityStep < 6) {
      const currentAnswer = formData[`securityQ${securityStep}`];
      if (currentAnswer && formData.username) {
        await collectBehavioralDataForStep();
      }
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
          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Account created successfully! Redirecting...</p>
            </div>
          )}

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
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                      placeholder="Choose a username"
                      required
                      disabled={isSubmitting || submitSuccess}
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
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                      placeholder="Create a strong password"
                      required
                      disabled={isSubmitting || submitSuccess}
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
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || submitSuccess}
                className="flex-1 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : submitSuccess ? (
                  'Account Created!'
                ) : (
                  'Create Account'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
