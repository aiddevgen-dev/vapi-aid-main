import React, { useState, useEffect } from 'react';
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
  Calendar,
  FileText,
  Webhook,
  Eye,
  Bot,
  Database,
  PhoneCall,
  X,
  Zap,
} from 'lucide-react';
import { WorkflowForm, Workflow } from './WorkflowForm';
import { useToast } from '@/hooks/use-toast';

// Demo backend URL - always use this ngrok URL for Temporal
const DEMO_BACKEND_URL = 'https://reiko-transactional-vanessa.ngrok-free.dev';

// localStorage key for workflows
const WORKFLOWS_STORAGE_KEY = 'saved_workflows';

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


const getTriggerDisplay = (triggerSource: string) => {
  const config = triggerSourceConfig[triggerSource];
  if (!config) {
    return { icon: <Phone className="h-3 w-3" />, label: triggerSource, color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' };
  }
  return config;
};

// Load workflows from localStorage
const loadWorkflows = (): Workflow[] => {
  try {
    const saved = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load workflows:', e);
  }
  return [];
};

// Save workflows to localStorage
const saveWorkflows = (workflows: Workflow[]) => {
  try {
    localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
  } catch (e) {
    console.error('Failed to save workflows:', e);
  }
};

export const WorkflowsList: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>(loadWorkflows);
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
  const [isOrchestrationOpen, setIsOrchestrationOpen] = useState(false);

  const { toast } = useToast();

  // Save workflows whenever they change
  useEffect(() => {
    saveWorkflows(workflows);
  }, [workflows]);

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

      {/* Active Call Status Card - Purple Theme */}
      {activeVapiCallId && (
        <div className="fixed bottom-4 right-4 w-96 z-50">
          <Card className="shadow-2xl border-2 border-purple-500/50 bg-gradient-to-br from-background to-purple-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
                    <PhoneCall className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Workflow Running</CardTitle>
                    <p className="text-xs text-muted-foreground">Pipeline Active</p>
                  </div>
                </div>
                <Badge className="bg-purple-500 text-white border-0 animate-pulse">
                  {vapiCallStatus || 'LIVE'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Call ID</span>
                  <span className="text-xs font-mono">{activeVapiCallId.slice(0, 20)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-xs font-medium text-purple-500">Processing</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsOrchestrationOpen(true)}
                  className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                >
                  <Eye className="h-4 w-4" />
                  View Workflow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveVapiCallId(null);
                    setVapiCallStatus(null);
                  }}
                  className="border-purple-500/30 hover:bg-purple-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Visualization Dialog - Purple Theme */}
      <Dialog open={isOrchestrationOpen} onOpenChange={setIsOrchestrationOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-purple-500/30">
          {/* Header */}
          <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/50 to-violet-950/50">
            <DialogTitle className="text-lg font-semibold text-white">Workflow Execution</DialogTitle>
            <DialogDescription className="text-sm text-purple-200/70">
              Live view of your automation pipeline
            </DialogDescription>
          </div>

          {/* Canvas Area - Purple themed */}
          <div className="p-8 bg-gradient-to-br from-[#1e1033] via-[#1a0a2e] to-[#0f0518] min-h-[450px] relative overflow-hidden">
            {/* Grid Pattern Background */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Animated Flow Line */}
            <style>{`
              @keyframes flowPulse {
                0% { left: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { left: 100%; opacity: 0; }
              }
              .flow-particle {
                animation: flowPulse 3s ease-in-out infinite;
              }
              .flow-particle-delayed {
                animation: flowPulse 3s ease-in-out infinite 1.5s;
              }
            `}</style>

            {/* Workflow Pipeline */}
            <div className="relative flex flex-col items-center justify-center pt-8">

              {/* Flow Track - Purple gradient */}
              <div className="absolute top-[72px] left-[10%] right-[10%] h-1 bg-gradient-to-r from-purple-500/40 via-violet-500/40 to-fuchsia-500/40 rounded-full">
                {/* Animated particles */}
                <div className="flow-particle absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-300 shadow-lg shadow-purple-400/50" style={{ filter: 'blur(2px)' }} />
                <div className="flow-particle-delayed absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-fuchsia-400 shadow-lg shadow-fuchsia-400/50" style={{ filter: 'blur(1px)' }} />
              </div>

              {/* Nodes Container */}
              <div className="relative flex items-center justify-between w-full px-[5%]">

                {/* Node 1: Trigger */}
                <div className="flex flex-col items-center z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/40 flex items-center justify-center relative border-2 border-purple-400/50">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-purple-300">Trigger</span>
                  <span className="text-[10px] text-purple-400/60">Start</span>
                </div>

                {/* Node 2: Process */}
                <div className="flex flex-col items-center z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/40 flex items-center justify-center relative border-2 border-violet-400/50">
                    <GitBranch className="h-7 w-7 text-white" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-violet-300">Process</span>
                  <span className="text-[10px] text-violet-400/60">Engine</span>
                </div>

                {/* Node 3: Call */}
                <div className="flex flex-col items-center z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 shadow-lg shadow-fuchsia-500/40 flex items-center justify-center relative border-2 border-fuchsia-400/50">
                    <PhoneCall className="h-7 w-7 text-white" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-fuchsia-300">Call</span>
                  <span className="text-[10px] text-fuchsia-400/60">Outbound</span>
                </div>

                {/* Node 4: AI */}
                <div className="flex flex-col items-center z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-700 shadow-lg shadow-pink-500/40 flex items-center justify-center relative border-2 border-pink-400/50">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-pink-300">AI Agent</span>
                  <span className="text-[10px] text-pink-400/60">Response</span>
                </div>

                {/* Node 5: Actions */}
                <div className="flex flex-col items-center z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/40 flex items-center justify-center relative border-2 border-indigo-400/50">
                    <Database className="h-7 w-7 text-white" />
                  </div>
                  <span className="mt-3 text-xs font-semibold text-indigo-300">Actions</span>
                  <span className="text-[10px] text-indigo-400/60">Complete</span>
                </div>
              </div>

              {/* Flow Direction Indicator */}
              <div className="mt-8 flex items-center gap-2 text-purple-300/50">
                <span className="text-xs">Flow Direction</span>
                <svg className="w-16 h-4" viewBox="0 0 64 16">
                  <defs>
                    <linearGradient id="arrowGradPurple" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <path d="M0 8 L56 8 M48 2 L58 8 L48 14" stroke="url(#arrowGradPurple)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-purple-500/20 bg-gradient-to-r from-purple-950/30 to-violet-950/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-purple-300/70">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Live</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsOrchestrationOpen(false)} className="border-purple-500/30 hover:bg-purple-500/10">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
