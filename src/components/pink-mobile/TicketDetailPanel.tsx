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
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-base">Ticket Detail</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select a call to view details</p>
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
      <CardHeader className="pb-3 flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Call Details</CardTitle>
          <Badge
            variant="outline"
            className={`font-mono text-xs ${isActive ? 'bg-green-500/20 text-green-600 border-green-500/50' : ''}`}
          >
            {selectedSession.ticket_id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Lead Info */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-full ${isInbound ? 'bg-blue-500/20' : 'bg-pink-500/20'}`}>
                  {isInbound ? (
                    <PhoneIncoming className="h-4 w-4 text-blue-600" />
                  ) : (
                    <PhoneOutgoing className="h-4 w-4 text-pink-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold font-mono">{selectedSession.customer_phone}</p>
                    {isActive && (
                      <Badge className="text-[10px] bg-green-500 text-white animate-pulse">LIVE</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isInbound ? 'Inbound' : 'Outbound'} Call
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Started: {new Date(selectedSession.started_at).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Duration: {formatDuration(selectedSession.started_at, selectedSession.ended_at)}</span>
                </div>
              </div>
            </div>

            {/* Call Outcome */}
            <div className={`p-3 rounded-lg border ${
              isActive
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-2 ${
                isActive ? 'text-green-600' : 'text-blue-600'
              }`}>
                {isActive ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3" />
                )}
                Outcome
              </h4>
              <p className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-blue-600'}`}>
                {isActive
                  ? 'Call in Progress - Sara AI handling'
                  : 'Call Completed by AI'}
              </p>
            </div>

            {/* Transcript */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <MessageSquare className="h-3 w-3" />
                Transcript {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              </h4>
              {transcripts.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {transcripts.map((t) => (
                    <div
                      key={t.id}
                      className={`p-2 rounded text-xs ${
                        t.speaker === 'agent'
                          ? 'bg-pink-500/10 border border-pink-500/20 ml-4'
                          : 'bg-muted/50 border border-border mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`font-semibold ${t.speaker === 'agent' ? 'text-pink-600' : 'text-foreground'}`}>
                          {t.speaker === 'agent' ? 'Sara AI' : 'Customer'}
                        </span>
                      </div>
                      <p className="text-foreground">{t.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-xs border border-dashed border-border rounded">
                  {isActive ? 'Transcript will appear after call ends' : 'No transcript available'}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/30 border border-border text-center">
                <p className="text-lg font-bold text-foreground">{transcripts.length}</p>
                <p className="text-[10px] text-muted-foreground">Messages</p>
              </div>
              <div className="p-2 rounded bg-muted/30 border border-border text-center">
                <p className="text-lg font-bold text-foreground">
                  {transcripts.filter(t => t.speaker === 'agent').length}
                </p>
                <p className="text-[10px] text-muted-foreground">AI Responses</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
