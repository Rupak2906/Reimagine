// Content Script - Runs on every webpage
console.log('🛡️ Fraud Shield: Content script loaded');

const tracker = new BehavioralTracker();

// Detect credit card input fields
function isCreditCardField(input) {
  const patterns = [
    /card.*number/i,
    /cc.*number/i,
    /cardnumber/i,
    /creditcard/i
  ];

  const name = input.name || '';
  const id = input.id || '';
  const placeholder = input.placeholder || '';
  const text = `${name} ${id} ${placeholder}`.toLowerCase();

  return patterns.some(pattern => pattern.test(text)) || 
         input.autocomplete === 'cc-number';
}

// Monitor all forms on the page
function monitorForms() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      if (isCreditCardField(input)) {
        console.log('🛡️ Credit card field detected!', input);
        attachTracking(input);
      }
    });
  });
}

// Attach keystroke tracking
function attachTracking(input) {
  input.addEventListener('focus', () => {
    console.log('🛡️ Started tracking');
    tracker.startTracking();
  });

  input.addEventListener('keydown', (e) => {
    tracker.trackKeystroke(e, 'card');
  });

  input.addEventListener('blur', () => {
    console.log('🛡️ Stopped tracking');
    tracker.stopTracking();
    const pattern = tracker.getPattern();
    console.log('📊 Pattern captured:', pattern);
  });
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', monitorForms);
} else {
  monitorForms();
}

console.log('🛡️ Fraud Shield: Monitoring for payment forms...');
