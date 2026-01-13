import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, PhoneIncoming, PhoneOutgoing, CheckCircle, Loader2, Clock, ChevronDown, FileText } from 'lucide-react';
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

  const handleViewTranscript = (call: CallRecord) => {
    setSelectedCallForTranscript(call);
    setTranscriptDialogOpen(true);
  };

  const fetchCalls = useCallback(async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      }

      const offset = loadMore ? calls.length : 0;

      // First, always get active calls (no limit)
      const { data: activeCalls, error: activeError } = await supabase
        .from('calls')
        .select('id, customer_number, call_direction, call_status, started_at, ended_at, created_at, agent_id')
        .eq('call_status', 'in-progress')
        .order('created_at', { ascending: false });

      if (activeError) {
        console.error('Error fetching active calls:', activeError);
      }

      // Then get completed/other calls with pagination
      const { data: otherCalls, error: otherError, count } = await supabase
        .from('calls')
        .select('id, customer_number, call_direction, call_status, started_at, ended_at, created_at, agent_id', { count: 'exact' })
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
        ? [...(activeCalls || []), ...calls.filter(c => c.call_status !== 'in-progress'), ...filteredOther]
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
    }
  }, [calls]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchCalls(false);

    // Subscribe to realtime changes on calls table
    const channel = supabase
      .channel('live-calls')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls' },
        (payload) => {
          console.log('Realtime call update:', payload);
          fetchCalls(false); // Refetch on any change
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Refetch when refreshKey changes (triggered by parent after call is made)
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      console.log('Refreshing calls due to refreshKey change:', refreshKey);
      fetchCalls(false);
    }
  }, [refreshKey]);

  // Poll every 5 seconds when there are active calls (backup for realtime)
  useEffect(() => {
    const hasActiveCalls = calls.some(c => c.call_status === 'in-progress');

    if (hasActiveCalls) {
      console.log('Active calls detected, starting polling...');
      const pollInterval = setInterval(() => {
        console.log('Polling for call updates...');
        fetchCalls(false);
      }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [calls]);

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
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Live Calls</span>
          <div className="flex items-center gap-2">
            {activeCalls.length > 0 && (
              <Badge className="text-[10px] bg-green-500 text-white animate-pulse">
                {activeCalls.length} Active
              </Badge>
            )}
          </div>
        </CardTitle>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{totalCount} total calls ({completedCalls.length} shown)</span>
          <span className="text-[10px]">Updated {formatTime(lastUpdate.toISOString())}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No calls yet. Make an outbound call or receive an inbound call.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Active Calls First */}
              {activeCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => onSelectSession(callToSession(call))}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSessionId === call.id
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-green-500 bg-green-500/10 animate-pulse'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
                        call.call_direction === 'inbound'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-pink-500/20 text-pink-500'
                      }`}>
                        {call.call_direction === 'inbound'
                          ? <PhoneIncoming className="h-3 w-3" />
                          : <PhoneOutgoing className="h-3 w-3" />
                        }
                      </div>
                      <span className="font-medium text-sm font-mono">{call.customer_number}</span>
                    </div>
                    <Badge className="text-[10px] bg-green-500 text-white">
                      LIVE
                    </Badge>
                  </div>

                  {/* Call Info */}
                  <div className="text-xs text-muted-foreground mb-1">
                    {call.call_direction === 'inbound' ? 'Inbound' : 'Outbound'} call via Sara AI
                  </div>

                  {/* Live Duration */}
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <Clock className="h-3 w-3 animate-pulse" />
                    {formatDuration(call.started_at)} (live)
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1 text-[10px] text-green-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Sara handling call...</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
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
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSessionId === call.id
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/30'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
                        call.call_direction === 'inbound'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-pink-500/20 text-pink-500'
                      }`}>
                        {call.call_direction === 'inbound'
                          ? <PhoneIncoming className="h-3 w-3" />
                          : <PhoneOutgoing className="h-3 w-3" />
                        }
                      </div>
                      <span className="font-medium text-sm font-mono">{call.customer_number}</span>
                    </div>
                    <Badge className="text-[10px] bg-gray-500/20 text-gray-600 border-gray-500/30">
                      {call.call_status}
                    </Badge>
                  </div>

                  {/* Call Info */}
                  <div className="text-xs text-muted-foreground mb-1">
                    {call.call_direction === 'inbound' ? 'Inbound' : 'Outbound'} call
                  </div>

                  {/* Duration */}
                  {call.ended_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Duration: {formatDuration(call.started_at, call.ended_at)}
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Completed</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTranscript(call);
                      }}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Transcript
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
                  className="w-full mt-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-2" />
                      Load More ({totalCount - completedCalls.length} remaining)
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
        customerNumber={selectedCallForTranscript?.customer_number}
        callDirection={selectedCallForTranscript?.call_direction}
        callStatus={selectedCallForTranscript?.call_status}
        startedAt={selectedCallForTranscript?.started_at}
        endedAt={selectedCallForTranscript?.ended_at}
      />
    </Card>
  );
};
