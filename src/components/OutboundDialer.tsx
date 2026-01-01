import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneCall, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomerProfile {
  id: string;
  phone_number: string;
  name: string | null;
  email: string | null;
  call_history_count: number;
  last_interaction_at: string | null;
}

interface OutboundDialerProps {
  isDeviceReady: boolean;
  isConnected: boolean;
  onMakeCall: (phoneNumber: string) => Promise<void>;
  onCallInitiated?: (customerNumber: string) => void;
  disabled?: boolean;
}

export const OutboundDialer = ({
  isDeviceReady,
  isConnected,
  onMakeCall,
  onCallInitiated,
  disabled = false
}: OutboundDialerProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  const [customerPreview, setCustomerPreview] = useState<CustomerProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Lookup customer when phone number changes
  useEffect(() => {
    const lookupCustomer = async () => {
      if (phoneNumber.length < 10) {
        setCustomerPreview(null);
        return;
      }

      setIsSearching(true);
      try {
        // Try different phone number formats
        const formats = [
          phoneNumber,
          `+${phoneNumber}`,
          `+1${phoneNumber}`,
          phoneNumber.replace(/\D/g, '')
        ];

        for (const format of formats) {
          const { data, error } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('phone_number', format)
            .maybeSingle();

          if (data && !error) {
            setCustomerPreview(data);
            setIsSearching(false);
            return;
          }
        }
        setCustomerPreview(null);
      } catch (error) {
        console.error('Error looking up customer:', error);
        setCustomerPreview(null);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(lookupCustomer, 500);
    return () => clearTimeout(debounce);
  }, [phoneNumber]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits except + at start
    const cleaned = value.replace(/[^\d+]/g, '');
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleMakeCall = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    // Removed device ready check - let it try and show actual error if any

    setIsDialing(true);
    try {
      // Format number with + if not present
      let formattedNumber = phoneNumber;
      if (!formattedNumber.startsWith('+')) {
        formattedNumber = `+${formattedNumber}`;
      }

      console.log('Initiating outbound call to:', formattedNumber);

      await onMakeCall(formattedNumber);

      if (onCallInitiated) {
        onCallInitiated(formattedNumber);
      }

      toast({
        title: "Calling...",
        description: `Dialing ${formattedNumber}`,
      });

    } catch (error) {
      console.error('Error making call:', error);
      toast({
        title: "Call Failed",
        description: "Failed to initiate outbound call",
        variant: "destructive"
      });
    } finally {
      setIsDialing(false);
    }
  };

  const handleClear = () => {
    setPhoneNumber('');
    setCustomerPreview(null);
  };

  // Simplified - only disable if already in call or dialing
  const isCallDisabled = disabled || isConnected || isDialing || phoneNumber.length < 10;

  return (
    <Card className="bg-sidebar border-sidebar-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sidebar-foreground flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            Outbound Call
          </div>
          {isDeviceReady ? (
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
              Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
              Connecting...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Phone Input */}
        <div className="relative">
          <Input
            type="tel"
            placeholder="Enter phone number..."
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={isConnected || isDialing}
            className="pr-8 font-mono bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-accent-foreground/50"
          />
          {phoneNumber && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-accent-foreground hover:text-sidebar-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Customer Preview */}
        {isSearching && (
          <div className="text-xs text-sidebar-accent-foreground">
            Searching customer...
          </div>
        )}

        {customerPreview && (
          <div className="bg-sidebar-accent p-3 rounded-lg border border-sidebar-border">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-3 w-3 text-sidebar-accent-foreground" />
              <span className="text-xs text-sidebar-accent-foreground">Customer Found</span>
            </div>
            <p className="text-sm font-medium text-sidebar-foreground">
              {customerPreview.name || 'Unknown Name'}
            </p>
            {customerPreview.email && (
              <p className="text-xs text-sidebar-accent-foreground">
                {customerPreview.email}
              </p>
            )}
            <p className="text-xs text-sidebar-accent-foreground mt-1">
              {customerPreview.call_history_count} previous call{customerPreview.call_history_count !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Call Button */}
        <Button
          onClick={handleMakeCall}
          disabled={isCallDisabled}
          className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
        >
          <Phone className="mr-2 h-4 w-4" />
          {isDialing ? 'Dialing...' : isConnected ? 'In Call' : 'Call'}
        </Button>

        {/* Status Info */}
        {isConnected && (
          <p className="text-xs text-center text-sidebar-accent-foreground">
            End current call before making a new one
          </p>
        )}
      </CardContent>
    </Card>
  );
};
