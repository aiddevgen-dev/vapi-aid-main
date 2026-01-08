import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, MessageSquare, TrendingUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { AISession } from '@/pages/PinkMobileDashboard';

interface LiveSessionsPanelProps {
  onSelectSession: (session: AISession) => void;
  selectedSessionId?: string;
}

// Demo data - will be replaced with real VAPI data
const demoSessions: AISession[] = [
  {
    id: '1',
    customer_name: 'Marco L.',
    customer_phone: '+1-555-0123',
    channel: 'voice',
    intent: 'Add Line',
    promo: '5-Line Free iPad',
    outcome: '+$150 MRR',
    financial_impact: '+150 USD',
    status: 'completed',
    started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ended_at: new Date().toISOString(),
    ticket_id: 'PMK-8723',
  },
  {
    id: '2',
    customer_name: 'Lena K.',
    customer_phone: '+1-555-0456',
    channel: 'chat',
    intent: 'Roaming Inquiry',
    outcome: 'Europe Pass Activated',
    financial_impact: '+74 USD avg',
    status: 'completed',
    started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    ticket_id: 'PMK-5491',
  },
  {
    id: '3',
    customer_name: 'James R.',
    customer_phone: '+1-555-0789',
    channel: 'voice',
    intent: 'Billing Question',
    status: 'active',
    started_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    customer_name: 'Sarah M.',
    customer_phone: '+1-555-0321',
    channel: 'voice',
    intent: 'Technical Support',
    status: 'escalated',
    started_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    ticket_id: 'PMK-5502',
  },
];

export const LiveSessionsPanel = ({ onSelectSession, selectedSessionId }: LiveSessionsPanelProps) => {
  const [sessions, setSessions] = useState<AISession[]>(demoSessions);

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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
