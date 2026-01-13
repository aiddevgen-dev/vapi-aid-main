import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  MessageSquare,
  User,
  Target,
  CheckCircle,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AISession } from '@/pages/PinkMobileDashboard';

interface TicketDetailPanelProps {
  selectedSession: AISession | null;
}

interface TranscriptEntry {
  id: string;
  speaker: 'agent' | 'customer';
  text: string;
  created_at: string;
}

export const TicketDetailPanel = ({ selectedSession }: TicketDetailPanelProps) => {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch transcripts when session changes
  useEffect(() => {
    if (selectedSession?.id) {
      fetchTranscripts(selectedSession.id);
    } else {
      setTranscripts([]);
    }
  }, [selectedSession?.id]);

  const fetchTranscripts = async (callId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transcripts')
        .select('id, speaker, text, created_at')
        .eq('call_id', callId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching transcripts:', error);
      } else {
        setTranscripts((data || []).map(t => ({
          id: t.id,
          speaker: t.speaker as 'agent' | 'customer',
          text: t.text || '',
          created_at: t.created_at,
        })));
      }
    } catch (err) {
      console.error('Error in fetchTranscripts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedSession) {
    return (
      <Card className="h-full flex flex-col bg-card border-border">
        <CardHeader className="pb-2 lg:pb-3 pt-2 lg:pt-3 px-2 lg:px-4 flex-shrink-0">
          <CardTitle className="text-sm lg:text-base">Call Details</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 lg:h-12 lg:w-12 mx-auto mb-2 lg:mb-3 opacity-50" />
            <p className="text-[10px] lg:text-sm">Select a call to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isInbound = selectedSession.intent?.toLowerCase().includes('inbound');
  const isActive = selectedSession.status === 'active';

  const formatDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardHeader className="pb-2 lg:pb-3 pt-2 lg:pt-3 px-2 lg:px-4 flex-shrink-0 border-b">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm lg:text-base">Call Details</CardTitle>
          <Badge
            variant="outline"
            className={`font-mono text-[9px] lg:text-xs px-1 lg:px-1.5 ${isActive ? 'bg-green-500/20 text-green-600 border-green-500/50' : ''}`}
          >
            {selectedSession.ticket_id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-2 lg:p-4 space-y-2 lg:space-y-4">
            {/* Lead Info */}
            <div className="p-2 lg:p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                <div className={`p-1.5 lg:p-2 rounded-full flex-shrink-0 ${isInbound ? 'bg-blue-500/20' : 'bg-pink-500/20'}`}>
                  {isInbound ? (
                    <PhoneIncoming className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600" />
                  ) : (
                    <PhoneOutgoing className="h-3 w-3 lg:h-4 lg:w-4 text-pink-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 lg:gap-2">
                    <p className="font-semibold font-mono text-[10px] lg:text-sm truncate">{selectedSession.customer_phone}</p>
                    {isActive && (
                      <Badge className="text-[8px] lg:text-[10px] bg-green-500 text-white animate-pulse px-1">LIVE</Badge>
                    )}
                  </div>
                  <p className="text-[9px] lg:text-xs text-muted-foreground">
                    {isInbound ? 'Inbound' : 'Outbound'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 lg:gap-2 text-[9px] lg:text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{new Date(selectedSession.started_at).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-muted-foreground flex-shrink-0" />
                  <span>{formatDuration(selectedSession.started_at, selectedSession.ended_at)}</span>
                </div>
              </div>
            </div>

            {/* Call Outcome */}
            <div className={`p-2 lg:p-3 rounded-lg border ${
              isActive
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <h4 className={`text-[9px] lg:text-xs font-semibold uppercase tracking-wide mb-0.5 lg:mb-1 flex items-center gap-1 lg:gap-2 ${
                isActive ? 'text-green-600' : 'text-blue-600'
              }`}>
                {isActive ? (
                  <Loader2 className="h-2.5 w-2.5 lg:h-3 lg:w-3 animate-spin" />
                ) : (
                  <CheckCircle className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                )}
                Outcome
              </h4>
              <p className={`text-[10px] lg:text-sm font-medium ${isActive ? 'text-green-600' : 'text-blue-600'}`}>
                {isActive
                  ? 'In Progress - Sara AI'
                  : 'Completed by AI'}
              </p>
            </div>

            {/* Transcript */}
            <div>
              <h4 className="text-[9px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 lg:mb-2 flex items-center gap-1 lg:gap-2">
                <MessageSquare className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                Transcript {loading && <Loader2 className="h-2.5 w-2.5 lg:h-3 lg:w-3 animate-spin" />}
              </h4>
              {transcripts.length > 0 ? (
                <div className="space-y-1.5 lg:space-y-2 max-h-32 lg:max-h-48 overflow-y-auto">
                  {transcripts.map((t) => (
                    <div
                      key={t.id}
                      className={`p-1.5 lg:p-2 rounded text-[9px] lg:text-xs ${
                        t.speaker === 'agent'
                          ? 'bg-pink-500/10 border border-pink-500/20 ml-2 lg:ml-4'
                          : 'bg-muted/50 border border-border mr-2 lg:mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5 lg:mb-1">
                        <span className={`font-semibold text-[9px] lg:text-xs ${t.speaker === 'agent' ? 'text-pink-600' : 'text-foreground'}`}>
                          {t.speaker === 'agent' ? 'Sara' : 'Customer'}
                        </span>
                      </div>
                      <p className="text-foreground">{t.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 lg:py-4 text-muted-foreground text-[9px] lg:text-xs border border-dashed border-border rounded">
                  {isActive ? 'Transcript after call' : 'No transcript'}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
              <div className="p-1.5 lg:p-2 rounded bg-muted/30 border border-border text-center">
                <p className="text-sm lg:text-lg font-bold text-foreground">{transcripts.length}</p>
                <p className="text-[8px] lg:text-[10px] text-muted-foreground">Messages</p>
              </div>
              <div className="p-1.5 lg:p-2 rounded bg-muted/30 border border-border text-center">
                <p className="text-sm lg:text-lg font-bold text-foreground">
                  {transcripts.filter(t => t.speaker === 'agent').length}
                </p>
                <p className="text-[8px] lg:text-[10px] text-muted-foreground">AI Resp</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
