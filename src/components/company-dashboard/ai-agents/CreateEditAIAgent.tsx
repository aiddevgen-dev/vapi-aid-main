import React, { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  Phone,
  Mic,
  Wrench,
  PhoneOff,
  BookOpen,
  Volume2,
  Plus,
  Play,
  Plug,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Headphones,
  Building2,
  Mail,
} from 'lucide-react';
import { AIAgent } from './AIAgentCard';

interface CreateEditAIAgentProps {
  agent: AIAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Partial<AIAgent>) => void;
}

const availablePhoneNumbers = [
  { number: '+1 (555) 100-0001', label: 'Sales Line' },
  { number: '+1 (555) 100-0002', label: 'Support Line' },
  { number: '+1 (555) 100-0003', label: 'General' },
  { number: '+1 (555) 100-0004', label: 'Billing' },
  { number: '+1 (555) 100-0005', label: 'New Number' },
];

const voiceProviders = [
  { id: 'elevenlabs', name: 'ElevenLabs', voices: ['Rachel', 'Josh', 'Emily', 'Sam', 'Arnold'] },
  { id: 'openai', name: 'OpenAI', voices: ['Alloy', 'Echo', 'Fable', 'Onyx', 'Nova', 'Shimmer'] },
  { id: 'azure', name: 'Azure', voices: ['Jenny', 'Guy', 'Aria', 'Davis'] },
];

const availableTools = [
  { id: 'transfer', name: 'Transfer to Human', description: 'Hand off call to human agent' },
  { id: 'order-status', name: 'Check Order Status', description: 'Look up customer order information' },
  { id: 'appointment', name: 'Schedule Appointment', description: 'Book appointments in calendar' },
  { id: 'refund', name: 'Process Refund', description: 'Initiate refund requests' },
  { id: 'send-email', name: 'Send Email', description: 'Send confirmation or follow-up emails' },
  { id: 'create-ticket', name: 'Create Support Ticket', description: 'Create tickets in helpdesk' },
  { id: 'crm-update', name: 'Update CRM', description: 'Update customer records in CRM' },
  { id: 'send-sms', name: 'Send SMS', description: 'Send text messages to customers' },
];

const endOfCallActions = [
  { id: 'summary-crm', name: 'Send Call Summary to CRM', description: 'Automatically log call details' },
  { id: 'zendesk-ticket', name: 'Create Zendesk Ticket', description: 'Create ticket for follow-up' },
  { id: 'followup-email', name: 'Send Follow-up Email', description: 'Email call summary to customer' },
  { id: 'update-lead', name: 'Update Lead Status', description: 'Update lead in pipeline' },
  { id: 'webhook', name: 'Trigger Webhook', description: 'Send data to external system' },
  { id: 'survey', name: 'Send Customer Survey', description: 'Request CSAT feedback' },
];

const knowledgeCollections = [
  { id: 'products', name: 'Product Knowledge', entries: 45 },
  { id: 'faq', name: 'FAQ & Common Questions', entries: 120 },
  { id: 'policies', name: 'Company Policies', entries: 32 },
  { id: 'troubleshooting', name: 'Troubleshooting Guides', entries: 78 },
  { id: 'pricing', name: 'Pricing & Plans', entries: 15 },
];

const availableIntegrations = [
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Create tickets, sync customer data',
    icon: Headphones,
    status: 'connected' as const,
    category: 'Helpdesk',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Log calls, update contacts & leads',
    icon: Building2,
    status: 'connected' as const,
    category: 'CRM',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, log activities',
    icon: Building2,
    status: 'connected' as const,
    category: 'CRM',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Send follow-up messages',
    icon: MessageSquare,
    status: 'connected' as const,
    category: 'Messaging',
  },
  {
    id: 'email',
    name: 'Email (SendGrid)',
    description: 'Send emails and notifications',
    icon: Mail,
    status: 'connected' as const,
    category: 'Communication',
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Sync leads and call logs',
    icon: Building2,
    status: 'disconnected' as const,
    category: 'CRM',
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Update deals and activities',
    icon: Building2,
    status: 'disconnected' as const,
    category: 'CRM',
  },
];

