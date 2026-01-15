import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, PhoneIncoming, PhoneOutgoing, CheckCircle, Loader2, Clock, ChevronDown, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AISession } from '@/pages/PinkMobileDashboard';
import { TranscriptViewerDialog } from './TranscriptViewerDialog';

interface LiveSessionsPanelProps {
  onSelectSession: (session: AISession) => void;
  selectedSessionId?: string;
  refreshKey?: number;
}

interface CallRecord {
  id: string;
  customer_number: string;
  call_direction: 'inbound' | 'outbound';
  call_status: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
  agent_name?: string;
  vapi_call_id?: string;
}

const CALLS_PER_PAGE = 10;

export const LiveSessionsPanel = ({ onSelectSession, selectedSessionId, refreshKey }: LiveSessionsPanelProps) => {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false);
  const [selectedCallForTranscript, setSelectedCallForTranscript] = useState<CallRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref to always have latest calls for loadMore
  const callsRef = useRef<CallRecord[]>([]);
  callsRef.current = calls;

  const handleViewTranscript = (call: CallRecord) => {
    setSelectedCallForTranscript(call);
    setTranscriptDialogOpen(true);
  };

  const fetchCalls = useCallback(async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      }

      // Use ref for loadMore to always have latest calls
      const currentCalls = callsRef.current;
      const offset = loadMore ? currentCalls.length : 0;

      // First, always get active calls (no limit)
      const { data: activeCalls, error: activeError } = await supabase
        .from('calls')
        .select('id, customer_number, call_direction, call_status, started_at, ended_at, created_at, agent_id, vapi_call_id')
        .eq('call_status', 'in-progress')
        .order('created_at', { ascending: false });

      if (activeError) {
        console.error('Error fetching active calls:', activeError);
      }

      // Then get completed/other calls with pagination
      const { data: otherCalls, error: otherError, count } = await supabase
        .from('calls')
        .select('id, customer_number, call_direction, call_status, started_at, ended_at, created_at, agent_id, vapi_call_id', { count: 'exact' })
        .neq('call_status', 'in-progress')
        .order('created_at', { ascending: false })
        .range(offset, offset + CALLS_PER_PAGE - 1);

      if (otherError) {
        console.error('Error fetching calls:', otherError);
        return;
      }

      // Combine: active calls first (not paginated), then completed calls (paginated)
      const activeIds = new Set((activeCalls || []).map(c => c.id));
      const filteredOther = (otherCalls || []).filter(c => !activeIds.has(c.id));

      const allCallsData = loadMore
        ? [...(activeCalls || []), ...currentCalls.filter(c => c.call_status !== 'in-progress'), ...filteredOther]
        : [...(activeCalls || []), ...filteredOther];

      // Remove duplicates by id
      const uniqueCalls = Array.from(new Map(allCallsData.map(c => [c.id, c])).values());

      const mappedCalls: CallRecord[] = uniqueCalls.map(call => ({
        id: call.id,
        customer_number: call.customer_number || 'Unknown',
        call_direction: (call.call_direction as 'inbound' | 'outbound') || 'inbound',
        call_status: call.call_status || 'unknown',
        started_at: call.started_at || call.created_at,
        ended_at: call.ended_at,
        created_at: call.created_at,
        agent_name: 'Sara AI',
        vapi_call_id: call.vapi_call_id,
      }));

      setCalls(mappedCalls);
      setLastUpdate(new Date());
      setTotalCount(count || 0);
      setHasMore((otherCalls?.length || 0) === CALLS_PER_PAGE);

      console.log('LiveSessionsPanel - fetched calls:', mappedCalls.length, 'total completed:', count);
    } catch (err) {
      console.error('Error in fetchCalls:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  }, []); // No dependencies - uses ref for current calls

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchCalls(false);

    // Generate unique channel name to avoid conflicts
    const channelId = `live-calls-panel-${Date.now()}`;
    console.log('LiveSessionsPanel: Setting up realtime subscription:', channelId);

    // Subscribe to realtime changes on calls table
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calls' },
        (payload) => {
          console.log('LiveSessionsPanel: New call INSERT detected:', payload.new);
          fetchCalls(false); // Refetch on new call
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls' },
        (payload) => {
          console.log('LiveSessionsPanel: Call UPDATE detected:', payload.new);
          fetchCalls(false); // Refetch on status change
        }
      )
      .subscribe((status) => {
        console.log('LiveSessionsPanel: Subscription status:', status);
      });

    return () => {
      console.log('LiveSessionsPanel: Cleaning up subscription:', channelId);
      supabase.removeChannel(channel);
    };
  }, [fetchCalls]);

  // Refetch when refreshKey changes (triggered by parent after call is made)
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      console.log('Refreshing calls due to refreshKey change:', refreshKey);
      fetchCalls(false);
    }
  }, [refreshKey]);

  // Poll every 3 seconds as reliable fallback (Realtime can be unreliable)
  useEffect(() => {
    console.log('LiveSessionsPanel: Starting polling fallback (every 3s)');
    const pollInterval = setInterval(() => {
      fetchCalls(false);
    }, 3000);

    return () => {
      console.log('LiveSessionsPanel: Stopping polling');
      clearInterval(pollInterval);
    };
  }, [fetchCalls]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchCalls(false);
  };

  const handleLoadMore = () => {
    fetchCalls(true);
  };

  // Convert call to AISession format for compatibility
  const callToSession = (call: CallRecord): AISession => ({
    id: call.id,
    customer_name: call.customer_number,
    customer_phone: call.customer_number,
    channel: 'voice',
    intent: call.call_direction === 'inbound' ? 'Inbound Call' : 'Outbound Call',
    status: call.call_status === 'in-progress' ? 'active' : 'completed',
    started_at: call.started_at,
    ended_at: call.ended_at,
    ticket_id: `CALL-${call.id.slice(0, 8).toUpperCase()}`,
  });

  const formatDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeCalls = calls.filter(c => c.call_status === 'in-progress');
  const completedCalls = calls.filter(c => c.call_status !== 'in-progress');

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardHeader className="pb-2 lg:pb-3 pt-2 lg:pt-3 px-2 lg:px-4 flex-shrink-0">
        <CardTitle className="text-sm lg:text-base flex items-center justify-between">
          <span>Live Calls</span>
          <div className="flex items-center gap-1 lg:gap-2">
            {activeCalls.length > 0 && (
              <Badge className="text-[9px] lg:text-[10px] bg-green-500 text-white animate-pulse px-1 lg:px-1.5">
                {activeCalls.length} Active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManualRefresh}
              disabled={isRefreshing || loading}
              className="h-5 w-5 lg:h-6 lg:w-6"
              title="Refresh calls"
            >
              <RefreshCw className={`h-2.5 w-2.5 lg:h-3 lg:w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <div className="flex items-center justify-between text-[10px] lg:text-xs text-muted-foreground">
          <span>{totalCount} total ({completedCalls.length} shown)</span>
          <span className="text-[9px] lg:text-[10px]">{formatTime(lastUpdate.toISOString())}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-2 lg:px-4 pb-2 lg:pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 lg:py-8">
              <Loader2 className="h-5 w-5 lg:h-6 lg:w-6 animate-spin text-muted-foreground" />
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-6 lg:py-8 text-muted-foreground text-[10px] lg:text-sm">
              No calls yet. Make an outbound call or receive an inbound call.
            </div>
          ) : (
            <div className="space-y-1.5 lg:space-y-2">
              {/* Active Calls First */}
              {activeCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => onSelectSession(callToSession(call))}
                  className={`p-2 lg:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSessionId === call.id
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-green-500 bg-green-500/10 animate-pulse'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-1 lg:mb-2">
                    <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                      <div className={`p-1 lg:p-1.5 rounded-full flex-shrink-0 ${
                        call.call_direction === 'inbound'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-pink-500/20 text-pink-500'
                      }`}>
                        {call.call_direction === 'inbound'
                          ? <PhoneIncoming className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                          : <PhoneOutgoing className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                        }
                      </div>
                      <span className="font-medium text-[10px] lg:text-sm font-mono truncate">{call.customer_number}</span>
                    </div>
                    <Badge className="text-[8px] lg:text-[10px] bg-green-500 text-white px-1 lg:px-1.5 flex-shrink-0">
                      LIVE
                    </Badge>
                  </div>

                  {/* Call Info */}
                  <div className="text-[9px] lg:text-xs text-muted-foreground mb-0.5 lg:mb-1">
                    {call.call_direction === 'inbound' ? 'In' : 'Out'} via Sara AI
                  </div>

                  {/* Live Duration */}
                  <div className="flex items-center gap-1 text-[9px] lg:text-xs text-green-600 font-medium">
                    <Clock className="h-2.5 w-2.5 lg:h-3 lg:w-3 animate-pulse" />
                    {formatDuration(call.started_at)} (live)
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center justify-between mt-1.5 lg:mt-2 pt-1.5 lg:pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1 text-[8px] lg:text-[10px] text-green-600">
                      <Loader2 className="h-2.5 w-2.5 lg:h-3 lg:w-3 animate-spin" />
                      <span className="hidden lg:inline">Sara handling call...</span>
                      <span className="lg:hidden">Sara AI...</span>
                    </div>
                    <span className="text-[8px] lg:text-[10px] text-muted-foreground">
                      {formatTime(call.started_at)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Completed Calls */}
              {completedCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => onSelectSession(callToSession(call))}
                  className={`p-2 lg:p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSessionId === call.id
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/30'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-1 lg:mb-2">
                    <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                      <div className={`p-1 lg:p-1.5 rounded-full flex-shrink-0 ${
                        call.call_direction === 'inbound'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-pink-500/20 text-pink-500'
                      }`}>
                        {call.call_direction === 'inbound'
                          ? <PhoneIncoming className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                          : <PhoneOutgoing className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                        }
                      </div>
                      <span className="font-medium text-[10px] lg:text-sm font-mono truncate">{call.customer_number}</span>
                    </div>
                    <Badge className="text-[8px] lg:text-[10px] bg-gray-500/20 text-gray-600 border-gray-500/30 px-1 flex-shrink-0">
                      {call.call_status}
                    </Badge>
                  </div>

                  {/* Call Info */}
                  <div className="text-[9px] lg:text-xs text-muted-foreground mb-0.5 lg:mb-1">
                    {call.call_direction === 'inbound' ? 'Inbound' : 'Outbound'}
                  </div>

                  {/* Duration */}
                  {call.ended_at && (
                    <div className="flex items-center gap-1 text-[9px] lg:text-xs text-muted-foreground">
                      <Clock className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                      {formatDuration(call.started_at, call.ended_at)}
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="flex items-center justify-between mt-1.5 lg:mt-2 pt-1.5 lg:pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1 text-[8px] lg:text-[10px] text-muted-foreground">
                      <CheckCircle className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-green-500" />
                      <span>Done</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 lg:h-6 px-1.5 lg:px-2 text-[8px] lg:text-[10px] text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTranscript(call);
                      }}
                    >
                      <FileText className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                      <span className="hidden lg:inline ml-1">Transcript</span>
                    </Button>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && completedCalls.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full mt-1 lg:mt-2 h-7 lg:h-8 text-[10px] lg:text-xs"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-2.5 w-2.5 lg:h-3 lg:w-3 mr-1 lg:mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-2.5 w-2.5 lg:h-3 lg:w-3 mr-1 lg:mr-2" />
                      More ({totalCount - completedCalls.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Transcript Viewer Dialog */}
      <TranscriptViewerDialog
        isOpen={transcriptDialogOpen}
        onClose={() => {
          setTranscriptDialogOpen(false);
          setSelectedCallForTranscript(null);
        }}
        callId={selectedCallForTranscript?.id || null}
        vapiCallId={selectedCallForTranscript?.vapi_call_id}
        customerNumber={selectedCallForTranscript?.customer_number}
        callDirection={selectedCallForTranscript?.call_direction}
        callStatus={selectedCallForTranscript?.call_status}
        startedAt={selectedCallForTranscript?.started_at}
        endedAt={selectedCallForTranscript?.ended_at}
      />
    </Card>
  );
};
