/**
 * Workflow Status Hooks
 * React hooks for real-time workflow status monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  temporalService,
  WorkflowExecutionInfo,
  CallState,
  CampaignState,
  IntegrationSyncState
} from '@/services/temporalService';

// Generic workflow status hook
export function useWorkflowStatus(workflowId: string | null, pollInterval = 2000) {
  const [status, setStatus] = useState<WorkflowExecutionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!workflowId) {
      setStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const statusResult = await temporalService.getWorkflowStatus(workflowId);
      setStatus(statusResult);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (!workflowId) return;

    refresh();

    // Poll for updates if workflow is running
    intervalRef.current = setInterval(() => {
      if (status?.status === 'RUNNING') {
        refresh();
      }
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workflowId, pollInterval, refresh, status?.status]);

  return { status, isLoading, error, refresh };
}

// Call workflow status hook with actions
export function useCallWorkflowStatus(workflowId: string | null) {
  const [callState, setCallState] = useState<CallState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!workflowId) {
      setCallState(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const state = await temporalService.getCallState(workflowId);
      setCallState(state);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (!workflowId) return;

    refresh();

    intervalRef.current = setInterval(() => {
      if (callState?.status !== 'completed' && callState?.status !== 'failed') {
        refresh();
      }
    }, 1000); // Poll every second for calls

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workflowId, refresh, callState?.status]);

  const requestHandoff = useCallback(async (reason: string) => {
    if (!workflowId) return;
    await temporalService.signalHumanHandoff(workflowId, reason);
    await refresh();
  }, [workflowId, refresh]);

  const acceptHandoff = useCallback(async (agentId: string) => {
    if (!workflowId) return;
    await temporalService.signalHumanAccepted(workflowId, agentId);
    await refresh();
  }, [workflowId, refresh]);

  const endCall = useCallback(async () => {
    if (!workflowId) return;
    await temporalService.signalCallEnded(workflowId);
    await refresh();
  }, [workflowId, refresh]);

  const sendTranscript = useCallback(async (speaker: string, text: string) => {
    if (!workflowId) return;
    await temporalService.sendTranscript(workflowId, speaker, text);
  }, [workflowId]);

  return {
    callState,
    isLoading,
    error,
    refresh,
    requestHandoff,
    acceptHandoff,
    endCall,
    sendTranscript,
  };
}

// Campaign workflow status hook with actions
export function useCampaignWorkflowStatus(workflowId: string | null) {
  const [campaignState, setCampaignState] = useState<CampaignState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!workflowId) {
      setCampaignState(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const state = await temporalService.getCampaignState(workflowId);
      setCampaignState(state);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (!workflowId) return;

    refresh();

    intervalRef.current = setInterval(() => {
      if (campaignState?.status === 'running') {
        refresh();
      }
    }, 3000); // Poll every 3 seconds for campaigns

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workflowId, refresh, campaignState?.status]);

  const pause = useCallback(async () => {
    if (!workflowId) return;
    await temporalService.pauseCampaign(workflowId);
    await refresh();
  }, [workflowId, refresh]);

  const resume = useCallback(async () => {
    if (!workflowId) return;
    await temporalService.resumeCampaign(workflowId);
    await refresh();
  }, [workflowId, refresh]);

  const cancel = useCallback(async () => {
    if (!workflowId) return;
    await temporalService.cancelCampaign(workflowId);
    await refresh();
  }, [workflowId, refresh]);

  return {
    campaignState,
    isLoading,
    error,
    refresh,
    pause,
    resume,
    cancel,
  };
}

// Integration sync workflow status hook with actions
export function useIntegrationSyncStatus(workflowId: string | null) {
  const [syncState, setSyncState] = useState<IntegrationSyncState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!workflowId) {
      setSyncState(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const state = await temporalService.getSyncState(workflowId);
      setSyncState(state);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (!workflowId) return;

    refresh();

    intervalRef.current = setInterval(() => {
      if (syncState?.status === 'running') {
        refresh();
      }
    }, 5000); // Poll every 5 seconds for sync

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [workflowId, refresh, syncState?.status]);

  const triggerSync = useCallback(async (integrationId?: string) => {
    if (!workflowId) return;
    await temporalService.triggerImmediateSync(workflowId, integrationId);
    await refresh();
  }, [workflowId, refresh]);

  const pause = useCallback(async () => {
    if (!workflowId) return;
    await temporalService.pauseSync(workflowId);
    await refresh();
  }, [workflowId, refresh]);

  const resume = useCallback(async () => {
    if (!workflowId) return;
    await temporalService.resumeSync(workflowId);
    await refresh();
  }, [workflowId, refresh]);

  return {
    syncState,
    isLoading,
    error,
    refresh,
    triggerSync,
    pause,
    resume,
  };
}

// Hook to list all workflows for a company
export function useWorkflowsList(companyId: string | null, workflowType?: string) {
  const [workflows, setWorkflows] = useState<WorkflowExecutionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setWorkflows([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await temporalService.listWorkflows({
        companyId,
        workflowType,
        limit: 50,
      });
      setWorkflows(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [companyId, workflowType]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { workflows, isLoading, error, refresh };
}
