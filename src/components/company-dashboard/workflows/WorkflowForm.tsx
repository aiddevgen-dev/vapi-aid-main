import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Database,
  Mail,
  Calendar,
  Users,
  FileText,
  Phone,
  MessageSquare,
  Webhook,
  Globe,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  triggerSource: string;
  status: 'active' | 'inactive';
  tools: string[];
  actions: string[];
  webhookUrl?: string;
  updatedAt: string;
  // Hidden fields for backend
  aiAgentId?: string;
  vapiAssistantId?: string;
  vapiPhoneNumberId?: string;
}

interface WorkflowFormProps {
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: Partial<Workflow>) => void;
}

// Trigger sources - what initiates the workflow
const triggerSources = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🟠',
    description: 'Trigger on HubSpot contact or deal events',
    category: 'CRM'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: '☁️',
    description: 'Trigger on Salesforce lead or opportunity events',
    category: 'CRM'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    icon: '🟢',
    description: 'Trigger on Pipedrive deal stage changes',
    category: 'CRM'
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    icon: '🔴',
    description: 'Trigger on Zoho CRM module events',
    category: 'CRM'
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    icon: <Webhook className="h-5 w-5" />,
    description: 'Trigger via HTTP POST request',
    category: 'Developer'
  },
  {
    id: 'calendar',
    name: 'Calendar Event',
    icon: <Calendar className="h-5 w-5" />,
    description: 'Trigger before scheduled appointments',
    category: 'Scheduling'
  },
  {
    id: 'form',
    name: 'Form Submission',
    icon: <FileText className="h-5 w-5" />,
    description: 'Trigger when a form is submitted',
    category: 'Lead Capture'
  },
  {
    id: 'manual',
    name: 'Manual Trigger',
    icon: <Phone className="h-5 w-5" />,
    description: 'Manually initiate calls from dashboard',
    category: 'Manual'
  },
];

// Workflow actions - what happens when triggered
const workflowActions = [
  {
    id: 'outbound-call',
    name: 'Make Outbound Call',
    description: 'Initiate an AI-powered phone call to the contact',
    icon: <Phone className="h-4 w-4" />
  },
  {
    id: 'send-sms',
    name: 'Send SMS',
    description: 'Send a text message to the contact',
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    id: 'send-email',
    name: 'Send Email',
    description: 'Send an automated email',
    icon: <Mail className="h-4 w-4" />
  },
  {
    id: 'update-crm',
    name: 'Update CRM',
    description: 'Update contact/deal status in CRM',
    icon: <Database className="h-4 w-4" />
  },
  {
    id: 'create-task',
    name: 'Create Follow-up Task',
    description: 'Schedule a follow-up task for the team',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    id: 'notify-team',
    name: 'Notify Team',
    description: 'Send notification to Slack/Teams',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'webhook-callback',
    name: 'Webhook Callback',
    description: 'Send results to external system',
    icon: <Globe className="h-4 w-4" />
  },
];

// Post-call actions
const postCallActions = [
  { id: 'log-call', name: 'Log Call to CRM', description: 'Record call details and transcript' },
  { id: 'update-status', name: 'Update Contact Status', description: 'Mark contact as contacted/qualified' },
  { id: 'schedule-followup', name: 'Schedule Follow-up', description: 'Create next action based on call outcome' },
  { id: 'send-summary', name: 'Send Summary Email', description: 'Email call summary to team' },
  { id: 'trigger-webhook', name: 'Trigger Webhook', description: 'POST call data to external URL' },
];

const steps = [
  { id: 1, name: 'Details' },
  { id: 2, name: 'Trigger' },
  { id: 3, name: 'Actions' },
  { id: 4, name: 'Review' },
];

