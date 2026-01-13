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
  AlertCircle,
  Database,
  Mail,
  Calendar,
  Users,
  FileText,
  BarChart3,
  Shield,
  Webhook,
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
  // Integration configuration
  integrations?: {
    crm?: { provider: string; apiKey?: string; syncContacts?: boolean };
    calendar?: { provider: string; autoSchedule?: boolean };
    notifications?: { channels: string[]; webhookUrl?: string };
  };
}

interface WorkflowFormProps {
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: Partial<Workflow>) => void;
}

const triggerTypes = [
  { id: 'inbound-call', name: 'Inbound Call', icon: <PhoneIncoming className="h-4 w-4" />, description: 'Triggered when a customer calls your business' },
  { id: 'outbound-call', name: 'Outbound Campaign', icon: <PhoneOutgoing className="h-4 w-4" />, description: 'Automated outbound calling campaigns' },
  { id: 'chat-message', name: 'Chat / SMS', icon: <MessageSquare className="h-4 w-4" />, description: 'Triggered by incoming chat or SMS messages' },
  { id: 'scheduled', name: 'Scheduled', icon: <Clock className="h-4 w-4" />, description: 'Run on a recurring schedule (daily, weekly, etc.)' },
  { id: 'webhook', name: 'Webhook / API', icon: <Webhook className="h-4 w-4" />, description: 'Triggered by external API calls or webhooks' },
  { id: 'crm-event', name: 'CRM Event', icon: <Database className="h-4 w-4" />, description: 'Triggered by CRM events (new lead, deal stage change)' },
];

const aiAgents = [
  { id: '1', name: 'Sales Assistant', description: 'Qualified lead handling and sales inquiries' },
  { id: '2', name: 'Support Agent', description: 'Customer support and issue resolution' },
  { id: '3', name: 'Appointment Scheduler', description: 'Calendar management and booking' },
  { id: '4', name: 'Billing Assistant', description: 'Payment and invoice inquiries' },
  { id: '5', name: 'Onboarding Specialist', description: 'New customer onboarding flows' },
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
  'Cancellation Request',
  'Upgrade Request',
];

const availableTools = [
  { id: 'search-kb', name: 'Knowledge Base Search', description: 'Search internal documentation and FAQs', icon: <FileText className="h-4 w-4" /> },
  { id: 'crm-lookup', name: 'CRM Lookup', description: 'Retrieve customer data from CRM', icon: <Database className="h-4 w-4" /> },
  { id: 'order-status', name: 'Order Status', description: 'Check order and shipment status', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'appointment', name: 'Calendar Integration', description: 'Schedule and manage appointments', icon: <Calendar className="h-4 w-4" /> },
  { id: 'transfer', name: 'Live Agent Transfer', description: 'Escalate to human agent when needed', icon: <Users className="h-4 w-4" /> },
  { id: 'send-sms', name: 'Send SMS/Email', description: 'Send follow-up messages to customers', icon: <Mail className="h-4 w-4" /> },
  { id: 'create-ticket', name: 'Create Support Ticket', description: 'Create tickets in helpdesk system', icon: <FileText className="h-4 w-4" /> },
  { id: 'payment', name: 'Payment Processing', description: 'Handle payment inquiries and refunds', icon: <Shield className="h-4 w-4" /> },
];

const crmProviders = [
  { id: 'hubspot', name: 'HubSpot', icon: '🟠' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️' },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🟢' },
  { id: 'zoho', name: 'Zoho CRM', icon: '🔴' },
  { id: 'custom', name: 'Custom API', icon: '⚡' },
];

const calendarProviders = [
  { id: 'google', name: 'Google Calendar', icon: '📅' },
  { id: 'outlook', name: 'Microsoft Outlook', icon: '📧' },
  { id: 'calendly', name: 'Calendly', icon: '🗓️' },
  { id: 'custom', name: 'Custom Integration', icon: '⚡' },
];

