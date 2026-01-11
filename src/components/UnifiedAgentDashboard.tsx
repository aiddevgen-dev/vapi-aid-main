import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, BarChart3, LogOut, User, ArrowLeft } from 'lucide-react';
import { CallCenterLayout } from './CallCenterLayout';
import { AgentDashboard } from './AgentDashboard';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

type DashboardMode = 'call-center' | 'chat-support' | 'analytics';

export const UnifiedAgentDashboard = () => {
  const [mode, setMode] = useState<DashboardMode>('call-center');
  const { userProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="lyric-theme h-screen flex flex-col bg-background">
      {/* Header with Mode Toggle */}
      <header className="h-14 flex items-center justify-between px-4 border-b bg-background z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/pink-mobile')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground">lyriq.ai </h1>
            <span className="text-xs text-muted-foreground">Contact Centre</span>
          </div>
          <Badge variant="outline" className="text-xs border-primary/50 text-foreground">
            {mode === 'call-center' ? 'Call Center Mode' : 
             mode === 'chat-support' ? 'Chat Support Mode' : 
             'Analytics Mode'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Mode Toggle Buttons */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={mode === 'call-center' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('call-center')}
              className={`flex items-center gap-2 transition-all ${mode !== 'call-center' ? 'text-foreground hover:bg-primary/20' : ''}`}
            >
              <Phone className="h-4 w-4" />
              Call Center
            </Button>
            <Button
              variant={mode === 'chat-support' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('chat-support')}
              className={`flex items-center gap-2 transition-all ${mode !== 'chat-support' ? 'text-foreground hover:bg-primary/20' : ''}`}
            >
              <MessageSquare className="h-4 w-4" />
              Chat Support
            </Button>
            <Button
              variant={mode === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('analytics')}
              className={`flex items-center gap-2 transition-all ${mode !== 'analytics' ? 'text-foreground hover:bg-primary/20' : ''}`}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {userProfile?.full_name || userProfile?.email || 'Agent'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-foreground hover:bg-primary/20"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {mode === 'call-center' ? (
          <div className="h-full">
            <CallCenterLayout showHeader={false} />
          </div>
        ) : mode === 'chat-support' ? (
          <div className="h-full">
            <AgentDashboard showHeader={false} />
          </div>
        ) : (
          <div className="h-full">
            <AnalyticsDashboard />
          </div>
        )}
      </div>
    </div>
  );
};