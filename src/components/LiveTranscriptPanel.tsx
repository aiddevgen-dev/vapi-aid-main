import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, User, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Transcript {
  id: string;
  speaker: string;
  text: string;
  created_at: string;
}

interface LiveTranscriptPanelProps {
  callId: string | null;
}

export const LiveTranscriptPanel = ({ callId }: LiveTranscriptPanelProps) => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  console.log('📺 LiveTranscriptPanel rendered with callId:', callId, 'type:', typeof callId);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Load existing transcripts when call starts
  useEffect(() => {
    if (!callId) {
      console.log('📺 No callId provided, clearing transcripts');
      setTranscripts([]);
      setIsLoading(false);
      return;
    }

    console.log('📺 ✅ Starting transcript loading for callId:', callId, 'type:', typeof callId);

    const loadTranscripts = async () => {
      setIsLoading(true);
      try {
        console.log('📺 🔍 Fetching existing transcripts from database for callId:', callId);
        const { data, error } = await supabase
          .from('transcripts')
          .select('*')
          .eq('call_id', callId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Error loading transcripts:', error);
          throw error;
        }
        console.log('📺 ✅ Loaded existing transcripts:', data?.length || 0, 'for call:', callId);
        console.log('📺 📋 Transcript data:', data);
        setTranscripts(data || []);
      } catch (error) {
        console.error('❌ Error loading transcripts:', error);
        setTranscripts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranscripts();

    // Subscribe to new transcripts with a unique channel name
    const channelName = `live-transcripts-${callId}-${Date.now()}`;
    console.log('📺 🔗 Creating transcript subscription with channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcripts',
          filter: `call_id=eq.${callId}`
        },
        (payload) => {
          console.log('📺 🎉 NEW TRANSCRIPT RECEIVED via realtime:', payload.new);
          const newTranscript = payload.new as Transcript;
          setTranscripts(prev => {
            // Avoid duplicates by checking ID
            const exists = prev.find(t => t.id === newTranscript.id);
            if (exists) {
              console.log('📺 ⚠️ Duplicate transcript ignored:', newTranscript.id);
              return prev;
            }
            console.log('📺 ➕ Adding new transcript:', newTranscript.id, 'text:', newTranscript.text);
            const updated = [...prev, newTranscript];
            console.log('📺 📊 Total transcripts now:', updated.length);
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log('📺 🔔 Realtime transcript subscription status:', status, 'for call:', callId, 'channel:', channelName);
        if (status === 'SUBSCRIBED') {
          console.log('📺 ✅ Successfully subscribed to transcript updates for call:', callId);
        } else if (status === 'CLOSED') {
          console.log('📺 🔒 Transcript subscription closed for call:', callId);
        } else if (status === 'CHANNEL_ERROR') {
          console.log('📺 ❌ Transcript subscription error for call:', callId);
        }
      });

    return () => {
      console.log('📺 🧹 Cleaning up transcript channel:', channelName, 'for call:', callId);
      supabase.removeChannel(channel);
    };
  }, [callId]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="h-full bg-sidebar border-sidebar-border flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="text-sidebar-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Live Transcription
          {callId && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {transcripts.length}
          </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        {!callId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Headphones className="h-12 w-12 text-sidebar-primary mb-4" />
            <p className="text-sidebar-foreground font-medium">
              No Active Call
            </p>
            <p className="text-sm text-sidebar-accent-foreground mt-2">
              Start a call to see live transcription
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full px-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-primary"></div>
              </div>
            ) : transcripts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sidebar-accent-foreground text-sm">
                  Waiting for audio to transcribe...
                </p>
              </div>
            ) : (
              <div className="space-y-1 pb-4" ref={scrollRef}>
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
        )}
      </CardContent>
    </Card>
  );
};