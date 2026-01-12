import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Phone,
  Users,
  Loader2,
  RefreshCw,
  Bot,
  Search
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
        toast({
          title: "Call Initiated",
          description: `Sara AI is calling ${customerName || phoneNumber}${data.dbCallId ? ' (tracked)' : ''}`,
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
    <Card className="h-full flex flex-col bg-card border-border border-2 border-pink-500/30">
      <CardHeader className="pb-2 pt-3 flex-shrink-0">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold">AI Outbound</span>
              <p className="text-[10px] text-muted-foreground font-normal">Sara AI Calling</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchCustomers}
              disabled={isLoadingCustomers}
              className="h-6 w-6"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
            </Button>
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Ready</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-2 pb-3 flex flex-col gap-3">
        {/* Manual Number Input */}
        <div className="p-2.5 rounded-lg border-2 border-dashed border-pink-500/30 bg-pink-500/5">
          <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
            <Phone className="h-3 w-3" /> Quick Dial - Enter any number
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="+1234567890"
              value={manualNumber}
              onChange={(e) => setManualNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && makeOutboundCall(manualNumber)}
              className="h-8 text-xs font-mono flex-1"
              disabled={!!callingNumber}
            />
            <Button
              size="sm"
              onClick={() => makeOutboundCall(manualNumber)}
              disabled={!manualNumber.trim() || !!callingNumber}
              className="bg-pink-600 hover:bg-pink-700 text-white h-8 px-3 text-xs"
            >
              {callingNumber === manualNumber ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Pink Mobile Customers
            </p>
            <Badge variant="outline" className="text-[10px]">
              {filteredCustomers.length}
            </Badge>
          </div>

          {isLoadingCustomers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No customers found</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100%-2rem)]">
              <div className="space-y-2 pr-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-pink-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{customer.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{customer.phone}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => makeOutboundCall(customer.phone, customer.name)}
                        disabled={!!callingNumber}
                        className="bg-pink-600 hover:bg-pink-700 text-white h-7 px-3 text-xs flex-shrink-0"
                      >
                        {callingNumber === customer.phone ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Bot className="h-3 w-3 mr-1" />
                            AI Call
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
  );
};
