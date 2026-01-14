import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  User,
  MessageSquare,
  Headphones,
  Sparkles,
  Lightbulb,
  Copy,
  CheckCircle,
  Loader2,
  Clock
} from 'lucide-react';
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

interface TranscriptViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string | null;
  vapiCallId?: string;
  customerNumber?: string;
  callDirection?: 'inbound' | 'outbound';
  callStatus?: string;
  startedAt?: string;
  endedAt?: string;
}

export const TranscriptViewerDialog = ({
  isOpen,
  onClose,
  callId,
  vapiCallId,
  customerNumber,
  callDirection,
  callStatus,
  startedAt,
  endedAt
}: TranscriptViewerDialogProps) => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [copiedSuggestions, setCopiedSuggestions] = useState<Set<string>>(new Set());
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isFetchingVapi, setIsFetchingVapi] = useState(false);
  const { toast } = useToast();

  // Fetch transcript from VAPI API on button click
  const handleFetchVapiTranscript = async () => {
    if (!vapiCallId || !callId) return;

    setIsFetchingVapi(true);
    try {
      const { data: vapiData, error: vapiError } = await supabase.functions.invoke('vapi-get-transcript', {
        body: { callId: vapiCallId },
      });

      if (vapiError) {
        throw vapiError;
      }

      if (vapiData?.success && vapiData?.data?.transcript) {
        // Save transcript to local database
        const { data: insertedTranscript, error: insertError } = await supabase
          .from('transcripts')
          .insert({
            call_id: callId,
            speaker: 'agent',
            text: vapiData.data.transcript,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error saving transcript:', insertError);
        }

        // Add to local state
        if (insertedTranscript) {
          setTranscripts(prev => [...prev, insertedTranscript]);
        }

        toast({
          title: 'Transcript Loaded',
          description: 'Call transcript fetched successfully',
        });
      } else {
        toast({
          title: 'No Transcript',
          description: 'No transcript available yet. Call may still be in progress.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching VAPI transcript:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transcript',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingVapi(false);
    }
  };

  // Load transcripts when dialog opens
  useEffect(() => {
    if (!callId || !isOpen) {
      setTranscripts([]);
      setSuggestions([]);
      return;
    }

    const loadData = async () => {
      setIsLoadingTranscripts(true);
      setIsLoadingSuggestions(true);

      try {
        // Load transcripts from local database
        const { data: transcriptData, error: transcriptError } = await supabase
          .from('transcripts')
          .select('*')
          .eq('call_id', callId)
          .order('created_at', { ascending: true });

        if (transcriptError) throw transcriptError;
        setTranscripts(transcriptData || []);
      } catch (error) {
        console.error('Error loading transcripts:', error);
        setTranscripts([]);
      } finally {
        setIsLoadingTranscripts(false);
      }

      try {
        // Load suggestions
        const { data: suggestionData, error: suggestionError } = await supabase
          .from('suggestions')
          .select('*')
          .eq('call_id', callId)
          .order('created_at', { ascending: false });

        if (suggestionError) throw suggestionError;
        setSuggestions(suggestionData || []);
      } catch (error) {
        console.error('Error loading suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    loadData();
  }, [callId, isOpen]);

  const formatDuration = (start: string, end?: string) => {
    if (!start) return '00:00';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const seconds = Math.floor((endTime - startTime) / 1000);
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

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[85vh] max-h-[85vh] p-0 gap-0 bg-background border-border">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                {callDirection === 'inbound' ? (
                  <PhoneIncoming className="h-5 w-5 text-blue-500" />
                ) : (
                  <PhoneOutgoing className="h-5 w-5 text-pink-500" />
                )}
                Call Transcript
              </DialogTitle>
              <Badge className={`${
                callStatus === 'completed'
                  ? 'bg-green-500/20 text-green-600 border-green-500/30'
                  : 'bg-gray-500/20 text-gray-600 border-gray-500/30'
              }`}>
                {callStatus || 'Unknown'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {customerNumber || 'Unknown'}
            </span>
            {startedAt && (
              <>
                <span>•</span>
                <span>{formatDate(startedAt)} at {formatTime(startedAt)}</span>
              </>
            )}
            {startedAt && endedAt && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Duration: {formatDuration(startedAt, endedAt)}
                </span>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left side - Transcription */}
            <Card className="h-full bg-card border-border flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Transcript
                  <Badge variant="secondary" className="ml-auto">
                    {transcripts.length} messages
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
                      <p className="text-muted-foreground">No transcript available for this call</p>
                      {vapiCallId && (
                        <Button
                          onClick={handleFetchVapiTranscript}
                          disabled={isFetchingVapi}
                          className="mt-4"
                        >
                          {isFetchingVapi ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Fetching...
                            </>
                          ) : (
                            'Fetch Transcript'
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1 pb-4">
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
                      <p className="text-muted-foreground">No AI suggestions were generated for this call</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {suggestions.map((suggestion, index) => (
                        <div key={suggestion.id}>
                          <div className={`bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border ${
                            index === 0 ? 'border-purple-400' : 'border-purple-200'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Lightbulb className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                                    SUGGESTION
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatTime(suggestion.created_at)}
                                  </span>
                                </div>
                                <div className="bg-white p-3 rounded-md border-l-4 border-purple-400 mb-2">
                                  <p className="text-sm text-gray-900 leading-relaxed">
                                    {suggestion.text}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => copySuggestion(suggestion.id, suggestion.text)}
                                  variant={copiedSuggestions.has(suggestion.id) ? "secondary" : "outline"}
                                  className="h-7 px-3 text-xs"
                                >
                                  {copiedSuggestions.has(suggestion.id) ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
