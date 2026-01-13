import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Phone,
  Headphones,
  Bot,
  ArrowRight,
  CheckCircle,
  Copy,
  Sparkles,
  Settings,
  Users,
  PhoneForwarded,
  MessageSquare,
  Shield,
  Clock,
  Zap,
  Edit,
  Save,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Transfer Configuration
const TRANSFER_CONFIG = {
  twilioNumber: '+1 (765) 676-3105',
  twilioNumberRaw: '+17656763105',
  vapiAssistantId: '805978f7-ce8b-44f5-9147-16a90280022b',
  transferEndpoint: 'vapi-pink-transfer',
};

// Default AI Suggestions Prompt used during calls
const DEFAULT_AI_SUGGESTIONS_PROMPT = `You are an AI assistant helping human agents during live customer calls for Pink Mobile.

When a call is transferred from Sara AI to a human agent, provide real-time suggestions based on:
1. The customer's issue and call history
2. The escalation reason from Sara AI
3. Available solutions and promotions

CAPABILITIES:
- Suggest relevant responses based on customer queries
- Provide account information lookups
- Recommend applicable promotions or discounts
- Guide agents through complex troubleshooting steps
- Draft professional responses for difficult situations

RESPONSE FORMAT:
- Keep suggestions concise (1-2 sentences)
- Highlight key actions in bold
- Include relevant policy references when applicable
- Suggest de-escalation phrases for frustrated customers

EXAMPLE SUGGESTIONS:
- "Customer may be eligible for the Loyalty Discount (15% off). Check account tenure."
- "For SIM issues, verify if customer has tried: 1) Airplane mode toggle, 2) Restart device"
- "Billing dispute - Offer one-time courtesy credit up to $25 per company policy."

Always prioritize customer satisfaction while adhering to Pink Mobile policies.`;

// Transfer Tool Definition (as configured in VAPI)
const TRANSFER_TOOL = {
  name: 'transferToHuman',
  description: 'Transfer the call to a human agent when the customer requests human assistance or when the issue requires human intervention',
  parameters: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        description: 'The reason for transferring to a human agent',
      },
      customerName: {
        type: 'string',
        description: 'The customer\'s name if known',
      },
      context: {
        type: 'object',
        description: 'Additional context about the call to help the human agent',
      },
    },
    required: ['reason'],
  },
  serverUrl: 'https://xyzcompanyidxzy.supabase.co/functions/v1/vapi-pink-transfer',
};