export const CreateEditAIAgent: React.FC<CreateEditAIAgentProps> = ({
  agent,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    description: agent?.description || '',
    status: agent?.status || 'inactive',
    phoneNumber: agent?.phoneNumber || '',
    voiceProvider: agent?.voiceProvider || 'ElevenLabs',
    voiceId: 'Rachel',
    personalityFriendly: 70,
    personalityProfessional: 80,
    firstMessage: 'Hello! Thank you for calling. How can I assist you today?',
    systemPrompt: `You are a helpful AI assistant for our company.
Your role is to assist customers with their inquiries professionally and efficiently.
Always be polite, clear, and helpful.
If you cannot resolve an issue, offer to transfer to a human agent.`,
    selectedTools: ['transfer', 'order-status'] as string[],
    endOfCallActions: ['summary-crm'] as string[],
    knowledgeBases: ['products', 'faq'] as string[],
    selectedIntegrations: ['zendesk', 'salesforce', 'email'] as string[],
  });

  const handleSave = () => {
    onSave({
      name: formData.name,
      description: formData.description,
      status: formData.status as 'active' | 'inactive',
      phoneNumber: formData.phoneNumber,
      voiceProvider: formData.voiceProvider,
    });
  };

  const toggleTool = (toolId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTools: prev.selectedTools.includes(toolId)
        ? prev.selectedTools.filter((t) => t !== toolId)
        : [...prev.selectedTools, toolId],
    }));
  };

  const toggleEndOfCallAction = (actionId: string) => {
    setFormData((prev) => ({
      ...prev,
      endOfCallActions: prev.endOfCallActions.includes(actionId)
        ? prev.endOfCallActions.filter((a) => a !== actionId)
        : [...prev.endOfCallActions, actionId],
    }));
  };

  const toggleKnowledgeBase = (kbId: string) => {
    setFormData((prev) => ({
      ...prev,
      knowledgeBases: prev.knowledgeBases.includes(kbId)
        ? prev.knowledgeBases.filter((k) => k !== kbId)
        : [...prev.knowledgeBases, kbId],
    }));
  };

  const toggleIntegration = (integrationId: string) => {
    const integration = availableIntegrations.find((i) => i.id === integrationId);
    if (integration?.status === 'disconnected') return; // Can't select disconnected integrations

    setFormData((prev) => ({
      ...prev,
      selectedIntegrations: prev.selectedIntegrations.includes(integrationId)
        ? prev.selectedIntegrations.filter((i) => i !== integrationId)
        : [...prev.selectedIntegrations, integrationId],
    }));
  };

  const selectedProvider = voiceProviders.find((p) => p.name === formData.voiceProvider);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {agent ? 'Edit AI Agent' : 'Create AI Agent'}
          </DialogTitle>
          <DialogDescription>
            Configure your AI agent's behavior, voice, and capabilities.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic" className="gap-1 text-xs">
              <Bot className="h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-1 text-xs">
              <Mic className="h-4 w-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1 text-xs">
              <Plug className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-1 text-xs">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="endcall" className="gap-1 text-xs">
              <PhoneOff className="h-4 w-4" />
              End Call
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-1 text-xs">
              <BookOpen className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Sales Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Select
                  value={formData.phoneNumber}
                  onValueChange={(value) => setFormData({ ...formData, phoneNumber: value })}
                >
                  <SelectTrigger>
                    <Phone className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePhoneNumbers.map((phone) => (
                      <SelectItem key={phone.number} value={phone.number}>
                        {phone.number} ({phone.label})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this agent does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label>Agent Status</Label>
                <p className="text-sm text-muted-foreground">Enable to start handling calls</p>
              </div>
              <Switch
                checked={formData.status === 'active'}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstMessage">First Message</Label>
              <Textarea
                id="firstMessage"
                placeholder="The first thing the agent says when answering..."
                value={formData.firstMessage}
                onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="Instructions for how the agent should behave..."
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Voice Provider</Label>
                <Select
                  value={formData.voiceProvider}
                  onValueChange={(value) => setFormData({ ...formData, voiceProvider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.name}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select
                  value={formData.voiceId}
                  onValueChange={(value) => setFormData({ ...formData, voiceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider?.voices.map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Voice Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Play className="h-4 w-4" />
                    Play Sample
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Preview how "{formData.voiceId}" sounds with your first message
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Personality Traits</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Friendliness</span>
                      <span>{formData.personalityFriendly}%</span>
                    </div>
                    <Slider
                      value={[formData.personalityFriendly]}
                      onValueChange={([value]) =>
                        setFormData({ ...formData, personalityFriendly: value })
                      }
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Professionalism</span>
                      <span>{formData.personalityProfessional}%</span>
                    </div>
                    <Slider
                      value={[formData.personalityProfessional]}
                      onValueChange={([value]) =>
                        setFormData({ ...formData, personalityProfessional: value })
                      }
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Connected Integrations</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select which integrations this AI agent can use for CRM updates, ticket creation, and notifications
              </p>

              {/* Connected Integrations */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Available to Connect</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {availableIntegrations.filter(i => i.status === 'connected').map((integration) => {
                    const IconComponent = integration.icon;
                    return (
                      <div
                        key={integration.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          formData.selectedIntegrations.includes(integration.id)
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleIntegration(integration.id)}
                      >
                        <Checkbox
                          checked={formData.selectedIntegrations.includes(integration.id)}
                          onCheckedChange={() => toggleIntegration(integration.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-primary" />
                            <p className="font-medium text-sm">{integration.name}</p>
                            <Badge className="bg-green-500/10 text-green-500 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                          <Badge variant="outline" className="text-xs mt-2">{integration.category}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disconnected Integrations */}
              <div className="space-y-4 mt-6">
                <h4 className="text-sm font-medium text-muted-foreground">Not Connected</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {availableIntegrations.filter(i => i.status === 'disconnected').map((integration) => {
                    const IconComponent = integration.icon;
                    return (
                      <div
                        key={integration.id}
                        className="flex items-start gap-3 p-4 rounded-lg border opacity-60"
                      >
                        <Checkbox disabled checked={false} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">{integration.name}</p>
                            <Badge className="bg-muted text-muted-foreground text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Not Connected
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                          <Badge variant="outline" className="text-xs mt-2">{integration.category}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect these integrations in the <span className="text-primary font-medium">Integrations</span> section to use them with this agent.
                </p>
              </div>

              {/* Integration Actions Summary */}
              {formData.selectedIntegrations.length > 0 && (
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">What this agent can do with integrations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {formData.selectedIntegrations.includes('zendesk') && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Create support tickets in Zendesk after calls
                        </li>
                      )}
                      {formData.selectedIntegrations.includes('salesforce') && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Log call summaries and update contacts in Salesforce
                        </li>
                      )}
                      {formData.selectedIntegrations.includes('hubspot') && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Sync call activities and update deals in HubSpot
                        </li>
                      )}
                      {formData.selectedIntegrations.includes('email') && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Send follow-up emails and notifications
                        </li>
                      )}
                      {formData.selectedIntegrations.includes('whatsapp') && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Send WhatsApp messages for follow-ups
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Available Tools</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the tools this AI agent can use during calls
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {availableTools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.selectedTools.includes(tool.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleTool(tool.id)}
                  >
                    <Checkbox
                      checked={formData.selectedTools.includes(tool.id)}
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

            <div className="p-4 rounded-lg border border-dashed">
              <Button variant="outline" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add Custom Function
              </Button>
            </div>
          </TabsContent>

          {/* End of Call Tab */}
          <TabsContent value="endcall" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-medium mb-2">End of Call Actions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure what happens automatically after each call ends
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
                    onClick={() => toggleEndOfCallAction(action.id)}
                  >
                    <Checkbox
                      checked={formData.endOfCallActions.includes(action.id)}
                      onCheckedChange={() => toggleEndOfCallAction(action.id)}
                    />
                    <div>
                      <p className="font-medium text-sm">{action.name}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Webhook Configuration</CardTitle>
                <CardDescription>Send call data to your systems</CardDescription>
              </CardHeader>
              <CardContent>
                <Input placeholder="https://your-api.com/webhook/calls" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Knowledge Base Collections</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select knowledge collections this agent can access during calls
              </p>
              <div className="grid gap-3">
                {knowledgeCollections.map((kb) => (
                  <div
                    key={kb.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.knowledgeBases.includes(kb.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleKnowledgeBase(kb.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={formData.knowledgeBases.includes(kb.id)}
                        onCheckedChange={() => toggleKnowledgeBase(kb.id)}
                      />
                      <div>
                        <p className="font-medium">{kb.name}</p>
                        <p className="text-sm text-muted-foreground">{kb.entries} entries</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{kb.entries}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {agent ? 'Save Changes' : 'Create Agent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
