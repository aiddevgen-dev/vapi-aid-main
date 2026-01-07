import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LiveTranscriptPanel } from './LiveTranscriptPanel';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { Call } from '@/types/call-center';
import { X, Phone, PhoneOutgoing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface ActiveCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeCall: Call | null;
}

export const ActiveCallDialog = ({ isOpen, onClose, activeCall }: ActiveCallDialogProps) => {
  const [hasTranscripts, setHasTranscripts] = useState(false);
  const isOutbound = activeCall?.call_direction === 'outbound';

  // For outbound calls: check if transcripts exist to determine if call is connected
  // (transcripts only arrive after customer answers)
  const isRinging = isOutbound
    ? (activeCall?.call_status === 'ringing' && !hasTranscripts)
    : activeCall?.call_status === 'ringing';

  // Subscribe to transcripts for this call to detect when it connects
  useEffect(() => {
    if (!activeCall?.id || !isOutbound) {
      setHasTranscripts(false);
      return;
    }

    // Check for existing transcripts
    const checkTranscripts = async () => {
      const { data } = await supabase
        .from('transcripts')
        .select('id')
        .eq('call_id', activeCall.id)
        .limit(1);

      if (data && data.length > 0) {
        setHasTranscripts(true);
      }
    };
    checkTranscripts();

    // Subscribe to new transcripts
    const channel = supabase
      .channel(`call-connect-${activeCall.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transcripts',
        filter: `call_id=eq.${activeCall.id}`
      }, () => {
        setHasTranscripts(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCall?.id, isOutbound]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="lyric-theme max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 gap-0 bg-background border-border">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl font-bold text-foreground">
                {isOutbound ? 'Outbound Call' : 'Active Call'} - Live Transcript & AI Suggestions
              </DialogTitle>
              {isRinging && isOutbound && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse">
                  <PhoneOutgoing className="h-3 w-3 mr-1" />
                  Ringing...
                </Badge>
              )}
              {!isRinging && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Phone className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-foreground hover:bg-primary/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {activeCall && (
            <p className="text-sm text-muted-foreground mt-1">
              {isOutbound ? 'Calling' : 'Customer'}: {activeCall.customer_number} • {isOutbound ? 'Outbound' : 'Inbound'} • Call ID: {activeCall.id.slice(0, 8)}...
            </p>
          )}
        </DialogHeader>

        {/* Ringing overlay for outbound calls */}
        {isRinging && isOutbound ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <PhoneOutgoing className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Calling {activeCall?.customer_number}</h2>
              <p className="text-muted-foreground">Waiting for customer to answer...</p>
              <p className="text-xs text-muted-foreground mt-4">Transcription will start when call connects</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden p-6">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Left side - Live Transcription */}
              <div className="h-full">
                <LiveTranscriptPanel callId={activeCall?.id || null} />
              </div>

              {/* Right side - AI Suggestions */}
              <div className="h-full">
                <AISuggestionsPanel callId={activeCall?.id || null} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
