import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Bot, Filter, Phone, Mic, Wrench, CheckCircle, ExternalLink, Copy, Eye, BarChart3 } from 'lucide-react';
import { AIAgentCard, AIAgent } from './AIAgentCard';
import { CreateEditAIAgent } from './CreateEditAIAgent';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Sara AI - Pink Mobile VAPI Configuration
const SARA_AI_CONFIG = {
  assistantId: '805978f7-ce8b-44f5-9147-16a90280022b',
  phoneNumberId: 'b0220ebf-bc0e-46cb-bcf5-9b3bd45e6a23',
  phoneNumber: '+1 (929) 505-4089',
  voiceProvider: 'Vapi',
  voice: 'jennifer-playht',
  model: 'gpt-4o-mini',
  firstMessage: "Hello! This is Sara from Pink Mobile. How can I assist you today?",
  systemPrompt: `You are Sara, a friendly and professional AI assistant for Pink Mobile, a telecommunications company. Your role is to help customers with:

1. **Account inquiries** - Check account status, balance, usage
2. **Plan information** - Explain mobile plans, pricing, features
3. **Technical support** - Troubleshoot device and network issues
4. **Billing questions** - Payment options, bill explanations
5. **Service changes** - Upgrades, downgrades, add-ons

Guidelines:
- Be warm, helpful, and concise
- Confirm customer identity before discussing account details
- If you cannot resolve an issue, offer to transfer to a human agent
- Always thank the customer for their patience
- Use natural conversational language

Remember: You represent Pink Mobile - maintain professionalism while being approachable.`,
  tools: [
    {
      name: 'transferToHuman',
      description: 'Transfer the call to a human agent when the customer requests or the issue is complex',
      parameters: { reason: 'string' }
    },
    {
      name: 'checkAccountStatus',
      description: 'Look up customer account information and current status',
      parameters: { phoneNumber: 'string' }
    },
    {
      name: 'getUsageDetails',
      description: 'Get data, minutes, and SMS usage for the billing period',
      parameters: { phoneNumber: 'string' }
    },
    {
      name: 'getPlanDetails',
      description: 'Get information about available mobile plans',
      parameters: { planType: 'string' }
    },
    {
      name: 'createSupportTicket',
      description: 'Create a support ticket for follow-up',
      parameters: { issue: 'string', priority: 'string' }
    },
    {
      name: 'sendSMS',
      description: 'Send an SMS confirmation or information to the customer',
      parameters: { message: 'string', phoneNumber: 'string' }
    }
  ],
  endCallPhrases: [
    "Thank you for calling Pink Mobile. Have a great day!",
    "Is there anything else I can help you with before we end the call?"
  ]
};

// Mock data for AI agents (keep existing + add Sara AI)
const mockAgents: AIAgent[] = [
  {
    id: 'sara-ai-pink-mobile',
    name: 'Sara AI - Pink Mobile',
    description: 'Live VAPI AI assistant for Pink Mobile customer support and sales',
    avatar: 'sara',
    status: 'active',
    phoneNumber: '+1 (929) 505-4089',
    voiceProvider: 'Vapi (jennifer-playht)',
    totalCalls: 0, // Will be updated from DB
    inboundCalls: 0,
    outboundCalls: 0,
    successRate: 98,
    createdAt: '2024-12-01',
  },
  {
    id: '1',
    name: 'Sales Assistant',
    description: 'Handles inbound sales inquiries and product questions',
    avatar: 'sales',
    status: 'active',
    phoneNumber: '+1 (555) 100-0001',
    voiceProvider: 'ElevenLabs',
    totalCalls: 1234,
    inboundCalls: 892,
    outboundCalls: 342,
    successRate: 94,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Support Bot',
    description: 'Customer support and troubleshooting assistance',
    avatar: 'support',
    status: 'active',
    phoneNumber: '+1 (555) 100-0002',
    voiceProvider: 'OpenAI',
    totalCalls: 2567,
    inboundCalls: 2100,
    outboundCalls: 467,
    successRate: 89,
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    name: 'Appointment Scheduler',
    description: 'Books and manages customer appointments',
    avatar: 'scheduler',
    status: 'active',
    phoneNumber: '+1 (555) 100-0003',
    voiceProvider: 'Azure',
    totalCalls: 756,
    inboundCalls: 450,
    outboundCalls: 306,
    successRate: 97,
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Billing Assistant',
    description: 'Handles billing inquiries and payment processing',
    avatar: 'billing',
    status: 'inactive',
    phoneNumber: '+1 (555) 100-0004',
    voiceProvider: 'ElevenLabs',
    totalCalls: 432,
    inboundCalls: 400,
    outboundCalls: 32,
    successRate: 91,
    createdAt: '2024-02-15',
  },
];

