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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GitBranch,
  ChevronRight,
  ChevronLeft,
  Check,
  PhoneIncoming,
  PhoneOutgoing,
  MessageSquare,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  status: 'active' | 'inactive';
  aiAgentId: string;
  greeting?: string;
  intents?: string[];
  fallbackBehavior?: string;
  maxTurns?: number;
  timeout?: number;
  tools: string[];
  endOfCallActions: string[];
  webhookUrl?: string;
  updatedAt: string;
}

interface WorkflowFormProps {
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: Partial<Workflow>) => void;
}

const triggerTypes = [
  { id: 'inbound-call', name: 'Inbound Call Received', icon: <PhoneIncoming className="h-4 w-4" /> },
  { id: 'outbound-call', name: 'Outbound Call Initiated', icon: <PhoneOutgoing className="h-4 w-4" /> },
  { id: 'chat-message', name: 'Chat Message Received', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'time-based', name: 'Time-Based Trigger', icon: <Clock className="h-4 w-4" /> },
  { id: 'webhook', name: 'Webhook Received', icon: <Zap className="h-4 w-4" /> },
];

const aiAgents = [
  { id: '1', name: 'Sales Assistant' },
  { id: '2', name: 'Support Bot' },
  { id: '3', name: 'Appointment Scheduler' },
  { id: '4', name: 'Billing Assistant' },
];

const intents = [
  'Sales Inquiry',
  'Technical Support',
  'Billing Question',
  'Account Information',
  'Product Information',
  'Appointment Booking',
  'Complaint',
  'General Question',
];

const availableTools = [
  { id: 'search-kb', name: 'Search Knowledge Base', description: 'Look up information in knowledge base' },
  { id: 'order-status', name: 'Check Order Status', description: 'Look up customer order information' },
  { id: 'appointment', name: 'Schedule Appointment', description: 'Book appointments in calendar' },
  { id: 'refund', name: 'Process Refund', description: 'Initiate refund requests' },
  { id: 'transfer', name: 'Transfer to Human Agent', description: 'Hand off call to human agent' },
  { id: 'send-sms', name: 'Send SMS', description: 'Send text messages to customers' },
  { id: 'create-ticket', name: 'Create Support Ticket', description: 'Create tickets in helpdesk' },
];

const endOfCallActions = [
  { id: 'summary-email', name: 'Send Call Summary Email', description: 'Email transcript to customer' },
  { id: 'zendesk-ticket', name: 'Create Zendesk Ticket', description: 'Create follow-up ticket' },
  { id: 'crm-update', name: 'Update CRM Record', description: 'Log call in CRM system' },
  { id: 'survey', name: 'Send Customer Survey', description: 'Request CSAT feedback' },
  { id: 'webhook', name: 'Trigger Webhook', description: 'Send data to external system' },
];

