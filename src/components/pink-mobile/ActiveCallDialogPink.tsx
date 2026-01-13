import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Phone,
  PhoneOff,
  User,
  Mic,
  MicOff,
  Pause,
  Play,
  MessageSquare,
  Headphones,
  Sparkles,
  Lightbulb,
  Copy,
  CheckCircle,
  Loader2
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

interface ActiveCallDialogPinkProps {
  isOpen: boolean;
  onClose: () => void;
  activeCall: DbCall | null;
  isConnected: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  callDuration: number;
  toggleMute: () => void;
  toggleHold: () => void;
  onEndCall: () => void;
}

export const ActiveCallDialogPink = ({
  isOpen,
  onClose,
  activeCall,
  isConnected,
  isMuted,
  isOnHold,
  callDuration,
  toggleMute,
  toggleHold,
  onEndCall
}: ActiveCallDialogPinkProps) => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [copiedSuggestions, setCopiedSuggestions] = useState<Set<string>>(new Set());
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const callId = activeCall?.id || null;

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

    const channelName = `pink-dialog-transcripts-${callId}-${Date.now()}`;
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

    const channelName = `pink-dialog-suggestions-${callId}-${Date.now()}`;
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

  const handleEndCall = () => {
    onEndCall();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[85vh] max-h-[85vh] p-0 gap-0 bg-background border-border">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-xl font-bold text-foreground">
                Active Call - Live Transcript & AI Suggestions
              </DialogTitle>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Phone className="h-3 w-3 mr-1" />
                Connected • {formatDuration(callDuration)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Call Controls */}
              <Button
                onClick={toggleMute}
                variant={isMuted ? 'destructive' : 'secondary'}
                size="sm"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                onClick={toggleHold}
                variant={isOnHold ? 'destructive' : 'secondary'}
                size="sm"
              >
                {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleEndCall}
                variant="destructive"
                size="sm"
              >
                <PhoneOff className="h-4 w-4 mr-1" />
                End Call
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 ml-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          {activeCall && (
            <p className="text-sm text-muted-foreground mt-1">
              Customer: {activeCall.customer_number} • Call ID: {activeCall.id.slice(0, 8)}...
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left side - Live Transcription */}
            <Card className="h-full bg-card border-border flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Live Transcription
                  <Badge variant="secondary" className="ml-auto">
                    {transcripts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-full px-4">
                  {isLoadingTranscripts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : transcripts.length === 0 ? (
                    <div className="text-center py-8">
                      <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Waiting for audio to transcribe...</p>
                    </div>
                  ) : (
                    <div className="space-y-1 pb-4" ref={transcriptScrollRef}>
                      {transcripts.map((transcript, index) => (
                        <div key={transcript.id} className="py-2">
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              transcript.speaker === 'customer'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {transcript.speaker === 'customer' ? (
                                <User className="h-5 w-5" />
                              ) : (
                                <Headphones className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className={`font-bold text-sm uppercase ${
                                  transcript.speaker === 'customer'
                                    ? 'text-blue-700'
                                    : 'text-green-700'
                                }`}>
                                  {transcript.speaker === 'customer' ? 'Customer' : 'Agent'}:
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTime(transcript.created_at)}
                                </span>
                              </div>
                              <div className={`p-3 rounded-lg ${
                                transcript.speaker === 'customer'
                                  ? 'bg-blue-50 border-l-4 border-blue-400'
                                  : 'bg-green-50 border-l-4 border-green-400'
                              }`}>
                                <p className="text-[15px] leading-relaxed text-gray-900">
                                  {transcript.text}
                                </p>
                              </div>
                            </div>
                          </div>
                          {index < transcripts.length - 1 && (
                            <div className="h-px bg-gray-200 my-2 ml-14" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right side - AI Suggestions */}
            <Card className="h-full bg-card border-border flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Suggestions
                  {suggestions.length > 0 && (
                    <Badge className="ml-auto bg-purple-200 text-purple-800">
                      {suggestions.length}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Use these AI-generated responses to guide your conversation
                </p>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-full px-4">
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                      <p className="text-muted-foreground">AI is analyzing the conversation...</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Suggestions will appear automatically
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {suggestions.map((suggestion, index) => {
                        const isLatest = index === 0;
                        return (
                          <div key={suggestion.id}>
                            <div className={`bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-lg border-2 hover:border-purple-300 transition-colors ${
                              isLatest ? 'border-purple-400 shadow-md' : 'border-purple-200'
                            }`}>
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                  <Lightbulb className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className={`text-xs font-semibold ${
                                      isLatest
                                        ? 'bg-purple-200 text-purple-800 border-purple-400'
                                        : 'bg-purple-100 text-purple-700 border-purple-300'
                                    }`}>
                                      {isLatest ? '⚡ LATEST' : 'SUGGESTION'}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {formatTime(suggestion.created_at)}
                                    </span>
                                  </div>
                                  <div className={`bg-white p-4 rounded-md border-l-4 mb-3 ${
                                    isLatest ? 'border-purple-500' : 'border-purple-400'
                                  }`}>
                                    <p className="text-[16px] text-gray-900 leading-relaxed font-medium">
                                      {suggestion.text}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => copySuggestion(suggestion.id, suggestion.text)}
                                    variant={copiedSuggestions.has(suggestion.id) ? "secondary" : "default"}
                                    className="h-9 px-4"
                                  >
                                    {copiedSuggestions.has(suggestion.id) ? (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
