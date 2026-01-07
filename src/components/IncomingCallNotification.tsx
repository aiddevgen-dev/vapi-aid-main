import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, User } from 'lucide-react';
import { Call } from '@/types/call-center';

interface IncomingCallNotificationProps {
  incomingCall: Call | null;
  onAnswer: (call: Call) => void;
  onDecline: (call: Call) => void;
}

export const IncomingCallNotification = ({ 
  incomingCall, 
  onAnswer, 
  onDecline 
}: IncomingCallNotificationProps) => {
  const [ringingDuration, setRingingDuration] = useState(0);

  useEffect(() => {
    console.log('📢 IncomingCallNotification - incomingCall changed:', {
      hasCall: !!incomingCall,
      callId: incomingCall?.id,
      status: incomingCall?.call_status,
      customerNumber: incomingCall?.customer_number
    });

    let interval: NodeJS.Timeout | null = null;

    if (incomingCall && (incomingCall.call_status === 'ringing' || incomingCall.call_status === 'in-progress')) {
      interval = setInterval(() => {
        setRingingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRingingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [incomingCall]);

  const shouldShow = incomingCall &&
                     incomingCall.call_status !== 'completed' &&
                     incomingCall.call_status !== 'failed' &&
                     incomingCall.call_status !== 'in-progress';

  console.log('📢 IncomingCallNotification - render decision:', {
    incomingCall: incomingCall?.id || 'null',
    status: incomingCall?.call_status || 'null',
    shouldShow,
    willRenderNotification: shouldShow
  });

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-pulse">
      <Card className="w-80 bg-card border-2 border-green-500/50 shadow-xl shadow-green-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Phone className="h-5 w-5 animate-bounce" />
            Incoming Call
            <Badge variant="secondary" className="ml-auto bg-primary/20 text-foreground">
              {Math.floor(ringingDuration / 60)}:{(ringingDuration % 60).toString().padStart(2, '0')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-full">
              <User className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {incomingCall.customer_number}
              </p>
              <p className="text-sm text-muted-foreground">
                {incomingCall.call_direction} call
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                console.log('🔵 IncomingCallNotification Answer button clicked!');
                console.log('🔵 Call details:', incomingCall.id, 'status:', incomingCall.call_status);
                if (incomingCall.call_status === 'ringing') {
                  onAnswer(incomingCall);
                } else {
                  console.log('❌ Cannot answer call - status is not ringing:', incomingCall.call_status);
                }
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={incomingCall.call_status !== 'ringing'}
            >
              <Phone className="mr-2 h-4 w-4" />
              Answer
            </Button>
            <Button 
              onClick={() => onDecline(incomingCall)}
              variant="destructive"
              className="flex-1"
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};