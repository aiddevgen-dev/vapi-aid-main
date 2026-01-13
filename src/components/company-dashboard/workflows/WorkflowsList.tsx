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
  Loader2,
  Play,
  Activity,
  Calendar,
  FileText,
  Webhook,
} from 'lucide-react';
import { WorkflowForm, Workflow } from './WorkflowForm';
import { useToast } from '@/hooks/use-toast';

// Demo backend URL - always use this ngrok URL for Temporal
const DEMO_BACKEND_URL = 'https://reiko-transactional-vanessa.ngrok-free.dev';

// Trigger source display config
const triggerSourceConfig: Record<string, { icon: string | React.ReactNode; label: string; color: string }> = {
  hubspot: { icon: '🟠', label: 'HubSpot', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  salesforce: { icon: '☁️', label: 'Salesforce', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  pipedrive: { icon: '🟢', label: 'Pipedrive', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  zoho: { icon: '🔴', label: 'Zoho CRM', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  webhook: { icon: <Webhook className="h-3 w-3" />, label: 'Webhook', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  calendar: { icon: <Calendar className="h-3 w-3" />, label: 'Calendar', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  form: { icon: <FileText className="h-3 w-3" />, label: 'Form', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
  manual: { icon: <Phone className="h-3 w-3" />, label: 'Manual', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' },
};

// Mock data with new structure
const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'New Lead Follow-up',
    description: 'Automatically call new HubSpot leads within 5 minutes',
    triggerType: 'temporal-outbound',
    triggerSource: 'hubspot',
    status: 'active',
    tools: ['log-call', 'update-status'],
    actions: ['outbound-call', 'update-crm'],
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Salesforce Opportunity Call',
    description: 'Call prospects when opportunity stage changes',
    triggerType: 'temporal-outbound',
    triggerSource: 'salesforce',
    status: 'active',
    tools: ['log-call', 'schedule-followup'],
    actions: ['outbound-call', 'send-email'],
    updatedAt: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    name: 'Appointment Reminder',
    description: 'Call customers 1 hour before scheduled appointments',
    triggerType: 'temporal-outbound',
    triggerSource: 'calendar',
    status: 'active',
    tools: ['log-call', 'update-status'],
    actions: ['outbound-call', 'send-sms'],
    updatedAt: '2024-01-13T09:00:00Z',
  },
  {
    id: '4',
    name: 'Form Submission Callback',
    description: 'Call leads who submitted contact form',
    triggerType: 'temporal-outbound',
    triggerSource: 'form',
    status: 'inactive',
    tools: ['log-call'],
    actions: ['outbound-call'],
    updatedAt: '2024-01-10T11:15:00Z',
  },
];

const getTriggerDisplay = (triggerSource: string) => {
  const config = triggerSourceConfig[triggerSource];
  if (!config) {
    return { icon: <Phone className="h-3 w-3" />, label: triggerSource, color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' };
  }
  return config;
};

export const WorkflowsList: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

  // Temporal VAPI call state
  const [isVapiDialogOpen, setIsVapiDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [vapiCallConfig, setVapiCallConfig] = useState({
    phoneNumber: '',
    customerName: '',
  });
  const [isStarting, setIsStarting] = useState(false);
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
        triggerType: workflowData.triggerType || 'temporal-outbound',
        triggerSource: workflowData.triggerSource || 'manual',
        status: workflowData.status || 'inactive',
        tools: workflowData.tools || [],
        actions: workflowData.actions || [],
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

  // Run workflow - opens dialog to enter phone number
  const handleRunWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setVapiCallConfig({ phoneNumber: '', customerName: '' });
    setIsVapiDialogOpen(true);
  };

  // Start the actual call via Temporal backend
  const handleStartCall = async () => {
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
      // Build payload for Temporal backend
      const payload: Record<string, string> = {
        phoneNumber: vapiCallConfig.phoneNumber,
      };
      if (vapiCallConfig.customerName) {
        payload.customerName = vapiCallConfig.customerName;
      }
      // Add workflow context
      if (selectedWorkflow?.id) {
        payload.workflowId = selectedWorkflow.id;
      }
      if (selectedWorkflow?.triggerSource) {
        payload.triggerSource = selectedWorkflow.triggerSource;
      }

      // Call Temporal backend
      const response = await fetch(`${DEMO_BACKEND_URL}/api/campaigns/trigger-vapi-call`, {
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
        description: `Calling ${vapiCallConfig.phoneNumber}...`,
      });

      setIsVapiDialogOpen(false);
      setVapiCallConfig({ phoneNumber: '', customerName: '' });
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

  // Check call status
  const checkCallStatus = async () => {
    if (!activeVapiCallId) return;

    try {
      const response = await fetch(`${DEMO_BACKEND_URL}/api/campaigns/vapi-call/${activeVapiCallId}/status`);
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
          <p className="text-muted-foreground">Automate outbound calls based on CRM events</p>
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
                : 'Create your first workflow to automate outbound calls'}
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
          {filteredWorkflows.map((workflow) => {
            const triggerDisplay = getTriggerDisplay(workflow.triggerSource || 'manual');
            return (
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
                  {/* Trigger Source Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`gap-1.5 ${triggerDisplay.color}`}>
                      <span className="text-sm">{typeof triggerDisplay.icon === 'string' ? triggerDisplay.icon : triggerDisplay.icon}</span>
                      {triggerDisplay.label}
                    </Badge>
                  </div>

                  {/* Actions Summary */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{workflow.actions?.length || 0} actions</span>
                    <span>•</span>
                    <span>{workflow.tools?.length || 0} post-call actions</span>
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
            );
          })}
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

      {/* Run Workflow Dialog - Enter Phone Number */}
      <Dialog open={isVapiDialogOpen} onOpenChange={setIsVapiDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Run Workflow
            </DialogTitle>
            <DialogDescription>
              {selectedWorkflow?.name} - Enter contact details to initiate call
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
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
              <p className="text-xs text-muted-foreground">E.164 format (e.g., +14155551234)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
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

            {/* Workflow Info */}
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-1">This workflow will:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Initiate an AI-powered outbound call</li>
                <li>Execute {selectedWorkflow?.actions?.length || 0} configured actions</li>
                <li>Run {selectedWorkflow?.tools?.length || 0} post-call automations</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVapiDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartCall} disabled={isStarting} className="gap-2">
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
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

      {/* Active Call Status Card */}
      {activeVapiCallId && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Card className="shadow-lg border-green-500/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  Active Call
                </CardTitle>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                  {vapiCallStatus || 'initiated'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Call ID: {activeVapiCallId.slice(0, 16)}...
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={checkCallStatus} className="flex-1">
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
