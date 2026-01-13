import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  PhoneOff,
  User,
  Mic,
  MicOff,
  Pause,
  Play,
  PhoneIncoming,
  Loader2
} from 'lucide-react';
import { Call as DbCall } from '@/types/call-center';
import { supabase } from '@/integrations/supabase/client';
import { ActiveCallDialogPink } from './ActiveCallDialogPink';

interface HumanAgentCallPanelProps {
  // Twilio state
  twilioCall: any;
  isConnected: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  isDeviceReady: boolean;
  isInitializing: boolean;
  // Twilio functions
  answerCall: () => void;
  rejectCall: () => void;
  hangupCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  retryConnection: () => void;
  // Database call
  incomingDbCall: DbCall | null;
  activeDbCall: DbCall | null;
  onCallAnswered?: (call: DbCall) => void;
  onCallEnded?: () => void;
}

export const HumanAgentCallPanel = ({
  twilioCall,
  isConnected,
  isMuted,
  isOnHold,
  isDeviceReady,
  isInitializing,
  answerCall,
  rejectCall,
  hangupCall,
  toggleMute,
  toggleHold,
  retryConnection,
  incomingDbCall,
  activeDbCall,
  onCallAnswered,
  onCallEnded
}: HumanAgentCallPanelProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const [ringingDuration, setRingingDuration] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogCall, setDialogCall] = useState<DbCall | null>(null);

  const currentCall = activeDbCall || incomingDbCall;

  // Keep dialogCall in sync with activeDbCall when available
  useEffect(() => {
    if (activeDbCall) {
      setDialogCall(activeDbCall);
    }
  }, [activeDbCall]);

  // Auto-open dialog when there's an active in-progress call (e.g., page refresh during call)
  useEffect(() => {
    if (activeDbCall?.call_status === 'in-progress' && isConnected && !dialogCall) {
      setDialogCall(activeDbCall);
      setIsDialogOpen(true);
    }
  }, [activeDbCall?.call_status, isConnected]);
  const hasIncomingCall = (twilioCall && !isConnected) || (incomingDbCall && incomingDbCall.call_status === 'ringing');
  const hasActiveCall = isConnected || (activeDbCall && activeDbCall.call_status === 'in-progress');
  const showCallUI = twilioCall || currentCall;

  // Timer for call duration when connected
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isConnected || (activeDbCall && activeDbCall.call_status === 'in-progress')) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, activeDbCall]);

  // Timer for ringing duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (hasIncomingCall && !hasActiveCall) {
      interval = setInterval(() => {
        setRingingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRingingDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasIncomingCall, hasActiveCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = async () => {
    console.log('[HumanAgentCallPanel] Answer button clicked');
    answerCall();

    const call = incomingDbCall || activeDbCall;
    if (call) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: agent } = await supabase
            .from('agents')
            .select('id')
            .eq('user_id', user.id)
            .single();

          await supabase
            .from('calls')
            .update({
              call_status: 'in-progress',
              agent_id: agent?.id,
              started_at: new Date().toISOString()
            })
            .eq('id', call.id);

          // Start transcription
          await supabase.functions.invoke('twilio-start-transcription', {
            body: { callId: call.id }
          });

          // Set the call for dialog BEFORE opening to ensure it has data immediately
          setDialogCall(call);
          onCallAnswered?.(call);
          setIsDialogOpen(true);
        }
      } catch (err) {
        console.error('[HumanAgentCallPanel] Failed to update call status:', err);
      }
    }
  };

  const handleReject = async () => {
    console.log('[HumanAgentCallPanel] Reject button clicked');
    rejectCall();

    const call = incomingDbCall || activeDbCall;
    if (call) {
      // Update database directly first
      try {
        await supabase
          .from('calls')
          .update({
            call_status: 'failed',
            ended_at: new Date().toISOString()
          })
          .eq('id', call.id);
        console.log('[HumanAgentCallPanel] Database updated to failed');
      } catch (err) {
        console.error('[HumanAgentCallPanel] Failed to update database:', err);
      }

      // Also try edge function to end Twilio call
      try {
        await supabase.functions.invoke('twilio-end-call', {
          body: { callId: call.id }
        });
      } catch (err) {
        console.error('[HumanAgentCallPanel] Failed to call edge function:', err);
      }
    }
    onCallEnded?.();
    setIsDialogOpen(false);
    setDialogCall(null);
  };

  const handleEnd = async () => {
    console.log('[HumanAgentCallPanel] End call button clicked');
    hangupCall();

    const call = activeDbCall || incomingDbCall;
    if (call) {
      // Update database directly first
      try {
        await supabase
          .from('calls')
          .update({
            call_status: 'completed',
            ended_at: new Date().toISOString()
          })
          .eq('id', call.id);
        console.log('[HumanAgentCallPanel] Database updated to completed');
      } catch (err) {
        console.error('[HumanAgentCallPanel] Failed to update database:', err);
      }

      // Also try edge function to end Twilio call
      try {
        await supabase.functions.invoke('twilio-end-call', {
          body: { callId: call.id }
        });
      } catch (err) {
        console.error('[HumanAgentCallPanel] Failed to call edge function:', err);
      }
    }
    onCallEnded?.();
    setIsDialogOpen(false);
    setDialogCall(null);
  };

  const getStatusBadge = () => {
    if (!isDeviceReady) {
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[10px]">
          {isInitializing ? 'Connecting...' : 'Offline'}
        </Badge>
      );
    }
    if (hasActiveCall) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">
          On Call
        </Badge>
      );
    }
    if (hasIncomingCall) {
      return (
        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 animate-pulse text-[10px]">
          Ringing
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">
        Ready
      </Badge>
    );
  };

  return (
    <>
      <Card className="h-full flex flex-col bg-card border border-green-500/30">
        <CardHeader className="pb-1 lg:pb-2 pt-2 lg:pt-3 px-2 lg:px-3 flex-shrink-0">
          <CardTitle className="text-xs lg:text-sm flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
              <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                hasActiveCall
                  ? 'bg-gradient-to-br from-green-500 to-green-600'
                  : hasIncomingCall
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 animate-pulse'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                {hasIncomingCall ? (
                  <PhoneIncoming className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-white" />
                ) : (
                  <Phone className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-white" />
                )}
              </div>
              <span className="font-semibold text-[10px] lg:text-xs truncate">Human Line</span>
            </div>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden pt-1 pb-2 lg:pb-3 px-2 lg:px-3 flex flex-col">
          {!isDeviceReady && !isInitializing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Phone className="h-6 w-6 lg:h-8 lg:w-8 text-muted-foreground mb-1.5 lg:mb-2" />
              <p className="text-[10px] lg:text-xs font-medium mb-1.5 lg:mb-2">Voice Offline</p>
              <Button onClick={retryConnection} variant="outline" size="sm" className="text-[10px] lg:text-xs h-6 lg:h-7 px-2">
                <Phone className="h-2.5 w-2.5 lg:h-3 lg:w-3 mr-1" />
                Connect
              </Button>
            </div>
          ) : isInitializing ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="h-5 w-5 lg:h-6 lg:w-6 animate-spin text-primary mb-1.5 lg:mb-2" />
              <p className="text-[10px] lg:text-xs text-muted-foreground">Connecting...</p>
            </div>
          ) : showCallUI ? (
            <div className="flex-1 flex flex-col gap-1.5 lg:gap-2">
              {/* Caller Info */}
              <div className="p-1.5 lg:p-2 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-1.5 lg:gap-2">
                  <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    hasActiveCall ? 'bg-green-500/20' : 'bg-orange-500/20'
                  }`}>
                    <User className={`h-3 w-3 lg:h-3.5 lg:w-3.5 ${hasActiveCall ? 'text-green-500' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] lg:text-xs truncate">
                      {currentCall?.customer_number || 'Unknown'}
                    </p>
                    <p className="text-[9px] lg:text-[10px] text-muted-foreground">
                      {hasActiveCall ? `${formatDuration(callDuration)}` : `Ringing ${formatDuration(ringingDuration)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Reason */}
              {currentCall?.notes && (
                <div className="p-1.5 lg:p-2 rounded-lg border border-pink-500/30 bg-pink-500/5">
                  <p className="text-[9px] lg:text-[10px] text-muted-foreground">Reason</p>
                  <p className="text-[10px] lg:text-xs truncate">{currentCall.notes}</p>
                </div>
              )}

              <div className="flex-1" />

              {/* Call Controls */}
              {hasIncomingCall && !hasActiveCall ? (
                <div className="grid grid-cols-2 gap-1 lg:gap-1.5">
                  <Button onClick={handleAnswer} size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 lg:h-8 text-[10px] lg:text-xs px-1 lg:px-2">
                    <Phone className="h-3 w-3" />
                    <span className="hidden xl:inline ml-1">Answer</span>
                  </Button>
                  <Button onClick={handleReject} size="sm" variant="destructive" className="h-7 lg:h-8 text-[10px] lg:text-xs px-1 lg:px-2">
                    <PhoneOff className="h-3 w-3" />
                    <span className="hidden xl:inline ml-1">Decline</span>
                  </Button>
                </div>
              ) : hasActiveCall ? (
                <div className="space-y-1 lg:space-y-1.5">
                  <div className="grid grid-cols-2 gap-1 lg:gap-1.5">
                    <Button onClick={toggleMute} variant={isMuted ? 'destructive' : 'secondary'} size="sm" className="h-6 lg:h-7 text-[10px] lg:text-xs">
                      {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    </Button>
                    <Button onClick={toggleHold} variant={isOnHold ? 'destructive' : 'secondary'} size="sm" className="h-6 lg:h-7 text-[10px] lg:text-xs">
                      {isOnHold ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    </Button>
                  </div>
                  <Button onClick={handleEnd} variant="destructive" size="sm" className="w-full h-6 lg:h-7 text-[10px] lg:text-xs">
                    <PhoneOff className="h-3 w-3" />
                    <span className="ml-1">End</span>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-1.5 lg:mb-2 border border-green-500/30">
                <Phone className="h-4 w-4 lg:h-5 lg:w-5 text-green-500" />
              </div>
              <p className="text-[10px] lg:text-xs font-medium">Ready</p>
              <p className="text-[9px] lg:text-[10px] text-muted-foreground">Waiting for calls</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Call Dialog with Transcript & AI Suggestions */}
      <ActiveCallDialogPink
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        activeCall={dialogCall}
        isConnected={isConnected}
        isMuted={isMuted}
        isOnHold={isOnHold}
        callDuration={callDuration}
        toggleMute={toggleMute}
        toggleHold={toggleHold}
        onEndCall={handleEnd}
      />
    </>
  );
};
