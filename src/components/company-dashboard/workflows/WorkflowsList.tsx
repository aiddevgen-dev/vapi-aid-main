import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  GitBranch,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  MessageSquare,
  Clock,
  Zap,
  Play,
  Activity,
  Loader2,
} from 'lucide-react';
import { WorkflowForm, Workflow } from './WorkflowForm';
import { CampaignExecutionPanel } from './WorkflowExecutionPanel';
import { useToast } from '@/hooks/use-toast';
import { temporalService } from '@/services/temporalService';

// Demo backend URL - always use this ngrok URL
const DEMO_BACKEND_URL = 'https://reiko-transactional-vanessa.ngrok-free.dev';

// Mock data
const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Inbound Sales Call Handler',
    description: 'Handle incoming sales inquiries with AI-powered qualification',
    triggerType: 'inbound-call',
    status: 'active',
    aiAgentId: '1',
    tools: ['transfer', 'order-status', 'appointment'],
    endOfCallActions: ['summary-crm', 'followup-email'],
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Support Ticket Escalation',
    description: 'Escalate complex support issues to human agents',
    triggerType: 'inbound-call',
    status: 'active',
    aiAgentId: '2',
    tools: ['transfer', 'create-ticket'],
    endOfCallActions: ['zendesk-ticket'],
    updatedAt: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    name: 'Outbound Appointment Reminder',
    description: 'Automated appointment confirmation calls',
    triggerType: 'outbound-call',
    status: 'active',
    aiAgentId: '3',
    tools: ['appointment', 'send-sms'],
    endOfCallActions: ['update-lead'],
    updatedAt: '2024-01-13T09:00:00Z',
  },
  {
    id: '4',
    name: 'After Hours Message',
    description: 'Handle calls outside business hours',
    triggerType: 'time-based',
    status: 'inactive',
    aiAgentId: '1',
    tools: ['send-email'],
    endOfCallActions: ['summary-crm'],
    updatedAt: '2024-01-10T11:15:00Z',
  },
];

const getTriggerIcon = (type: string) => {
  switch (type) {
    case 'inbound-call':
      return <PhoneIncoming className="h-4 w-4" />;
    case 'outbound-call':
      return <PhoneOutgoing className="h-4 w-4" />;
    case 'chat-message':
      return <MessageSquare className="h-4 w-4" />;
    case 'time-based':
      return <Clock className="h-4 w-4" />;
    case 'webhook':
      return <Zap className="h-4 w-4" />;
    default:
      return <Phone className="h-4 w-4" />;
  }
};

const getTriggerLabel = (type: string) => {
  switch (type) {
    case 'inbound-call':
      return 'Inbound Call';
    case 'outbound-call':
      return 'Outbound Call';
    case 'chat-message':
      return 'Chat Message';
    case 'time-based':
      return 'Time-Based';
    case 'webhook':
      return 'Webhook';
    case 'keyword':
      return 'Keyword Detected';
    default:
      return type;
  }
};

// Campaign configuration for running workflows
interface CampaignConfig {
  campaignId: string;
  companyId: string;
  batchSize: number;
  callWindowStart: string;
  callWindowEnd: string;
  maxConcurrentCalls: number;
}

