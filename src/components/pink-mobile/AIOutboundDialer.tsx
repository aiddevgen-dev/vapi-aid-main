import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Phone,
  Users,
  Loader2,
  RefreshCw,
  Bot,
  Search,
  PhoneCall,
  FileText,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PinkCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
}

interface AIOutboundDialerProps {
  agentId?: string;
  onCallMade?: () => void;
}

export const AIOutboundDialer = ({ agentId: propAgentId, onCallMade }: AIOutboundDialerProps) => {
  const [customers, setCustomers] = useState<PinkCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<PinkCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualNumber, setManualNumber] = useState('');
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [callingNumber, setCallingNumber] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(propAgentId || null);
  const [activeCallDbId, setActiveCallDbId] = useState<string | null>(null);
  const [activeCallDirection, setActiveCallDirection] = useState<'inbound' | 'outbound' | null>(null);
  const [activeCallNumber, setActiveCallNumber] = useState<string | null>(null);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [liveTranscripts, setLiveTranscripts] = useState<Array<{ speaker: string; text: string; created_at: string }>>([]);

  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch agent ID for current user (if not passed as prop)
  useEffect(() => {
    const fetchAgentId = async () => {
      if (propAgentId) {
        setAgentId(propAgentId);
        return;
      }

      if (!user) return;

      try {
        // First try to find agent directly by user_id
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (agent) {
          setAgentId(agent.id);
          console.log('Found agent for user:', agent.id);
          return;
        }

        // If no direct agent, try to find via company
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (company) {
          // Get first agent of this company
          const { data: companyAgent } = await supabase
            .from('agents')
            .select('id')
            .eq('company_id', company.id)
            .limit(1)
            .single();

          if (companyAgent) {
            setAgentId(companyAgent.id);
            console.log('Found company agent:', companyAgent.id);
          }
        }
      } catch (error) {
        console.log('Could not find agent for user - calls will not be tracked');
      }
    };

    fetchAgentId();
  }, [user, propAgentId]);

  // Fetch Pink Mobile customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCustomers(customers.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        (c.email && c.email.toLowerCase().includes(query))
      ));
    }
  }, [searchQuery, customers]);

  // Check for inbound VAPI calls (polling as reliable fallback)
  useEffect(() => {
    const checkInboundCalls = async () => {
      // Skip if we already have an active call
      if (activeCallDbId) return;

      const { data: inboundCall } = await supabase
        .from('calls')
        .select('id, customer_number, call_direction')
        .eq('call_direction', 'inbound')
        .eq('call_status', 'in-progress')
        .not('vapi_call_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (inboundCall) {
        console.log('AIOutboundDialer: Found inbound VAPI call:', inboundCall.id);
        setActiveCallDbId(inboundCall.id);
        setActiveCallDirection('inbound');
        setActiveCallNumber(inboundCall.customer_number);
        setLiveTranscripts([]);
        toast({
          title: "Incoming AI Call",
          description: `Sara AI answering call from ${inboundCall.customer_number}`,
        });
      }
    };

    // Check immediately on mount
    checkInboundCalls();

    // Poll every 3 seconds for new inbound calls
    const pollInterval = setInterval(checkInboundCalls, 3000);

    return () => clearInterval(pollInterval);
  }, [activeCallDbId, toast]);

  // Function to fetch transcripts from DB
  const fetchTranscripts = async (callId: string) => {
    console.log('Fetching transcripts for call:', callId);
    const { data } = await supabase
      .from('transcripts')
      .select('speaker, text, created_at')
      .eq('call_id', callId)
      .order('created_at', { ascending: true });
    if (data && data.length > 0) {
      console.log('Fetched', data.length, 'transcripts');
      setLiveTranscripts(data);
    }
    return data;
  };

  // Subscribe to live transcripts via Supabase Realtime
  useEffect(() => {
    if (!activeCallDbId) return;

    console.log('Subscribing to live transcripts for call:', activeCallDbId);

    // Fetch existing transcripts first
    fetchTranscripts(activeCallDbId);

    // Subscribe to new transcripts
    const transcriptChannel = supabase
      .channel(`transcripts-${activeCallDbId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcripts',
          filter: `call_id=eq.${activeCallDbId}`,
        },
        (payload) => {
          console.log('New transcript received:', payload.new);
          const newEntry = payload.new as { speaker: string; text: string; created_at: string };
          setLiveTranscripts((prev) => {
            const updated = [...prev, newEntry];
            console.log('Updated transcripts array, length:', updated.length);
            return updated;
          });
        }
      )
      .subscribe();

    // Subscribe to call status changes
    const callChannel = supabase
      .channel(`call-status-${activeCallDbId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${activeCallDbId}`,
        },
        (payload) => {
          const newStatus = (payload.new as any).call_status;
          console.log('Call status changed:', newStatus);
          if (newStatus === 'completed' || newStatus === 'failed') {
            // Refetch transcripts when call ends (catches end-of-call-report batch)
            setTimeout(() => {
              fetchTranscripts(activeCallDbId);
              toast({
                title: "Call Ended",
                description: "Transcript available in dialog",
              });
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from channels');
      supabase.removeChannel(transcriptChannel);
      supabase.removeChannel(callChannel);
    };
  }, [activeCallDbId, toast]);

  // Refetch transcripts when dialog opens
  useEffect(() => {
    if (isTranscriptOpen && activeCallDbId) {
      fetchTranscripts(activeCallDbId);
    }
  }, [isTranscriptOpen, activeCallDbId]);

  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('pink_customers')
        .select('id, name, phone, email, address')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const makeOutboundCall = async (phoneNumber: string, customerName?: string) => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Invalid Number",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    setCallingNumber(phoneNumber);

    try {
      const { data, error } = await supabase.functions.invoke('vapi-outbound-call', {
        body: {
          phoneNumber: phoneNumber,
          customerName: customerName || phoneNumber,
          agentId: agentId // Pass agent ID for call tracking
        }
      });

      if (error) throw error;

      if (data.success) {
        console.log('VAPI call initiated:', data);

        // Store DB call ID for live transcript subscription
        if (data.dbCallId) {
          setActiveCallDbId(data.dbCallId);
          setActiveCallDirection('outbound');
          setActiveCallNumber(phoneNumber);
          setLiveTranscripts([]);
        }

        toast({
          title: "Call Initiated",
          description: `Sara AI is calling ${customerName || phoneNumber}`,
        });
        // Trigger refresh of live calls panel
        onCallMade?.();
      } else {
        throw new Error(data.error || 'Failed to initiate call');
      }

    } catch (error: any) {
      console.error('Error making call:', error);
      toast({
        title: "Call Failed",
        description: error.message || "Failed to initiate outbound call",
        variant: "destructive"
      });
    } finally {
      setCallingNumber(null);
      setManualNumber('');
    }
  };

  return (
    <>
    <Card className="h-full flex flex-col bg-card border-border border-2 border-pink-500/30">
      <CardHeader className="pb-2 pt-2 lg:pt-3 px-2 lg:px-4 flex-shrink-0">
        <CardTitle className="text-sm lg:text-base flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-xs lg:text-sm">AI Outbound</span>
              <p className="text-[9px] lg:text-[10px] text-muted-foreground font-normal truncate">Sara AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchCustomers}
              disabled={isLoadingCustomers}
              className="h-5 w-5 lg:h-6 lg:w-6"
            >
              <RefreshCw className={`h-2.5 w-2.5 lg:h-3 lg:w-3 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
            </Button>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[9px] lg:text-[10px] px-1 lg:px-1.5">Ready</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-1 lg:pt-2 pb-2 lg:pb-3 px-2 lg:px-4 flex flex-col gap-2 lg:gap-3">
        {/* Manual Number Input */}
        <div className="p-2 lg:p-2.5 rounded-lg border-2 border-dashed border-pink-500/30 bg-pink-500/5">
          <p className="text-[9px] lg:text-[10px] text-muted-foreground mb-1.5 lg:mb-2 flex items-center gap-1">
            <Phone className="h-2.5 w-2.5 lg:h-3 lg:w-3" /> Quick Dial
          </p>
          <div className="flex gap-1.5 lg:gap-2">
            <Input
              placeholder="+1234567890"
              value={manualNumber}
              onChange={(e) => setManualNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && makeOutboundCall(manualNumber)}
              className="h-7 lg:h-8 text-[10px] lg:text-xs font-mono flex-1"
              disabled={!!callingNumber}
            />
            <Button
              size="sm"
              onClick={() => makeOutboundCall(manualNumber)}
              disabled={!manualNumber.trim() || !!callingNumber}
              className="bg-pink-600 hover:bg-pink-700 text-white h-7 lg:h-8 px-2 lg:px-3 text-[10px] lg:text-xs"
            >
              {callingNumber === manualNumber ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Phone className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 lg:h-3.5 lg:w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 lg:h-8 pl-7 lg:pl-8 text-[10px] lg:text-xs"
          />
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="flex items-center justify-between mb-1.5 lg:mb-2">
            <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
              <span className="hidden lg:inline">Pink Mobile </span>Customers
            </p>
            <Badge variant="outline" className="text-[9px] lg:text-[10px] px-1">
              {filteredCustomers.length}
            </Badge>
          </div>

          {isLoadingCustomers ? (
            <div className="flex items-center justify-center py-4 lg:py-8">
              <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin text-pink-500" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-4 lg:py-6">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-[10px] lg:text-sm text-muted-foreground">No customers</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-1.5 lg:space-y-2 pr-1 lg:pr-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-1.5 lg:p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-pink-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1.5 lg:gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[10px] lg:text-sm truncate">{customer.name}</p>
                        <p className="text-[9px] lg:text-xs text-muted-foreground font-mono truncate">{customer.phone}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => makeOutboundCall(customer.phone, customer.name)}
                        disabled={!!callingNumber}
                        className="bg-pink-600 hover:bg-pink-700 text-white h-6 lg:h-7 w-6 lg:w-auto lg:px-2 p-0 text-[10px] lg:text-xs flex-shrink-0"
                        title="AI Call"
                      >
                        {callingNumber === customer.phone ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Bot className="h-3 w-3" />
                            <span className="hidden lg:inline ml-1">Call</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Active Call Status Card (Inbound or Outbound) */}
    {activeCallDbId && (
      <div className="fixed bottom-4 right-4 w-80 z-50">
        <Card className={`shadow-2xl border-2 bg-gradient-to-br from-background ${
          activeCallDirection === 'inbound'
            ? 'border-green-500/50 to-green-500/10'
            : 'border-pink-500/50 to-pink-500/10'
        }`}>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center animate-pulse ${
                  activeCallDirection === 'inbound' ? 'bg-green-500/20' : 'bg-pink-500/20'
                }`}>
                  <PhoneCall className={`h-4 w-4 ${
                    activeCallDirection === 'inbound' ? 'text-green-500' : 'text-pink-500'
                  }`} />
                </div>
                <div>
                  <CardTitle className="text-sm">
                    {activeCallDirection === 'inbound' ? 'Sara AI Receiving' : 'Sara AI Calling'}
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {activeCallNumber || 'Unknown'}
                  </p>
                </div>
              </div>
              <Badge className={`text-white border-0 animate-pulse text-[10px] ${
                activeCallDirection === 'inbound' ? 'bg-green-500' : 'bg-pink-500'
              }`}>
                {activeCallDirection === 'inbound' ? 'INBOUND' : 'OUTBOUND'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 pb-3">
            <div className={`p-2 rounded-lg border ${
              activeCallDirection === 'inbound'
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-pink-500/5 border-pink-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">Transcript</span>
                <div className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                    activeCallDirection === 'inbound' ? 'bg-green-500' : 'bg-pink-500'
                  }`} />
                  <span className={`text-[10px] font-medium ${
                    activeCallDirection === 'inbound' ? 'text-green-500' : 'text-pink-500'
                  }`}>{liveTranscripts.length} messages</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsTranscriptOpen(true)}
                className={`flex-1 gap-1 h-7 text-xs ${
                  activeCallDirection === 'inbound'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700'
                }`}
              >
                <FileText className="h-3 w-3" />
                Live Transcript {liveTranscripts.length > 0 && `(${liveTranscripts.length})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveCallDbId(null);
                  setActiveCallDirection(null);
                  setActiveCallNumber(null);
                  setLiveTranscripts([]);
                }}
                className={`h-7 w-7 p-0 ${
                  activeCallDirection === 'inbound'
                    ? 'border-green-500/30 hover:bg-green-500/10'
                    : 'border-pink-500/30 hover:bg-pink-500/10'
                }`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {/* Live Transcript Dialog */}
    <Dialog open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center animate-pulse ${
              activeCallDirection === 'inbound' ? 'bg-green-500/20' : 'bg-pink-500/20'
            }`}>
              <PhoneCall className={`h-3 w-3 ${
                activeCallDirection === 'inbound' ? 'text-green-500' : 'text-pink-500'
              }`} />
            </div>
            Live Transcript
            <Badge className={`text-white border-0 animate-pulse text-[10px] ml-2 ${
              activeCallDirection === 'inbound' ? 'bg-green-500' : 'bg-pink-500'
            }`}>
              {activeCallDirection === 'inbound' ? 'INBOUND' : 'OUTBOUND'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {activeCallDirection === 'inbound'
              ? `Incoming call from ${activeCallNumber || 'Unknown'}`
              : `Outgoing call to ${activeCallNumber || 'Unknown'}`}
          </DialogDescription>
        </DialogHeader>
        <div className={`flex-1 max-h-[50vh] overflow-y-scroll pr-4 ${
          activeCallDirection === 'inbound' ? 'dialog-scroll-transcripts' : 'dialog-scroll-suggestions'
        }`}>
          <div className="space-y-3 py-4">
            {liveTranscripts.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className={`h-6 w-6 animate-spin mx-auto mb-2 ${
                  activeCallDirection === 'inbound' ? 'text-green-500' : 'text-pink-500'
                }`} />
                <p className="text-sm text-muted-foreground">Waiting for conversation...</p>
              </div>
            ) : (
              liveTranscripts.map((entry, index) => {
                const isCustomer = entry.speaker === 'customer';
                const isInbound = activeCallDirection === 'inbound';
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      isCustomer
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : isInbound
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-pink-500/10 border border-pink-500/20'
                    }`}
                  >
                    <p className={`text-xs font-medium mb-1 ${
                      isCustomer ? 'text-blue-400' : isInbound ? 'text-green-400' : 'text-pink-400'
                    }`}>
                      {isCustomer ? 'Customer' : 'Sara AI'}
                    </p>
                    <p className="text-sm">{entry.text}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mr-auto">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              activeCallDirection === 'inbound' ? 'bg-green-500' : 'bg-pink-500'
            }`} />
            {liveTranscripts.length} messages
          </div>
          <Button variant="outline" onClick={() => setIsTranscriptOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
