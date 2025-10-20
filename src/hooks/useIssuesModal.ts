/**
 * useIssuesModal Hook
 * 
 * Manages Issues modal state and provides quick access methods
 * for different types of issue reporting throughout the app.
 */

import { useState, useCallback } from 'react';
import type { IssueType } from '@/components/IssuesModal';

interface IssuesModalState {
  isOpen: boolean;
  initialType: IssueType;
  initialTitle: string;
  initialDescription: string;
}

export function useIssuesModal() {
  const [modalState, setModalState] = useState<IssuesModalState>({
    isOpen: false,
    initialType: 'help',
    initialTitle: '',
    initialDescription: '',
  });

  const openModal = useCallback((
    type: IssueType = 'help',
    title: string = '',
    description: string = ''
  ) => {
    setModalState({
      isOpen: true,
      initialType: type,
      initialTitle: title,
      initialDescription: description,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Convenience methods for different issue types
  const reportBug = useCallback((title?: string, description?: string) => {
    openModal('bug', title, description);
  }, [openModal]);

  const requestFeature = useCallback((title?: string, description?: string) => {
    openModal('feature', title, description);
  }, [openModal]);

  const getHelp = useCallback((title?: string, description?: string) => {
    openModal('help', title, description);
  }, [openModal]);

  const giveFeedback = useCallback((title?: string, description?: string) => {
    openModal('feedback', title, description);
  }, [openModal]);

  const reportDataIssue = useCallback((title?: string, description?: string) => {
    openModal('data', title, description);
  }, [openModal]);

  // Quick access for common scenarios
  const reportCalculationError = useCallback((calculationType: string, expectedValue?: string, actualValue?: string) => {
    const title = `Calculation Error: ${calculationType}`;
    const description = expectedValue && actualValue 
      ? `Expected: ${expectedValue}\nActual: ${actualValue}\n\nCalculation type: ${calculationType}`
      : `Issue with ${calculationType} calculation`;
    reportDataIssue(title, description);
  }, [reportDataIssue]);

  const reportUIIssue = useCallback((component: string, issue: string) => {
    const title = `UI Issue: ${component}`;
    const description = `Component: ${component}\nIssue: ${issue}`;
    reportBug(title, description);
  }, [reportBug]);

  const requestMobileImprovement = useCallback((area: string, suggestion: string) => {
    const title = `Mobile UX: ${area}`;
    const description = `Area: ${area}\nSuggestion: ${suggestion}`;
    requestFeature(title, description);
  }, [requestFeature]);

  return {
    modalState,
    openModal,
    closeModal,
    reportBug,
    requestFeature,
    getHelp,
    giveFeedback,
    reportDataIssue,
    reportCalculationError,
    reportUIIssue,
    requestMobileImprovement,
  };
}