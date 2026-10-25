import { useState, useEffect, useRef, useCallback } from 'react';

export const usePhoneStepTracker = ({ onStepBatch, initialTodaySteps = 0 }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);
  const [currentCadence, setCurrentCadence] = useState(0); // steps per minute

  // Refs for tracking algorithm state without re-render lag
  const sessionStepsRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const stepTimestampsRef = useRef([]);
  const gravityRef = useRef(9.8);
  const isPeakRef = useRef(false);
  const wakeLockRef = useRef(null);
  const unsavedStepsRef = useRef(0);

  // Check support on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      setIsSupported(false);
    }
  }, []);

  // Screen WakeLock helper so phone doesn't sleep in pocket while walking
  const acquireWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch {}
  };

  const releaseWakeLock = () => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {}
  };

  // Accelerometer motion handler
  const handleDeviceMotion = useCallback(
    (event) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      // Calculate 3D magnitude
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (isNaN(magnitude) || magnitude === 0) return;

      // Smooth gravity baseline with rolling filter
      gravityRef.current = gravityRef.current * 0.92 + magnitude * 0.08;
      const delta = magnitude - gravityRef.current;

      const now = Date.now();
      const minInterval = 280; // max ~3.5 steps/sec
      const stepThreshold = 1.35; // m/s^2 above baseline

      // Peak detection with hysteresis
      if (delta > stepThreshold && !isPeakRef.current) {
        isPeakRef.current = true;

        if (now - lastStepTimeRef.current > minInterval) {
          lastStepTimeRef.current = now;
          sessionStepsRef.current += 1;
          unsavedStepsRef.current += 1;
          setSessionSteps(sessionStepsRef.current);

          // Update cadence (steps/min in last 10s)
          stepTimestampsRef.current.push(now);
          stepTimestampsRef.current = stepTimestampsRef.current.filter((t) => now - t < 10000);
          if (stepTimestampsRef.current.length > 2) {
            const spm = Math.round((stepTimestampsRef.current.length / 10) * 60);
            setCurrentCadence(spm);
          }

          // Auto-save batch every 8 steps
          if (unsavedStepsRef.current >= 8 && onStepBatch) {
            onStepBatch(sessionStepsRef.current);
            unsavedStepsRef.current = 0;
          }
        }
      } else if (delta < stepThreshold * 0.4) {
        isPeakRef.current = false;
      }
    },
    [onStepBatch]
  );

  // Start tracking
  const startTracking = async () => {
    setError(null);

    // iOS 13+ permission request
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response !== 'granted') {
          setError('Motion permission denied on iPhone. Please enable Motion & Orientation in Safari Settings.');
          setPermissionGranted(false);
          return false;
        }
        setPermissionGranted(true);
      } catch (err) {
        setError('Motion access request failed: ' + (err?.message || 'unknown error'));
        return false;
      }
    } else {
      setPermissionGranted(true);
    }

    // Attach listener
    window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
    setIsTracking(true);
    acquireWakeLock();
    return true;
  };

  // Stop tracking
  const stopTracking = () => {
    window.removeEventListener('devicemotion', handleDeviceMotion);
    setIsTracking(false);
    releaseWakeLock();
    setCurrentCadence(0);

    // Flush any unsaved steps
    if (unsavedStepsRef.current > 0 && onStepBatch) {
      onStepBatch(sessionStepsRef.current);
      unsavedStepsRef.current = 0;
    }

    return sessionStepsRef.current;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      releaseWakeLock();
    };
  }, [handleDeviceMotion]);

  return {
    isTracking,
    sessionSteps,
    totalSteps: initialTodaySteps + sessionSteps,
    isSupported,
    permissionGranted,
    currentCadence,
    error,
    startTracking,
    stopTracking,
    resetSession: () => {
      sessionStepsRef.current = 0;
      unsavedStepsRef.current = 0;
      setSessionSteps(0);
    },
  };
};
