import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Phone,
  Mail,
  Headphones,
  Building2,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  Zap,
  Code2,
  Target,
  Plus,
  RefreshCw,
  Play,
  Loader2,
  Activity,
} from 'lucide-react';
import { temporalService } from '@/services/temporalService';
import { IntegrationSyncPanel } from '@/components/company-dashboard/workflows/WorkflowExecutionPanel';
import { useToast } from '@/hooks/use-toast';

interface IntegrationsOverviewProps {
  onNavigate: (section: string) => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'pending' | 'disconnected';
  category: 'channel' | 'crm' | 'helpdesk' | 'custom';
  lastSync?: string;
  color?: string;
}

const integrations: Integration[] = [
  // Channels
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Connect with customers via WhatsApp messaging',
    icon: <MessageSquare className="h-6 w-6" />,
    status: 'connected',
    category: 'channel',
    lastSync: '2 mins ago',
    color: 'text-green-500',
  },
  {
    id: 'avaya',
    name: 'Avaya Voice',
    description: 'Enterprise telephony and SIP trunk integration',
    icon: <Phone className="h-6 w-6" />,
    status: 'connected',
    category: 'channel',
    lastSync: '5 mins ago',
    color: 'text-red-500',
  },
  {
    id: 'email',
    name: 'Email',
    description: 'SMTP/API email integration for notifications',
    icon: <Mail className="h-6 w-6" />,
    status: 'connected',
    category: 'channel',
    lastSync: '1 hour ago',
    color: 'text-blue-500',
  },
  // Helpdesk
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Customer support and ticketing system',
    icon: <Headphones className="h-6 w-6" />,
    status: 'connected',
    category: 'helpdesk',
    lastSync: '10 mins ago',
    color: 'text-emerald-500',
  },
  // CRMs
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM for customer data and task sync',
    icon: <Building2 className="h-6 w-6" />,
    status: 'connected',
    category: 'crm',
    lastSync: '5 mins ago',
    color: 'text-blue-500',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing, sales, and service CRM platform',
    icon: <Building2 className="h-6 w-6" />,
    status: 'connected',
    category: 'crm',
    lastSync: '3 mins ago',
    color: 'text-orange-500',
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Lead management and call logging integration',
    icon: <Building2 className="h-6 w-6" />,
    status: 'connected',
    category: 'crm',
    lastSync: '8 mins ago',
    color: 'text-red-500',
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales pipeline and activity tracking',
    icon: <Target className="h-6 w-6" />,
    status: 'pending',
    category: 'crm',
    color: 'text-green-500',
  },
  // Custom
  {
    id: 'custom',
    name: 'Custom Integration',
    description: 'Build your own with HTTP requests (BYO)',
    icon: <Code2 className="h-6 w-6" />,
    status: 'connected',
    category: 'custom',
    lastSync: 'Active',
    color: 'text-purple-500',
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'connected':
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/30 gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 gap-1">
          <AlertCircle className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'disconnected':
      return (
        <Badge className="bg-red-500/10 text-red-500 border-red-500/30 gap-1">
          <XCircle className="h-3 w-3" />
          Disconnected
        </Badge>
      );
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'disconnected':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-muted';
  }
};