export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  workflow,
  isOpen,
  onClose,
  onSave,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'inactive' as 'active' | 'inactive',
    triggerSource: 'hubspot',
    actions: ['outbound-call'] as string[],
    postCallActions: ['log-call', 'update-status'] as string[],
    webhookUrl: '',
  });

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        triggerSource: workflow.triggerSource || 'hubspot',
        actions: workflow.actions || ['outbound-call'],
        postCallActions: workflow.tools || ['log-call', 'update-status'],
        webhookUrl: workflow.webhookUrl || '',
      });
      setCurrentStep(1);
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'inactive',
        triggerSource: 'hubspot',
        actions: ['outbound-call'],
        postCallActions: ['log-call', 'update-status'],
        webhookUrl: '',
      });
      setCurrentStep(1);
    }
  }, [workflow, isOpen]);

  const toggleAction = (actionId: string) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.includes(actionId)
        ? prev.actions.filter((a) => a !== actionId)
        : [...prev.actions, actionId],
    }));
  };

  const togglePostCallAction = (actionId: string) => {
    setFormData((prev) => ({
      ...prev,
      postCallActions: prev.postCallActions.includes(actionId)
        ? prev.postCallActions.filter((a) => a !== actionId)
        : [...prev.postCallActions, actionId],
    }));
  };

  const handleSave = () => {
    const workflowData: Partial<Workflow> = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      // Always use temporal-outbound for backend - this triggers the Temporal workflow
      triggerType: 'temporal-outbound',
      triggerSource: formData.triggerSource,
      actions: formData.actions,
      tools: formData.postCallActions,
      webhookUrl: formData.webhookUrl,
    };
    onSave(workflowData);
  };

  const progress = (currentStep / steps.length) * 100;

  const selectedTrigger = triggerSources.find(t => t.id === formData.triggerSource);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Details
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                placeholder="e.g., New Lead Follow-up"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this workflow does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <Label>Activate Immediately</Label>
                <p className="text-sm text-muted-foreground">Enable to start processing triggers right away</p>
              </div>
              <Switch
                checked={formData.status === 'active'}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                }
              />
            </div>
          </div>
        );

      case 2: // Trigger
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base">Trigger Source</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select what should trigger this workflow
              </p>

              {/* CRM Triggers */}
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">CRM Integrations</p>
                <div className="grid grid-cols-2 gap-3">
                  {triggerSources.filter(t => t.category === 'CRM').map((trigger) => (
                    <div
                      key={trigger.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.triggerSource === trigger.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'hover:bg-muted/50 hover:border-muted-foreground/30'
                      }`}
                      onClick={() => setFormData({ ...formData, triggerSource: trigger.id })}
                    >
                      <span className="text-2xl">{trigger.icon as string}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block">{trigger.name}</span>
                        <p className="text-xs text-muted-foreground truncate">{trigger.description}</p>
                      </div>
                      {formData.triggerSource === trigger.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Triggers */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Other Triggers</p>
                <div className="grid grid-cols-2 gap-3">
                  {triggerSources.filter(t => t.category !== 'CRM').map((trigger) => (
                    <div
                      key={trigger.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.triggerSource === trigger.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'hover:bg-muted/50 hover:border-muted-foreground/30'
                      }`}
                      onClick={() => setFormData({ ...formData, triggerSource: trigger.id })}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        formData.triggerSource === trigger.id
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted'
                      }`}>
                        {trigger.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block">{trigger.name}</span>
                        <p className="text-xs text-muted-foreground truncate">{trigger.description}</p>
                      </div>
                      {formData.triggerSource === trigger.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {formData.triggerSource === 'webhook' && (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <Label htmlFor="webhookUrl">Webhook Endpoint URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://api.yourcompany.com/webhook"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  POST requests to this URL will trigger the workflow
                </p>
              </div>
            )}
          </div>
        );

      case 3: // Actions
        return (
          <div className="space-y-6">
            {/* Primary Actions */}
            <div>
              <Label className="text-base">Workflow Actions</Label>
              <p className="text-sm text-muted-foreground mb-3">
                What should happen when this workflow is triggered?
              </p>
              <div className="space-y-2">
                {workflowActions.map((action) => (
                  <div
                    key={action.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.actions.includes(action.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleAction(action.id)}
                  >
                    <Checkbox
                      checked={formData.actions.includes(action.id)}
                      onCheckedChange={() => toggleAction(action.id)}
                    />
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      formData.actions.includes(action.id)
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted'
                    }`}>
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{action.name}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Post-Call Actions - only show if outbound-call is selected */}
            {formData.actions.includes('outbound-call') && (
              <div className="border-t pt-6">
                <Label className="text-base">After Call Completes</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Actions to perform after the call ends
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {postCallActions.map((action) => (
                    <div
                      key={action.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.postCallActions.includes(action.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => togglePostCallAction(action.id)}
                    >
                      <Checkbox
                        checked={formData.postCallActions.includes(action.id)}
                        onCheckedChange={() => togglePostCallAction(action.id)}
                      />
                      <div>
                        <p className="font-medium text-sm">{action.name}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Workflow Summary</CardTitle>
                <CardDescription>Review your workflow configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{formData.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                      {formData.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Workflow Flow Visualization */}
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-3">Workflow Flow</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Trigger */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{selectedTrigger?.name}</span>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground" />

                    {/* Actions */}
                    {formData.actions.map((actionId, index) => {
                      const action = workflowActions.find(a => a.id === actionId);
                      return (
                        <React.Fragment key={actionId}>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                            {action?.icon}
                            <span className="text-sm font-medium">{action?.name}</span>
                          </div>
                          {index < formData.actions.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Post-Call Actions */}
                {formData.actions.includes('outbound-call') && formData.postCallActions.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">After Call Actions</p>
                    <div className="flex flex-wrap gap-1">
                      {formData.postCallActions.map((actionId) => {
                        const action = postCallActions.find(a => a.id === actionId);
                        return (
                          <Badge key={actionId} variant="secondary" className="text-xs">
                            {action?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!formData.name && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Please provide a workflow name before saving</span>
              </div>
            )}

            {formData.actions.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Please select at least one action</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {workflow ? 'Edit Workflow' : 'Create Workflow'}
          </DialogTitle>
          <DialogDescription>
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`text-xs transition-colors ${
                  step.id === currentStep
                    ? 'text-primary font-medium'
                    : step.id < currentStep
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                {step.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-6 min-h-[350px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!formData.name || formData.actions.length === 0}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {workflow ? 'Save Changes' : 'Create Workflow'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