export const HumanAgentsList: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // AI Suggestions Prompt editing state
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_AI_SUGGESTIONS_PROMPT);
  const [editablePrompt, setEditablePrompt] = useState(DEFAULT_AI_SUGGESTIONS_PROMPT);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Load AI Suggestions Prompt from database
  const loadAiPrompt = async () => {
    setIsLoadingPrompt(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get company for current user
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, ai_suggestion_prompt' as any)
        .eq('user_id', user.id)
        .single();

      if (companyData) {
        setCompanyId(companyData.id);
        const prompt = (companyData as any).ai_suggestion_prompt || DEFAULT_AI_SUGGESTIONS_PROMPT;
        setAiPrompt(prompt);
        setEditablePrompt(prompt);
      }
    } catch (error) {
      console.error('Error loading AI prompt:', error);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  // Save AI Suggestions Prompt to database
  const saveAiPrompt = async () => {
    if (!companyId) {
      toast({
        title: 'Error',
        description: 'Company not found. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingPrompt(true);
    try {
      const { error } = await (supabase
        .from('companies' as any)
        .update({ ai_suggestion_prompt: editablePrompt } as any)
        .eq('id', companyId) as any);

      if (error) throw error;

      setAiPrompt(editablePrompt);
      setIsEditingPrompt(false);
      toast({
        title: 'Prompt Saved!',
        description: 'AI Suggestions prompt has been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving AI prompt:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save the prompt. Make sure the ai_suggestion_prompt column exists in the companies table.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Load prompt on mount
  useEffect(() => {
    loadAiPrompt();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Human Agents</h1>
          <p className="text-muted-foreground">Call transfer & AI-assisted agent support</p>
        </div>
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 py-1 px-3">
          <CheckCircle className="h-3 w-3 mr-1" />
          Transfer Active
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PhoneForwarded className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Transfer Line</span>
            </div>
            <p className="text-lg font-bold text-purple-600 font-mono">{TRANSFER_CONFIG.twilioNumber}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Twilio Contact Centre</p>
          </CardContent>
        </Card>

        <Card className="border-pink-500/20 bg-pink-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-4 w-4 text-pink-600" />
              <span className="text-xs text-pink-600 font-medium">AI Assistant</span>
            </div>
            <p className="text-lg font-bold text-pink-600">Sara AI</p>
            <p className="text-[10px] text-muted-foreground mt-1">Handles initial calls</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">AI Suggestions</span>
            </div>
            <p className="text-lg font-bold text-blue-600">Enabled</p>
            <p className="text-[10px] text-muted-foreground mt-1">Real-time agent assist</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Escalation</span>
            </div>
            <p className="text-lg font-bold text-green-600">Active</p>
            <p className="text-[10px] text-muted-foreground mt-1">Auto-escalation ready</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-1 text-xs">
            <Headphones className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transfer" className="gap-1 text-xs">
            <PhoneForwarded className="h-4 w-4" />
            Transfer Config
          </TabsTrigger>
          <TabsTrigger value="ai-prompt" className="gap-1 text-xs">
            <Sparkles className="h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
          {/* <TabsTrigger value="tool" className="gap-1 text-xs">
            <Settings className="h-4 w-4" />
            VAPI Tool
          </TabsTrigger> */}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Call Transfer Flow
              </CardTitle>
              <CardDescription>
                How calls are routed from Sara AI to human agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-pink-500/20 flex items-center justify-center mb-2">
                    <Bot className="h-8 w-8 text-pink-500" />
                  </div>
                  <p className="font-semibold">Sara AI</p>
                  <p className="text-xs text-muted-foreground">Initial Handler</p>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-16 bg-gradient-to-r from-pink-500 to-purple-500" />
                    <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30">
                      <span className="text-xs text-purple-600 font-medium">Transfer Request</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-purple-500" />
                    <div className="h-0.5 w-16 bg-gradient-to-r from-purple-500 to-blue-500" />
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                    <Headphones className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="font-semibold">Human Agent</p>
                  <p className="text-xs text-muted-foreground">Contact Centre</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-pink-500" />
                    Transfer Triggers
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Customer explicitly requests human agent
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Complex billing disputes requiring manual review
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Technical issues beyond AI troubleshooting
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Account security concerns or fraud reports
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Transfer Process
                  </h4>
                  <ol className="space-y-2 text-sm list-decimal list-inside">
                    <li>Sara AI detects transfer need or customer request</li>
                    <li>Call context and reason logged to database</li>
                    <li>Customer hears: "Connecting you with a specialist"</li>
                    <li>Call forwards to Twilio Contact Centre number</li>
                    <li>Human agent receives call with AI context</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Config Tab */}
        <TabsContent value="transfer" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneForwarded className="h-5 w-5 text-purple-500" />
                Transfer Configuration
              </CardTitle>
              <CardDescription>
                Phone numbers and endpoints for call transfers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Contact Centre Number</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(TRANSFER_CONFIG.twilioNumberRaw, 'Phone number')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xl font-bold font-mono text-purple-600">{TRANSFER_CONFIG.twilioNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">Twilio-powered human agent line</p>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Transfer Endpoint</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(TRANSFER_CONFIG.transferEndpoint, 'Endpoint')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-lg font-bold font-mono text-blue-600">{TRANSFER_CONFIG.transferEndpoint}</p>
                  <p className="text-xs text-muted-foreground mt-1">Supabase Edge Function</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">Transfer Active</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  When Sara AI calls the <code className="bg-muted px-1 rounded">transferToHuman</code> function,
                  the call is automatically forwarded to your Contact Centre number with full context.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="ai-prompt" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  AI Suggestions Prompt
                  {isEditingPrompt && (
                    <Badge variant="outline" className="text-orange-500 border-orange-500/50 text-[10px]">
                      Editing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isEditingPrompt ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditablePrompt(aiPrompt);
                          setIsEditingPrompt(false);
                        }}
                        disabled={isSavingPrompt}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveAiPrompt}
                        disabled={isSavingPrompt}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSavingPrompt ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(aiPrompt, 'AI Prompt')}
                        className="gap-2"
                        disabled={isLoadingPrompt}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPrompt(true)}
                        className="gap-2 border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                        disabled={isLoadingPrompt}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Prompt
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                This prompt powers real-time AI assistance for human agents during calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingPrompt ? (
                <Textarea
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  className="min-h-[400px] font-mono text-sm resize-y"
                  placeholder="Enter AI suggestions prompt..."
                  disabled={isSavingPrompt}
                />
              ) : isLoadingPrompt ? (
                <div className="h-[400px] flex items-center justify-center rounded-lg border bg-muted/30">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading prompt...</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[400px] rounded-lg border bg-muted/30 p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {aiPrompt}
                  </pre>
                </ScrollArea>
              )}

              <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
                <h4 className="font-semibold mb-2 text-blue-600">How It Works</h4>
                <p className="text-sm text-muted-foreground">
                  When a call is transferred to a human agent, this prompt enables real-time AI suggestions
                  that appear on the agent's screen. The AI analyzes the conversation context, customer history,
                  and escalation reason to provide helpful recommendations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VAPI Tool Tab */}
        <TabsContent value="tool" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-500" />
                VAPI Transfer Tool Definition
              </CardTitle>
              <CardDescription>
                The tool configured in VAPI that Sara AI uses to transfer calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(TRANSFER_TOOL, null, 2), 'Tool JSON')}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy JSON
                </Button>
              </div>
              <ScrollArea className="h-[300px] rounded-lg border bg-muted/30 p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {JSON.stringify(TRANSFER_TOOL, null, 2)}
                </pre>
              </ScrollArea>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Required Parameters</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="font-mono">reason</Badge>
                      <span className="text-muted-foreground">Why the transfer is needed</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Optional Parameters</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="font-mono">customerName</Badge>
                      <span className="text-muted-foreground">Customer's name</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="font-mono">context</Badge>
                      <span className="text-muted-foreground">Additional call context</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
