import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse Twilio webhook data
    const formData = await req.formData();
    const webhookData = Object.fromEntries(formData.entries());
    
    console.log('Twilio Voice Webhook:', webhookData);

    const {
      CallSid,
      From,
      To,
      CallStatus,
      Direction,
      ForwardedFrom,
      CallerName,
      Digits
    } = webhookData;

    // Find or create customer profile and gather comprehensive data
    let customerProfile = null;
    if (From) {
      const { data: existingProfile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('phone_number', From as string)
        .single();

      if (!existingProfile) {
        // Check if user exists with this phone number
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', From as string)
          .single();

        const { data: newProfile } = await supabase
          .from('customer_profiles')
          .insert({
            phone_number: From as string,
            name: userData?.full_name || CallerName as string || null,
            email: userData?.email || null,
            call_history_count: 1,
            last_interaction_at: new Date().toISOString()
          })
          .select()
          .single();
        customerProfile = newProfile;
      } else {
        // Update call history count and last interaction
        const { data: updatedProfile } = await supabase
          .from('customer_profiles')
          .update({
            call_history_count: existingProfile.call_history_count + 1,
            last_interaction_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id)
          .select()
          .single();
        customerProfile = updatedProfile || existingProfile;
      }
    }

    // Create or update call record
    const { data: callRecord, error: callError } = await supabase
      .from('calls')
      .upsert({
        twilio_call_sid: CallSid as string,
        customer_number: From as string,
        call_status: CallStatus as string,
        call_direction: Direction as string,
        started_at: new Date().toISOString()
      }, {
        onConflict: 'twilio_call_sid'
      })
      .select()
      .single();

    if (callError) {
      console.error('Error creating/updating call:', callError);
    }

    // Find available agent for incoming calls
    if (CallStatus === 'ringing' && Direction === 'inbound') {
      console.log('Looking for available agents...');
      const { data: availableAgents } = await supabase
        .from('agents')
        .select('*')
        .eq('status', 'online')
        .limit(1);

      console.log('Available agents found:', availableAgents?.length);

      if (availableAgents && availableAgents.length > 0) {
        const assignedAgent = availableAgents[0];
        console.log('Assigning call to agent:', assignedAgent.id, assignedAgent.name);
        
        // Assign call to first available agent - use the user_id as agent_id for consistency
        await supabase
          .from('calls')
          .update({ agent_id: assignedAgent.user_id || assignedAgent.id })
          .eq('twilio_call_sid', CallSid as string);

        console.log('Call assigned successfully');
        
        // Log streaming configuration 
        const streamUrl = "wss://blgjdtftopdkszdioskv.supabase.co/functions/v1/twilio-audio-stream-v2";
        console.log('🎙️ Configuring call with live transcription streaming:');
        console.log('  - Stream URL:', streamUrl);
        console.log('  - CallSid:', CallSid);
        console.log('  - Agent:', assignedAgent.name, '(ID:', assignedAgent.id, ')');
        
        // Generate TwiML with WebSocket stream for AssemblyAI transcription
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">Connecting you to our agent.</Say>
          <Start>
            <Stream url="wss://blgjdtftopdkszdioskv.supabase.co/functions/v1/twilio-audio-stream-v2" />
          </Start>
          <Dial timeout="30" 
                record="record-from-ringing" 
                recordingStatusCallback="https://blgjdtftopdkszdioskv.supabase.co/functions/v1/twilio-call-status">
            <Client>agent</Client>
          </Dial>
        </Response>`;

        console.log('📤 Sending TwiML response with streaming configuration:');
        console.log(twiml);
        
        return new Response(twiml, {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/xml' 
          }
        });
      } else {
        // No agents available
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">All our agents are currently busy. Please try again later.</Say>
          <Hangup/>
        </Response>`;

        return new Response(twiml, {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/xml' 
          }
        });
      }
    }

    // Default response for other call states
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/xml' 
        }
      }
    );

  } catch (error) {
    console.error('Error in twilio-voice-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});