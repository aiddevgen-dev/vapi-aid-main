import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LiveTranscriptPanel } from './LiveTranscriptPanel';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { Call } from '@/types/call-center';
import { X, Phone, PhoneOutgoing, User, Mail, MapPin, Target, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from './OutboundDialer';

interface ActiveCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeCall: Call | null;
  selectedLead?: Lead | null;
}

export const ActiveCallDialog = ({ isOpen, onClose, activeCall, selectedLead }: ActiveCallDialogProps) => {
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
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Calling {selectedLead?.name || activeCall?.customer_number}
              </h2>
              <p className="text-muted-foreground">Waiting for customer to answer...</p>
              <p className="text-xs text-muted-foreground mt-4">Transcription will start when call connects</p>

              {/* Lead Info Card during ringing */}
              {selectedLead && (
                <Card className="mt-6 max-w-md mx-auto text-left bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Lead Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-muted-foreground text-xs">Name</p>
                        <p className="font-medium">{selectedLead.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Phone</p>
                        <p className="font-medium">{selectedLead.phone_number}</p>
                      </div>
                      {selectedLead.email && (
                        <div>
                          <p className="text-muted-foreground text-xs">Email</p>
                          <p className="font-medium">{selectedLead.email}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground text-xs">Security PIN</p>
                        <p className="font-medium font-mono">{selectedLead.security_pin}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Intent</p>
                      <Badge className="mt-1 bg-primary/20 text-primary border-primary/30">
                        <Target className="h-3 w-3 mr-1" />
                        {selectedLead.intent}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Address</p>
                      <p className="font-medium">{selectedLead.address}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden p-6">
            <div className={`grid ${selectedLead ? 'grid-cols-3' : 'grid-cols-2'} gap-6 h-full`}>
              {/* Left side - Live Transcription */}
              <div className="h-full">
                <LiveTranscriptPanel callId={activeCall?.id || null} />
              </div>

              {/* Center/Right - AI Suggestions */}
              <div className="h-full">
                <AISuggestionsPanel callId={activeCall?.id || null} />
              </div>

              {/* Right side - Lead Info (for any call with matched lead) */}
              {selectedLead && (
                <div className="h-full">
                  <Card className="h-full bg-card border-border flex flex-col">
                    <CardHeader className="pb-3 flex-shrink-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Lead Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 overflow-auto">
                      {/* Name & Phone */}
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <User className="h-3 w-3" />
                            Name
                          </div>
                          <p className="font-semibold text-lg">{selectedLead.name}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Phone className="h-3 w-3" />
                            Phone Number
                          </div>
                          <p className="font-medium font-mono">{selectedLead.phone_number}</p>
                        </div>

                        {selectedLead.email && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                              <Mail className="h-3 w-3" />
                              Email
                            </div>
                            <p className="font-medium">{selectedLead.email}</p>
                          </div>
                        )}
                      </div>

                      {/* Security PIN - Highlighted */}
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-center gap-2 text-yellow-600 text-xs mb-1">
                          <Shield className="h-3 w-3" />
                          Security PIN (Verify with Customer)
                        </div>
                        <p className="font-bold text-2xl font-mono tracking-widest text-yellow-600">
                          {selectedLead.security_pin}
                        </p>
                      </div>

                      {/* Intent */}
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                        <div className="flex items-center gap-2 text-primary text-xs mb-1">
                          <Target className="h-3 w-3" />
                          Intent / Purpose
                        </div>
                        <p className="font-semibold text-primary">{selectedLead.intent}</p>
                      </div>

                      {/* Address */}
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                          <MapPin className="h-3 w-3" />
                          Address
                        </div>
                        <p className="font-medium">{selectedLead.address}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
