// Background Script - Runs in extension background
console.log('🛡️ Fraud Shield: Background script loaded');

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  if (request.type === 'VERIFY_TRANSACTION') {
    // TODO: Call backend API
    console.log('Transaction verification requested:', request.data);
    
    // For now, return mock response
    sendResponse({
      riskScore: 25,
      decision: 'approved',
      confidence: 75
    });
  }
  
  return true; // Keep channel open for async response
});

console.log('🛡️ Fraud Shield: Ready to protect!');
