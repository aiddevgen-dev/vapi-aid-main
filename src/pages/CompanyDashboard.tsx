import { useState, useEffect } from 'react';
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
import { Loader2, Plus, Eye, EyeOff, Users, Phone, BarChart3, Clock, TrendingUp } from 'lucide-react';
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
}

interface RecentCall {
  id: string;
  customer_number: string;
  agent_name: string;
  duration: number;
  call_status: string;
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

      // Fetch agents belonging to this company
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          status,
          user_id,
          created_at
        `)
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;

      // Fetch user details for each agent
      const agentsWithDetails = await Promise.all(
        (agentsData || []).map(async (agent) => {
          const { data: userData } = await supabase
            .from('users')
            .select('email, phone_number')
            .eq('user_id', agent.user_id)
            .single();

          return {
            ...agent,
            email: userData?.email,
            phone_number: userData?.phone_number,
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
            created_at
          )
        `)
        .eq('company_id', companyId);

      if (error) throw error;

      const performance = agents?.map(agent => {
        const calls = agent.calls || [];
        const completedCalls = calls.filter(c => c.ended_at && c.started_at);

        const avgDuration = completedCalls.length > 0
          ? completedCalls.reduce((sum, call) => {
              const duration = (new Date(call.ended_at!).getTime() - new Date(call.started_at!).getTime()) / 1000;
              return sum + duration;
            }, 0) / completedCalls.length
          : 0;

        const lastCall = calls.length > 0
          ? calls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          total_calls: calls.length,
          avg_duration: Math.round(avgDuration),
          last_call: lastCall,
          status: agent.status,
        };
      }) || [];

      setAgentPerformance(performance);
    } catch (error) {
      console.error('Error fetching agent performance:', error);
    }
  };

  const fetchRecentCalls = async (companyId: string) => {
    try {
      const { data: calls, error } = await supabase
        .from('calls')
        .select(`
          id,
          customer_number,
          call_status,
          started_at,
          ended_at,
          created_at,
          agents!inner(
            name,
            company_id
          )
        `)
        .eq('agents.company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(10);

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
          created_at: call.created_at,
        };
      }) || [];

      setRecentCalls(recentCallsData);
    } catch (error) {
      console.error('Error fetching recent calls:', error);
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{company?.company_name}</h1>
            <p className="text-muted-foreground">Company Dashboard</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/auth?action=logout')}>
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
            <Card>
              <CardHeader>
                <CardTitle>Your Agents</CardTitle>
                <CardDescription>Manage your team of agents</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No agents yet. Create your first agent to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      agents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell className="font-medium">{agent.name}</TableCell>
                          <TableCell>{agent.email || 'N/A'}</TableCell>
                          <TableCell>{agent.phone_number || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={agent.status === 'online' ? 'default' : 'secondary'}>
                              {agent.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(agent.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>View performance metrics for each agent</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Total Calls</TableHead>
                      <TableHead>Avg Duration</TableHead>
                      <TableHead>Last Call</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No performance data yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      agentPerformance.map((perf) => (
                        <TableRow key={perf.agent_id}>
                          <TableCell className="font-medium">{perf.agent_name}</TableCell>
                          <TableCell>{perf.total_calls}</TableCell>
                          <TableCell>{perf.avg_duration}s</TableCell>
                          <TableCell>
                            {perf.last_call ? new Date(perf.last_call).toLocaleString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={perf.status === 'online' ? 'default' : 'secondary'}>
                              {perf.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call History Tab */}
          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
                <CardDescription>View the last 10 calls handled by your team</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
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
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No calls yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentCalls.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell className="font-medium">{call.customer_number}</TableCell>
                          <TableCell>{call.agent_name}</TableCell>
                          <TableCell>{call.duration}s</TableCell>
                          <TableCell>
                            <Badge variant={call.call_status === 'completed' ? 'default' : 'secondary'}>
                              {call.call_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(call.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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
                        placeholder="+1234567890"
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
