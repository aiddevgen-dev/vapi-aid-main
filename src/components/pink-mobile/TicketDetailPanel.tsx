import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  MessageSquare,
  User,
  Target,
  CheckCircle,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { AISession } from '@/pages/PinkMobileDashboard';

interface TicketDetailPanelProps {
  selectedSession: AISession | null;
}

export const TicketDetailPanel = ({ selectedSession }: TicketDetailPanelProps) => {
  if (!selectedSession) {
    return (
      <Card className="h-full flex flex-col bg-card border-border">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-base">Ticket Detail</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select a session to view ticket details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const intents = selectedSession.intents_detected || [selectedSession.intent];
  const actions = selectedSession.actions_taken || [];

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardHeader className="pb-3 flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Ticket Detail</CardTitle>
          {selectedSession.ticket_id && (
            <Badge variant="outline" className="font-mono text-xs">
              {selectedSession.ticket_id}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Customer Info */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-pink-500/20">
                  <User className="h-4 w-4 text-pink-600" />
                </div>
                <div>
                  <p className="font-semibold">{selectedSession.customer_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedSession.customer_phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  {selectedSession.channel === 'voice' ? (
                    <Phone className="h-3 w-3 text-green-500" />
                  ) : (
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                  )}
                  <span className="capitalize">{selectedSession.channel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{new Date(selectedSession.started_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* Intents Detected */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                <Target className="h-3 w-3" />
                Intents Detected
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {intents.map((intent, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {intent}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions Taken */}
            {actions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Actions Taken
                </h4>
                <div className="space-y-1.5">
                  {actions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm p-2 rounded bg-green-500/10 border border-green-500/20"
                    >
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Impact */}
            {selectedSession.financial_impact && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  Financial Impact
                </h4>
                <p className="text-lg font-bold text-green-600">
                  {selectedSession.financial_impact}
                </p>
              </div>
            )}

            {/* Resolution */}
            <div className={`p-3 rounded-lg border ${
              selectedSession.status === 'escalated'
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-2 ${
                selectedSession.status === 'escalated' ? 'text-orange-600' : 'text-blue-600'
              }`}>
                {selectedSession.status === 'escalated' ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <CheckCircle className="h-3 w-3" />
                )}
                Resolution
              </h4>
              <p className={`text-sm font-medium ${
                selectedSession.status === 'escalated' ? 'text-orange-600' : 'text-blue-600'
              }`}>
                {selectedSession.status === 'active'
                  ? 'In Progress - Sara handling'
                  : selectedSession.status === 'escalated'
                  ? 'Escalated to Contact Centre'
                  : 'Completed by AI; No escalation'}
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
