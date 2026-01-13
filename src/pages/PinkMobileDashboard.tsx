import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, LogOut, User, Headphones } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { LiveSessionsPanel } from '@/components/pink-mobile/LiveSessionsPanel';
import { TicketDetailPanel } from '@/components/pink-mobile/TicketDetailPanel';
import { AIAnalyticsPanel } from '@/components/pink-mobile/AIAnalyticsPanel';
import { AIOutboundDialer } from '@/components/pink-mobile/AIOutboundDialer';
import { HumanAgentCallPanel } from '@/components/pink-mobile/HumanAgentCallPanel';
import { useTwilioVoice } from '@/hooks/useTwilioVoice';
import { supabase } from '@/integrations/supabase/client';
import { Call } from '@/types/call-center';

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const { userProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize Twilio Voice
  const {
    activeCall: twilioCall,
    isConnected,
    isMuted,
    isOnHold,
    isDeviceReady,
    isInitializing,
    answerCall: twilioAnswerCall,
    rejectCall: twilioRejectCall,
    hangupCall: twilioHangupCall,
    toggleMute,
    toggleHold,
    retryConnection,
  } = useTwilioVoice(() => {
    // Callback for when Twilio call disconnects
    console.log('[PinkMobile] Twilio call disconnected - clearing state');
    setActiveCall(null);
    setIncomingCall(null);
  });

  // Get current agent ID helper
  const getCurrentAgentId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      return agent?.id || null;
    } catch (error) {
      console.error('[PinkMobile] Error getting agent ID:', error);
      return null;
    }
  };

  // Set agent online/offline status
  useEffect(() => {
    let agentId: string | null = null;

    const setAgentOnline = async () => {
      agentId = await getCurrentAgentId();
      if (!agentId) return;

      console.log('[PinkMobile] Setting agent status to online:', agentId);
      await supabase
        .from('agents')
        .update({ status: 'online', updated_at: new Date().toISOString() })
        .eq('id', agentId);
    };

    const setAgentOffline = async () => {
      if (!agentId) return;
      console.log('[PinkMobile] Setting agent status to offline:', agentId);
      await supabase
        .from('agents')
        .update({ status: 'offline', updated_at: new Date().toISOString() })
        .eq('id', agentId);
    };

    setAgentOnline();
    return () => { setAgentOffline(); };
  }, []);

  // Subscribe to incoming calls and call updates
  useEffect(() => {
    let mounted = true;

    const initializeCallState = async () => {
      if (!mounted) return;

      const currentAgentId = await getCurrentAgentId();
      console.log('[PinkMobile] Initializing call state for agent:', currentAgentId);

      // Check for existing ringing calls
      const { data: ringingCalls } = await supabase
        .from('calls')
        .select('*')
        .eq('call_direction', 'inbound')
        .eq('call_status', 'ringing')
        .or(`agent_id.eq.${currentAgentId},agent_id.is.null`)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      // Check for existing active calls
      const { data: activeCalls } = await supabase
        .from('calls')
        .select('*')
        .eq('call_status', 'in-progress')
        .eq('agent_id', currentAgentId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!mounted) return;

      if (activeCalls && activeCalls.length > 0) {
        setActiveCall(activeCalls[0] as Call);
        setIncomingCall(null);
      } else if (ringingCalls && ringingCalls.length > 0) {
        setIncomingCall(ringingCalls[0] as Call);
      }
    };

    initializeCallState();

    // Auto-sync every 5 seconds
    const syncInterval = setInterval(async () => {
      const currentAgentId = await getCurrentAgentId();
      const { data: allCalls } = await supabase
        .from('calls')
        .select('*')
        .or('call_status.eq.ringing,call_status.eq.in-progress')
        .order('created_at', { ascending: false })
        .limit(5);

      // Check if current activeCall is still active in DB
      if (activeCall) {
        const stillActive = allCalls?.find(c => c.id === activeCall.id && c.call_status === 'in-progress');
        if (!stillActive) {
          console.log('[PinkMobile] Active call no longer in-progress, clearing state');
          setActiveCall(null);
          setIncomingCall(null);
          return;
        }
      }

      // Check if current incomingCall is still ringing in DB
      if (incomingCall) {
        const stillRinging = allCalls?.find(c => c.id === incomingCall.id && c.call_status === 'ringing');
        if (!stillRinging) {
          console.log('[PinkMobile] Incoming call no longer ringing, clearing state');
          setIncomingCall(null);
          return;
        }
      }

      if (allCalls && allCalls.length > 0) {
        // Check for active call
        const activeCallInDb = allCalls.find(c =>
          c.agent_id === currentAgentId && c.call_status === 'in-progress'
        );
        if (activeCallInDb && !activeCall) {
          setActiveCall(activeCallInDb as Call);
          setIncomingCall(null);
        }

        // Check for ringing calls
        if (!activeCall) {
          const ringingCallInDb = allCalls.find(c =>
            (c.agent_id === currentAgentId || !c.agent_id) &&
            c.call_status === 'ringing' &&
            c.call_direction === 'inbound'
          );
          if (ringingCallInDb && !incomingCall) {
            const callAge = Date.now() - new Date(ringingCallInDb.created_at).getTime();
            if (callAge < 15 * 60 * 1000) {
              setIncomingCall(ringingCallInDb as Call);
            }
          }
        }
      } else {
        // No active or ringing calls in DB, clear state
        if (activeCall || incomingCall) {
          console.log('[PinkMobile] No active calls in DB, clearing state');
          setActiveCall(null);
          setIncomingCall(null);
        }
      }
    }, 5000);

    // Real-time subscription
    const channel = supabase
      .channel('pink-mobile-calls')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'calls',
      }, async (payload) => {
        if (!mounted) return;
        const newCall = payload.new as Call;
        const currentAgentId = await getCurrentAgentId();

        const callAge = Date.now() - new Date(newCall.created_at).getTime();
        const isRecentCall = callAge < 15 * 60 * 1000;

        if (newCall.call_direction === 'inbound' &&
            newCall.call_status === 'ringing' &&
            (!newCall.agent_id || newCall.agent_id === currentAgentId) &&
            !activeCall &&
            isRecentCall) {
          setIncomingCall(newCall);
          toast({
            title: "Incoming Call",
            description: `Call from ${newCall.customer_number}`,
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
      }, async (payload) => {
        if (!mounted) return;
        const updatedCall = payload.new as Call;

        if (activeCall && updatedCall.id === activeCall.id) {
          setActiveCall(updatedCall);
          if (updatedCall.call_status === 'completed' || updatedCall.call_status === 'failed') {
            setActiveCall(null);
            setIncomingCall(null);
          }
        }

        if (incomingCall && updatedCall.id === incomingCall.id) {
          if (updatedCall.call_status === 'completed' || updatedCall.call_status === 'failed') {
            setIncomingCall(null);
          } else if (updatedCall.call_status === 'in-progress') {
            setIncomingCall(null);
            setActiveCall(updatedCall);
          }
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, [activeCall, incomingCall, toast]);

  // Callback to trigger refresh when a call is made
  const handleCallMade = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCallAnswered = (call: Call) => {
    console.log('[PinkMobile] Call answered:', call.id);
    setActiveCall(call);
    setIncomingCall(null);
  };

  const handleCallEnded = () => {
    console.log('[PinkMobile] Call ended');
    setActiveCall(null);
    setIncomingCall(null);
  };

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

      {/* Main Content - 5 Panels */}
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full grid grid-cols-12 gap-3">
          {/* Panel A: AI Outbound Dialer */}
          <div className="col-span-2 h-full overflow-hidden">
            <AIOutboundDialer onCallMade={handleCallMade} />
          </div>

          {/* Panel B: Live Sessions */}
          <div className="col-span-3 h-full overflow-hidden">
            <LiveSessionsPanel
              onSelectSession={setSelectedSession}
              selectedSessionId={selectedSession?.id}
              refreshKey={refreshKey}
            />
          </div>

          {/* Panel C: Ticket Detail */}
          <div className="col-span-3 h-full overflow-hidden">
            <TicketDetailPanel selectedSession={selectedSession} />
          </div>

          {/* Panel D: Analytics */}
          <div className="col-span-2 h-full overflow-hidden">
            <AIAnalyticsPanel />
          </div>

          {/* Panel E: Human Agent Call Panel - Compact box for incoming calls */}
          <div className="col-span-2 h-full overflow-hidden">
            <HumanAgentCallPanel
              twilioCall={twilioCall}
              isConnected={isConnected}
              isMuted={isMuted}
              isOnHold={isOnHold}
              isDeviceReady={isDeviceReady}
              isInitializing={isInitializing}
              answerCall={twilioAnswerCall}
              rejectCall={twilioRejectCall}
              hangupCall={twilioHangupCall}
              toggleMute={toggleMute}
              toggleHold={toggleHold}
              retryConnection={retryConnection}
              incomingDbCall={incomingCall}
              activeDbCall={activeCall}
              onCallAnswered={handleCallAnswered}
              onCallEnded={handleCallEnded}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
