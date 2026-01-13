import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  PhoneOff,
  User,
  Mic,
  MicOff,
  Pause,
  Play,
  PhoneIncoming,
  Loader2,
  MessageSquare,
  Headphones,
  Sparkles,
  Lightbulb,
  Copy,
  CheckCircle
} from 'lucide-react';
import { Call as DbCall } from '@/types/call-center';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transcript {
  id: string;
  speaker: string;
  text: string;
  created_at: string;
}

interface Suggestion {
  id: string;
  text: string;
  created_at: string;
}

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
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [copiedSuggestions, setCopiedSuggestions] = useState<Set<string>>(new Set());
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentCall = activeDbCall || incomingDbCall;
  const hasIncomingCall = twilioCall && !isConnected;
  const hasActiveCall = isConnected;
  const showCallUI = twilioCall || currentCall;
  const callId = currentCall?.id || null;

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

  // Auto-scroll transcripts to bottom
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Load and subscribe to transcripts
  useEffect(() => {
    if (!callId) {
      setTranscripts([]);
      setIsLoadingTranscripts(false);
      return;
    }

    const loadTranscripts = async () => {
      setIsLoadingTranscripts(true);
      try {
        const { data, error } = await supabase
          .from('transcripts')
          .select('*')
          .eq('call_id', callId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTranscripts(data || []);
      } catch (error) {
        console.error('Error loading transcripts:', error);
        setTranscripts([]);
      } finally {
        setIsLoadingTranscripts(false);
      }
    };

    loadTranscripts();

    const channelName = `pink-transcripts-${callId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transcripts',
        filter: `call_id=eq.${callId}`
      }, (payload) => {
        const newTranscript = payload.new as Transcript;
        setTranscripts(prev => {
          const exists = prev.find(t => t.id === newTranscript.id);
          if (exists) return prev;
          return [...prev, newTranscript];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId]);

  // Load and subscribe to suggestions
  useEffect(() => {
    if (!callId) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        const { data, error } = await supabase
          .from('suggestions')
          .select('*')
          .eq('call_id', callId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error('Error loading suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadSuggestions();

    const channelName = `pink-suggestions-${callId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'suggestions',
        filter: `call_id=eq.${callId}`
      }, (payload) => {
        const newSuggestion = payload.new as Suggestion;
        setSuggestions(prev => {
          const exists = prev.find(s => s.id === newSuggestion.id);
          if (exists) return prev;
          return [newSuggestion, ...prev].slice(0, 10);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const copySuggestion = async (suggestionId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuggestions(prev => new Set([...prev, suggestionId]));
      toast({
        title: "Copied!",
        description: "Suggestion copied to clipboard",
      });
      setTimeout(() => {
        setCopiedSuggestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestionId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy suggestion:', error);
    }
  };

  const handleAnswer = async () => {
    console.log('[HumanAgentCallPanel] Answer button clicked');
    answerCall();

    const call = incomingDbCall || activeDbCall;
    if (call) {
      try {
        // Get current agent ID
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

          console.log('[HumanAgentCallPanel] Call answered and transcription started');
          onCallAnswered?.(call);
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
      try {
        await supabase.functions.invoke('twilio-end-call', {
          body: { callId: call.id }
        });
        onCallEnded?.();
      } catch (err) {
        console.error('[HumanAgentCallPanel] Failed to reject call:', err);
        onCallEnded?.();
      }
    }
  };

  const handleEnd = async () => {
    console.log('[HumanAgentCallPanel] End call button clicked');
    hangupCall();

    const call = activeDbCall || incomingDbCall;
    if (call) {
      try {
        await supabase.functions.invoke('twilio-end-call', {
          body: { callId: call.id }
        });
        onCallEnded?.();
      } catch (err) {
        console.error('[HumanAgentCallPanel] Failed to end call:', err);
        onCallEnded?.();
      }
    }
  };

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
              <span className="font-semibold">Human Agent Line</span>
              <p className="text-[10px] text-muted-foreground font-normal">
                Live Transcript & AI Suggestions
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden pt-2 pb-3 flex flex-col gap-2">
        {!isDeviceReady && !isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Voice Not Connected</p>
            <p className="text-xs text-muted-foreground mb-4">
              Click below to connect to the voice service
            </p>
            <Button onClick={retryConnection} variant="outline" size="sm" className="border-primary/50">
              <Phone className="h-4 w-4 mr-2" />
              Connect Voice
            </Button>
          </div>
        ) : isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium text-foreground">Connecting to Voice Service...</p>
          </div>
        ) : showCallUI ? (
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            {/* Caller Info & Controls Row */}
            <div className="flex gap-2 flex-shrink-0">
              {/* Caller Info */}
              <div className="flex-1 p-2 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    hasActiveCall ? 'bg-green-500/20' : 'bg-orange-500/20'
                  }`}>
                    <User className={`h-4 w-4 ${hasActiveCall ? 'text-green-500' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">
                      {currentCall?.customer_number || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {hasActiveCall ? 'On Call' : 'Incoming'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="p-2 rounded-lg border border-border bg-muted/30 text-center min-w-[80px]">
                <p className="text-[10px] text-muted-foreground">
                  {hasActiveCall ? 'Duration' : 'Ringing'}
                </p>
                <p className="text-lg font-mono font-bold text-foreground">
                  {hasActiveCall ? formatDuration(callDuration) : formatDuration(ringingDuration)}
                </p>
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex-shrink-0">
              {hasIncomingCall ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleAnswer} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Phone className="mr-1 h-3 w-3" />
                    Answer
                  </Button>
                  <Button onClick={handleReject} size="sm" variant="destructive">
                    <PhoneOff className="mr-1 h-3 w-3" />
                    Decline
                  </Button>
                </div>
              ) : hasActiveCall ? (
                <div className="flex gap-2">
                  <Button onClick={toggleMute} variant={isMuted ? 'destructive' : 'secondary'} size="sm" className="flex-1">
                    {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  </Button>
                  <Button onClick={toggleHold} variant={isOnHold ? 'destructive' : 'secondary'} size="sm" className="flex-1">
                    {isOnHold ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </Button>
                  <Button onClick={handleEnd} variant="destructive" size="sm" className="flex-1">
                    <PhoneOff className="h-3 w-3" />
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Live Transcript & AI Suggestions - Only show when connected */}
            {hasActiveCall && (
              <div className="flex-1 grid grid-rows-2 gap-2 min-h-0">
                {/* Live Transcript */}
                <div className="border rounded-lg overflow-hidden flex flex-col bg-background min-h-0">
                  <div className="px-2 py-1.5 border-b bg-muted/50 flex items-center gap-2 flex-shrink-0">
                    <MessageSquare className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">Live Transcript</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                      {transcripts.length}
                    </Badge>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1" ref={transcriptScrollRef}>
                      {isLoadingTranscripts ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      ) : transcripts.length === 0 ? (
                        <div className="text-center py-4">
                          <Headphones className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                          <p className="text-[10px] text-muted-foreground">Waiting for audio...</p>
                        </div>
                      ) : (
                        transcripts.map((transcript) => (
                          <div key={transcript.id} className="flex gap-2">
                            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                              transcript.speaker === 'customer' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {transcript.speaker === 'customer' ? (
                                <User className="h-2.5 w-2.5 text-blue-600" />
                              ) : (
                                <Headphones className="h-2.5 w-2.5 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-bold uppercase ${
                                  transcript.speaker === 'customer' ? 'text-blue-600' : 'text-green-600'
                                }`}>
                                  {transcript.speaker === 'customer' ? 'Customer' : 'Agent'}
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  {formatTime(transcript.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-foreground leading-tight">
                                {transcript.text}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* AI Suggestions */}
                <div className="border rounded-lg overflow-hidden flex flex-col bg-background min-h-0">
                  <div className="px-2 py-1.5 border-b bg-purple-50 flex items-center gap-2 flex-shrink-0">
                    <Sparkles className="h-3 w-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900">AI Suggestions</span>
                    {suggestions.length > 0 && (
                      <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-purple-200 text-purple-800">
                        {suggestions.length}
                      </Badge>
                    )}
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                      {isLoadingSuggestions ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        </div>
                      ) : suggestions.length === 0 ? (
                        <div className="text-center py-4">
                          <Lightbulb className="h-6 w-6 text-purple-300 mx-auto mb-2" />
                          <p className="text-[10px] text-muted-foreground">AI is analyzing...</p>
                        </div>
                      ) : (
                        suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.id}
                            className={`p-2 rounded-lg border ${
                              index === 0
                                ? 'bg-purple-50 border-purple-300'
                                : 'bg-muted/30 border-border'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Lightbulb className={`h-3 w-3 mt-0.5 flex-shrink-0 ${
                                index === 0 ? 'text-purple-600' : 'text-muted-foreground'
                              }`} />
                              <div className="flex-1 min-w-0">
                                {index === 0 && (
                                  <Badge className="text-[9px] px-1 py-0 bg-purple-200 text-purple-800 mb-1">
                                    LATEST
                                  </Badge>
                                )}
                                <p className="text-xs text-foreground leading-tight">
                                  {suggestion.text}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 mt-1 text-[10px]"
                                  onClick={() => copySuggestion(suggestion.id, suggestion.text)}
                                >
                                  {copiedSuggestions.has(suggestion.id) ? (
                                    <>
                                      <CheckCircle className="h-2.5 w-2.5 mr-1 text-green-600" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-2.5 w-2.5 mr-1" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* Escalation Info for incoming calls */}
            {!hasActiveCall && currentCall?.metadata && (
              <div className="p-2 rounded-lg border border-pink-500/30 bg-pink-500/5 flex-shrink-0">
                <p className="text-[10px] text-muted-foreground mb-0.5">Transfer Reason</p>
                <p className="text-xs text-foreground">
                  {(currentCall.metadata as any)?.escalationReason ||
                   currentCall.notes ||
                   'Customer requested human agent'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3 border-2 border-green-500/30">
              <Phone className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Ready for Calls</p>
            <p className="text-[10px] text-muted-foreground">
              Waiting for transferred calls from Sara AI
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
