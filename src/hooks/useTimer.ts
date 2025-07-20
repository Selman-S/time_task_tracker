import { useState, useEffect, useCallback } from 'react';

interface TimerState {
  isActive: boolean;
  startTime: Date | null;
  duration: number; // in minutes
  elapsed: number; // in minutes
}

export const useTimer = (initialDuration: number = 0) => {
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    startTime: null,
    duration: initialDuration,
    elapsed: 0,
  });

  const startTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date(),
      elapsed: 0,
    }));
  }, []);

  const stopTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isActive: false,
      startTime: null,
      duration: prev.duration + prev.elapsed,
      elapsed: 0,
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isActive: false,
      duration: prev.duration + prev.elapsed,
      elapsed: 0,
    }));
  }, []);

  const continueTimer = useCallback((accumulatedDuration: number) => {
    setTimerState(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date(),
      duration: accumulatedDuration,
      elapsed: 0,
    }));
  }, []);

  // Update elapsed time every second when timer is active
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isActive && timerState.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsedMinutes = Math.floor(
          (now.getTime() - timerState.startTime!.getTime()) / (1000 * 60)
        );
        
        setTimerState(prev => ({
          ...prev,
          elapsed: elapsedMinutes,
        }));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerState.isActive, timerState.startTime]);

  const totalDuration = timerState.duration + timerState.elapsed;

  return {
    ...timerState,
    totalDuration,
    startTimer,
    stopTimer,
    pauseTimer,
    continueTimer,
  };
}; 