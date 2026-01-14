import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GitBranch,
  Phone,
  Loader2,
  RefreshCw,
  Play,
  Calendar,
  FileText,
  Webhook,
  Eye,
  Bot,
  Database,
  PhoneCall,
  X,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Demo backend URL for Temporal
const DEMO_BACKEND_URL = 'https://reiko-transactional-vanessa.ngrok-free.dev';

interface Workflow {
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
}

// Trigger source display config
const triggerSourceConfig: Record<string, { icon: string | React.ReactNode; label: string; color: string }> = {
  hubspot: { icon: '🟠', label: 'HubSpot', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  salesforce: { icon: '☁️', label: 'Salesforce', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  pipedrive: { icon: '🟢', label: 'Pipedrive', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  zoho: { icon: '🔴', label: 'Zoho CRM', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  webhook: { icon: <Webhook className="h-3 w-3" />, label: 'Webhook', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  calendar: { icon: <Calendar className="h-3 w-3" />, label: 'Calendar', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  form: { icon: <FileText className="h-3 w-3" />, label: 'Form', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
  manual: { icon: <Phone className="h-3 w-3" />, label: 'Manual', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' },
};

const getTriggerDisplay = (triggerSource: string) => {
  const config = triggerSourceConfig[triggerSource];
  if (!config) {
    return { icon: <Phone className="h-3 w-3" />, label: triggerSource, color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' };
  }
  return config;
};

export const WorkflowTriggerPanel = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isOrchestrationOpen, setIsOrchestrationOpen] = useState(false);

  const { toast } = useToast();

  // Load workflows from database
  const loadWorkflows = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setWorkflows([]);
        return;
      }

      let companyId: string | null = null;

      // First check if user is a company owner
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (companyData) {
        companyId = companyData.id;
      } else {
        // User might be an agent - check agents table
        const { data: agentData } = await supabase
          .from('agents')
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (agentData?.company_id) {
          companyId = agentData.company_id;
        }
      }

      if (!companyId) {
        console.log('No company found for user');
        setWorkflows([]);
        return;
      }

      // Fetch active workflows for this company
      // Note: Using type assertion until migration is run and types are regenerated
      const { data: workflowsData, error } = await (supabase
        .from('workflows' as any)
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false }) as any);

      if (error) {
        console.error('Error fetching workflows:', error);
        setWorkflows([]);
      } else {
        // Map DB fields to Workflow interface
        const mappedWorkflows: Workflow[] = (workflowsData || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description || '',
          triggerType: row.trigger_type || 'temporal-outbound',
          triggerSource: row.trigger_source || 'manual',
          status: row.status as 'active' | 'inactive',
          tools: row.tools || [],
          actions: row.actions || [],
          webhookUrl: row.webhook_url,
          updatedAt: row.updated_at,
        }));
        setWorkflows(mappedWorkflows);
      }
    } catch (e) {
      console.error('Failed to load workflows:', e);
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const handleRunWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setPhoneNumber('');
    setCustomerName('');
    setIsRunDialogOpen(true);
  };

  const handleStartCall = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter a phone number to call',
        variant: 'destructive',
      });
      return;
    }

    setIsStarting(true);
    try {
      const payload: Record<string, string> = {
        phoneNumber: phoneNumber,
      };
      if (customerName) {
        payload.customerName = customerName;
      }
      if (selectedWorkflow?.id) {
        payload.workflowId = selectedWorkflow.id;
      }
      if (selectedWorkflow?.triggerSource) {
        payload.triggerSource = selectedWorkflow.triggerSource;
      }

      const response = await fetch(`${DEMO_BACKEND_URL}/api/campaigns/trigger-vapi-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response from Temporal backend:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger call');
      }

      const vapiCallId = data.vapiCallId || data.callId || data.call_id;
      console.log('Extracted vapiCallId:', vapiCallId);
      setActiveCallId(vapiCallId);

      // Save call to calls table so it appears in Live Calls
      if (vapiCallId) {
        console.log('Saving call to database with vapi_call_id:', vapiCallId);
        const { data: insertedCall, error: insertError } = await supabase
          .from('calls')
          .insert({
            customer_number: phoneNumber,
            call_direction: 'outbound',
            call_status: 'completed',
            vapi_call_id: vapiCallId,
          } as any)
          .select();

        if (insertError) {
          console.error('Error saving call to database:', insertError);
        } else {
          console.log('Call saved successfully:', insertedCall);
        }
      }

      toast({
        title: 'Workflow Started',
        description: `Calling ${phoneNumber}...`,
      });

      setIsRunDialogOpen(false);
      setPhoneNumber('');
      setCustomerName('');
    } catch (error) {
      toast({
        title: 'Failed to Start Workflow',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const activeCount = workflows.length;

  return (
    <>
      <Card className="h-full flex flex-col bg-card border-border border-2 border-purple-500/30">
        <CardHeader className="pb-1 lg:pb-2 pt-2 lg:pt-3 px-2 lg:px-4 flex-shrink-0">
          <CardTitle className="text-sm lg:text-base flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <GitBranch className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-xs lg:text-sm">Workflows</span>
                <p className="text-[9px] lg:text-[10px] text-muted-foreground font-normal truncate">Automations</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={loadWorkflows}
                disabled={isLoading}
                className="h-5 w-5 lg:h-6 lg:w-6"
              >
                <RefreshCw className={`h-2.5 w-2.5 lg:h-3 lg:w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[9px] lg:text-[10px] px-1 lg:px-1.5">
                {activeCount}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden pt-1 lg:pt-2 pb-2 lg:pb-3 px-2 lg:px-4 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 lg:py-8">
              <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin text-purple-500" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-3 lg:py-6">
              <GitBranch className="h-5 w-5 lg:h-6 lg:w-6 mx-auto mb-1 lg:mb-2 text-muted-foreground" />
              <p className="text-[10px] lg:text-sm text-muted-foreground">No active workflows</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-1.5 lg:space-y-2 pr-1 lg:pr-2">
                {workflows.map((workflow) => {
                  const triggerDisplay = getTriggerDisplay(workflow.triggerSource || 'manual');
                  return (
                    <div
                      key={workflow.id}
                      className="p-1.5 lg:p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-purple-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1 lg:gap-2 mb-1 lg:mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[10px] lg:text-sm truncate">{workflow.name}</p>
                          <Badge variant="outline" className={`gap-0.5 lg:gap-1 text-[8px] lg:text-[10px] mt-0.5 lg:mt-1 px-1 ${triggerDisplay.color}`}>
                            <span className="flex-shrink-0">{typeof triggerDisplay.icon === 'string' ? triggerDisplay.icon : triggerDisplay.icon}</span>
                            <span className="truncate">{triggerDisplay.label}</span>
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRunWorkflow(workflow)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-6 lg:h-7 text-[10px] lg:text-xs"
                      >
                        <Play className="h-2.5 w-2.5 lg:h-3 lg:w-3 mr-0.5 lg:mr-1" />
                        Run
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Run Workflow Dialog */}
      <Dialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-purple-500" />
              Run Workflow
            </DialogTitle>
            <DialogDescription>
              {selectedWorkflow?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartCall()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
              <Input
                id="customerName"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRunDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartCall}
              disabled={isStarting}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Workflow Status Card */}
      {activeCallId && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Card className="shadow-2xl border-2 border-purple-500/50 bg-gradient-to-br from-background to-purple-500/10">
            <CardHeader className="pb-2 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
                    <PhoneCall className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Workflow Running</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Pipeline Active</p>
                  </div>
                </div>
                <Badge className="bg-purple-500 text-white border-0 animate-pulse text-[10px]">
                  LIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-purple-500">Processing</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsOrchestrationOpen(true)}
                  className="flex-1 gap-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 h-7 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  View Workflow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveCallId(null)}
                  className="border-purple-500/30 hover:bg-purple-500/10 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Visualization Dialog */}
      <Dialog open={isOrchestrationOpen} onOpenChange={setIsOrchestrationOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-purple-500/30">
          <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/50 to-violet-950/50">
            <DialogTitle className="text-lg font-semibold text-white">Workflow Execution</DialogTitle>
            <DialogDescription className="text-sm text-purple-200/70">
              Live view of your automation pipeline
            </DialogDescription>
          </div>

          <div className="p-8 bg-gradient-to-br from-[#1e1033] via-[#1a0a2e] to-[#0f0518] min-h-[400px] relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            <style>{`
              @keyframes flowPulse {
                0% { left: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { left: 100%; opacity: 0; }
              }
              .flow-particle {
                animation: flowPulse 3s ease-in-out infinite;
              }
              .flow-particle-delayed {
                animation: flowPulse 3s ease-in-out infinite 1.5s;
              }
            `}</style>

            <div className="relative flex flex-col items-center justify-center pt-6">
              <div className="absolute top-[64px] left-[10%] right-[10%] h-1 bg-gradient-to-r from-purple-500/40 via-violet-500/40 to-fuchsia-500/40 rounded-full">
                <div className="flow-particle absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-300 shadow-lg shadow-purple-400/50" style={{ filter: 'blur(2px)' }} />
                <div className="flow-particle-delayed absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-fuchsia-400 shadow-lg shadow-fuchsia-400/50" style={{ filter: 'blur(1px)' }} />
              </div>

              <div className="relative flex items-center justify-between w-full px-[5%]">
                <div className="flex flex-col items-center z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/40 flex items-center justify-center border-2 border-purple-400/50">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-purple-300">Trigger</span>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/40 flex items-center justify-center border-2 border-violet-400/50">
                    <GitBranch className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-violet-300">Process</span>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 shadow-lg shadow-fuchsia-500/40 flex items-center justify-center border-2 border-fuchsia-400/50">
                    <PhoneCall className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-fuchsia-300">Call</span>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-700 shadow-lg shadow-pink-500/40 flex items-center justify-center border-2 border-pink-400/50">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-pink-300">AI Agent</span>
                </div>

                <div className="flex flex-col items-center z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/40 flex items-center justify-center border-2 border-indigo-400/50">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-indigo-300">Actions</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-purple-300/50">
                <span className="text-xs">Flow Direction</span>
                <svg className="w-12 h-3" viewBox="0 0 64 16">
                  <defs>
                    <linearGradient id="arrowGradPurpleMini" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <path d="M0 8 L56 8 M48 2 L58 8 L48 14" stroke="url(#arrowGradPurpleMini)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-purple-500/20 bg-gradient-to-r from-purple-950/30 to-violet-950/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-purple-300/70">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Live</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsOrchestrationOpen(false)} className="border-purple-500/30 hover:bg-purple-500/10">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
