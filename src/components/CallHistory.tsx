import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  Eye,
  Filter,
  Search,
  PhoneOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Call } from '@/types/call-center';
import { useToast } from '@/hooks/use-toast';

interface CallHistoryProps {
  onSelectCall?: (call: Call) => void;
  className?: string;
}

export const CallHistory = ({ onSelectCall, className }: CallHistoryProps) => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [endingCallId, setEndingCallId] = useState<string | null>(null);
  const { toast } = useToast();

  // End call - update DB to completed and disconnect from Twilio
  const handleEndCall = async (call: Call, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onSelectCall

    if (!call.id) return;
    setEndingCallId(call.id);

    try {
      // 1. Call the twilio-end-call edge function to disconnect from Twilio
      if (call.twilio_call_sid) {
        await supabase.functions.invoke('twilio-end-call', {
          body: { callId: call.id }
        });
      }

      // 2. Update call status to completed in database
      const { error } = await supabase
        .from('calls')
        .update({
          call_status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', call.id);

      if (error) throw error;

      toast({
        title: "Call Ended",
        description: `Call with ${call.customer_number} marked as completed`,
      });
    } catch (error) {
      console.error('Error ending call:', error);
      toast({
        title: "Error",
        description: "Failed to end call properly",
        variant: "destructive"
      });
    } finally {
      setEndingCallId(null);
    }
  };

  // Check if call is active (can be ended)
  const isCallActive = (status: string) => {
    return status === 'in-progress' || status === 'ringing';
  };

  useEffect(() => {
    loadCalls();
    
    // Subscribe to real-time call updates
    const channel = supabase
      .channel('call-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls'
        },
        (payload) => {
          console.log('📞 Call history change:', payload.eventType);
          loadCalls(); // Reload calls when any change happens
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = calls;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(call => 
        call.customer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.call_status === statusFilter);
    }

    // Direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter(call => call.call_direction === directionFilter);
    }

    setFilteredCalls(filtered);
  }, [calls, searchTerm, statusFilter, directionFilter]);

  const loadCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCalls((data as Call[]) || []);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'completed': { variant: 'default', label: 'Completed' },
      'in-progress': { variant: 'secondary', label: 'In Progress' },
      'ringing': { variant: 'secondary', label: 'Ringing' },
      'busy': { variant: 'destructive', label: 'Busy' },
      'no-answer': { variant: 'outline', label: 'No Answer' },
      'failed': { variant: 'destructive', label: 'Failed' },
      'canceled': { variant: 'outline', label: 'Canceled' }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
    
    return (
      <Badge variant={config.variant as any} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === 'inbound') {
      return <PhoneIncoming className="h-4 w-4 text-green-600" />;
    }
    return <PhoneOutgoing className="h-4 w-4 text-blue-600" />;
  };

  return (
    <Card className={`h-[600px] max-h-[70vh] bg-sidebar border-sidebar-border flex flex-col ${className}`}>
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sidebar-foreground flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call History
            <Badge variant="secondary" className="ml-2">
              {filteredCalls.length} calls
            </Badge>
          </CardTitle>
        </div>
        
        {/* Filters */}
        <div className="space-y-3 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by phone number or call ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="ringing">Ringing</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="no-answer">No Answer</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-primary"></div>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-sidebar-primary mx-auto mb-4" />
              <p className="text-sidebar-foreground font-medium">
                {calls.length === 0 ? 'No Call History' : 'No Matching Calls'}
              </p>
              <p className="text-sm text-sidebar-accent-foreground mt-2">
                {calls.length === 0 
                  ? 'Call history will appear here once you start making or receiving calls'
                  : 'Try adjusting your search filters'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filteredCalls.map((call, index) => (
                <div key={call.id}>
                  <div 
                    className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer hover:bg-gray-50/50"
                    onClick={() => onSelectCall?.(call)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getDirectionIcon(call.call_direction || 'inbound')}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm text-foreground truncate">
                              {call.customer_number}
                            </p>
                            {getStatusBadge(call.call_status || 'completed')}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(call.started_at)}
                            </div>

                            {call.call_duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(call.call_duration)}
                              </div>
                            )}

                            <div className="text-xs text-gray-400">
                              {call.call_direction?.toUpperCase()}
                            </div>

                            {call.resolution_status && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  call.resolution_status === 'resolved'
                                    ? 'bg-green-500/10 text-green-600 border-green-500/30'
                                    : call.resolution_status === 'escalated'
                                    ? 'bg-orange-500/10 text-orange-600 border-orange-500/30'
                                    : 'bg-gray-500/10 text-gray-600 border-gray-500/30'
                                }`}
                              >
                                {call.resolution_status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* End Call button for active calls */}
                        {isCallActive(call.call_status || '') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => handleEndCall(call, e)}
                            disabled={endingCallId === call.id}
                          >
                            {endingCallId === call.id ? (
                              <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <PhoneOff className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {onSelectCall && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < filteredCalls.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};