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

interface IncomingCallPanelProps {
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

export const IncomingCallPanel = ({
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
}: IncomingCallPanelProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const [ringingDuration, setRingingDuration] = useState(0);

  // Timer for call duration when connected
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  // Timer for ringing duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (twilioCall && !isConnected) {
      interval = setInterval(() => {
        setRingingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRingingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [twilioCall, isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = async () => {
    console.log('[IncomingCallPanel] Answer button clicked');

    // Answer the Twilio call
    answerCall();

    // Update database call status
    const call = incomingDbCall || activeDbCall;
    if (call) {
      try {
        await supabase
          .from('calls')
          .update({ call_status: 'in-progress' })
          .eq('id', call.id);

        console.log('[IncomingCallPanel] Database call status updated to in-progress');
        onCallAnswered?.(call);
      } catch (err) {
        console.error('[IncomingCallPanel] Failed to update call status:', err);
      }
    }
  };

  const handleReject = async () => {
    console.log('[IncomingCallPanel] Reject/Decline button clicked');

    // Reject the Twilio call
    rejectCall();

    // Update database call status
    const call = incomingDbCall || activeDbCall;
    if (call) {
      try {
        await supabase
          .from('calls')
          .update({ call_status: 'failed' })
          .eq('id', call.id);

        console.log('[IncomingCallPanel] Database call status updated to failed');
        onCallEnded?.();
      } catch (err) {
        console.error('[IncomingCallPanel] Failed to update call status:', err);
      }
    }
  };

  const handleEnd = async () => {
    console.log('[IncomingCallPanel] End call button clicked');

    // Hang up the Twilio call
    hangupCall();

    // Update database call status
    const call = activeDbCall || incomingDbCall;
    if (call) {
      try {
        await supabase
          .from('calls')
          .update({
            call_status: 'completed',
            ended_at: new Date().toISOString()
          })
          .eq('id', call.id);

        console.log('[IncomingCallPanel] Database call status updated to completed');
        onCallEnded?.();
      } catch (err) {
        console.error('[IncomingCallPanel] Failed to update call status:', err);
      }
    }
  };

  const currentCall = activeDbCall || incomingDbCall;
  const hasIncomingCall = twilioCall && !isConnected;
  const hasActiveCall = isConnected;
  const showCallUI = twilioCall || currentCall;

  const getStatusBadge = () => {
    if (!isDeviceReady) {
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
          {isInitializing ? 'Connecting...' : 'Offline'}
        </Badge>
      );
    }
    if (hasActiveCall) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
          Connected
        </Badge>
      );
    }
    if (hasIncomingCall) {
      return (
        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 animate-pulse">
          Incoming
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
        Ready
      </Badge>
    );
  };

  return (
    <Card className="h-full flex flex-col bg-card border-2 border-green-500/30">
      <CardHeader className="pb-2 pt-3 flex-shrink-0">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              hasActiveCall
                ? 'bg-gradient-to-br from-green-500 to-green-600'
                : hasIncomingCall
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 animate-pulse'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}>
              {hasIncomingCall ? (
                <PhoneIncoming className="h-4 w-4 text-white" />
              ) : (
                <Phone className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <span className="font-semibold">Incoming Calls</span>
              <p className="text-[10px] text-muted-foreground font-normal">
                Human Agent Line
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-2 pb-3 flex flex-col">
        {!isDeviceReady && !isInitializing ? (
          // Not connected state
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Voice Not Connected</p>
            <p className="text-xs text-muted-foreground mb-4">
              Click below to connect to the voice service
            </p>
            <Button
              onClick={retryConnection}
              variant="outline"
              size="sm"
              className="border-primary/50"
            >
              <Phone className="h-4 w-4 mr-2" />
              Connect Voice
            </Button>
          </div>
        ) : isInitializing ? (
          // Initializing state
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium text-foreground">Connecting to Voice Service...</p>
            <p className="text-xs text-muted-foreground mt-1">Setting up Twilio device</p>
          </div>
        ) : showCallUI ? (
          // Active or incoming call UI
          <div className="flex-1 flex flex-col gap-3">
            {/* Caller Info */}
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  hasActiveCall ? 'bg-green-500/20' : 'bg-orange-500/20'
                }`}>
                  <User className={`h-5 w-5 ${hasActiveCall ? 'text-green-500' : 'text-orange-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {currentCall?.customer_number || 'Unknown Caller'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasActiveCall ? 'On Call' : 'Incoming Call from VAPI Transfer'}
                  </p>
                </div>
              </div>
            </div>

            {/* Call Duration / Ringing */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {hasActiveCall ? 'Call Duration' : 'Ringing'}
              </p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {hasActiveCall ? formatDuration(callDuration) : formatDuration(ringingDuration)}
              </p>
            </div>

            {/* Escalation Info (if available) */}
            {currentCall?.metadata && (
              <div className="p-2.5 rounded-lg border border-pink-500/30 bg-pink-500/5">
                <p className="text-[10px] text-muted-foreground mb-1">Transfer Reason</p>
                <p className="text-xs text-foreground">
                  {(currentCall.metadata as any)?.escalationReason ||
                   currentCall.notes ||
                   'Customer requested human agent'}
                </p>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex-1" />

            {hasIncomingCall ? (
              // Incoming call buttons
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleAnswer}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Answer
                </Button>
                <Button
                  onClick={handleReject}
                  variant="destructive"
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </div>
            ) : hasActiveCall ? (
              // Active call buttons
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={toggleMute}
                    variant={isMuted ? 'destructive' : 'secondary'}
                    size="sm"
                  >
                    {isMuted ? (
                      <MicOff className="mr-1 h-3 w-3" />
                    ) : (
                      <Mic className="mr-1 h-3 w-3" />
                    )}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  <Button
                    onClick={toggleHold}
                    variant={isOnHold ? 'destructive' : 'secondary'}
                    size="sm"
                  >
                    {isOnHold ? (
                      <Play className="mr-1 h-3 w-3" />
                    ) : (
                      <Pause className="mr-1 h-3 w-3" />
                    )}
                    {isOnHold ? 'Resume' : 'Hold'}
                  </Button>
                </div>
                <Button
                  onClick={handleEnd}
                  variant="destructive"
                  className="w-full"
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Call
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          // Ready state - waiting for calls
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border-2 border-green-500/30">
              <Phone className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Ready for Calls</p>
            <p className="text-xs text-muted-foreground">
              Waiting for transferred calls from Sara AI
            </p>
            <div className="mt-4 p-2.5 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20">
              <p className="text-[10px] text-muted-foreground">
                Twilio Line: +1 (765) 676-3105
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
