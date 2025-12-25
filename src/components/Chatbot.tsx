import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, User, Bot, AlertTriangle, Database, ShoppingCart, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, ChatSession } from '@/types/ecommerce';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const Chatbot = () => {
  console.log('🔥 CHATBOT COMPONENT LOADING - This should always show!');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsEscalation, setNeedsEscalation] = useState(false);
  const [contextUsed, setContextUsed] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  useEffect(() => {
    console.log('🚀 CHATBOT USEEFFECT - isOpen changed to:', isOpen);
    if (isOpen && !session) {
      console.log('💫 CHATBOT - Initializing session because chatbot opened');
      initializeSession();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!session?.id) return;

    console.log('🚀 REALTIME: Starting fast subscription for session:', session.id);
    
    // Use a simple, consistent channel name for faster reconnection
    const channelName = `messages_${session.id}`;
    let subscriptionAttempts = 0;
    const maxRetries = 3;
    
    const setupSubscription = () => {
      subscriptionAttempts++;
      console.log(`📡 REALTIME: Attempt ${subscriptionAttempts} - Creating channel:`, channelName);
      
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `session_id=eq.${session.id}`
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            console.log('⚡ REALTIME: INSTANT message received:', {
              sender: newMessage.sender_type,
              id: newMessage.id.substring(0,8),
              preview: newMessage.content.substring(0, 30)
            });
            
            // Immediate state update for fastest response
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              
              const sorted = [...prev, newMessage].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              
              console.log('⚡ REALTIME: Message added instantly, count:', sorted.length);
              return sorted;
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_sessions',
            filter: `id=eq.${session.id}`
          },
          (payload) => {
            const updatedSession = payload.new as ChatSession;
            console.log('🔄 REALTIME: Session status changed:', updatedSession.status);
            
            const wasEscalated = session.agent_id && session.status === 'escalated';
            const isNowEscalated = updatedSession.agent_id && updatedSession.status === 'escalated';
            const isBackToAI = !updatedSession.agent_id && updatedSession.status === 'active';
            
            setSession(updatedSession);
            
            if (isNowEscalated && !wasEscalated) {
              setNeedsEscalation(false);
              const agentTakeoverMessage: ChatMessage = {
                id: `agent_takeover_${Date.now()}`,
                session_id: session.id,
                sender_type: 'ai',
                content: "🎧 A human customer service agent has joined the chat and will assist you from now on.",
                metadata: { is_agent_takeover: true },
                created_at: new Date().toISOString()
              };
              setMessages(prev => [...prev, agentTakeoverMessage]);
              
              toast({
                title: "Human Agent Connected",
                description: "A customer service representative is now handling your chat",
              });
            }
            
            if (isBackToAI && wasEscalated) {
              setNeedsEscalation(false);
              toast({
                title: "Back to AI Assistant", 
                description: "The human agent has completed their assistance. I'm here to continue helping you!",
              });
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 REALTIME: Status update [${channelName}]:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ REALTIME: CONNECTED! Ready for instant messages');
          } else if (status === 'CHANNEL_ERROR' && subscriptionAttempts < maxRetries) {
            console.log('❌ REALTIME: Connection failed, retrying in 1s...');
            setTimeout(() => {
              supabase.removeChannel(channel);
              setupSubscription();
            }, 1000);
          } else if (status === 'CLOSED') {
            console.log('🔌 REALTIME: Connection closed');
          }
        });
        
      return channel;
    };
    
    const channel = setupSubscription();

    return () => {
      console.log('🧹 REALTIME: Cleanup for session:', session.id);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [session?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = async () => {
    try {
      console.log('🔄 REFRESH DEBUG: initializeSession called');
      console.log('🔄 REFRESH DEBUG: Current user:', user?.id);
      
      // First, check if user has any active sessions
      if (user?.id) {
        console.log('🔍 REFRESH DEBUG: Looking for existing sessions for user:', user.id);
        const { data: existingSession } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'escalated'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingSession) {
          console.log('🔄 REFRESH DEBUG: Found existing session:', existingSession.id);
          console.log('🔄 REFRESH DEBUG: Session status:', existingSession.status);
          console.log('🔄 REFRESH DEBUG: Assigned agent:', existingSession.agent_id);
          setSession(existingSession as ChatSession);
          
          // Load existing messages
          console.log('📚 REFRESH DEBUG: Loading existing messages for session:', existingSession.id);
          const { data: existingMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', existingSession.id)
            .order('created_at', { ascending: true });

          if (existingMessages && existingMessages.length > 0) {
            console.log('📚 REFRESH DEBUG: Loaded', existingMessages.length, 'existing messages');
            console.log('📚 REFRESH DEBUG: Message types:', existingMessages.map(m => `${m.sender_type}(${m.id.substring(0,8)})`).join(', '));
            setMessages(existingMessages as ChatMessage[]);
            return; // Don't add welcome message if messages exist
          } else {
            console.log('📚 REFRESH DEBUG: No existing messages found');
          }
        } else {
          console.log('🔍 REFRESH DEBUG: No existing session found');
        }
      } else {
        console.log('🔍 REFRESH DEBUG: No user ID available');
      }

      // Create new session only if no active session exists
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          session_token: `session_${Date.now()}`,
          status: 'active',
          user_id: user?.id || null
        })
        .select()
        .single();

      if (error) throw error;
      setSession(data as ChatSession);

      // Add personalized welcome message
      const welcomeContent = user?.id 
        ? `Hi ${userProfile?.full_name || 'there'}! I'm your Complete Credit Solutions assistant. I can help you with payment arrangements, hardship applications, account inquiries, or answer any questions about managing your account. How can I assist you today?`
        : "Hi! I'm your Complete Credit Solutions assistant. I can help answer questions about payments, hardship assistance, or general account inquiries. For personalized help with your account, please log in. How can I help you today?";

      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        session_id: data.id,
        sender_type: 'ai',
        content: welcomeContent,
        metadata: { is_welcome: true, user_authenticated: !!user?.id },
        created_at: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || isLoading) return;

    // Check if session is handled by human agent
    if (session.status === 'escalated' && session.agent_id) {
      toast({
        title: "Human Agent Active",
        description: "Your message will be sent directly to the human agent",
      });
    }

    const messageContent = input.trim();
    setInput('');
    setIsLoading(true);

    // Create user message for immediate UI update
    const userMessage: ChatMessage = {
      id: `temp_${Date.now()}`, // Temporary ID until DB insert
      session_id: session.id,
      sender_type: 'user',
      content: messageContent,
      metadata: { user_id: user?.id || null },
      created_at: new Date().toISOString()
    };

    // Immediately show user message (optimistic update)
    setMessages(prev => [...prev, userMessage]);

    try {
      // Save to database
      const { data: insertedMessage, error } = await supabase.from('messages').insert({
        session_id: session.id,
        sender_type: 'user',
        content: messageContent,
        metadata: { user_id: user?.id || null }
      }).select().single();

      if (error) throw error;

      // Update the message with real ID from database
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, id: insertedMessage.id, created_at: insertedMessage.created_at }
          : msg
      ));

      // Only get AI response if not escalated to human
      if (!(session.status === 'escalated' && session.agent_id)) {
        const finalUserMessage: ChatMessage = {
          id: insertedMessage.id,
          session_id: session.id,
          sender_type: 'user',
          content: messageContent,
          metadata: { user_id: user?.id || null },
          created_at: insertedMessage.created_at
        };
        await simulateAIResponse(finalUserMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (userMessage: ChatMessage) => {
    try {
      // Call our enhanced RAG chatbot endpoint with user context
      const { data, error } = await supabase.functions.invoke('chatbot-rag', {
        body: {
          message: userMessage.content,
          sessionId: session!.id,
          userId: user?.id || null
        }
      });

      if (error) {
        console.error('Error calling chatbot function:', error);
        throw error;
      }

      const response = data;
      if (!response.success) {
        throw new Error(response.error || 'Failed to get AI response');
      }

      // Handle human takeover scenario
      if (response.humanTakeover) {
        // Don't set escalation flag or show AI response for human takeover
        return;
      }

      // Set escalation flag and context info based on AI response
      setNeedsEscalation(response.needsEscalation);
      setContextUsed(response.contextUsed);
      
      // Add AI response immediately (don't wait for real-time)
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        session_id: session!.id,
        sender_type: 'ai',
        content: response.message,
        metadata: { 
          escalation_suggested: response.needsEscalation,
          context_used: response.contextUsed
        },
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        session_id: session!.id,
        sender_type: 'ai',
        content: "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment, or I can connect you with one of our human agents for immediate assistance.",
        metadata: { escalation_suggested: true, is_fallback: true },
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, fallbackMessage]);
      setNeedsEscalation(true);
    }
  };

  const requestHumanAgent = async () => {
    if (!session) {
      console.error('❌ No session available for escalation');
      return;
    }

    console.log('🚀 Escalating chat session:', session.id);
    
    try {
      // Update session to escalated status
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'escalated',
          escalated_at: new Date().toISOString()
        })
        .eq('id', session.id)
        .select();

      if (error) {
        console.error('❌ Database error during escalation:', error);
        throw error;
      }

      console.log('✅ Session escalated successfully:', data);

      const escalationMessage: ChatMessage = {
        id: `escalation_${Date.now()}`,
        session_id: session.id,
        sender_type: 'ai',
        content: "I've escalated your chat to our human customer service team. A representative will join this conversation shortly to assist you further.",
        metadata: { is_escalation: true },
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, escalationMessage]);
      setNeedsEscalation(false);

      toast({
        title: "Chat Escalated",
        description: "A human agent will assist you shortly",
      });
    } catch (error) {
      console.error('❌ Error escalating chat:', error);
      toast({
        title: "Error",
        description: "Failed to escalate chat",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-h-[500px] flex flex-col shadow-2xl border">
          <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 border-b">
            <CardTitle className="text-lg">CCS Assistant</CardTitle>
            <div className="flex items-center space-x-2">
              {session?.status === 'escalated' && (
                <Badge variant="secondary">Agent Requested</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {(() => {
                console.log('🎨 Customer: Rendering messages array:', messages);
                return messages.map((message) => {
                  console.log('🎨 Customer: Rendering message:', message.sender_type, message.content.substring(0, 30) + '...');
                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] ${
                        message.sender_type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className="flex-shrink-0">
                          {message.sender_type === 'user' ? (
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                          ) : message.sender_type === 'agent' ? (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <Shield className="h-4 w-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                              <Bot className="h-4 w-4 text-accent-foreground" />
                            </div>
                          )}
                        </div>
                        <div
                          className={`px-3 py-2 rounded-lg break-words ${
                            message.sender_type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : message.sender_type === 'agent'
                              ? 'bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-200 dark:border-emerald-800'
                              : 'bg-muted'
                          }`}
                        >
                          <p className={`text-sm whitespace-pre-wrap ${
                            message.sender_type === 'agent' 
                              ? 'text-emerald-800 dark:text-emerald-100 font-semibold' 
                              : ''
                          }`}>
                            {message.sender_type === 'agent' && (
                              <span className="inline-flex items-center gap-1 mb-1 text-emerald-600 dark:text-emerald-400">
                                <Shield className="h-3 w-3" />
                                <span className="text-xs font-bold">HUMAN AGENT</span>
                              </span>
                            )}
                            <br />
                            {message.content}
                          </p>
                           {message.metadata?.escalation_suggested && needsEscalation && 
                           !(session?.status === 'escalated' && session?.agent_id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                console.log('🔴 Talk to Human Agent button clicked!');
                                e.preventDefault();
                                e.stopPropagation();
                                requestHumanAgent();
                              }}
                              className="mt-2 w-full"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Talk to Human Agent
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="bg-muted px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t bg-background">
              {session?.status === 'escalated' && session?.agent_id && (
                <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    You're now chatting with a human customer service agent
                  </p>
                </div>
              )}
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    session?.status === 'escalated' && session?.agent_id 
                      ? "Message the human agent..." 
                      : "Type your message..."
                  }
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};