import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, PhoneOutgoing, Mic, MicOff, Pause, Play } from 'lucide-react';
import { Call } from '@/types/call-center';
import { supabase } from '@/integrations/supabase/client';

interface CallPanelProps {
  activeCall: Call | null;
  incomingCall: Call | null;
  onAnswerCall: (call?: Call) => void;
  onEndCall: () => void;
  onDeclineCall: (call: Call) => void;
  onClearDashboard: () => void;
  // Twilio state and functions passed from parent
  twilioCall: any;
  isConnected: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  isDeviceReady: boolean;
  isInitializing: boolean;
  toggleMute: () => void;
  toggleHold: () => void;
  retryConnection: () => void;
}

export const CallPanel = ({
  activeCall: dbCall,
  incomingCall,
  onAnswerCall,
  onEndCall,
  onDeclineCall,
  onClearDashboard,
  twilioCall,
  isConnected,
  isMuted,
  isOnHold,
  isDeviceReady,
  isInitializing,
  toggleMute,
  toggleHold,
  retryConnection
}: CallPanelProps) => {
  const [callDuration, setCallDuration] = useState(0);

  // Debug: Log props received EVERY time they change
  useEffect(() => {
    console.log('🔵 [CALLPANEL DEBUG] Props received:', {
      dbCall: dbCall,
      incomingCall: incomingCall,
      dbCallExists: !!dbCall,
      incomingCallExists: !!incomingCall,
      dbCallId: dbCall?.id || 'NONE',
      incomingCallId: incomingCall?.id || 'NONE',
      dbCallStatus: dbCall?.call_status || 'NONE',
      incomingCallStatus: incomingCall?.call_status || 'NONE',
      dbCallCustomer: dbCall?.customer_number || 'NONE',
      incomingCallCustomer: incomingCall?.customer_number || 'NONE'
    });

    // Also log if we have ANY call to answer
    const callToAnswer = dbCall || incomingCall;
    console.log('🔵 [CALLPANEL DEBUG] Can answer call?', {
      hasCallToAnswer: !!callToAnswer,
      callId: callToAnswer?.id || 'NONE',
      source: dbCall ? 'activeCall' : incomingCall ? 'incomingCall' : 'NO_CALL'
    });
  }, [dbCall, incomingCall]);

  // Timer for call duration
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = async () => {
    console.log('🔵 CallPanel Answer button clicked!');
    console.log('🔵 CallPanel Props check:', {
      dbCall,
      incomingCall,
      dbCallExists: !!dbCall,
      incomingCallExists: !!incomingCall,
      dbCallId: dbCall?.id || 'none',
      incomingCallId: incomingCall?.id || 'none',
      dbCallStatus: dbCall?.call_status || 'none',
      incomingCallStatus: incomingCall?.call_status || 'none'
    });

    let callToAnswer = dbCall || incomingCall;
    console.log('🔵 CallPanel callToAnswer selected:', {
      callToAnswer: !!callToAnswer,
      callId: callToAnswer?.id || 'none',
      callStatus: callToAnswer?.call_status || 'none',
      source: dbCall ? 'dbCall' : incomingCall ? 'incomingCall' : 'none'
    });

    // If no call in props, try to get the latest call directly from database
    if (!callToAnswer) {
      console.log('🔍 CallPanel: No call in props, checking database directly...');
      try {
        const { data: availableCalls, error } = await supabase
          .from('calls')
          .select('*')
          .eq('call_status', 'ringing')
          .eq('call_direction', 'inbound')
          .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (availableCalls && availableCalls.length > 0) {
          callToAnswer = availableCalls[0];
          console.log('✅ CallPanel: Found call in database:', callToAnswer?.id);
        }
      } catch (dbError) {
        console.error('❌ CallPanel: Database query failed:', dbError);
      }
    }

    if (!callToAnswer) {
      console.error('❌ CallPanel: No call to answer (checked props and database)');
      console.error('❌ Current state - activeCall:', !!dbCall, 'incomingCall:', !!incomingCall);
      return;
    }

    // Call parent handler which handles BOTH Twilio answer + database update
    console.log('🔵 CallPanel calling onAnswerCall with:', callToAnswer.id);
    onAnswerCall(callToAnswer);
  };

  const handleEnd = () => {
    console.log('🔚 CallPanel: End button clicked');
    // Parent handler now manages both Twilio hangup + database update
    onEndCall();
  };

  const handleReject = async () => {
    console.log('🚫 CallPanel: Reject/Decline button clicked');

    // If there's an incoming call, use decline handler (rejects Twilio + updates DB)
    if (incomingCall) {
      console.log('🚫 Declining incoming call:', incomingCall.id);
      onDeclineCall(incomingCall);
      return;
    }

    // If there's an active call, end it
    if (dbCall) {
      console.log('🔚 Ending active call:', dbCall.id);
      onEndCall();
      return;
    }

    // If state is empty but Twilio has a call, query database directly
    if (twilioCall) {
      console.log('🔍 No call in state but Twilio call exists, checking database...');
      try {
        const { data: ringingCalls, error } = await supabase
          .from('calls')
          .select('*')
          .eq('call_status', 'ringing')
          .eq('call_direction', 'inbound')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (ringingCalls && ringingCalls.length > 0) {
          const call = ringingCalls[0];
          console.log('✅ Found call in database:', call.id, 'declining it now');
          onDeclineCall(call);
          return;
        }
      } catch (err) {
        console.error('❌ Failed to query database for call:', err);
      }
    }

    console.warn('⚠️ No call to reject/end anywhere (state, Twilio, or database)');
  };

  const isOutboundCall = dbCall?.call_direction === 'outbound';

  const getCallStatus = () => {
    if (!isDeviceReady) return "Initializing...";
    if (twilioCall && !isConnected) return isOutboundCall ? "Dialing" : "Incoming";
    if (isConnected) return "Connected";
    if (dbCall && !twilioCall) return isOutboundCall ? "Dialing" : "Waiting";
    return "Ready";
  };

  const getStatusBadgeVariant = (): "secondary" | "default" | "destructive" | "outline" => {
    if (!isDeviceReady) return "secondary";
    if (isConnected) return "default";
    if (twilioCall || dbCall) return "destructive";
    return "secondary";
  };

  return (
    <Card className="h-full bg-sidebar border-sidebar-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-sidebar-foreground flex items-center justify-between">
          Call Control
          <Badge variant={getStatusBadgeVariant()}>
            {getCallStatus()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(dbCall || incomingCall || twilioCall) ? (
          <>
            <div className="bg-sidebar-accent p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-sidebar-accent-foreground">
                {isOutboundCall ? (
                  <>
                    <PhoneOutgoing className="h-3 w-3" />
                    Calling
                  </>
                ) : (
                  <>
                    <Phone className="h-3 w-3" />
                    Customer Number
                  </>
                )}
              </div>
              <p className="text-lg font-mono text-sidebar-foreground">
                {(dbCall || incomingCall)?.customer_number || 'Unknown'}
              </p>
            </div>
            
            <div className="bg-sidebar-accent p-4 rounded-lg">
              <p className="text-sm font-medium text-sidebar-accent-foreground">
                Call Duration
              </p>
              <p className="text-lg font-mono text-sidebar-foreground">
                {isConnected ? formatDuration(callDuration) : "Waiting..."}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {!isConnected && twilioCall ? (
                isOutboundCall ? (
                  <Button
                    onClick={handleEnd}
                    variant="destructive"
                    className="w-full"
                  >
                    <PhoneOff className="mr-2 h-4 w-4" />
                    Cancel Call
                  </Button>
                ) : (
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
                )
              ) : isConnected ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={toggleMute} 
                      variant={isMuted ? "destructive" : "secondary"}
                      size="sm"
                    >
                      {isMuted ? (
                        <MicOff className="mr-1 h-3 w-3" />
                      ) : (
                        <Mic className="mr-1 h-3 w-3" />
                      )}
                      {isMuted ? "Unmute" : "Mute"}
                    </Button>
                    <Button 
                      onClick={toggleHold} 
                      variant={isOnHold ? "destructive" : "secondary"}
                      size="sm"
                    >
                      {isOnHold ? (
                        <Play className="mr-1 h-3 w-3" />
                      ) : (
                        <Pause className="mr-1 h-3 w-3" />
                      )}
                      {isOnHold ? "Resume" : "Hold"}
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
                </>
              ) : (dbCall || incomingCall) && !twilioCall ? (
                <Button 
                  onClick={handleAnswer} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={!isDeviceReady}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  {isDeviceReady ? "Answer Call" : "Initializing..."}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Phone className="mx-auto h-12 w-12 text-sidebar-primary mb-4" />
            <p className="text-sidebar-foreground font-medium">
              {isDeviceReady ? "Ready for Calls" : isInitializing ? "Connecting..." : "Connection Failed"}
            </p>
            <p className="text-sm text-sidebar-accent-foreground mt-2">
              {isDeviceReady 
                ? "Waiting for incoming calls" 
                : isInitializing 
                  ? "Setting up Twilio voice device" 
                  : "Unable to connect to voice service"
              }
            </p>
            {!isDeviceReady && !isInitializing && (
              <button 
                onClick={retryConnection}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
              >
                Retry Connection
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};