export const WorkflowsList: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

  // Temporal integration state
  const [runningWorkflow, setRunningWorkflow] = useState<Workflow | null>(null);
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfig>({
    campaignId: '',
    companyId: 'demo-company',
    batchSize: 10,
    callWindowStart: '09:00',
    callWindowEnd: '17:00',
    maxConcurrentCalls: 3,
  });

  // Temporal VAPI call state
  const [isVapiDialogOpen, setIsVapiDialogOpen] = useState(false);
  const [selectedTemporalWorkflow, setSelectedTemporalWorkflow] = useState<Workflow | null>(null);
  const [vapiCallConfig, setVapiCallConfig] = useState({
    phoneNumber: '',
    customerName: '',
    campaignId: '',
    assistantId: '',
    phoneNumberId: '',
  });
  const [activeVapiCallId, setActiveVapiCallId] = useState<string | null>(null);
  const [vapiCallStatus, setVapiCallStatus] = useState<string | null>(null);

  const { toast } = useToast();

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setIsFormOpen(true);
  };

  const handleDelete = (workflow: Workflow) => {
    setDeletingWorkflow(workflow);
  };

  const confirmDelete = () => {
    if (deletingWorkflow) {
      setWorkflows(workflows.filter((w) => w.id !== deletingWorkflow.id));
      toast({
        title: 'Workflow Deleted',
        description: `"${deletingWorkflow.name}" has been removed.`,
      });
      setDeletingWorkflow(null);
    }
  };

  const handleDuplicate = (workflow: Workflow) => {
    const newWorkflow: Workflow = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (Copy)`,
      status: 'inactive',
    };
    setWorkflows([...workflows, newWorkflow]);
    toast({
      title: 'Workflow Duplicated',
      description: `"${newWorkflow.name}" has been created.`,
    });
  };

  const handleToggleStatus = (workflow: Workflow) => {
    setWorkflows(workflows.map((w) =>
      w.id === workflow.id
        ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' }
        : w
    ));
    toast({
      title: workflow.status === 'active' ? 'Workflow Disabled' : 'Workflow Enabled',
      description: `"${workflow.name}" is now ${workflow.status === 'active' ? 'inactive' : 'active'}.`,
    });
  };

  const handleSave = (workflowData: Partial<Workflow>) => {
    if (editingWorkflow) {
      setWorkflows(workflows.map((w) =>
        w.id === editingWorkflow.id ? { ...w, ...workflowData, updatedAt: new Date().toISOString() } : w
      ));
      toast({
        title: 'Workflow Updated',
        description: `"${workflowData.name}" has been updated.`,
      });
    } else {
      const newWorkflow: Workflow = {
        id: Date.now().toString(),
        name: workflowData.name || 'New Workflow',
        description: workflowData.description || '',
        triggerType: workflowData.triggerType || 'inbound-call',
        status: 'inactive',
        aiAgentId: workflowData.aiAgentId || '',
        tools: workflowData.tools || [],
        endOfCallActions: workflowData.endOfCallActions || [],
        updatedAt: new Date().toISOString(),
      };
      setWorkflows([...workflows, newWorkflow]);
      toast({
        title: 'Workflow Created',
        description: `"${newWorkflow.name}" has been created.`,
      });
    }
    setIsFormOpen(false);
    setEditingWorkflow(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Temporal workflow handlers
  const handleRunWorkflow = (workflow: Workflow) => {
    // Special handling for Temporal Outbound workflows
    if (workflow.triggerType === 'temporal-outbound') {
      setSelectedTemporalWorkflow(workflow);
      setVapiCallConfig({ phoneNumber: '', customerName: '', campaignId: '', assistantId: '', phoneNumberId: '' });
      setIsVapiDialogOpen(true);
      return;
    }

    setRunningWorkflow(workflow);
    setCampaignConfig({
      ...campaignConfig,
      campaignId: `campaign-${workflow.id}-${Date.now()}`,
    });
    setIsRunDialogOpen(true);
  };

  const handleStartWorkflow = async () => {
    if (!runningWorkflow) return;

    setIsStarting(true);
    try {
      // Determine workflow type based on trigger
      if (runningWorkflow.triggerType === 'outbound-call') {
        // Start lead processing workflow
        const result = await temporalService.startLeadProcessingWorkflow({
          campaignId: campaignConfig.campaignId,
          companyId: campaignConfig.companyId,
          batchSize: campaignConfig.batchSize,
          callWindowStart: campaignConfig.callWindowStart,
          callWindowEnd: campaignConfig.callWindowEnd,
          maxConcurrentCalls: campaignConfig.maxConcurrentCalls,
          aiAgentId: runningWorkflow.aiAgentId || '',
        });

        setActiveWorkflowId(result.workflowId);
        toast({
          title: 'Campaign Started',
          description: `${runningWorkflow.name} is now running. Workflow ID: ${result.workflowId.slice(0, 12)}...`,
        });
      } else {
        // For other trigger types, show a message (they would be triggered by events)
        toast({
          title: 'Workflow Activated',
          description: `${runningWorkflow.name} is now listening for ${getTriggerLabel(runningWorkflow.triggerType)} events.`,
        });
      }

      setIsRunDialogOpen(false);
      setRunningWorkflow(null);
    } catch (error) {
      toast({
        title: 'Failed to Start Workflow',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Temporal VAPI call handler
  const handleStartVapiCall = async () => {
    if (!vapiCallConfig.phoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter a phone number to call',
        variant: 'destructive',
      });
      return;
    }

    setIsStarting(true);
    try {
      // Build payload with workflow config and call details
      const payload: Record<string, string> = {
        phoneNumber: vapiCallConfig.phoneNumber,
      };
      if (vapiCallConfig.customerName) payload.customerName = vapiCallConfig.customerName;
      if (selectedTemporalWorkflow?.vapiAssistantId) payload.assistantId = selectedTemporalWorkflow.vapiAssistantId;
      if (selectedTemporalWorkflow?.vapiPhoneNumberId) payload.phoneNumberId = selectedTemporalWorkflow.vapiPhoneNumberId;
      if (vapiCallConfig.campaignId) payload.campaignId = vapiCallConfig.campaignId;

      // Always use demo backend URL
      const serverUrl = DEMO_BACKEND_URL;
      const response = await fetch(`${serverUrl}/api/campaigns/trigger-vapi-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger call');
      }

      setActiveVapiCallId(data.callId || data.call_id);
      setVapiCallStatus('initiated');

      toast({
        title: 'Call Initiated',
        description: `Calling ${vapiCallConfig.phoneNumber}... Call ID: ${data.callId || data.call_id}`,
      });

      setIsVapiDialogOpen(false);
      setVapiCallConfig({ phoneNumber: '', customerName: '', campaignId: '', assistantId: '', phoneNumberId: '' });
    } catch (error) {
      toast({
        title: 'Failed to Start Call',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Check VAPI call status
  const checkVapiCallStatus = async () => {
    if (!activeVapiCallId) return;

    try {
      // Always use demo backend URL
      const serverUrl = DEMO_BACKEND_URL;
      const response = await fetch(`${serverUrl}/api/campaigns/vapi-call/${activeVapiCallId}/status`);
      const data = await response.json();
      setVapiCallStatus(data.status || 'unknown');
    } catch (error) {
      console.error('Failed to check call status:', error);
    }
  };

  const activeCount = workflows.filter((w) => w.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Workflows</h1>
          <p className="text-muted-foreground">Configure AI agent behaviors and automations</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm py-1 px-3">
          {workflows.length} Total Workflows
        </Badge>
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 py-1 px-3">
          {activeCount} Active
        </Badge>
        <Badge variant="secondary" className="py-1 px-3">
          {workflows.length - activeCount} Inactive
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Workflow Cards */}
      {filteredWorkflows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workflows Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first workflow to automate AI agent behaviors'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      workflow.status === 'active'
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{workflow.name}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {workflow.description}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(workflow)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(workflow)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(workflow)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trigger Type */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    {getTriggerIcon(workflow.triggerType)}
                    {getTriggerLabel(workflow.triggerType)}
                  </Badge>
                </div>

                {/* Tools Count */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{workflow.tools.length} tools configured</span>
                  <span>•</span>
                  <span>{workflow.endOfCallActions.length} end actions</span>
                </div>

                {/* Status Toggle & Run Button */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={workflow.status === 'active'}
                      onCheckedChange={() => handleToggleStatus(workflow)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {workflow.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(workflow.updatedAt)}
                    </span>
                    {workflow.status === 'active' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRunWorkflow(workflow)}
                        className="gap-1 h-7"
                      >
                        <Play className="h-3 w-3" />
                        Run
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Workflow Form Dialog */}
      <WorkflowForm
        workflow={editingWorkflow}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingWorkflow(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingWorkflow} onOpenChange={() => setDeletingWorkflow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingWorkflow?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Run Workflow Dialog */}
      <Dialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Run Workflow
            </DialogTitle>
            <DialogDescription>
              Configure and start "{runningWorkflow?.name}"
            </DialogDescription>
          </DialogHeader>

          {runningWorkflow?.triggerType === 'outbound-call' ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    min="1"
                    max="100"
                    value={campaignConfig.batchSize}
                    onChange={(e) => setCampaignConfig({
                      ...campaignConfig,
                      batchSize: parseInt(e.target.value) || 10,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Leads to process per batch</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrent">Concurrent Calls</Label>
                  <Input
                    id="maxConcurrent"
                    type="number"
                    min="1"
                    max="10"
                    value={campaignConfig.maxConcurrentCalls}
                    onChange={(e) => setCampaignConfig({
                      ...campaignConfig,
                      maxConcurrentCalls: parseInt(e.target.value) || 3,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Max simultaneous calls</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="windowStart">Call Window Start</Label>
                  <Input
                    id="windowStart"
                    type="time"
                    value={campaignConfig.callWindowStart}
                    onChange={(e) => setCampaignConfig({
                      ...campaignConfig,
                      callWindowStart: e.target.value,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="windowEnd">Call Window End</Label>
                  <Input
                    id="windowEnd"
                    type="time"
                    value={campaignConfig.callWindowEnd}
                    onChange={(e) => setCampaignConfig({
                      ...campaignConfig,
                      callWindowEnd: e.target.value,
                    })}
                  />
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium mb-1">Workflow will:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Fetch leads from database</li>
                  <li>Initiate outbound calls using AI agent</li>
                  <li>Track call outcomes and update lead status</li>
                  <li>Execute {runningWorkflow?.endOfCallActions.length || 0} end-of-call actions</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Event-Triggered Workflow</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This workflow will activate and wait for {getTriggerLabel(runningWorkflow?.triggerType || '')} events.
                  Each incoming event will trigger the workflow automatically.
                </p>
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium mb-1">On trigger, workflow will:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Handle call with AI agent</li>
                  <li>Use {runningWorkflow?.tools.length || 0} configured tools</li>
                  <li>Detect intent and escalate if needed</li>
                  <li>Execute {runningWorkflow?.endOfCallActions.length || 0} end-of-call actions</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRunDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartWorkflow} disabled={isStarting} className="gap-2">
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Workflow
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Campaign Panel */}
      {activeWorkflowId && (
        <div className="fixed bottom-4 right-4 w-96 z-50 shadow-lg">
          <CampaignExecutionPanel
            workflowId={activeWorkflowId}
            campaignName="Outbound Campaign"
            onClose={() => setActiveWorkflowId(null)}
          />
        </div>
      )}

      {/* Temporal VAPI Call Dialog */}
      <Dialog open={isVapiDialogOpen} onOpenChange={setIsVapiDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Temporal VAPI Call
            </DialogTitle>
            <DialogDescription>
              Trigger an outbound call via deployed Temporal workflow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+1234567890"
                  value={vapiCallConfig.phoneNumber}
                  onChange={(e) => setVapiCallConfig({
                    ...vapiCallConfig,
                    phoneNumber: e.target.value,
                  })}
                />
                <p className="text-xs text-muted-foreground">E.164 format required</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="John Doe"
                  value={vapiCallConfig.customerName}
                  onChange={(e) => setVapiCallConfig({
                    ...vapiCallConfig,
                    customerName: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaignId">Campaign ID</Label>
                <Input
                  id="campaignId"
                  placeholder="uuid"
                  value={vapiCallConfig.campaignId}
                  onChange={(e) => setVapiCallConfig({
                    ...vapiCallConfig,
                    campaignId: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assistantId">Assistant ID</Label>
                <Input
                  id="assistantId"
                  placeholder="vapi-asst-xxx"
                  value={vapiCallConfig.assistantId}
                  onChange={(e) => setVapiCallConfig({
                    ...vapiCallConfig,
                    assistantId: e.target.value,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                <Input
                  id="phoneNumberId"
                  placeholder="vapi-phone-xxx"
                  value={vapiCallConfig.phoneNumberId}
                  onChange={(e) => setVapiCallConfig({
                    ...vapiCallConfig,
                    phoneNumberId: e.target.value,
                  })}
                />
              </div>
            </div>

            <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg text-sm">
              <p className="font-medium mb-1 text-purple-700">Temporal Workflow</p>
              <p className="text-muted-foreground text-xs">
                Triggers VAPI outbound call via deployed Temporal server. Optional fields use defaults if empty.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVapiDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartVapiCall} disabled={isStarting} className="gap-2 bg-purple-600 hover:bg-purple-700">
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  Start Call
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active VAPI Call Status */}
      {activeVapiCallId && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Card className="shadow-lg border-purple-500/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-600" />
                  Active Call
                </CardTitle>
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                  {vapiCallStatus || 'initiated'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Call ID: {activeVapiCallId.slice(0, 16)}...
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={checkVapiCallStatus} className="flex-1">
                  <Activity className="h-3 w-3 mr-1" />
                  Check Status
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setActiveVapiCallId(null);
                  setVapiCallStatus(null);
                }}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
