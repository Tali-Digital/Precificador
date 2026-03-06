import { useState, useCallback } from 'react';

export const useUndoableState = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = useCallback((value: T | ((prevState: T) => T)) => {
    const newState = typeof value === 'function' 
      ? (value as (prevState: T) => T)(state) 
      : value;

    // Não adiciona ao histórico se o estado não mudou
    if (JSON.stringify(newState) === JSON.stringify(state)) {
        return;
    }

    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [history, currentIndex, state]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  return { state, setState, undo, redo };
};
