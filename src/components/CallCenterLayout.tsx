import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CallPanel } from './CallPanel';
import { LiveTranscriptPanel } from './LiveTranscriptPanel';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { CallHistory } from './CallHistory';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { EnhancedCustomerInfoPanel } from './EnhancedCustomerInfoPanel';
import { CustomerChatHistory } from './CustomerChatHistory';
import { CallDetailsModal } from './CallDetailsModal';
import { IncomingCallNotification } from './IncomingCallNotification';
import { ActiveCallDialog } from './ActiveCallDialog';
import { Call, CustomerProfile } from '@/types/call-center';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTwilioVoice } from '@/hooks/useTwilioVoice';

interface CallCenterLayoutProps {
  showHeader?: boolean;
}

export const CallCenterLayout = ({ showHeader = true }: CallCenterLayoutProps) => {
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isCallDetailsOpen, setIsCallDetailsOpen] = useState(false);
  const [isActiveCallDialogOpen, setIsActiveCallDialogOpen] = useState(false);
  const { toast } = useToast();

  // Initialize Twilio Voice - centralized for both notification and panel
  const {
    activeCall: twilioCall,
    isConnected,
    isMuted,
    isOnHold,
    isDeviceReady,
    isInitializing,
    answerCall: twilioAnswerCall,
    rejectCall: twilioRejectCall,
    hangupCall: twilioHangupCall,
    toggleMute,
    toggleHold,
    retryConnection,
  } = useTwilioVoice(() => {
    // Callback for when Twilio call disconnects
    console.log('🔔 Twilio call disconnected - clearing dashboard state');
    setActiveCall(null);
    setCustomerProfile(null);
    setIncomingCall(null);
  });

  // Debug active call changes
  useEffect(() => {
    console.log('🏢 CallCenterLayout - activeCall changed:', {
      id: activeCall?.id,
      status: activeCall?.call_status,
      agentId: activeCall?.agent_id,
      customerNumber: activeCall?.customer_number
    });
  }, [activeCall]);

  // Open dialog when call becomes active
  useEffect(() => {
    if (activeCall && activeCall.call_status === 'in-progress') {
      setIsActiveCallDialogOpen(true);
      console.log('📱 Opening active call dialog for call:', activeCall.id);
    } else {
      setIsActiveCallDialogOpen(false);
      console.log('📱 Closing active call dialog');
    }
  }, [activeCall]);

  // Debug incoming call changes
  useEffect(() => {
    console.log('🏢 CallCenterLayout - incomingCall changed:', {
      id: incomingCall?.id,
      status: incomingCall?.call_status,
      customerNumber: incomingCall?.customer_number
    });
  }, [incomingCall]);

  // Debug render
  useEffect(() => {
    console.log('🏢 CallCenterLayout rendered - activeCall:', activeCall?.id, 'status:', activeCall?.call_status);
    console.log('🏢 CallCenterLayout incomingCall state:', incomingCall?.id);
    console.log('🏢 CallCenterLayout component mounted, props:', { showHeader });
    
    // Debug: Log actual state values
    console.log('🏢 [RENDER] CallCenterLayout passing callId to panels:', {
      activeCallId: activeCall?.id || null,
      activeCallStatus: activeCall?.call_status || null,
      activeCallType: typeof activeCall?.id,
      timestamp: new Date().toISOString()
    });
    
    console.log('🔍 CallCenterLayout state debug:', {
      activeCall: activeCall,
      incomingCall: incomingCall,
      activeCallType: typeof activeCall,
      incomingCallType: typeof incomingCall
    });
  });

  const getCurrentAgentId = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('❌ Error getting current user:', userError);
        return null;
      }

      // Lookup agent record by user_id
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (agentError) {
        console.error('❌ Error fetching agent for user:', user.id, agentError);
        return null;
      }

      if (!agent) {
        console.error('❌ No agent found for user:', user.id);
        return null;
      }

      console.log('✅ Found agent ID:', agent.id, 'for user:', user.id);
      return agent.id;
    } catch (error) {
      console.error('❌ Unexpected error in getCurrentAgentId:', error);
      return null;
    }
  };

  // Agent Status Management - set to online when logged in
  useEffect(() => {
    let agentId: string | null = null;

    const setAgentOnline = async () => {
      try {
        agentId = await getCurrentAgentId();
        if (!agentId) {
          console.log('⚠️ No agent ID found, skipping status update');
          return;
        }

        console.log('🟢 Setting agent status to online:', agentId);
        const { error } = await supabase
          .from('agents')
          .update({
            status: 'online',
            updated_at: new Date().toISOString()
          })
          .eq('id', agentId);

        if (error) {
          console.error('❌ Error setting agent status to online:', error);
        } else {
          console.log('✅ Agent status set to online');
        }
      } catch (error) {
        console.error('❌ Error in setAgentOnline:', error);
      }
    };

    const setAgentOffline = async () => {
      if (!agentId) return;

      try {
        console.log('🔴 Setting agent status to offline:', agentId);
        const { error } = await supabase
          .from('agents')
          .update({
            status: 'offline',
            updated_at: new Date().toISOString()
          })
          .eq('id', agentId);

        if (error) {
          console.error('❌ Error setting agent status to offline:', error);
        } else {
          console.log('✅ Agent status set to offline');
        }
      } catch (error) {
        console.error('❌ Error in setAgentOffline:', error);
      }
    };

    // Set online on mount
    setAgentOnline();

    // Set offline on unmount (logout, page close, etc.)
    return () => {
      setAgentOffline();
    };
  }, []);

  // Subscribe to incoming calls and call updates - run only once
  useEffect(() => {
    let mounted = true;

    const initializeCallState = async () => {
      if (!mounted) return;
      
      try {
        const currentAgentId = await getCurrentAgentId();
        console.log('🔄 Initializing call state for agent:', currentAgentId);
        console.log('📊 [DEBUG] Current state before init:', {
          activeCall: activeCall?.id || 'none',
          incomingCall: incomingCall?.id || 'none'
        });
        
        // First, cleanup any stale ringing calls older than 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { error: cleanupError } = await supabase
          .from('calls')
          .update({ 
            call_status: 'failed',
            ended_at: new Date().toISOString()
          })
          .eq('call_status', 'ringing')
          .lt('created_at', fifteenMinutesAgo);
        
        if (cleanupError) {
          console.error('❌ Error cleaning up stale calls:', cleanupError);
        } else {
          console.log('🧹 Cleaned up stale ringing calls older than 15 minutes');
        }
        
        // Check for existing ringing calls first (both assigned and unassigned)
        const { data: existingCalls, error: ringingError } = await supabase
          .from('calls')
          .select('*')
          .eq('call_direction', 'inbound')
          .eq('call_status', 'ringing')
          .or(`agent_id.eq.${currentAgentId},agent_id.is.null`)
          .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Only calls from last 15 minutes
          .order('created_at', { ascending: false })
          .limit(1);
        
        console.log('🔍 Ringing calls query result:', { existingCalls, error: ringingError, count: existingCalls?.length });
        
        // Check for existing active calls
        const { data: activeCalls, error: activeError } = await supabase
          .from('calls')
          .select('*')
          .eq('call_status', 'in-progress')
          .eq('agent_id', currentAgentId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        console.log('🔍 Active calls query result:', { activeCalls, error: activeError });
        
        if (!mounted) return; // Check if component is still mounted
        
        // Set active call if found
        if (activeCalls && activeCalls.length > 0) {
          const activeCallData = activeCalls[0] as Call;
          console.log('🎯 Found existing active call, setting as activeCall:', activeCallData.id);
          setActiveCall(activeCallData);
          // Clear any incoming call state if we have an active call
          setIncomingCall(null);
        } 
        // Set incoming call only if no active call exists
        else if (existingCalls && existingCalls.length > 0) {
          const call = existingCalls[0] as Call;
          console.log('🔔 Found existing ringing call, setting incomingCall:', call.id);
          setIncomingCall(call);
          toast({
            title: "Incoming Call",
            description: `Call from ${call.customer_number}`,
          });
        } else {
          console.log('🔍 No existing calls found');
          setIncomingCall(null);
          setActiveCall(null);
        }
      } catch (error) {
        console.error('❌ Error initializing call state:', error);
      }
    };

    initializeCallState();

    // More frequent database sync every 5 seconds with auto-correction
    const debugInterval = setInterval(async () => {
      try {
        const currentAgentId = await getCurrentAgentId();
        const { data: allCalls, error } = await supabase
          .from('calls')
          .select('*')
          .or('call_status.eq.ringing,call_status.eq.in-progress')
          .order('created_at', { ascending: false })
          .limit(5);
        
        console.log('🔍 [AUTO-SYNC] Database check:', {
          currentAgentId,
          allCalls: allCalls || [],
          error,
          timestamp: new Date().toISOString(),
          currentState: {
            activeCall: activeCall?.id || 'none',
            incomingCall: incomingCall?.id || 'none'
          }
        });
        
        // Auto-correct state if database has calls but component state doesn't
        if (allCalls && allCalls.length > 0) {
          console.log('🔍 [AUTO-SYNC] Analyzing calls from database:', {
            totalCalls: allCalls.length,
            calls: allCalls.map(c => ({
              id: c.id,
              status: c.call_status,
              direction: c.call_direction,
              agent_id: c.agent_id,
              customer: c.customer_number,
              created: c.created_at
            }))
          });

          // First check for in-progress calls assigned to this agent
          const activeCallInDb = allCalls.find(call =>
            call.agent_id === currentAgentId &&
            call.call_status === 'in-progress' &&
            call.call_direction === 'inbound'
          );

          if (activeCallInDb && !activeCall) {
            const callAge = Date.now() - new Date(activeCallInDb.created_at).getTime();
            if (callAge < 60 * 60 * 1000) { // Active calls can be up to 1 hour old
              console.log('🔧 [AUTO-SYNC] Found missing active call, correcting state:', activeCallInDb.id);
              setActiveCall(activeCallInDb as Call);
              setIncomingCall(null); // Clear any incoming call state

              // Load customer profile
              const { data: profile } = await supabase
                .from('customer_profiles')
                .select('*')
                .eq('phone_number', activeCallInDb.customer_number)
                .maybeSingle();

              if (profile) {
                setCustomerProfile(profile);
              }

              // Start transcription if not already running
              try {
                console.log('🎙️ Starting transcription for restored call:', activeCallInDb.id);
                await supabase.functions.invoke('twilio-start-transcription', {
                  body: { callId: activeCallInDb.id }
                });
                console.log('✅ Transcription started for restored call');
              } catch (error) {
                console.error('❌ Failed to start transcription for restored call:', error);
              }

              toast({
                title: "Active Call Restored",
                description: `Call with ${activeCallInDb.customer_number} (auto-restored)`,
              });
              return; // Don't check for ringing calls if we found an active one
            }
          }

          // If no active call, check for ringing calls (only if no activeCall in state)
          if (!activeCall) {
            console.log('🔍 [AUTO-SYNC] Searching for ringing calls...', {
              currentAgentId,
              hasActiveCall: !!activeCall,
              hasIncomingCall: !!incomingCall
            });

            const availableCall = allCalls.find(call =>
              (call.agent_id === currentAgentId || !call.agent_id) &&
              call.call_status === 'ringing' &&
              call.call_direction === 'inbound'
            );

            console.log('🔍 [AUTO-SYNC] Ringing call search result:', {
              found: !!availableCall,
              callId: availableCall?.id,
              matchesAgentId: availableCall ? (availableCall.agent_id === currentAgentId || !availableCall.agent_id) : 'N/A',
              status: availableCall?.call_status,
              direction: availableCall?.call_direction
            });

            if (availableCall && !incomingCall) {
              const callAge = Date.now() - new Date(availableCall.created_at).getTime();
              console.log('🔍 [AUTO-SYNC] Call age check:', {
                callAge: Math.round(callAge / 1000) + 's',
                isRecent: callAge < 15 * 60 * 1000
              });

              if (callAge < 15 * 60 * 1000) { // Only recent calls
                console.log('🔧 [AUTO-SYNC] Found missing ringing call, correcting state:', availableCall.id);
                setIncomingCall(availableCall as Call);
                toast({
                  title: "Incoming Call Detected",
                  description: `Call from ${availableCall.customer_number} (auto-detected)`,
                });
              } else {
                console.log('⏰ [AUTO-SYNC] Call too old, not setting state');
              }
            } else {
              console.log('⚠️ [AUTO-SYNC] Not setting incomingCall:', {
                hasAvailableCall: !!availableCall,
                alreadyHasIncomingCall: !!incomingCall
              });
            }
          } else {
            console.log('⚠️ [AUTO-SYNC] Skipping ringing call check - already have activeCall');
          }
        } else {
          console.log('📭 [AUTO-SYNC] No calls found in database');
        }
      } catch (err) {
        console.error('❌ [AUTO-SYNC] Database check failed:', err);
      }
    }, 5000);

    const channel = supabase
      .channel('call-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
        },
        async (payload) => {
          if (!mounted) return;
          
          console.log('🔥 [REALTIME DEBUG] INSERT event received:', {
            new: payload.new,
            eventType: payload.eventType,
            schema: payload.schema,
            table: payload.table,
            timestamp: new Date().toISOString()
          });
          
          const newCall = payload.new as Call;
          console.log('🔔 New call inserted:', newCall);
          
          const currentAgentId = await getCurrentAgentId();
          
          // Show incoming call notification for calls that need an agent
          console.log('🔔 New call details:', {
            id: newCall.id,
            direction: newCall.call_direction,
            status: newCall.call_status,
            agent_id: newCall.agent_id,
            customer_number: newCall.customer_number,
            twilio_call_sid: newCall.twilio_call_sid,
            currentAgentId
          });
          
          // Only set as incoming call if no active call exists and it's for this agent
          // Also check that the call is recent (within last 15 minutes) to avoid stale calls
          const callAge = Date.now() - new Date(newCall.created_at).getTime();
          const isRecentCall = callAge < 15 * 60 * 1000; // 15 minutes
          
          if (newCall.call_direction === 'inbound' && 
              newCall.call_status === 'ringing' && 
              (!newCall.agent_id || newCall.agent_id === currentAgentId) &&
              !activeCall &&
              isRecentCall) { // Don't show incoming if already on a call or call is too old
          console.log('🔥 [REALTIME DEBUG] Setting incoming call state now:', {
            callId: newCall.id,
            agentId: currentAgentId,
            customer: newCall.customer_number,
            callAge: Math.round(callAge / 1000) + 's'
          });
          setIncomingCall(newCall);
            toast({
              title: "Incoming Call",
              description: `Call from ${newCall.customer_number}`,
            });
          } else {
            console.log('🔔 Call not shown as incoming:', {
              direction: newCall.call_direction,
              status: newCall.call_status,
              agent_id: newCall.agent_id,
              currentAgentId: currentAgentId,
              hasActiveCall: !!activeCall,
              isRecentCall,
              callAge: Math.round(callAge / 1000) + 's',
              reason: newCall.call_direction !== 'inbound' ? 'not inbound' :
                      newCall.call_status !== 'ringing' ? 'not ringing' :
                      (newCall.agent_id && newCall.agent_id !== currentAgentId) ? 'assigned to different agent' :
                      activeCall ? 'already on active call' :
                      !isRecentCall ? 'call too old' : 'unknown'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
        },
        async (payload) => {
          if (!mounted) return;
          
          console.log('📞 Call updated:', payload.new);
          const updatedCall = payload.new as Call;
          const currentAgentId = await getCurrentAgentId();
          
          console.log('🔍 Current activeCall before update:', activeCall?.id, 'status:', activeCall?.call_status);
          console.log('🔍 Updated call:', updatedCall.id, 'status:', updatedCall.call_status);
          
          // Update active call if it matches
          if (activeCall && updatedCall.id === activeCall.id) {
            console.log('🔄 Updating existing activeCall state with:', updatedCall);
            setActiveCall(updatedCall);
            
            // Clear dashboard if call is completed/failed
            if (updatedCall.call_status === 'completed' || updatedCall.call_status === 'failed') {
              console.log('🧹 Call ended - clearing dashboard state');
              setActiveCall(null);
              setCustomerProfile(null);
              setIncomingCall(null);
            }
          }
          
          // Handle incoming call status changes
          if (incomingCall && updatedCall.id === incomingCall.id) {
            console.log('🔄 Processing incoming call update:', updatedCall.call_status);
            // Only clear incoming call if it's completed or failed, not if it becomes in-progress
            if (updatedCall.call_status === 'completed' || updatedCall.call_status === 'failed') {
              console.log('🧹 Clearing incoming call - call ended with status:', updatedCall.call_status);
              setIncomingCall(null);
            } else if (updatedCall.call_status === 'in-progress') {
              console.log('🎯 Call answered - converting incoming to active');
              setIncomingCall(null);
              setActiveCall(updatedCall);
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (debugInterval) clearInterval(debugInterval);
      supabase.removeChannel(channel);
    };
  }, []); // Run only once on mount

  const handleAnswerCall = async (call?: Call) => {
    console.log('🔧 *** handleAnswerCall TRIGGERED ***');
    console.log('🔧 handleAnswerCall called with:', call?.id || 'no call provided');
    console.log('🔧 incomingCall state:', incomingCall?.id || 'no incoming call');
    console.log('🔧 activeCall state BEFORE:', activeCall?.id || 'no active call');

    // CRITICAL DEBUG: Check database directly when answer is clicked
    console.log('🔍 [CRITICAL DEBUG] Checking database directly for ALL calls:');
    try {
      const { data: allRingingCalls, error: dbError } = await supabase
        .from('calls')
        .select('*')
        .eq('call_status', 'ringing')
        .order('created_at', { ascending: false });

      console.log('🔍 [CRITICAL DEBUG] ALL ringing calls in database:', {
        allRingingCalls,
        dbError,
        count: allRingingCalls?.length || 0
      });

      if (allRingingCalls && allRingingCalls.length > 0) {
        console.log('🔍 [CRITICAL DEBUG] Most recent ringing call:', allRingingCalls[0]);
        console.log('🔍 [CRITICAL DEBUG] Why is this not in our state?', {
          incomingCall: incomingCall?.id || 'null',
          activeCall: activeCall?.id || 'null'
        });
      }
    } catch (dbErr) {
      console.error('❌ [CRITICAL DEBUG] Database query failed:', dbErr);
    }

    // If no call provided and no incoming call in state, get the most recent ringing call from DB
    let callToAnswer = call || incomingCall;

    if (!callToAnswer) {
      console.log('🔍 No call in state, checking database for recent ringing calls...');
      try {
        const currentAgentId = await getCurrentAgentId();
        const { data: availableCalls, error: availError } = await supabase
          .from('calls')
          .select('*')
          .or(`agent_id.eq.${currentAgentId},agent_id.is.null`)
          .eq('call_status', 'ringing')
          .eq('call_direction', 'inbound')
          .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (availError) throw availError;

        if (availableCalls && availableCalls.length > 0) {
          callToAnswer = availableCalls[0] as Call;
          console.log('🔍 Found recent call in database:', callToAnswer.id);
        }
      } catch (dbErr) {
        console.error('❌ Failed to check database for calls:', dbErr);
      }
    }

    if (!callToAnswer) {
      console.error('❌ No call to answer - checked state and database');
      toast({
        title: "No Call Available",
        description: "No ringing calls found to answer",
        variant: "destructive"
      });
      return;
    }

    console.log('📞 Answering call:', callToAnswer.id, 'status:', callToAnswer.call_status);

    try {
      // STEP 1: Answer the Twilio call FIRST (connects audio)
      console.log('📞 Step 1: Answering Twilio call...');
      twilioAnswerCall();
      console.log('✅ Twilio call answered');

      // STEP 2: Update the call status and assign agent in database
      console.log('🔄 Step 2: Updating call in database...');
      const currentAgentId = await getCurrentAgentId();

      if (!currentAgentId) {
        throw new Error('Unable to get current agent ID');
      }
      const { data: updatedCall, error: updateError } = await supabase
        .from('calls')
        .update({ 
          call_status: 'in-progress',
          agent_id: currentAgentId,
          started_at: new Date().toISOString() // Ensure started_at is set
        })
        .eq('id', callToAnswer.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        throw updateError;
      }
      
      if (!updatedCall) {
        console.error('❌ No updated call data returned');
        throw new Error('Failed to get updated call data');
      }
      
      console.log('✅ Call status updated in database:', updatedCall);
      console.log('🎯 Updated call object:', JSON.stringify(updatedCall, null, 2));
      
      // Ensure we have the correct status
      if (updatedCall.call_status !== 'in-progress') {
        console.error('❌ Call status was not updated correctly! Expected: in-progress, Got:', updatedCall.call_status);
      }
      
      // Force clear incoming call first
      setIncomingCall(null);
      
      // Set active call with updated data  
      console.log('🎯 Setting activeCall state to call with status:', updatedCall.call_status);
      console.log('🎯 Full updatedCall object:', JSON.stringify(updatedCall, null, 2));
      
      // Ensure we set the activeCall correctly
      const callWithCorrectId = {
        ...updatedCall,
        id: updatedCall.id || callToAnswer.id, // Ensure ID is preserved
        call_status: 'in-progress'
      } as Call;
      
      console.log('🎯 Final call object being set as activeCall:', JSON.stringify(callWithCorrectId, null, 2));
      setActiveCall(callWithCorrectId);
      
      // Force a state verification after setting
      setTimeout(() => {
        console.log('🔍 activeCall state verification after 100ms:', activeCall?.id, activeCall?.call_status);
        console.log('🔍 LiveTranscriptPanel should now get callId:', callWithCorrectId.id);
      }, 100);
      
      // Immediately show success feedback
      toast({
        title: "Call Connected", 
        description: `Connected to ${callToAnswer.customer_number} - Status: ${updatedCall.call_status}`,
      });
      
      // Start transcription immediately after call is connected
      console.log('🎙️ Starting transcription for connected call:', callWithCorrectId.id);
      try {
        const { data: transcriptionResult, error: transcriptionError } = await supabase.functions.invoke('twilio-start-transcription', {
          body: { callId: callWithCorrectId.id }
        });
        
        if (transcriptionError) {
          console.error('❌ Transcription startup error:', transcriptionError);
          toast({
            title: "Call Connected", 
            description: `Connected to ${callToAnswer.customer_number} - Live transcription unavailable`,
          });
        } else {
          console.log('✅ Transcription started:', transcriptionResult);
          toast({
            title: "Call Connected", 
            description: `Connected to ${callToAnswer.customer_number} - Live transcription active`,
          });
        }
      } catch (error) {
        console.error('❌ Failed to start transcription:', error);
      }
      
      // Load comprehensive customer profile data immediately
      console.log('📋 Loading customer profile for:', callToAnswer.customer_number);
      const { data: profile, error: profileError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('phone_number', callToAnswer.customer_number)
          .maybeSingle();
      
      if (profileError) {
        console.error('❌ Error loading customer profile:', profileError);
      }
      
      if (profile) {
        console.log('📋 Customer profile loaded:', profile);
        setCustomerProfile(profile);
      } else {
        console.log('📋 No existing profile, attempting to create one...');
        // Try to find user by phone number and create profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', callToAnswer.customer_number)
          .maybeSingle();
        
        if (userError) {
          console.error('❌ Error loading user data:', userError);
        }
        
        if (userData) {
          console.log('📋 Found user data, creating profile:', userData);
          const { data: newProfile, error: createError } = await supabase
            .from('customer_profiles')
            .insert({
              phone_number: callToAnswer.customer_number,
              name: userData.full_name,
              email: userData.email,
              call_history_count: 1,
              last_interaction_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) {
            console.error('❌ Error creating customer profile:', createError);
          } else if (newProfile) {
            console.log('📋 New customer profile created:', newProfile);
            setCustomerProfile(newProfile);
          }
        } else {
          // Create minimal profile for unknown customer
          console.log('📋 Creating minimal profile for unknown customer');
          const { data: minimalProfile, error: minimalError } = await supabase
            .from('customer_profiles')
            .insert({
              phone_number: callToAnswer.customer_number,
              name: `Customer ${callToAnswer.customer_number.slice(-4)}`,
              call_history_count: 1,
              last_interaction_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (minimalError) {
            console.error('❌ Error creating minimal profile:', minimalError);
          } else if (minimalProfile) {
            console.log('📋 Minimal customer profile created:', minimalProfile);
            setCustomerProfile(minimalProfile);
          }
        }
      }

    } catch (error) {
      console.error('❌ Error answering call:', error);
      toast({
        title: "Error",
        description: "Failed to answer call",
        variant: "destructive",
      });
    }
  };

  const handleDeclineCall = async (call: Call) => {
    console.log('🚫 Declining call:', call.id);

    try {
      // STEP 1: Reject the Twilio call (disconnect audio)
      console.log('🚫 Step 1: Rejecting Twilio call...');
      twilioRejectCall();
      console.log('✅ Twilio call rejected');

      // STEP 2: Call edge function to properly end the Twilio call
      console.log('🔄 Step 2: Calling twilio-end-call edge function...');
      const { error: endCallError } = await supabase.functions.invoke('twilio-end-call', {
        body: { callId: call.id }
      });

      if (endCallError) {
        console.error('❌ Error calling twilio-end-call:', endCallError);
        throw endCallError;
      }

      console.log('✅ Call ended successfully on Twilio side');

      // STEP 3: Clear state AFTER call is properly ended
      console.log('🧹 Step 3: Clearing incomingCall state');
      setIncomingCall(null);

      toast({
        title: "Call Declined",
        description: "Incoming call was declined",
      });
    } catch (error) {
      console.error('❌ Error declining call:', error);

      // Still clear state even if edge function fails (prevent stuck UI)
      setIncomingCall(null);

      toast({
        title: "Error",
        description: "Failed to decline call properly",
        variant: "destructive",
      });
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;

    console.log('🔚 handleEndCall called for call:', activeCall.id);

    try {
      // STEP 1: Hangup Twilio call (disconnect audio)
      console.log('🔚 Step 1: Hanging up Twilio call...');
      twilioHangupCall();
      console.log('✅ Twilio call hung up');

      // STEP 2: Call our edge function to properly end the Twilio call in backend
      const { error } = await supabase.functions.invoke('twilio-end-call', {
        body: { callId: activeCall.id }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Call Ended",
        description: "Call has been terminated",
      });

      // Immediately clear all dashboard state
      console.log('🧹 Manually clearing dashboard state after ending call');
      setActiveCall(null);
      setCustomerProfile(null);
      setIncomingCall(null);
    } catch (error) {
      console.error('Error ending call:', error);
      toast({
        title: "Error",
        description: "Failed to end call properly",
        variant: "destructive",
      });

      // Still clear state even if there was an error
      console.log('🧹 Clearing dashboard state despite error');
      setActiveCall(null);
      setCustomerProfile(null);
      setIncomingCall(null);
    }
  };

  // Simulate incoming call (for demo purposes)
  const simulateIncomingCall = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .insert({
          customer_number: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
          agent_id: null, // Will be assigned when answered
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setActiveCall(data as Call);
        toast({
          title: "Incoming Call",
          description: `Call from ${data.customer_number}`,
        });
      }
    } catch (error) {
      console.error('Error creating call:', error);
    }
  };

  const handleSelectCall = (call: Call) => {
    setSelectedCall(call);
    setIsCallDetailsOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Incoming Call Notification */}
        <IncomingCallNotification
          incomingCall={incomingCall}
          onAnswer={handleAnswerCall}
          onDecline={handleDeclineCall}
        />

        {showHeader && (
          <header className="absolute top-0 left-0 right-0 h-12 flex items-center border-b bg-background z-10">
            <SidebarTrigger className="ml-2" />
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold">Call Center Dashboard</h1>
            </div>
            <button 
              onClick={simulateIncomingCall}
              className="mr-4 text-sm px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Simulate Call
            </button>
          </header>
        )}

        {/* Sidebar - Call Panel */}
        <aside className={`w-80 border-r bg-sidebar ${showHeader ? 'pt-12' : ''}`}>
          <div className="p-4 h-full">
            <CallPanel
              activeCall={activeCall}
              incomingCall={incomingCall}
              onAnswerCall={handleAnswerCall}
              onEndCall={handleEndCall}
              onDeclineCall={handleDeclineCall}
              onClearDashboard={() => {
                console.log('🧹 Dashboard clear requested from CallPanel');
                setActiveCall(null);
                setCustomerProfile(null);
                setIncomingCall(null);
              }}
              twilioCall={twilioCall}
              isConnected={isConnected}
              isMuted={isMuted}
              isOnHold={isOnHold}
              isDeviceReady={isDeviceReady}
              isInitializing={isInitializing}
              toggleMute={toggleMute}
              toggleHold={toggleHold}
              retryConnection={retryConnection}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 ${showHeader ? 'pt-12' : ''}`}>
          <div className="h-[calc(100vh-3rem)] p-4 flex flex-col gap-4">
            <div className="flex gap-4 h-full">
              {/* Only show when NO active call - dialog handles active calls */}
              {!activeCall ? (
                <>
                  {/* Left Side - Transcript and Suggestions */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-1">
                      <LiveTranscriptPanel
                        callId={null}
                        key="transcript-none"
                      />
                    </div>
                    <div className="flex-1">
                      <AISuggestionsPanel
                        callId={null}
                        key="suggestions-none"
                      />
                    </div>
                  </div>

                  {/* Center - Customer Info and Chat History */}
                  <div className="w-80 flex flex-col gap-4">
                    <div className="flex-1">
                      <EnhancedCustomerInfoPanel
                        customerProfile={customerProfile}
                        activeCall={activeCall}
                      />
                    </div>
                    <div className="flex-1">
                      <CustomerChatHistory
                        customerProfile={customerProfile}
                        className="h-full"
                      />
                    </div>
                  </div>

                  {/* Right Side - Call History */}
                  <div className="w-80">
                    <CallHistory
                      onSelectCall={handleSelectCall}
                      className="h-full"
                    />
                  </div>
                </>
              ) : (
                /* During active call, show customer info and call history only */
                <div className="flex gap-4 h-full w-full">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-700 mb-2">Call In Progress</p>
                      <p className="text-gray-500">View transcript and AI suggestions in the dialog</p>
                    </div>
                  </div>

                  {/* Customer Info and Chat History */}
                  <div className="w-80 flex flex-col gap-4">
                    <div className="flex-1">
                      <EnhancedCustomerInfoPanel
                        customerProfile={customerProfile}
                        activeCall={activeCall}
                      />
                    </div>
                    <div className="flex-1">
                      <CustomerChatHistory
                        customerProfile={customerProfile}
                        className="h-full"
                      />
                    </div>
                  </div>

                  {/* Call History */}
                  <div className="w-80">
                    <CallHistory
                      onSelectCall={handleSelectCall}
                      className="h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {!showHeader && (
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={simulateIncomingCall}
                className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Simulate Call
              </button>
            </div>
          )}
        </main>
        
        {/* Call Details Modal */}
        <CallDetailsModal
          call={selectedCall}
          isOpen={isCallDetailsOpen}
          onClose={() => {
            setIsCallDetailsOpen(false);
            setSelectedCall(null);
          }}
        />

        {/* Active Call Dialog - Full Screen */}
        <ActiveCallDialog
          isOpen={isActiveCallDialogOpen}
          onClose={() => setIsActiveCallDialogOpen(false)}
          activeCall={activeCall}
        />
      </div>
    </SidebarProvider>
  );
};