const steps = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Trigger' },
  { id: 3, name: 'AI Behavior' },
  { id: 4, name: 'Tools' },
  { id: 5, name: 'End Actions' },
  { id: 6, name: 'Review' },
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
    triggerType: 'inbound-call',
    aiAgentId: '',
    greeting: 'Hello! Thank you for calling. How can I assist you today?',
    intents: ['Sales Inquiry', 'Technical Support'] as string[],
    fallbackBehavior: 'transfer',
    maxTurns: 10,
    timeout: 30,
    tools: ['search-kb', 'transfer'] as string[],
    endOfCallActions: ['crm-update'] as string[],
    webhookUrl: '',
  });

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        triggerType: workflow.triggerType,
        aiAgentId: workflow.aiAgentId,
        greeting: workflow.greeting || 'Hello! Thank you for calling. How can I assist you today?',
        intents: workflow.intents || ['Sales Inquiry'],
        fallbackBehavior: workflow.fallbackBehavior || 'transfer',
        maxTurns: workflow.maxTurns || 10,
        timeout: workflow.timeout || 30,
        tools: workflow.tools,
        endOfCallActions: workflow.endOfCallActions,
        webhookUrl: workflow.webhookUrl || '',
      });
      setCurrentStep(1);
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'inactive',
        triggerType: 'inbound-call',
        aiAgentId: '',
        greeting: 'Hello! Thank you for calling. How can I assist you today?',
        intents: ['Sales Inquiry', 'Technical Support'],
        fallbackBehavior: 'transfer',
        maxTurns: 10,
        timeout: 30,
        tools: ['search-kb', 'transfer'],
        endOfCallActions: ['crm-update'],
        webhookUrl: '',
      });
      setCurrentStep(1);
    }
  }, [workflow, isOpen]);

  const toggleTool = (toolId: string) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }));
  };

  const toggleEndAction = (actionId: string) => {
    setFormData((prev) => ({
      ...prev,
      endOfCallActions: prev.endOfCallActions.includes(actionId)
        ? prev.endOfCallActions.filter((a) => a !== actionId)
        : [...prev.endOfCallActions, actionId],
    }));
  };

  const toggleIntent = (intent: string) => {
    setFormData((prev) => ({
      ...prev,
      intents: prev.intents.includes(intent)
        ? prev.intents.filter((i) => i !== intent)
        : [...prev.intents, intent],
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const progress = (currentStep / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                placeholder="e.g., Inbound Sales Handler"
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
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label>Workflow Status</Label>
                <p className="text-sm text-muted-foreground">Enable to activate this workflow</p>
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

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select when this workflow should be activated
              </p>
              <div className="grid gap-3">
                {triggerTypes.map((trigger) => (
                  <div
                    key={trigger.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.triggerType === trigger.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setFormData({ ...formData, triggerType: trigger.id })}
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      formData.triggerType === trigger.id
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted'
                    }`}>
                      {trigger.icon}
                    </div>
                    <span className="font-medium">{trigger.name}</span>
                    {formData.triggerType === trigger.id && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Assign AI Agent</Label>
              <Select
                value={formData.aiAgentId}
                onValueChange={(value) => setFormData({ ...formData, aiAgentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an AI agent" />
                </SelectTrigger>
                <SelectContent>
                  {aiAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting Message</Label>
              <Textarea
                id="greeting"
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Intent Detection</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select which intents the AI should detect
              </p>
              <div className="flex flex-wrap gap-2">
                {intents.map((intent) => (
                  <Badge
                    key={intent}
                    variant={formData.intents.includes(intent) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleIntent(intent)}
                  >
                    {intent}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fallback Behavior</Label>
                <Select
                  value={formData.fallbackBehavior}
                  onValueChange={(value) => setFormData({ ...formData, fallbackBehavior: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer to Human</SelectItem>
                    <SelectItem value="retry">Retry with AI</SelectItem>
                    <SelectItem value="end">End Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Conversation Turns</Label>
                <Input
                  type="number"
                  value={formData.maxTurns}
                  onChange={(e) => setFormData({ ...formData, maxTurns: parseInt(e.target.value) })}
                  min={1}
                  max={50}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label>Available Tools</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select tools the AI agent can use during this workflow
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {availableTools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.tools.includes(tool.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleTool(tool.id)}
                  >
                    <Checkbox
                      checked={formData.tools.includes(tool.id)}
                      onCheckedChange={() => toggleTool(tool.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label>End of Call Actions</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Configure what happens after each call ends
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {endOfCallActions.map((action) => (
                  <div
                    key={action.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.endOfCallActions.includes(action.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleEndAction(action.id)}
                  >
                    <Checkbox
                      checked={formData.endOfCallActions.includes(action.id)}
                      onCheckedChange={() => toggleEndAction(action.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{action.name}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://your-api.com/webhook"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Workflow Summary</CardTitle>
                <CardDescription>Review your workflow configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{formData.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                      {formData.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trigger</p>
                    <p className="font-medium">
                      {triggerTypes.find((t) => t.id === formData.triggerType)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">AI Agent</p>
                    <p className="font-medium">
                      {aiAgents.find((a) => a.id === formData.aiAgentId)?.name || 'Not assigned'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tools ({formData.tools.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.tools.map((toolId) => (
                      <Badge key={toolId} variant="outline" className="text-xs">
                        {availableTools.find((t) => t.id === toolId)?.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    End Actions ({formData.endOfCallActions.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {formData.endOfCallActions.map((actionId) => (
                      <Badge key={actionId} variant="outline" className="text-xs">
                        {endOfCallActions.find((a) => a.id === actionId)?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {!formData.name && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Please provide a workflow name before saving</span>
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
                className={`text-xs ${
                  step.id === currentStep
                    ? 'text-primary font-medium'
                    : step.id < currentStep
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                {step.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-6 min-h-[300px]">
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
            <Button onClick={handleSave} disabled={!formData.name} className="gap-2">
              <Check className="h-4 w-4" />
              {workflow ? 'Save Changes' : 'Create Workflow'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
