import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Eye, EyeOff, Users, Phone, PhoneIncoming, PhoneOutgoing, BarChart3, Clock, TrendingUp, ChevronDown, ChevronUp, MessageSquare, User, Mail, Activity, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  status: string;
  user_id: string;
  created_at: string;
  email?: string;
  phone_number?: string;
  inbound_calls?: number;
  outbound_calls?: number;
  total_calls?: number;
}

interface AgentCredentials {
  email: string;
  password: string;
  name: string;
  phone: string;
}

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
  avg_duration: number;
  last_call: string | null;
  status: string;
  inbound_calls: number;
  outbound_calls: number;
  completed_calls: number;
  success_rate: number;
  calls_today: number;
}

interface RecentCall {
  id: string;
  customer_number: string;
  agent_name: string;
  duration: number;
  call_status: string;
  call_direction: string;
  created_at: string;
  started_at: string | null;
}

interface Transcript {
  id: string;
  speaker: string | null;
  text: string;
  created_at: string;
}

export const CompanyDashboard = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [newlyCreatedAgents, setNewlyCreatedAgents] = useState<AgentCredentials[]>([]);

  // Call statistics
  const [callStats, setCallStats] = useState<CallStats>({
    totalCalls: 0,
    callsToday: 0,
    avgDuration: 0,
    successRate: 0,
  });
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [callTranscripts, setCallTranscripts] = useState<Record<string, Transcript[]>>({});
  const [loadingTranscript, setLoadingTranscript] = useState<string | null>(null);
  const [callsLimit, setCallsLimit] = useState(20);
  const [hasMoreCalls, setHasMoreCalls] = useState(false);

  // Agent creation form
  const [agentName, setAgentName] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [agentPhone, setAgentPhone] = useState('');

  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not company role
    if (userProfile && userProfile.role !== 'company') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    if (user) {
      fetchCompanyData();
    }
  }, [user, userProfile]);

  const fetchCompanyData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (companyError) throw companyError;

      setCompany(companyData);

      // Fetch agents belonging to this company with call stats
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          status,
          user_id,
          created_at,
          calls(
            id,
            call_direction
          )
        `)
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;

      // Fetch user details for each agent and calculate call stats
      const agentsWithDetails = await Promise.all(
        (agentsData || []).map(async (agent) => {
          const { data: userData } = await supabase
            .from('users')
            .select('email, phone_number')
            .eq('user_id', agent.user_id)
            .single();

          const calls = agent.calls || [];
          const inboundCalls = calls.filter(c => c.call_direction === 'inbound' || !c.call_direction).length;
          const outboundCalls = calls.filter(c => c.call_direction === 'outbound').length;

          return {
            ...agent,
            email: userData?.email,
            phone_number: userData?.phone_number,
            inbound_calls: inboundCalls,
            outbound_calls: outboundCalls,
            total_calls: calls.length,
          };
        })
      );

      setAgents(agentsWithDetails);

      // Fetch call statistics
      await fetchCallStats(companyData.id);
      await fetchAgentPerformance(companyData.id);
      await fetchRecentCalls(companyData.id);
    } catch (error: any) {
      console.error('Error fetching company data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load company data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCallStats = async (companyId: string) => {
    try {
      // Get all calls for this company's agents
      const { data: calls, error } = await supabase
        .from('calls')
        .select(`
          id,
          call_status,
          started_at,
          ended_at,
          created_at,
          agents!inner(company_id)
        `)
        .eq('agents.company_id', companyId);

      if (error) throw error;

      const totalCalls = calls?.length || 0;

      // Calls today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const callsToday = calls?.filter(c => new Date(c.created_at) >= today).length || 0;

      // Average duration (for completed calls)
      const completedCalls = calls?.filter(c => c.ended_at && c.started_at) || [];
      const avgDuration = completedCalls.length > 0
        ? completedCalls.reduce((sum, call) => {
            const duration = (new Date(call.ended_at!).getTime() - new Date(call.started_at!).getTime()) / 1000;
            return sum + duration;
          }, 0) / completedCalls.length
        : 0;

      // Success rate
      const successfulCalls = calls?.filter(c => c.call_status === 'completed').length || 0;
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      setCallStats({
        totalCalls,
        callsToday,
        avgDuration: Math.round(avgDuration),
        successRate: Math.round(successRate),
      });
    } catch (error) {
      console.error('Error fetching call stats:', error);
    }
  };

  const fetchAgentPerformance = async (companyId: string) => {
    try {
      const { data: agents, error } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          status,
          calls(
            id,
            started_at,
            ended_at,
            created_at,
            call_direction,
            call_status
          )
        `)
        .eq('company_id', companyId);

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const performance = agents?.map(agent => {
        const calls = agent.calls || [];
        const completedCalls = calls.filter(c => c.ended_at && c.started_at);
        const inboundCalls = calls.filter(c => c.call_direction === 'inbound' || !c.call_direction);
        const outboundCalls = calls.filter(c => c.call_direction === 'outbound');
        const successfulCalls = calls.filter(c => c.call_status === 'completed');
        const callsToday = calls.filter(c => new Date(c.created_at) >= today);

        const avgDuration = completedCalls.length > 0
          ? completedCalls.reduce((sum, call) => {
              const duration = (new Date(call.ended_at!).getTime() - new Date(call.started_at!).getTime()) / 1000;
              return sum + duration;
            }, 0) / completedCalls.length
          : 0;

        const lastCall = calls.length > 0
          ? calls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;

        const successRate = calls.length > 0 ? (successfulCalls.length / calls.length) * 100 : 0;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          total_calls: calls.length,
          avg_duration: Math.round(avgDuration),
          last_call: lastCall,
          status: agent.status,
          inbound_calls: inboundCalls.length,
          outbound_calls: outboundCalls.length,
          completed_calls: completedCalls.length,
          success_rate: Math.round(successRate),
          calls_today: callsToday.length,
        };
      }) || [];

      setAgentPerformance(performance);
    } catch (error) {
      console.error('Error fetching agent performance:', error);
    }
  };

  const fetchRecentCalls = async (companyId: string, limit: number = 20) => {
    try {
      const { data: calls, error, count } = await supabase
        .from('calls')
        .select(`
          id,
          customer_number,
          call_status,
          call_direction,
          started_at,
          ended_at,
          created_at,
          agents!inner(
            name,
            company_id
          )
        `, { count: 'exact' })
        .eq('agents.company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const recentCallsData = calls?.map(call => {
        const duration = call.ended_at && call.started_at
          ? Math.round((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000)
          : 0;

        return {
          id: call.id,
          customer_number: call.customer_number,
          agent_name: call.agents.name,
          duration,
          call_status: call.call_status,
          call_direction: call.call_direction || 'inbound',
          created_at: call.created_at,
          started_at: call.started_at,
        };
      }) || [];

      setRecentCalls(recentCallsData);
      setHasMoreCalls((count || 0) > limit);
    } catch (error) {
      console.error('Error fetching recent calls:', error);
    }
  };

  const fetchTranscript = async (callId: string) => {
    if (callTranscripts[callId]) return;
    setLoadingTranscript(callId);
    try {
      const { data, error } = await supabase
        .from('transcripts')
        .select('id, speaker, text, created_at')
        .eq('call_id', callId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setCallTranscripts(prev => ({ ...prev, [callId]: data || [] }));
    } catch (error) {
      console.error('Error fetching transcript:', error);
    } finally {
      setLoadingTranscript(null);
    }
  };

  const toggleCallExpand = async (callId: string) => {
    if (expandedCallId === callId) {
      setExpandedCallId(null);
    } else {
      setExpandedCallId(callId);
      await fetchTranscript(callId);
    }
  };

  const loadMoreCalls = () => {
    const newLimit = callsLimit + 20;
    setCallsLimit(newLimit);
    if (company) fetchRecentCalls(company.id, newLimit);
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today ${time}`;
    if (isYesterday) return `Yesterday ${time}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`;
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (!company) {
        throw new Error('Company data not loaded');
      }

      // Call edge function to create agent (uses admin API)
      const { data, error } = await supabase.functions.invoke('create-agent', {
        body: {
          email: agentEmail,
          password: agentPassword,
          name: agentName,
          phone: agentPhone,
          companyId: company.id,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to create agent');

      // Save credentials for display
      setNewlyCreatedAgents((prev) => [
        ...prev,
        {
          email: agentEmail,
          password: agentPassword,
          name: agentName,
          phone: agentPhone,
        },
      ]);

      toast({
        title: "Agent Created!",
        description: `${agentName} has been added to your team.`,
      });

      // Reset form
      setAgentName('');
      setAgentEmail('');
      setAgentPassword('');
      setAgentPhone('');

      // Refresh agents list
      fetchCompanyData();
    } catch (error: any) {
      console.error('Error creating agent:', error);
      toast({
        title: "Failed to Create Agent",
        description: error.message || "An error occurred while creating the agent",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const togglePasswordVisibility = (index: number) => {
    setShowPassword((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (loading) {
    return (
      <div className="lyric-theme min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="lyric-theme min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-foreground">Lyric.ai</h1>
                <span className="text-xs text-muted-foreground">Admin Portal For Contact Centre</span>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <span className="text-xl font-semibold text-foreground">{company?.company_name}</span>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/auth?action=logout')} className="border-primary/50 text-foreground hover:bg-primary/20">
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
              <p className="text-xs text-muted-foreground">Active team members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Agents</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter((a) => a.status === 'online').length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{callStats.totalCalls}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{callStats.callsToday}</div>
              <p className="text-xs text-muted-foreground">Since midnight</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{callStats.avgDuration}s</div>
              <p className="text-xs text-muted-foreground">Average time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{callStats.successRate}%</div>
              <p className="text-xs text-muted-foreground">Completed calls</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="agents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agents">My Agents</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="calls">Call History</TabsTrigger>
            <TabsTrigger value="create">Create Agent</TabsTrigger>
            {newlyCreatedAgents.length > 0 && (
              <TabsTrigger value="credentials">
                Credentials ({newlyCreatedAgents.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Agents List */}
          <TabsContent value="agents">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Your Agents</h2>
                  <p className="text-muted-foreground">Manage your team of agents and view their call configurations</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {agents.length} Agent{agents.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {agents.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Agents Yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first agent to start handling calls
                    </p>
                    <Button onClick={() => document.querySelector('[value="create"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Agent
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => (
                    <Card key={agent.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              agent.status === 'online'
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{agent.name}</CardTitle>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={`h-2 w-2 rounded-full ${
                                  agent.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                                <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={agent.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                            {agent.status === 'online' ? 'Active' : 'Offline'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Contact Info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{agent.email || 'No email'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{agent.phone_number || 'No phone'}</span>
                          </div>
                        </div>

                        {/* Call Configuration Boxes */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border bg-green-500/5 border-green-500/20 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <PhoneIncoming className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700">Inbound</span>
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                              {agent.inbound_calls || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">calls handled</p>
                          </div>
                          <div className="rounded-lg border bg-blue-500/5 border-blue-500/20 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700">Outbound</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                              {agent.outbound_calls || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">calls made</p>
                          </div>
                        </div>

                        {/* Total Calls Summary */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Total Calls:</span>
                            <span className="font-semibold">{agent.total_calls || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(agent.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Agent Performance</h2>
                  <p className="text-muted-foreground">Detailed performance metrics and analytics for your team</p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                        <p className="text-3xl font-bold">{agentPerformance.filter(p => p.status === 'online').length}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Today's Calls</p>
                        <p className="text-3xl font-bold text-green-600">{agentPerformance.reduce((sum, p) => sum + p.calls_today, 0)}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Success Rate</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {agentPerformance.length > 0
                            ? Math.round(agentPerformance.reduce((sum, p) => sum + p.success_rate, 0) / agentPerformance.length)
                            : 0}%
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {agentPerformance.length > 0
                            ? formatCallDuration(Math.round(agentPerformance.reduce((sum, p) => sum + p.avg_duration, 0) / agentPerformance.length))
                            : '0s'}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Agent Performance Cards */}
              {agentPerformance.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
                    <p className="text-muted-foreground text-center">
                      Performance metrics will appear once your agents start handling calls
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {agentPerformance.map((perf) => (
                    <Card key={perf.agent_id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                          {/* Agent Info */}
                          <div className="flex items-center gap-4 lg:w-1/4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              perf.status === 'online'
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <User className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{perf.agent_name}</h3>
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${
                                  perf.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                                <span className="text-sm text-muted-foreground capitalize">{perf.status}</span>
                              </div>
                            </div>
                          </div>

                          {/* Call Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                            {/* Total Calls */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total Calls</span>
                                <Phone className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-2xl font-bold">{perf.total_calls}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-green-600">{perf.inbound_calls} in</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-blue-600">{perf.outbound_calls} out</span>
                              </div>
                            </div>

                            {/* Success Rate */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Success Rate</span>
                                {perf.success_rate >= 70 ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                              <p className="text-2xl font-bold">{perf.success_rate}%</p>
                              <Progress
                                value={perf.success_rate}
                                className="h-2"
                              />
                            </div>

                            {/* Avg Duration */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Avg Duration</span>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-2xl font-bold">{formatCallDuration(perf.avg_duration)}</p>
                              <p className="text-xs text-muted-foreground">per call</p>
                            </div>

                            {/* Today's Activity */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Today</span>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-2xl font-bold">{perf.calls_today}</p>
                              <p className="text-xs text-muted-foreground">
                                {perf.last_call ? `Last: ${formatDateTime(perf.last_call)}` : 'No calls today'}
                              </p>
                            </div>
                          </div>

                          {/* Call Direction Breakdown */}
                          <div className="lg:w-1/5">
                            <div className="flex gap-2">
                              <div className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
                                <PhoneIncoming className="h-4 w-4 text-green-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-green-600">{perf.inbound_calls}</p>
                                <p className="text-xs text-muted-foreground">Inbound</p>
                              </div>
                              <div className="flex-1 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                                <PhoneOutgoing className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-blue-600">{perf.outbound_calls}</p>
                                <p className="text-xs text-muted-foreground">Outbound</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Call History Tab */}
          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <CardTitle>Call History</CardTitle>
                <CardDescription>View all calls handled by your team with transcripts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCalls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No calls yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentCalls.map((call) => (
                        <React.Fragment key={call.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleCallExpand(call.id)}
                          >
                            <TableCell>
                              {expandedCallId === call.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {call.call_direction === 'outbound' ? (
                                  <>
                                    <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                                      Outbound
                                    </Badge>
                                  </>
                                ) : (
                                  <>
                                    <PhoneIncoming className="h-4 w-4 text-green-500" />
                                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                                      Inbound
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">{call.customer_number}</TableCell>
                            <TableCell>{call.agent_name}</TableCell>
                            <TableCell>{formatCallDuration(call.duration)}</TableCell>
                            <TableCell>
                              <Badge variant={call.call_status === 'completed' ? 'default' : 'secondary'}>
                                {call.call_status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(call.created_at)}</TableCell>
                          </TableRow>
                          {expandedCallId === call.id && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-muted/30 p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <MessageSquare className="h-4 w-4" />
                                    Call Transcript
                                  </div>
                                  {loadingTranscript === call.id ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Loading transcript...
                                    </div>
                                  ) : callTranscripts[call.id]?.length > 0 ? (
                                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border bg-background p-3">
                                      {callTranscripts[call.id].map((t) => (
                                        <div key={t.id} className={`flex gap-2 ${t.speaker === 'agent' ? 'justify-end' : ''}`}>
                                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                            t.speaker === 'agent'
                                              ? 'bg-primary text-primary-foreground'
                                              : 'bg-muted'
                                          }`}>
                                            <div className="text-xs opacity-70 mb-1">
                                              {t.speaker === 'agent' ? 'Agent' : 'Customer'}
                                            </div>
                                            {t.text}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No transcript available for this call.</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
                {hasMoreCalls && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={loadMoreCalls}>
                      Load More Calls
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Agent Form */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Agent</CardTitle>
                <CardDescription>
                  Add a new agent to your team. You'll see their credentials after creation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAgent} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="agent-name">Agent Name</Label>
                      <Input
                        id="agent-name"
                        placeholder="John Doe"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agent-email">Email</Label>
                      <Input
                        id="agent-email"
                        type="email"
                        placeholder="agent@company.com"
                        value={agentEmail}
                        onChange={(e) => setAgentEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agent-password">Password</Label>
                      <Input
                        id="agent-password"
                        type="password"
                        placeholder="Strong password"
                        value={agentPassword}
                        onChange={(e) => setAgentPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 6 characters. Save this - it won't be shown again after closing.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agent-phone">Phone Number</Label>
                      <Input
                        id="agent-phone"
                        type="tel"
                        placeholder="+17656763105"
                        value={agentPhone}
                        onChange={(e) => setAgentPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={creating} className="w-full">
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Agent...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Agent
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Credentials */}
          {newlyCreatedAgents.length > 0 && (
            <TabsContent value="credentials">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Credentials</CardTitle>
                  <CardDescription>
                    Share these credentials with your agents. Save them now - passwords won't be
                    shown again after you close this page.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {newlyCreatedAgents.map((cred, index) => (
                      <Card key={index} className="bg-muted/50">
                        <CardContent className="pt-6">
                          <div className="grid gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Name</Label>
                              <p className="font-medium">{cred.name}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Email</Label>
                              <p className="font-medium">{cred.email}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Password</Label>
                              <div className="flex items-center gap-2">
                                <p className="font-mono font-medium">
                                  {showPassword[index] ? cred.password : '••••••••'}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePasswordVisibility(index)}
                                >
                                  {showPassword[index] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Phone</Label>
                              <p className="font-medium">{cred.phone}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