const IntegrationCard: React.FC<{ integration: Integration; onNavigate: (id: string) => void }> = ({
  integration,
  onNavigate,
}) => (
  <Card
    className="cursor-pointer hover:shadow-md transition-shadow"
    onClick={() => onNavigate(integration.id)}
  >
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getStatusColor(integration.status)}`}>
          <span className={integration.color}>{integration.icon}</span>
        </div>
        {getStatusBadge(integration.status)}
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <CardTitle className="text-base">{integration.name}</CardTitle>
        <CardDescription className="line-clamp-2">{integration.description}</CardDescription>
      </div>
      {integration.lastSync && (
        <p className="text-xs text-muted-foreground">
          Last sync: {integration.lastSync}
        </p>
      )}
      <Button variant="ghost" size="sm" className="w-full justify-between">
        {integration.status === 'disconnected' ? 'Connect' : 'Configure'}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </CardContent>
  </Card>
);

export const IntegrationsOverview: React.FC<IntegrationsOverviewProps> = ({ onNavigate }) => {
  const [activeSyncWorkflowId, setActiveSyncWorkflowId] = useState<string | null>(null);
  const [isStartingSync, setIsStartingSync] = useState(false);
  const { toast } = useToast();

  const channels = integrations.filter((i) => i.category === 'channel');
  const crms = integrations.filter((i) => i.category === 'crm');
  const helpdesk = integrations.filter((i) => i.category === 'helpdesk');
  const custom = integrations.filter((i) => i.category === 'custom');

  const connectedCount = integrations.filter((i) => i.status === 'connected').length;
  const connectedIntegrations = integrations.filter((i) => i.status === 'connected');

  const handleStartSync = async () => {
    setIsStartingSync(true);
    try {
      // Build integration configs from connected integrations
      const integrationConfigs = connectedIntegrations
        .filter(i => ['salesforce', 'hubspot', 'zendesk', 'zoho', 'pipedrive'].includes(i.id))
        .map(i => ({
          type: i.id as 'salesforce' | 'hubspot' | 'zendesk' | 'zoho' | 'pipedrive',
          credentials: {}, // Would come from actual config
          syncDirection: 'bidirectional' as const,
          syncEntities: ['contacts', 'leads', 'calls'],
        }));

      if (integrationConfigs.length === 0) {
        toast({
          title: 'No Syncable Integrations',
          description: 'Connect at least one CRM or Helpdesk integration to start syncing.',
          variant: 'destructive',
        });
        return;
      }

      const result = await temporalService.startIntegrationSyncWorkflow({
        companyId: 'demo-company',
        integrations: integrationConfigs,
        syncIntervalMinutes: 15,
      });

      setActiveSyncWorkflowId(result.workflowId);
      toast({
        title: 'Sync Workflow Started',
        description: `Syncing ${integrationConfigs.length} integrations. Workflow ID: ${result.workflowId.slice(0, 12)}...`,
      });
    } catch (error) {
      toast({
        title: 'Failed to Start Sync',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsStartingSync(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Integrations</h1>
          <p className="text-muted-foreground">Connect your contact center with external services</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm py-1 px-3 gap-1">
            <Zap className="h-3 w-3" />
            {connectedCount} of {integrations.length} Connected
          </Badge>
          <Button
            onClick={handleStartSync}
            disabled={isStartingSync || connectedCount === 0}
            className="gap-2"
          >
            {isStartingSync ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : activeSyncWorkflowId ? (
              <>
                <Activity className="h-4 w-4" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Start Sync
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Channels Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Communication Channels</h2>
          <p className="text-sm text-muted-foreground">Voice, messaging, and email integrations</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {channels.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      {/* Helpdesk Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Helpdesk & Ticketing</h2>
          <p className="text-sm text-muted-foreground">Customer support platforms</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {helpdesk.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      {/* CRM Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">CRM & Sales</h2>
          <p className="text-sm text-muted-foreground">Customer relationship management platforms</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {crms.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      {/* Custom Integration Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Custom Integrations</h2>
          <p className="text-sm text-muted-foreground">Build your own integrations with HTTP requests</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {custom.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} onNavigate={onNavigate} />
          ))}
          {/* Add New Integration Card */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
            onClick={() => onNavigate('custom')}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-base mb-2">Create Custom Integration</CardTitle>
              <CardDescription>
                Connect any service using webhooks and HTTP requests
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Integration Stats */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">{connectedCount}</p>
              <p className="text-sm text-muted-foreground">Active Integrations</p>
            </div>
            <div>
              <p className="text-3xl font-bold">12.4K</p>
              <p className="text-sm text-muted-foreground">Events Today</p>
            </div>
            <div>
              <p className="text-3xl font-bold">99.2%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold">45ms</p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sync Panel */}
      {activeSyncWorkflowId && (
        <div className="fixed bottom-4 right-4 w-96 z-50 shadow-lg">
          <IntegrationSyncPanel
            workflowId={activeSyncWorkflowId}
            companyName="Demo Company"
            onClose={() => setActiveSyncWorkflowId(null)}
          />
        </div>
      )}
    </div>
  );
};
