import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LiveTranscriptPanel } from './LiveTranscriptPanel';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { Call } from '@/types/call-center';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActiveCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeCall: Call | null;
}

export const ActiveCallDialog = ({ isOpen, onClose, activeCall }: ActiveCallDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Active Call - Live Transcript & AI Suggestions
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {activeCall && (
            <p className="text-sm text-gray-600 mt-1">
              Customer: {activeCall.customer_number} • Call ID: {activeCall.id}
            </p>
          )}
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
};
