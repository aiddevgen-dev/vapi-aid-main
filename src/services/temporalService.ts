/**
 * Temporal Service Client
 * Frontend API client for interacting with Temporal workflows through the API bridge
 */

const TEMPORAL_API_URL = import.meta.env.VITE_TEMPORAL_API_URL || 'http://localhost:3001';

export interface WorkflowExecutionInfo {
  workflowId: string;
  runId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TERMINATED' | 'TIMED_OUT';
  workflowType: string;
  startedAt: string;
  completedAt?: string;
  currentState?: unknown;
}

export interface StartWorkflowResponse {
  workflowId: string;
  runId: string;
}

// Call Handling Types
export interface CallHandlingInput {
  callId: string;
  callSid: string;
  customerNumber: string;
  direction: 'inbound' | 'outbound';
  agentId?: string;
  workflowConfigId?: string;
}

export interface CallState {
  status: 'ringing' | 'ai_handling' | 'human_handoff_pending' | 'human_handling' | 'completed' | 'failed';
  currentHandler: 'ai' | 'human' | null;
  transcriptCount: number;
  escalationReason?: string;
  startedAt: string;
  handoffRequestedAt?: string;
  handoffCompletedAt?: string;
  completedAt?: string;
}

// Lead Processing Types
export interface LeadProcessingInput {
  campaignId: string;
  companyId: string;
  batchSize: number;
  callWindowStart: string;
  callWindowEnd: string;
  maxConcurrentCalls: number;
  aiAgentId: string;
}

export interface CampaignState {
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  totalLeads: number;
  processedLeads: number;
  successfulCalls: number;
  failedCalls: number;
  noAnswerCalls: number;
  currentBatchStart: number;
  lastProcessedAt?: string;
}

// Integration Sync Types
export interface IntegrationSyncInput {
  companyId: string;
  integrations: Array<{
    type: 'salesforce' | 'hubspot' | 'zendesk' | 'zoho' | 'pipedrive' | 'whatsapp';
    credentials: Record<string, string>;
    syncDirection: 'inbound' | 'outbound' | 'bidirectional';
    syncEntities: string[];
  }>;
  syncIntervalMinutes: number;
}

export interface IntegrationSyncState {
  status: 'running' | 'paused' | 'error';
  lastSyncAt?: string;
  syncCounts: Record<string, {
    inbound: number;
    outbound: number;
    conflicts: number;
    errors: number;
  }>;
  currentIntegration?: string;
  nextSyncAt?: string;
  errorDetails?: string;
}

class TemporalService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = TEMPORAL_API_URL;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============ Health Check ============
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetch('/health');
  }

  // ============ Call Handling Workflow ============
  async startCallHandlingWorkflow(params: CallHandlingInput): Promise<StartWorkflowResponse> {
    return this.fetch('/api/workflows/call-handling/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async signalHumanHandoff(workflowId: string, reason: string): Promise<void> {
    await this.fetch(`/api/workflows/call-handling/${workflowId}/signal/human-handoff`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async signalHumanAccepted(workflowId: string, agentId: string): Promise<void> {
    await this.fetch(`/api/workflows/call-handling/${workflowId}/signal/human-accepted`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  }

  async signalCallEnded(workflowId: string): Promise<void> {
    await this.fetch(`/api/workflows/call-handling/${workflowId}/signal/call-ended`, {
      method: 'POST',
    });
  }

  async sendTranscript(workflowId: string, speaker: string, text: string): Promise<void> {
    await this.fetch(`/api/workflows/call-handling/${workflowId}/signal/transcript`, {
      method: 'POST',
      body: JSON.stringify({ speaker, text }),
    });
  }

  async getCallState(workflowId: string): Promise<CallState> {
    return this.fetch(`/api/workflows/call-handling/${workflowId}/query/state`);
  }

  // ============ Lead Processing Workflow ============
  async startLeadProcessingWorkflow(params: LeadProcessingInput): Promise<StartWorkflowResponse> {
    return this.fetch('/api/workflows/lead-processing/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async pauseCampaign(workflowId: string): Promise<void> {
    await this.fetch(`/api/workflows/lead-processing/${workflowId}/signal/pause`, {
      method: 'POST',
    });
  }

  async resumeCampaign(workflowId: string): Promise<void> {
    await this.fetch(`/api/workflows/lead-processing/${workflowId}/signal/resume`, {
      method: 'POST',
    });
  }

  async cancelCampaign(workflowId: string): Promise<void> {
    await this.fetch(`/api/workflows/lead-processing/${workflowId}/signal/cancel`, {
      method: 'POST',
    });
  }

  async getCampaignState(workflowId: string): Promise<CampaignState> {
    return this.fetch(`/api/workflows/lead-processing/${workflowId}/query/state`);
  }

  // ============ Integration Sync Workflow ============
  async startIntegrationSyncWorkflow(params: IntegrationSyncInput): Promise<StartWorkflowResponse> {
    return this.fetch('/api/workflows/integration-sync/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async triggerImmediateSync(workflowId: string, integrationId?: string): Promise<void> {
    await this.fetch(`/api/workflows/integration-sync/${workflowId}/signal/sync-now`, {
      method: 'POST',
      body: JSON.stringify({ integrationId }),
    });
  }

  async pauseSync(workflowId: string): Promise<void> {
    await this.fetch(`/api/workflows/integration-sync/${workflowId}/signal/pause`, {
      method: 'POST',
    });
  }

  async resumeSync(workflowId: string): Promise<void> {
    await this.fetch(`/api/workflows/integration-sync/${workflowId}/signal/resume`, {
      method: 'POST',
    });
  }

  async getSyncState(workflowId: string): Promise<IntegrationSyncState> {
    return this.fetch(`/api/workflows/integration-sync/${workflowId}/query/state`);
  }

  // ============ Generic Workflow Operations ============
  async getWorkflowStatus(workflowId: string): Promise<WorkflowExecutionInfo> {
    return this.fetch(`/api/workflows/${workflowId}/status`);
  }

  async listWorkflows(params?: {
    workflowType?: string;
    status?: string;
    limit?: number;
    companyId?: string;
  }): Promise<WorkflowExecutionInfo[]> {
    const query = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    return this.fetch(`/api/workflows${query ? `?${query}` : ''}`);
  }

  async terminateWorkflow(workflowId: string, reason: string): Promise<void> {
    await this.fetch(`/api/workflows/${workflowId}/terminate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getWorkflowHistory(workflowId: string): Promise<unknown[]> {
    return this.fetch(`/api/workflows/${workflowId}/history`);
  }
}

export const temporalService = new TemporalService();
export default temporalService;