export const AIAgentsList: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>(mockAgents);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<AIAgent | null>(null);
  const [viewingSaraAI, setViewingSaraAI] = useState(false);
  const [viewingSaraAnalytics, setViewingSaraAnalytics] = useState(false);
  const [saraAnalytics, setSaraAnalytics] = useState<{
    totalCalls: number;
    inboundCalls: number;
    outboundCalls: number;
    completedCalls: number;
    avgDuration: number;
    successRate: number;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch real call stats for Sara AI from database
  useEffect(() => {
    const fetchSaraAIStats = async () => {
      try {
        const { data: calls, error } = await supabase
          .from('calls')
          .select('id, call_direction, call_status')
          .order('created_at', { ascending: false });

        if (!error && calls) {
          const inbound = calls.filter(c => c.call_direction === 'inbound').length;
          const outbound = calls.filter(c => c.call_direction === 'outbound').length;
          const completed = calls.filter(c => c.call_status === 'completed').length;
          const successRate = calls.length > 0 ? Math.round((completed / calls.length) * 100) : 98;

          setAgents(prev => prev.map(agent =>
            agent.id === 'sara-ai-pink-mobile'
              ? {
                  ...agent,
                  totalCalls: calls.length,
                  inboundCalls: inbound,
                  outboundCalls: outbound,
                  successRate
                }
              : agent
          ));
        }
      } catch (err) {
        console.error('Error fetching Sara AI stats:', err);
      }
    };

    fetchSaraAIStats();
  }, []);

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (agent: AIAgent) => {
    // For Sara AI, show the detail modal instead of edit
    if (agent.id === 'sara-ai-pink-mobile') {
      setViewingSaraAI(true);
      return;
    }
    setEditingAgent(agent);
  };

  const handleViewDetails = (agent: AIAgent) => {
    if (agent.id === 'sara-ai-pink-mobile') {
      setViewingSaraAI(true);
    } else {
      toast({
        title: 'Agent Details',
        description: `Viewing details for ${agent.name}`,
      });
    }
  };

  const handleDelete = (agent: AIAgent) => {
    setDeletingAgent(agent);
  };

  const confirmDelete = () => {
    if (deletingAgent) {
      setAgents(agents.filter((a) => a.id !== deletingAgent.id));
      toast({
        title: 'Agent Deleted',
        description: `${deletingAgent.name} has been removed.`,
      });
      setDeletingAgent(null);
    }
  };

  const handleDuplicate = (agent: AIAgent) => {
    const newAgent: AIAgent = {
      ...agent,
      id: Date.now().toString(),
      name: `${agent.name} (Copy)`,
      status: 'inactive',
      totalCalls: 0,
      inboundCalls: 0,
      outboundCalls: 0,
    };
    setAgents([...agents, newAgent]);
    toast({
      title: 'Agent Duplicated',
      description: `${newAgent.name} has been created.`,
    });
  };

  const handleToggleStatus = (agent: AIAgent) => {
    setAgents(agents.map((a) =>
      a.id === agent.id
        ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' }
        : a
    ));
    toast({
      title: agent.status === 'active' ? 'Agent Deactivated' : 'Agent Activated',
      description: `${agent.name} is now ${agent.status === 'active' ? 'inactive' : 'active'}.`,
    });
  };

  const handleViewAnalytics = async (agent: AIAgent) => {
    // For Sara AI, fetch and show real analytics
    if (agent.id === 'sara-ai-pink-mobile') {
      try {
        const { data: calls, error } = await supabase
          .from('calls')
          .select('id, call_direction, call_status, duration, started_at, ended_at')
          .order('created_at', { ascending: false });

        if (!error && calls) {
          const inbound = calls.filter(c => c.call_direction === 'inbound').length;
          const outbound = calls.filter(c => c.call_direction === 'outbound').length;
          const completed = calls.filter(c => c.call_status === 'completed').length;

          // Calculate average duration
          const callsWithDuration = calls.filter(c => c.duration && c.duration > 0);
          const avgDuration = callsWithDuration.length > 0
            ? Math.round(callsWithDuration.reduce((sum, c) => sum + (c.duration || 0), 0) / callsWithDuration.length)
            : 0;

          const successRate = calls.length > 0 ? Math.round((completed / calls.length) * 100) : 0;

          setSaraAnalytics({
            totalCalls: calls.length,
            inboundCalls: inbound,
            outboundCalls: outbound,
            completedCalls: completed,
            avgDuration,
            successRate
          });
          setViewingSaraAnalytics(true);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        toast({
          title: 'Error',
          description: 'Failed to load analytics',
          variant: 'destructive'
        });
      }
      return;
    }

    toast({
      title: 'Analytics',
      description: `Viewing analytics for ${agent.name}`,
    });
  };

  const handleSaveAgent = (agentData: Partial<AIAgent>) => {
    if (editingAgent) {
      // Update existing agent
      setAgents(agents.map((a) =>
        a.id === editingAgent.id ? { ...a, ...agentData } : a
      ));
      toast({
        title: 'Agent Updated',
        description: `${agentData.name} has been updated.`,
      });
      setEditingAgent(null);
    } else {
      // Create new agent
      const newAgent: AIAgent = {
        id: Date.now().toString(),
        name: agentData.name || 'New Agent',
        description: agentData.description || '',
        avatar: 'new',
        status: 'inactive',
        phoneNumber: agentData.phoneNumber || '+1 (555) 000-0000',
        voiceProvider: agentData.voiceProvider || 'ElevenLabs',
        totalCalls: 0,
        inboundCalls: 0,
        outboundCalls: 0,
        successRate: 0,
        createdAt: new Date().toISOString(),
      };
      setAgents([...agents, newAgent]);
      toast({
        title: 'Agent Created',
        description: `${newAgent.name} has been created.`,
      });
      setIsCreateOpen(false);
    }
  };

  const activeCount = agents.filter((a) => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Agents</h1>
          <p className="text-muted-foreground">Create and manage your AI-powered agents</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create AI Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm py-1 px-3">
          {agents.length} Total Agents
        </Badge>
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 py-1 px-3">
          {activeCount} Active
        </Badge>
        <Badge variant="secondary" className="py-1 px-3">
          {agents.length - activeCount} Inactive
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agent Cards Grid */}
      {filteredAgents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No AI Agents Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first AI agent to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create AI Agent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AIAgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
              onViewAnalytics={handleViewAnalytics}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(isCreateOpen || editingAgent) && (
        <CreateEditAIAgent
          agent={editingAgent}
          isOpen={isCreateOpen || !!editingAgent}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingAgent(null);
          }}
          onSave={handleSaveAgent}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAgent} onOpenChange={() => setDeletingAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAgent?.name}"? This action cannot be undone.
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

      {/* Sara AI Detail Modal */}
      <Dialog open={viewingSaraAI} onOpenChange={setViewingSaraAI}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-pink-500/30 bg-gradient-to-br from-background via-background to-pink-500/5">
          <DialogHeader className="border-b border-pink-500/20 pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-foreground">Sara AI - Pink Mobile</span>
                <Badge className="ml-2 bg-green-500/10 text-green-600 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Live VAPI-powered AI assistant handling Pink Mobile customer calls
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 bg-pink-500/10 border border-pink-500/20">
              <TabsTrigger value="overview" className="gap-1 text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <Eye className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="prompt" className="gap-1 text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <Bot className="h-4 w-4" />
                System Prompt
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-1 text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <Wrench className="h-4 w-4" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-1 text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <Phone className="h-4 w-4" />
                Config
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-pink-500" />
                      Phone Number
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-mono font-bold">{SARA_AI_CONFIG.phoneNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">Inbound & Outbound enabled</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mic className="h-4 w-4 text-purple-500" />
                      Voice
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{SARA_AI_CONFIG.voice}</p>
                    <p className="text-xs text-muted-foreground mt-1">Provider: {SARA_AI_CONFIG.voiceProvider}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-500" />
                      Model
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{SARA_AI_CONFIG.model}</p>
                    <p className="text-xs text-muted-foreground mt-1">OpenAI GPT-4o Mini</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-orange-500" />
                      Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold">{SARA_AI_CONFIG.tools.length} Functions</p>
                    <p className="text-xs text-muted-foreground mt-1">Available during calls</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">First Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg italic">"{SARA_AI_CONFIG.firstMessage}"</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">VAPI IDs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-xs text-muted-foreground">Assistant ID</span>
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded">{SARA_AI_CONFIG.assistantId}</code>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-xs text-muted-foreground">Phone Number ID</span>
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded">{SARA_AI_CONFIG.phoneNumberId}</code>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Prompt Tab */}
            <TabsContent value="prompt" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>System Prompt</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(SARA_AI_CONFIG.systemPrompt);
                        toast({ title: 'Copied!', description: 'System prompt copied to clipboard' });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-lg">
                      {SARA_AI_CONFIG.systemPrompt}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">End Call Phrases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {SARA_AI_CONFIG.endCallPhrases.map((phrase, i) => (
                      <div key={i} className="p-2 bg-muted/50 rounded text-sm italic">
                        "{phrase}"
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-4 mt-4">
              <div className="grid gap-3">
                {SARA_AI_CONFIG.tools.map((tool, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <Wrench className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{tool.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(tool.parameters).map(([key, type]) => (
                              <Badge key={key} variant="outline" className="text-[10px]">
                                {key}: {String(type)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Config Tab */}
            <TabsContent value="config" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">VAPI Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[350px]">
                    <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto">
{JSON.stringify({
  assistantId: SARA_AI_CONFIG.assistantId,
  phoneNumberId: SARA_AI_CONFIG.phoneNumberId,
  model: SARA_AI_CONFIG.model,
  voice: SARA_AI_CONFIG.voice,
  voiceProvider: SARA_AI_CONFIG.voiceProvider,
  firstMessage: SARA_AI_CONFIG.firstMessage,
  tools: SARA_AI_CONFIG.tools.map(t => t.name),
  endCallPhrases: SARA_AI_CONFIG.endCallPhrases
}, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.open('https://dashboard.vapi.ai', '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open VAPI Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(SARA_AI_CONFIG, null, 2));
                    toast({ title: 'Copied!', description: 'Full config copied to clipboard' });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Config
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-pink-500/20">
            <Button
              variant="outline"
              onClick={() => setViewingSaraAI(false)}
              className="border-pink-500/30 hover:bg-pink-500/10"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sara AI Analytics Modal */}
      <Dialog open={viewingSaraAnalytics} onOpenChange={setViewingSaraAnalytics}>
        <DialogContent className="max-w-2xl border-2 border-pink-500/30 bg-gradient-to-br from-background via-background to-pink-500/5">
          <DialogHeader className="border-b border-pink-500/20 pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-foreground">Sara AI Analytics</span>
                <Badge className="ml-2 bg-pink-500/10 text-pink-600 border-pink-500/30">
                  Real-time
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Live call statistics for Sara AI - Pink Mobile
            </DialogDescription>
          </DialogHeader>

          {saraAnalytics && (
            <div className="space-y-4 mt-4">
              {/* Main Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="border-pink-500/20 bg-pink-500/5">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-pink-500">{saraAnalytics.totalCalls}</div>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                  </CardContent>
                </Card>
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-500">{saraAnalytics.completedCalls}</div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-500">{saraAnalytics.successRate}%</div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Call Direction Breakdown */}
              <Card className="border-pink-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Call Direction Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Inbound Calls</span>
                    </div>
                    <span className="font-bold text-green-500">{saraAnalytics.inboundCalls}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${saraAnalytics.totalCalls > 0 ? (saraAnalytics.inboundCalls / saraAnalytics.totalCalls) * 100 : 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">Outbound Calls</span>
                    </div>
                    <span className="font-bold text-blue-500">{saraAnalytics.outboundCalls}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${saraAnalytics.totalCalls > 0 ? (saraAnalytics.outboundCalls / saraAnalytics.totalCalls) * 100 : 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Average Duration */}
              <Card className="border-pink-500/20">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Average Call Duration</p>
                    <p className="text-xl font-bold text-foreground">
                      {Math.floor(saraAnalytics.avgDuration / 60)}m {saraAnalytics.avgDuration % 60}s
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-pink-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-pink-500/20">
            <Button
              variant="outline"
              onClick={() => navigate('/pink-mobile')}
              className="border-pink-500/30 hover:bg-pink-500/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => setViewingSaraAnalytics(false)}
              className="border-pink-500/30 hover:bg-pink-500/10"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
