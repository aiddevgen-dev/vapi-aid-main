import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Bot, Filter } from 'lucide-react';
import { AIAgentCard, AIAgent } from './AIAgentCard';
import { CreateEditAIAgent } from './CreateEditAIAgent';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Mock data for AI agents
const mockAgents: AIAgent[] = [
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
  const { toast } = useToast();

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (agent: AIAgent) => {
    setEditingAgent(agent);
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

  const handleViewAnalytics = (agent: AIAgent) => {
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
    </div>
  );
};
