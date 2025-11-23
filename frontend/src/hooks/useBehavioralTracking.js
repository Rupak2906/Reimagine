import { useState, useEffect } from 'react';

// Behavioral Data Collector Hook
export function useBehavioralTracking() {
  const [behaviorData, setBehaviorData] = useState({
    mouseMovements: [],
    keystrokes: [],
    typingSpeeds: [],
    pasteEvents: [],
    clickPatterns: [],
    scrollEvents: [],
    fieldFocusTimes: {},
    startTime: Date.now()
  });

  useEffect(() => {
    // Track mouse movements
    const handleMouseMove = (e) => {
      setBehaviorData(prev => ({
        ...prev,
        mouseMovements: [...prev.mouseMovements.slice(-100), {
          x: e.clientX,
          y: e.clientY,
          time: Date.now() - prev.startTime
        }]
      }));
    };

    // Track keystrokes
    const handleKeyDown = (e) => {
      const currentTime = Date.now() - behaviorData.startTime;
      setBehaviorData(prev => {
        const newKeystrokes = [...prev.keystrokes, currentTime];
        
        // Calculate typing speed
        if (newKeystrokes.length >= 2) {
          const speed = currentTime - newKeystrokes[newKeystrokes.length - 2];
          return {
            ...prev,
            keystrokes: newKeystrokes.slice(-50),
            typingSpeeds: [...prev.typingSpeeds.slice(-30), speed]
          };
        }
        return { ...prev, keystrokes: newKeystrokes.slice(-50) };
      });
    };

    // Track paste events
    const handlePaste = (e) => {
      const field = e.target.name || e.target.id || 'unknown';
      setBehaviorData(prev => ({
        ...prev,
        pasteEvents: [...prev.pasteEvents, {
          field,
          time: Date.now() - prev.startTime
        }]
      }));
    };

    // Track clicks
    const handleClick = (e) => {
      setBehaviorData(prev => ({
        ...prev,
        clickPatterns: [...prev.clickPatterns.slice(-30), {
          x: e.clientX,
          y: e.clientY,
          time: Date.now() - prev.startTime
        }]
      }));
    };

    // Track scroll
    const handleScroll = (e) => {
      setBehaviorData(prev => ({
        ...prev,
        scrollEvents: [...prev.scrollEvents.slice(-20), {
          scrollY: window.scrollY,
          time: Date.now() - prev.startTime
        }]
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [behaviorData.startTime]);

  const analyzeBehavior = () => {
    const { mouseMovements, typingSpeeds, pasteEvents, keystrokes, clickPatterns, scrollEvents } = behaviorData;
    
    // Calculate typing metrics
    const avgTypingSpeed = typingSpeeds.length > 0 
      ? typingSpeeds.reduce((a, b) => a + b, 0) / typingSpeeds.length 
      : 0;
    
    const typingVariance = typingSpeeds.length > 0
      ? typingSpeeds.reduce((sum, speed) => sum + Math.pow(speed - avgTypingSpeed, 2), 0) / typingSpeeds.length
      : 0;

    // Calculate mouse movement metrics
    let totalDistance = 0;
    let straightLineDistance = 0;
    let mouseJitter = 0;
    
    if (mouseMovements.length > 1) {
      for (let i = 1; i < mouseMovements.length; i++) {
        const dx = mouseMovements[i].x - mouseMovements[i-1].x;
        const dy = mouseMovements[i].y - mouseMovements[i-1].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
      const first = mouseMovements[0];
      const last = mouseMovements[mouseMovements.length - 1];
      straightLineDistance = Math.sqrt(
        Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
      );
      
      // Calculate jitter (variance in movement)
      const distances = [];
      for (let i = 1; i < mouseMovements.length; i++) {
        const dx = mouseMovements[i].x - mouseMovements[i-1].x;
        const dy = mouseMovements[i].y - mouseMovements[i-1].y;
        distances.push(Math.sqrt(dx * dx + dy * dy));
      }
      const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
      mouseJitter = Math.sqrt(distances.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / distances.length);
    }
    
    const pathStraightness = straightLineDistance > 0 ? straightLineDistance / totalDistance : 0;

    // Calculate click patterns
    const avgClickInterval = clickPatterns.length > 1
      ? clickPatterns.slice(-10).reduce((sum, click, i, arr) => {
          if (i === 0) return 0;
          return sum + (click.time - arr[i-1].time);
        }, 0) / (clickPatterns.length - 1)
      : 0;

    return {
      profile: {
        // Typing metrics
        avgTypingSpeed: Math.round(avgTypingSpeed),
        typingVariance: Math.round(typingVariance),
        typingConsistency: typingVariance > 0 ? Math.sqrt(typingVariance) / avgTypingSpeed : 0,
        totalKeystrokes: keystrokes.length,
        
        // Mouse metrics
        mouseMovementCount: mouseMovements.length,
        pathStraightness: pathStraightness,
        mouseJitter: mouseJitter,
        totalMouseDistance: Math.round(totalDistance),
        
        // Interaction metrics
        pasteCount: pasteEvents.length,
        clickCount: clickPatterns.length,
        avgClickInterval: Math.round(avgClickInterval),
        scrollCount: scrollEvents.length,
        
        // Session info
        sessionDuration: Date.now() - behaviorData.startTime,
        timestamp: new Date().toISOString()
      },
      rawData: behaviorData
    };
  };

  return { behaviorData, analyzeBehavior };
}
