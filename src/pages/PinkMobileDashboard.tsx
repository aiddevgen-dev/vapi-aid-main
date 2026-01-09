import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, LogOut, User, Headphones } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { LiveSessionsPanel } from '@/components/pink-mobile/LiveSessionsPanel';
import { TicketDetailPanel } from '@/components/pink-mobile/TicketDetailPanel';
import { AIAnalyticsPanel } from '@/components/pink-mobile/AIAnalyticsPanel';

export interface AISession {
  id: string;
  customer_name: string;
  customer_phone: string;
  channel: 'voice' | 'chat';
  intent: string;
  promo?: string;
  outcome?: string;
  financial_impact?: string;
  status: 'active' | 'completed' | 'escalated';
  started_at: string;
  ended_at?: string;
  ticket_id?: string;
  intents_detected?: string[];
  actions_taken?: string[];
}

export interface AITicket {
  id: string;
  session_id: string;
  customer_name: string;
  channel: 'voice' | 'chat';
  intents_detected: string[];
  actions_taken: string[];
  financial_impact?: string;
  resolution: string;
  created_at: string;
}

export const PinkMobileDashboard = () => {
  const [selectedSession, setSelectedSession] = useState<AISession | null>(null);
  const { userProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  const handleOpenContactCentre = () => {
    navigate('/agent');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b bg-background z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground">PINK Mobile</h1>
              <span className="text-xs text-muted-foreground">Sara AI Operations</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-pink-500/50 text-pink-600 bg-pink-500/10">
            AI-Powered Support
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Contact Centre Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenContactCentre}
            className="flex items-center gap-2 border-primary/50 hover:bg-primary/10"
          >
            <Headphones className="h-4 w-4" />
            Contact Centre
          </Button>

          {/* User Info and Logout */}
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 border border-pink-500/30 rounded-lg">
              <User className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-medium text-foreground">
                {userProfile?.full_name || userProfile?.email || 'Operator'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-foreground hover:bg-primary/20"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panels */}
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full grid grid-cols-12 gap-4">
          {/* Panel A: Live Sessions */}
          <div className="col-span-3 h-full overflow-hidden">
            <LiveSessionsPanel
              onSelectSession={setSelectedSession}
              selectedSessionId={selectedSession?.id}
            />
          </div>

          {/* Panel B: Ticket Detail */}
          <div className="col-span-5 h-full overflow-hidden">
            <TicketDetailPanel selectedSession={selectedSession} />
          </div>

          {/* Panel C: Analytics */}
          <div className="col-span-4 h-full overflow-hidden">
            <AIAnalyticsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
