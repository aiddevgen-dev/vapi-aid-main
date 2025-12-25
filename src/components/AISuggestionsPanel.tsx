import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Lightbulb, Copy, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  id: string;
  text: string;
  created_at: string;
}

interface AISuggestionsPanelProps {
  callId: string | null;
}

export const AISuggestionsPanel = ({ callId }: AISuggestionsPanelProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [copiedSuggestions, setCopiedSuggestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  console.log('💡 AISuggestionsPanel rendered with callId:', callId, 'type:', typeof callId);

  // Auto-scroll to top when new suggestions arrive (latest is at top)
  useEffect(() => {
    if (scrollRef.current && suggestions.length > 0) {
      scrollRef.current.scrollTop = 0;
      console.log('💡 Auto-scrolled to show latest suggestion');
    }
  }, [suggestions]);

  // Load existing suggestions when call starts
  useEffect(() => {
    if (!callId) {
      console.log('💡 No callId provided, clearing suggestions');
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    console.log('💡 ✅ Starting suggestion loading for callId:', callId, 'type:', typeof callId);

    const loadSuggestions = async () => {
      setIsLoading(true);
      try {
        console.log('💡 🔍 Fetching existing suggestions from database for callId:', callId);
        const { data, error } = await supabase
          .from('suggestions')
          .select('*')
          .eq('call_id', callId)
          .order('created_at', { ascending: false})
          .limit(10); // Limit to latest 10 suggestions

        if (error) {
          console.error('❌ Error loading suggestions:', error);
          throw error;
        }
        console.log('💡 ✅ Loaded existing suggestions:', data?.length || 0, 'for call:', callId);
        console.log('💡 📋 Suggestion data:', data);
        setSuggestions(data || []);
      } catch (error) {
        console.error('❌ Error loading suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();

    // Subscribe to new suggestions with a unique channel name
    const channelName = `live-suggestions-${callId}-${Date.now()}`;
    console.log('💡 🔗 Creating suggestion subscription with channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'suggestions',
          filter: `call_id=eq.${callId}`
        },
        (payload) => {
          console.log('💡 🎉 NEW SUGGESTION RECEIVED via realtime:', payload.new);
          const newSuggestion = payload.new as Suggestion;
          setSuggestions(prev => {
            // Avoid duplicates by checking ID
            const exists = prev.find(s => s.id === newSuggestion.id);
            if (exists) {
              console.log('💡 ⚠️ Duplicate suggestion ignored:', newSuggestion.id);
              return prev;
            }
            console.log('💡 ➕ Adding new suggestion:', newSuggestion.id, 'text:', newSuggestion.text);
            // Add to front of array (most recent first) and limit to 10
            const updated = [newSuggestion, ...prev].slice(0, 10);
            console.log('💡 📊 Total suggestions now:', updated.length);
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log('💡 🔔 Realtime suggestion subscription status:', status, 'for call:', callId, 'channel:', channelName);
        if (status === 'SUBSCRIBED') {
          console.log('💡 ✅ Successfully subscribed to suggestion updates for call:', callId);
        } else if (status === 'CLOSED') {
          console.log('💡 🔒 Suggestion subscription closed for call:', callId);
        } else if (status === 'CHANNEL_ERROR') {
          console.log('💡 ❌ Suggestion subscription error for call:', callId);
        }
      });

    return () => {
      console.log('💡 🧹 Cleaning up suggestion channel:', channelName, 'for call:', callId);
      supabase.removeChannel(channel);
    };
  }, [callId]);

  const copySuggestion = async (suggestionId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuggestions(prev => new Set([...prev, suggestionId]));
      
      toast({
        title: "Copied!",
        description: "Suggestion copied to clipboard",
      });

      // Remove the "copied" state after 2 seconds
      setTimeout(() => {
        setCopiedSuggestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestionId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to copy suggestion",
        variant: "destructive",
      });
    }
  };


  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <Card className="h-full bg-sidebar border-sidebar-border flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sidebar-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Suggestions
          {callId && suggestions.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {suggestions.length}
            </Badge>
          )}
        </CardTitle>
        {callId && (
          <p className="text-xs text-sidebar-accent-foreground mt-2 font-medium">
            💡 Use these AI-generated responses to guide your conversation
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        {!callId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Lightbulb className="h-12 w-12 text-sidebar-primary mb-4" />
            <p className="text-sidebar-foreground font-medium">
              No Active Call
            </p>
            <p className="text-sm text-sidebar-accent-foreground mt-2">
              AI suggestions will appear here during calls
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full px-4">
            <div ref={scrollRef}>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-primary"></div>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-8 w-8 text-sidebar-primary mx-auto mb-3" />
                  <p className="text-sidebar-accent-foreground text-sm">
                    AI is analyzing the conversation...
                  </p>
                  <p className="text-sidebar-accent-foreground text-xs mt-1">
                    Suggestions will appear automatically as customers speak
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {suggestions.map((suggestion, index) => {
                    const isLatest = index === 0;
                    return (
                      <div key={suggestion.id} className="group">
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
                                  {isLatest ? '⚡ LATEST SUGGESTION' : 'SUGGESTED RESPONSE'}
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
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => copySuggestion(suggestion.id, suggestion.text)}
                                  variant={copiedSuggestions.has(suggestion.id) ? "secondary" : "default"}
                                  className="h-9 px-4"
                                >
                                  {copiedSuggestions.has(suggestion.id) ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      <span className="text-sm font-medium">Copied to clipboard</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-2" />
                                      <span className="text-sm font-medium">Copy this response</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < suggestions.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};