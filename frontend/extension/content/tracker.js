// Behavioral Tracker
console.log('🛡️ Fraud Shield: Tracker loaded');

class BehavioralTracker {
  constructor() {
    this.keystrokePattern = [];
    this.baseline = null;
    this.isTracking = false;
  }

  startTracking() {
    this.isTracking = true;
    this.keystrokePattern = [];
  }

  stopTracking() {
    this.isTracking = false;
  }

  trackKeystroke(event, fieldType) {
    if (!this.isTracking) return;

    const keystroke = {
      key: event.key,
      timestamp: Date.now(),
      duration: event.timeStamp,
      fieldType: fieldType
    };

    this.keystrokePattern.push(keystroke);
  }

  getPattern() {
    return {
      keystrokes: this.keystrokePattern,
      totalKeys: this.keystrokePattern.length
    };
  }

  async loadBaseline() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['behavioralBaseline'], (result) => {
        this.baseline = result.behavioralBaseline || null;
        resolve(this.baseline);
      });
    });
  }
}

// Make tracker available globally
window.BehavioralTracker = BehavioralTracker;
