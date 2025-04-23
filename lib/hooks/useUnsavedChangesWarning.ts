'use client';

import { useEffect } from 'react';

type UseNavigationGuardProps = {
  when: boolean;
  message?: string;
};

export function useNavigationGuard({ when, message = 'You have unsaved changes. Are you sure you want to leave this page?' }: UseNavigationGuardProps) {
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
    };

    const handlePopState = () => {
      const confirmed = window.confirm(message);
      if (!confirmed) {
        // Go forward again to cancel back
        history.forward();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [when, message]);
}