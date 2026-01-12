import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Bot,
  User,
  ArrowRightLeft,
  Zap,
  AlertCircle,
  Activity,
} from 'lucide-react';
import {
  useCampaignWorkflowStatus,
  useCallWorkflowStatus,
  useIntegrationSyncStatus,
} from '@/hooks/useWorkflowStatus';
import type { CampaignState, CallState, IntegrationSyncState } from '@/services/temporalService';

// ============ Campaign Execution Panel ============
interface CampaignExecutionPanelProps {
  workflowId: string;
  campaignName?: string;
  onClose?: () => void;
}

export const CampaignExecutionPanel: React.FC<CampaignExecutionPanelProps> = ({
  workflowId,
  campaignName,
  onClose,
}) => {
  const {
    campaignState,
    isLoading,
    error,
    refresh,
    pause,
    resume,
    cancel,
  } = useCampaignWorkflowStatus(workflowId);

  if (isLoading && !campaignState) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading campaign status...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4">
          <div className="flex items-center text-destructive">
            <XCircle className="h-5 w-5 mr-2" />
            Error: {error.message}
          </div>
          <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!campaignState) return null;

  const progressPercent = campaignState.totalLeads > 0
    ? (campaignState.processedLeads / campaignState.totalLeads) * 100
    : 0;

  const getStatusBadge = (status: CampaignState['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Running</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <PhoneOutgoing className="h-4 w-4" />
              {campaignName || 'Outbound Campaign'}
            </CardTitle>
            <CardDescription>Workflow: {workflowId.slice(0, 12)}...</CardDescription>
          </div>
          {getStatusBadge(campaignState.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{campaignState.processedLeads} / {campaignState.totalLeads} leads</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{Math.round(progressPercent)}% complete</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 py-2">
          <div className="text-center p-2 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-600">{campaignState.successfulCalls}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/5 border border-red-500/20">
            <div className="flex items-center justify-center mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-600">{campaignState.failedCalls}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <p className="text-xl font-bold text-yellow-600">{campaignState.noAnswerCalls}</p>
            <p className="text-xs text-muted-foreground">No Answer</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-blue-600">
              {campaignState.totalLeads - campaignState.processedLeads}
            </p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>

        {/* Last Processed */}
        {campaignState.lastProcessedAt && (
          <p className="text-xs text-muted-foreground">
            Last activity: {new Date(campaignState.lastProcessedAt).toLocaleString()}
          </p>
        )}

        {/* Controls */}
        <div className="flex gap-2 pt-3 border-t">
          {campaignState.status === 'running' && (
            <Button variant="outline" size="sm" onClick={pause} className="gap-1">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          {campaignState.status === 'paused' && (
            <Button variant="outline" size="sm" onClick={resume} className="gap-1">
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
          {(campaignState.status === 'running' || campaignState.status === 'paused') && (
            <Button variant="destructive" size="sm" onClick={cancel} className="gap-1">
              <StopCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={refresh} className="ml-auto">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============ Call Execution Panel ============
interface CallExecutionPanelProps {
  workflowId: string;
  customerNumber?: string;
  onClose?: () => void;
}

export const CallExecutionPanel: React.FC<CallExecutionPanelProps> = ({
  workflowId,
  customerNumber,
  onClose,
}) => {
  const {
    callState,
    isLoading,
    error,
    refresh,
    requestHandoff,
    acceptHandoff,
    endCall,
  } = useCallWorkflowStatus(workflowId);
  const [handoffReason, setHandoffReason] = useState('');

  if (isLoading && !callState) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading call status...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4">
          <div className="flex items-center text-destructive">
            <XCircle className="h-5 w-5 mr-2" />
            Error: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!callState) return null;

  const getStatusBadge = (status: CallState['status']) => {
    switch (status) {
      case 'ringing':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 animate-pulse">Ringing</Badge>;
      case 'ai_handling':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">AI Handling</Badge>;
      case 'human_handoff_pending':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 animate-pulse">Handoff Pending</Badge>;
      case 'human_handling':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Human Handling</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHandlerIcon = (handler: 'ai' | 'human' | null) => {
    switch (handler) {
      case 'ai':
        return <Bot className="h-5 w-5 text-purple-600" />;
      case 'human':
        return <User className="h-5 w-5 text-blue-600" />;
      default:
        return <Phone className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <PhoneIncoming className="h-4 w-4" />
              Active Call
            </CardTitle>
            <CardDescription>
              {customerNumber || 'Unknown Caller'} • Started {new Date(callState.startedAt).toLocaleTimeString()}
            </CardDescription>
          </div>
          {getStatusBadge(callState.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Handler */}
        <div className="flex items-center justify-center gap-4 py-4 bg-muted/50 rounded-lg">
          {getHandlerIcon(callState.currentHandler)}
          <div className="text-center">
            <p className="text-sm font-medium">
              {callState.currentHandler === 'ai' ? 'AI Agent' :
               callState.currentHandler === 'human' ? 'Human Agent' : 'Connecting...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {callState.transcriptCount} messages exchanged
            </p>
          </div>
        </div>

        {/* Handoff Info */}
        {callState.escalationReason && (
          <div className="flex items-start gap-2 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-700">Escalation Requested</p>
              <p className="text-xs text-muted-foreground">{callState.escalationReason}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Started: {new Date(callState.startedAt).toLocaleString()}</span>
          </div>
          {callState.handoffRequestedAt && (
            <div className="flex items-center gap-2 text-orange-600">
              <ArrowRightLeft className="h-3 w-3" />
              <span>Handoff requested: {new Date(callState.handoffRequestedAt).toLocaleTimeString()}</span>
            </div>
          )}
          {callState.handoffCompletedAt && (
            <div className="flex items-center gap-2 text-blue-600">
              <User className="h-3 w-3" />
              <span>Handoff completed: {new Date(callState.handoffCompletedAt).toLocaleTimeString()}</span>
            </div>
          )}
          {callState.completedAt && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Completed: {new Date(callState.completedAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {callState.status !== 'completed' && callState.status !== 'failed' && (
          <div className="flex gap-2 pt-3 border-t">
            {callState.currentHandler === 'ai' && callState.status === 'ai_handling' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestHandoff('Manual escalation requested')}
                className="gap-1"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Request Handoff
              </Button>
            )}
            {callState.status === 'human_handoff_pending' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => acceptHandoff('current-agent')}
                className="gap-1"
              >
                <User className="h-4 w-4" />
                Accept Call
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={endCall}
              className="gap-1 ml-auto"
            >
              <Phone className="h-4 w-4" />
              End Call
            </Button>
          </div>
        )}

        {/* Close button for completed calls */}
        {(callState.status === 'completed' || callState.status === 'failed') && onClose && (
          <div className="flex justify-end pt-3 border-t">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ Integration Sync Panel ============
interface IntegrationSyncPanelProps {
  workflowId: string;
  companyName?: string;
  onClose?: () => void;
}

export const IntegrationSyncPanel: React.FC<IntegrationSyncPanelProps> = ({
  workflowId,
  companyName,
  onClose,
}) => {
  const {
    syncState,
    isLoading,
    error,
    refresh,
    triggerSync,
    pause,
    resume,
  } = useIntegrationSyncStatus(workflowId);

  if (isLoading && !syncState) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading sync status...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4">
          <div className="flex items-center text-destructive">
            <XCircle className="h-5 w-5 mr-2" />
            Error: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!syncState) return null;

  const getStatusBadge = (status: IntegrationSyncState['status']) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Running</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Paused</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const integrationNames: Record<string, string> = {
    salesforce: 'Salesforce',
    hubspot: 'HubSpot',
    zendesk: 'Zendesk',
    zoho: 'Zoho CRM',
    pipedrive: 'Pipedrive',
    whatsapp: 'WhatsApp',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Integration Sync
            </CardTitle>
            <CardDescription>
              {companyName || 'Company'} • {syncState.currentIntegration ? `Syncing ${integrationNames[syncState.currentIntegration] || syncState.currentIntegration}` : 'Idle'}
            </CardDescription>
          </div>
          {getStatusBadge(syncState.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Activity */}
        {syncState.currentIntegration && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="text-sm">
              Syncing {integrationNames[syncState.currentIntegration] || syncState.currentIntegration}...
            </span>
          </div>
        )}

        {/* Sync Stats by Integration */}
        <div className="space-y-3">
          {Object.entries(syncState.syncCounts).map(([integration, counts]) => (
            <div key={integration} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {integrationNames[integration] || integration}
                </span>
                {counts.errors > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {counts.errors} errors
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-1 bg-green-500/5 rounded">
                  <p className="font-bold text-green-600">{counts.inbound}</p>
                  <p className="text-muted-foreground">Inbound</p>
                </div>
                <div className="text-center p-1 bg-blue-500/5 rounded">
                  <p className="font-bold text-blue-600">{counts.outbound}</p>
                  <p className="text-muted-foreground">Outbound</p>
                </div>
                <div className="text-center p-1 bg-yellow-500/5 rounded">
                  <p className="font-bold text-yellow-600">{counts.conflicts}</p>
                  <p className="text-muted-foreground">Conflicts</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error Details */}
        {syncState.errorDetails && (
          <div className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">Sync Error</p>
              <p className="text-xs text-muted-foreground">{syncState.errorDetails}</p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {syncState.lastSyncAt && (
            <p>Last sync: {new Date(syncState.lastSyncAt).toLocaleString()}</p>
          )}
          {syncState.nextSyncAt && (
            <p>Next sync: {new Date(syncState.nextSyncAt).toLocaleString()}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerSync()}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Now
          </Button>
          {syncState.status === 'running' && (
            <Button variant="outline" size="sm" onClick={pause} className="gap-1">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          {syncState.status === 'paused' && (
            <Button variant="outline" size="sm" onClick={resume} className="gap-1">
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={refresh} className="ml-auto">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ============ Combined Workflow Monitor ============
interface WorkflowMonitorProps {
  companyId: string;
}

export const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({ companyId }) => {
  const [activeTab, setActiveTab] = useState<'calls' | 'campaigns' | 'integrations'>('calls');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Active Workflows</CardTitle>
        <CardDescription>Monitor running Temporal workflows in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calls" className="gap-1">
              <Phone className="h-4 w-4" />
              Calls
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1">
              <PhoneOutgoing className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1">
              <Zap className="h-4 w-4" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calls" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active calls</p>
              <p className="text-xs">Calls will appear here when they start</p>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <PhoneOutgoing className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active campaigns</p>
              <p className="text-xs">Start a campaign to see it here</p>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active syncs</p>
              <p className="text-xs">Configure integrations to start syncing</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WorkflowMonitor;
