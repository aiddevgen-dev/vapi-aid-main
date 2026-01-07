import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Users, MapPin, Target, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone_number: string;
  security_pin: string;
  address: string;
  intent: string;
  created_at: string;
  updated_at: string;
}

interface OutboundDialerProps {
  isDeviceReady: boolean;
  isConnected: boolean;
  onMakeCall: (phoneNumber: string) => Promise<void>;
  onCallInitiated?: (customerNumber: string) => void;
  onLeadSelected?: (lead: Lead) => void;
  disabled?: boolean;
}

export const OutboundDialer = ({
  isDeviceReady,
  isConnected,
  onMakeCall,
  onCallInitiated,
  onLeadSelected,
  disabled = false
}: OutboundDialerProps) => {
  const [isDialing, setIsDialing] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [agentCompanyId, setAgentCompanyId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch agent's company_id on mount
  useEffect(() => {
    const fetchAgentCompany = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: agent } = await supabase
          .from('agents')
          .select('company_id')
          .eq('user_id', user.id)
          .single();

        if (agent?.company_id) {
          setAgentCompanyId(agent.company_id);
        }
      } catch (error) {
        console.error('Error fetching agent company:', error);
      }
    };

    fetchAgentCompany();
  }, []);

  // Auto-fetch leads when company_id is available
  useEffect(() => {
    if (agentCompanyId) {
      fetchLeads();
    }
  }, [agentCompanyId]);

  const fetchLeads = async () => {
    if (!agentCompanyId) {
      setIsLoadingLeads(false);
      return;
    }

    setIsLoadingLeads(true);
    try {
      const { data, error } = await (supabase as any)
        .from('leads')
        .select('*')
        .eq('company_id', agentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive"
      });
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const handleCallLead = async (lead: Lead) => {
    if (!lead.phone_number) {
      toast({
        title: "Invalid Lead",
        description: "This lead has no phone number",
        variant: "destructive"
      });
      return;
    }

    setIsDialing(true);
    try {
      // Format number with + if not present
      let formattedNumber = lead.phone_number;
      if (!formattedNumber.startsWith('+')) {
        formattedNumber = `+${formattedNumber}`;
      }

      console.log('Initiating outbound call to lead:', lead.name, formattedNumber);

      // Pass lead data to parent first
      if (onLeadSelected) {
        onLeadSelected(lead);
      }

      await onMakeCall(formattedNumber);

      if (onCallInitiated) {
        onCallInitiated(formattedNumber);
      }

      toast({
        title: "Calling...",
        description: `Dialing ${lead.name} at ${formattedNumber}`,
      });

    } catch (error) {
      console.error('Error making call:', error);
      toast({
        title: "Call Failed",
        description: "Failed to initiate outbound call",
        variant: "destructive"
      });
    } finally {
      setIsDialing(false);
    }
  };

  return (
    <Card className="bg-sidebar border-sidebar-border border-2 border-primary/30">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sidebar-foreground flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>Company Leads</span>
            <Badge variant="outline" className="text-xs ml-1">
              {leads.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchLeads}
              disabled={isLoadingLeads}
              className="h-6 w-6"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingLeads ? 'animate-spin' : ''}`} />
            </Button>
            {isDeviceReady ? (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                Connecting...
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        {/* Status message when on call */}
        {isConnected && (
          <p className="text-xs text-center text-muted-foreground mb-2 py-1 bg-muted/50 rounded">
            End current call before making a new one
          </p>
        )}

        {/* Leads List */}
        {isLoadingLeads ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No leads found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add leads from Company Dashboard
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="space-y-2 pr-2">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-lg border border-sidebar-border bg-sidebar-accent/50 hover:bg-sidebar-accent hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-sm text-sidebar-foreground">
                      {lead.name}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleCallLead(lead)}
                      disabled={isDialing || isConnected || disabled}
                      className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs flex-shrink-0"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-xs text-primary">{lead.intent}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground font-mono">{lead.phone_number}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