const notificationChannels = [
  { id: 'slack', name: 'Slack', icon: '💬' },
  { id: 'teams', name: 'Microsoft Teams', icon: '👥' },
  { id: 'email', name: 'Email Notifications', icon: '📧' },
  { id: 'webhook', name: 'Custom Webhook', icon: '🔗' },
];

const endOfCallActions = [
  { id: 'summary-email', name: 'Send Call Summary', description: 'Email conversation transcript and summary' },
  { id: 'crm-update', name: 'Update CRM Record', description: 'Log call details and outcomes in CRM' },
  { id: 'create-task', name: 'Create Follow-up Task', description: 'Schedule follow-up actions automatically' },
  { id: 'survey', name: 'Send Satisfaction Survey', description: 'Request customer feedback via SMS/email' },
  { id: 'analytics', name: 'Log to Analytics', description: 'Send call metrics to analytics platform' },
  { id: 'webhook', name: 'Trigger Webhook', description: 'Send data to external systems' },
];

const steps = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Trigger' },
  { id: 3, name: 'AI Behavior' },
  { id: 4, name: 'Integrations' },
  { id: 5, name: 'Actions' },
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
    greeting: 'Hello! Thank you for reaching out. How can I assist you today?',
    intents: ['Sales Inquiry', 'Technical Support'] as string[],
    fallbackBehavior: 'transfer',
    maxTurns: 10,
    timeout: 30,
    tools: ['search-kb', 'transfer'] as string[],
    endOfCallActions: ['crm-update'] as string[],
    webhookUrl: '',
    // Integration config
    crmProvider: '',
    crmApiKey: '',
    crmSyncContacts: true,
    calendarProvider: '',
    calendarAutoSchedule: true,
    notificationChannels: [] as string[],
    notificationWebhook: '',
  });

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        triggerType: workflow.triggerType,
        aiAgentId: workflow.aiAgentId,
        greeting: workflow.greeting || 'Hello! Thank you for reaching out. How can I assist you today?',
        intents: workflow.intents || ['Sales Inquiry'],
        fallbackBehavior: workflow.fallbackBehavior || 'transfer',
        maxTurns: workflow.maxTurns || 10,
        timeout: workflow.timeout || 30,
        tools: workflow.tools,
        endOfCallActions: workflow.endOfCallActions,
        webhookUrl: workflow.webhookUrl || '',
        crmProvider: workflow.integrations?.crm?.provider || '',
        crmApiKey: workflow.integrations?.crm?.apiKey || '',
        crmSyncContacts: workflow.integrations?.crm?.syncContacts ?? true,
        calendarProvider: workflow.integrations?.calendar?.provider || '',
        calendarAutoSchedule: workflow.integrations?.calendar?.autoSchedule ?? true,
        notificationChannels: workflow.integrations?.notifications?.channels || [],
        notificationWebhook: workflow.integrations?.notifications?.webhookUrl || '',
      });
      setCurrentStep(1);
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'inactive',
        triggerType: 'inbound-call',
        aiAgentId: '',
        greeting: 'Hello! Thank you for reaching out. How can I assist you today?',
        intents: ['Sales Inquiry', 'Technical Support'],
        fallbackBehavior: 'transfer',
        maxTurns: 10,
        timeout: 30,
        tools: ['search-kb', 'transfer'],
        endOfCallActions: ['crm-update'],
        webhookUrl: '',
        crmProvider: '',
        crmApiKey: '',
        crmSyncContacts: true,
        calendarProvider: '',
        calendarAutoSchedule: true,
        notificationChannels: [],
        notificationWebhook: '',
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

  const toggleNotificationChannel = (channelId: string) => {
    setFormData((prev) => ({
      ...prev,
      notificationChannels: prev.notificationChannels.includes(channelId)
        ? prev.notificationChannels.filter((c) => c !== channelId)
        : [...prev.notificationChannels, channelId],
    }));
  };

  const handleSave = () => {
    const workflowData: Partial<Workflow> = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      triggerType: formData.triggerType,
      aiAgentId: formData.aiAgentId,
      greeting: formData.greeting,
      intents: formData.intents,
      fallbackBehavior: formData.fallbackBehavior,
      maxTurns: formData.maxTurns,
      timeout: formData.timeout,
      tools: formData.tools,
      endOfCallActions: formData.endOfCallActions,
      webhookUrl: formData.webhookUrl,
      integrations: {
        crm: formData.crmProvider ? {
          provider: formData.crmProvider,
          apiKey: formData.crmApiKey,
          syncContacts: formData.crmSyncContacts,
        } : undefined,
        calendar: formData.calendarProvider ? {
          provider: formData.calendarProvider,
          autoSchedule: formData.calendarAutoSchedule,
        } : undefined,
        notifications: formData.notificationChannels.length > 0 ? {
          channels: formData.notificationChannels,
          webhookUrl: formData.notificationWebhook,
        } : undefined,
      },
    };
    onSave(workflowData);
  };

  const progress = (currentStep / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Basic Info
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sales Lead Qualification"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and behavior of this workflow..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <Label>Workflow Status</Label>
                <p className="text-sm text-muted-foreground">Enable to activate this workflow immediately</p>
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
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select what event should start this workflow
              </p>
              <div className="grid gap-3">
                {triggerTypes.map((trigger) => (
                  <div
                    key={trigger.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.triggerType === trigger.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'hover:bg-muted/50 hover:border-muted-foreground/30'
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
                    <div className="flex-1">
                      <span className="font-medium">{trigger.name}</span>
                      <p className="text-xs text-muted-foreground">{trigger.description}</p>
                    </div>
                    {formData.triggerType === trigger.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {formData.triggerType === 'webhook' && (
              <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                <Label htmlFor="webhookUrl">Webhook Endpoint</Label>
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

            {formData.triggerType === 'scheduled' && (
              <div className="p-4 rounded-lg border bg-blue-500/5 border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Schedule Configuration</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Schedule settings can be configured after workflow creation in the automation settings.
                </p>
              </div>
            )}
          </div>
        );

      case 3: // AI Behavior
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>AI Agent</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select the AI agent that will handle this workflow
              </p>
              <div className="grid gap-2">
                {aiAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.aiAgentId === agent.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setFormData({ ...formData, aiAgentId: agent.id })}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      formData.aiAgentId === agent.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">{agent.name}</span>
                      <p className="text-xs text-muted-foreground">{agent.description}</p>
                    </div>
                    {formData.aiAgentId === agent.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="greeting">Opening Message</Label>
              <Textarea
                id="greeting"
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Intent Detection</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select customer intents the AI should recognize
              </p>
              <div className="flex flex-wrap gap-2">
                {intents.map((intent) => (
                  <Badge
                    key={intent}
                    variant={formData.intents.includes(intent) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
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
                    <SelectItem value="transfer">Transfer to Human Agent</SelectItem>
                    <SelectItem value="retry">Retry with Clarification</SelectItem>
                    <SelectItem value="callback">Schedule Callback</SelectItem>
                    <SelectItem value="end">End Conversation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Conversation Turns</Label>
                <Input
                  type="number"
                  value={formData.maxTurns}
                  onChange={(e) => setFormData({ ...formData, maxTurns: parseInt(e.target.value) || 10 })}
                  min={1}
                  max={50}
                />
              </div>
            </div>
          </div>
        );

      case 4: // Integrations
        return (
          <div className="space-y-6">
            {/* CRM Integration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-orange-600" />
                <Label className="text-base">CRM Integration</Label>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {crmProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.crmProvider === provider.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setFormData({ ...formData, crmProvider: provider.id })}
                  >
                    <span className="text-xl">{provider.icon}</span>
                    <span className="text-xs font-medium text-center">{provider.name}</span>
                  </div>
                ))}
              </div>
              {formData.crmProvider && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-xs">API Key</Label>
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      value={formData.crmApiKey}
                      onChange={(e) => setFormData({ ...formData, crmApiKey: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Auto-sync contacts</Label>
                    <Switch
                      checked={formData.crmSyncContacts}
                      onCheckedChange={(checked) => setFormData({ ...formData, crmSyncContacts: checked })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Calendar Integration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <Label className="text-base">Calendar Integration</Label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {calendarProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.calendarProvider === provider.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setFormData({ ...formData, calendarProvider: provider.id })}
                  >
                    <span className="text-xl">{provider.icon}</span>
                    <span className="text-xs font-medium text-center">{provider.name}</span>
                  </div>
                ))}
              </div>
              {formData.calendarProvider && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <Label className="text-xs">Auto-schedule appointments</Label>
                  <Switch
                    checked={formData.calendarAutoSchedule}
                    onCheckedChange={(checked) => setFormData({ ...formData, calendarAutoSchedule: checked })}
                  />
                </div>
              )}
            </div>

            {/* Notification Channels */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-600" />
                <Label className="text-base">Notification Channels</Label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {notificationChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.notificationChannels.includes(channel.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleNotificationChannel(channel.id)}
                  >
                    <span className="text-xl">{channel.icon}</span>
                    <span className="text-xs font-medium text-center">{channel.name}</span>
                  </div>
                ))}
              </div>
              {formData.notificationChannels.includes('webhook') && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <Label className="text-xs">Webhook URL</Label>
                  <Input
                    placeholder="https://hooks.slack.com/..."
                    value={formData.notificationWebhook}
                    onChange={(e) => setFormData({ ...formData, notificationWebhook: e.target.value })}
                    className="h-8 text-sm mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 5: // Actions (Tools + End Actions)
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base">Available Tools</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select capabilities the AI can use during conversations
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {availableTools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {tool.icon}
                        <p className="font-medium text-sm">{tool.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <Label className="text-base">Post-Conversation Actions</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Actions to perform after each conversation ends
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {endOfCallActions.map((action) => (
                  <div
                    key={action.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
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
          </div>
        );

      case 6: // Review
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Workflow Summary</CardTitle>
                <CardDescription>Review your configuration before saving</CardDescription>
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

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Integrations</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.crmProvider && (
                      <Badge variant="outline">
                        {crmProviders.find((p) => p.id === formData.crmProvider)?.icon}{' '}
                        {crmProviders.find((p) => p.id === formData.crmProvider)?.name}
                      </Badge>
                    )}
                    {formData.calendarProvider && (
                      <Badge variant="outline">
                        {calendarProviders.find((p) => p.id === formData.calendarProvider)?.icon}{' '}
                        {calendarProviders.find((p) => p.id === formData.calendarProvider)?.name}
                      </Badge>
                    )}
                    {formData.notificationChannels.map((ch) => (
                      <Badge key={ch} variant="outline">
                        {notificationChannels.find((n) => n.id === ch)?.icon}{' '}
                        {notificationChannels.find((n) => n.id === ch)?.name}
                      </Badge>
                    ))}
                    {!formData.crmProvider && !formData.calendarProvider && formData.notificationChannels.length === 0 && (
                      <span className="text-sm text-muted-foreground">No integrations configured</span>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Tools ({formData.tools.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.tools.map((toolId) => (
                      <Badge key={toolId} variant="secondary" className="text-xs">
                        {availableTools.find((t) => t.id === toolId)?.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Post-Conversation Actions ({formData.endOfCallActions.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {formData.endOfCallActions.map((actionId) => (
                      <Badge key={actionId} variant="secondary" className="text-xs">
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

            {!formData.aiAgentId && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Consider assigning an AI agent to this workflow</span>
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
