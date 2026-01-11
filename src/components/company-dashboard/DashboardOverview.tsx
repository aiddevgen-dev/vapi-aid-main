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
  BookOpen,
  MessageSquare,
  Headphones,
  Building2,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Activity,
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigate: (section: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  // Mock data for demonstration
  const stats = {
    activeAIAgents: 4,
    totalCallsToday: 127,
    avgResolutionTime: '2m 34s',
    csatScore: 94,
  };

  const integrationStatus = [
    { name: 'WhatsApp', status: 'connected', icon: <MessageSquare className="h-4 w-4" /> },
    { name: 'Zendesk', status: 'connected', icon: <Headphones className="h-4 w-4" /> },
    { name: 'Salesforce', status: 'pending', icon: <Building2 className="h-4 w-4" /> },
    { name: 'Avaya', status: 'connected', icon: <Phone className="h-4 w-4" /> },
    { name: 'HubSpot', status: 'disconnected', icon: <Building2 className="h-4 w-4" /> },
    { name: 'Email', status: 'connected', icon: <Mail className="h-4 w-4" /> },
  ];

  const recentActivity = [
    { type: 'call', message: 'AI Agent "Sales Bot" completed call with +1 (555) 123-4567', time: '2 mins ago' },
    { type: 'escalation', message: 'Call escalated to human agent: John Doe', time: '5 mins ago' },
    { type: 'integration', message: 'Zendesk ticket #4521 created automatically', time: '12 mins ago' },
    { type: 'call', message: 'AI Agent "Support Bot" resolved billing inquiry', time: '18 mins ago' },
    { type: 'knowledge', message: 'Knowledge base updated: 3 new entries added', time: '1 hour ago' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Connected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'disconnected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Disconnected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

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
          <Button variant="outline" onClick={() => onNavigate('knowledge-base')} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Add Knowledge
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active AI Agents</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeAIAgents}</div>
            <p className="text-xs text-muted-foreground mt-1">Handling calls 24/7</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalCallsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">+23% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground mt-1">-18% improvement</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CSAT Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.csatScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Customer satisfaction</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Integration Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Integration Status</CardTitle>
                <CardDescription>Connected channels and services</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('integrations')} className="gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {integrationStatus.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onNavigate(integration.name.toLowerCase().replace(' ', '-'))}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      {integration.icon}
                    </div>
                    <span className="font-medium text-sm">{integration.name}</span>
                  </div>
                  {integration.status === 'connected' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : integration.status === 'pending' ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest events from your contact center</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('call-history')} className="gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    activity.type === 'call' ? 'bg-green-500/10' :
                    activity.type === 'escalation' ? 'bg-yellow-500/10' :
                    activity.type === 'integration' ? 'bg-blue-500/10' :
                    'bg-purple-500/10'
                  }`}>
                    {activity.type === 'call' ? (
                      <Phone className="h-4 w-4 text-green-600" />
                    ) : activity.type === 'escalation' ? (
                      <Activity className="h-4 w-4 text-yellow-600" />
                    ) : activity.type === 'integration' ? (
                      <Headphones className="h-4 w-4 text-blue-600" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
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
              onClick={() => onNavigate('knowledge-base')}
            >
              <BookOpen className="h-6 w-6" />
              <span>Update Knowledge</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onNavigate('call-history')}
            >
              <Phone className="h-6 w-6" />
              <span>View Call History</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
