import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, MessageSquare, TrendingUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AISession } from '@/pages/PinkMobileDashboard';

interface LiveSessionsPanelProps {
  onSelectSession: (session: AISession) => void;
  selectedSessionId?: string;
}

export const LiveSessionsPanel = ({ onSelectSession, selectedSessionId }: LiveSessionsPanelProps) => {
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('ai_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_sessions' }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('ai_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching sessions:', error);
    } else if (data) {
      setSessions(data.map((s: any) => ({
        id: s.id,
        customer_name: s.customer_name,
        customer_phone: s.customer_phone,
        channel: s.channel as 'voice' | 'chat',
        intent: s.intent || '',
        promo: s.promo,
        outcome: s.outcome,
        financial_impact: s.financial_impact,
        status: s.status as 'active' | 'completed' | 'escalated',
        started_at: s.started_at,
        ended_at: s.ended_at,
        ticket_id: s.id.replace('sess_', 'PMK-'),
        intents_detected: s.intents_detected,
        actions_taken: s.actions_taken,
      })));
    }
    setLoading(false);
  };

  const getStatusIcon = (status: AISession['status']) => {
    switch (status) {
      case 'active':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'escalated':
        return <AlertCircle className="h-3 w-3 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: AISession['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="text-[10px] bg-blue-500/20 text-blue-600 border-blue-500/30">Live</Badge>;
      case 'completed':
        return <Badge className="text-[10px] bg-green-500/20 text-green-600 border-green-500/30">AI Done</Badge>;
      case 'escalated':
        return <Badge className="text-[10px] bg-orange-500/20 text-orange-600 border-orange-500/30">Escalated</Badge>;
    }
  };

  const getChannelIcon = (channel: AISession['channel']) => {
    return channel === 'voice'
      ? <Phone className="h-3 w-3" />
      : <MessageSquare className="h-3 w-3" />;
  };

  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const completedToday = sessions.filter(s => s.status === 'completed').length;

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Live Sessions</span>
          <div className="flex items-center gap-2">
            {activeSessions > 0 && (
              <Badge className="text-[10px] bg-blue-500 text-white animate-pulse">
                {activeSessions} Active
              </Badge>
            )}
          </div>
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{completedToday} completed today</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No sessions yet
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSessionId === session.id
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/30'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
                        session.channel === 'voice' ? 'bg-green-500/20' : 'bg-blue-500/20'
                      }`}>
                        {getChannelIcon(session.channel)}
                      </div>
                      <span className="font-medium text-sm">{session.customer_name}</span>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>

                  {/* Intent */}
                  <div className="text-xs text-muted-foreground mb-1">
                    Intent: <span className="text-foreground font-medium">{session.intent}</span>
                  </div>

                  {/* Promo if exists */}
                  {session.promo && (
                    <div className="text-xs text-pink-600 mb-1">
                      Promo: {session.promo}
                    </div>
                  )}

                  {/* Outcome/Financial */}
                  {session.outcome && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      {session.outcome}
                    </div>
                  )}

                  {/* Status indicator */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      {getStatusIcon(session.status)}
                      <span>
                        {session.status === 'active'
                          ? 'Sara handling...'
                          : session.status === 'escalated'
                          ? 'Transferred to agent'
                          : 'Completed by AI'}
                      </span>
                    </div>
                    {session.ticket_id && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {session.ticket_id}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
