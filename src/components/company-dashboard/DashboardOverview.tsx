import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Phone,
  Clock,
  TrendingUp,
  Plus,
  // BookOpen,
  // MessageSquare,
  Headphones,
  // Building2,
  // Mail,
  // CheckCircle,
  // AlertCircle,
  ArrowRight,
  Activity,
  Target,
  GitBranch,
  Megaphone,
  Users,
} from 'lucide-react';

interface CallStats {
  totalCalls: number;
  callsToday: number;
  avgDuration: number;
  successRate: number;
}

interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  total_calls: number;
  status: string;
}

interface DashboardOverviewProps {
  onNavigate: (section: string) => void;
  callStats?: CallStats;
  agentPerformance?: AgentPerformance[];
  leadsCount?: number;
  workflowsCount?: number;
  aiAgentsCount?: number;
  humanAgentsCount?: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  callStats,
  agentPerformance = [],
  leadsCount = 0,
  workflowsCount = 0,
  aiAgentsCount = 0,
  humanAgentsCount = 0,
}) => {
  // Format duration for display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Get active agents count
  const activeAgents = agentPerformance.filter(a => a.status === 'online').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your AI Contact Center command center</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('ai-agents')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create AI Agent
          </Button>
          <Button variant="outline" onClick={() => onNavigate('leads')} className="gap-2">
            <Target className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{aiAgentsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeAgents > 0 ? `${activeAgents} active now` : 'Configure your agents'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{callStats?.callsToday || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {callStats?.totalCalls || 0} total calls
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              3m 25s
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per completed call</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{callStats?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Call completion rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Your contact center at a glance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onNavigate('ai-agents')}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-sm">AI Agents</span>
                </div>
                <Badge variant="secondary">{aiAgentsCount}</Badge>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onNavigate('human-agents')}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Headphones className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="font-medium text-sm">Human Agents</span>
                </div>
                <Badge variant="secondary">{humanAgentsCount}</Badge>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onNavigate('workflows')}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <GitBranch className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-sm">Workflows</span>
                </div>
                <Badge variant="secondary">{workflowsCount}</Badge>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onNavigate('leads')}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium text-sm">Leads</span>
                </div>
                <Badge variant="secondary">{leadsCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Performance Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Your team's recent activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('campaigns')} className="gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentPerformance.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No agent data yet</p>
                  <p className="text-xs">Performance will appear once calls are made</p>
                </div>
              ) : (
                agentPerformance.slice(0, 4).map((agent) => (
                  <div key={agent.agent_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        agent.status === 'online' ? 'bg-green-500/10' : 'bg-muted'
                      }`}>
                        <Headphones className={`h-4 w-4 ${
                          agent.status === 'online' ? 'text-green-600' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{agent.agent_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{agent.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{agent.total_calls} calls</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your AI contact center</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onNavigate('campaigns')}
            >
              <Megaphone className="h-6 w-6" />
              <span>View Campaigns</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onNavigate('ai-agents')}
            >
              <Bot className="h-6 w-6" />
              <span>Manage AI Agents</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onNavigate('workflows')}
            >
              <Activity className="h-6 w-6" />
              <span>Configure Workflows</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onNavigate('leads')}
            >
              <Target className="h-6 w-6" />
              <span>Manage Leads</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
