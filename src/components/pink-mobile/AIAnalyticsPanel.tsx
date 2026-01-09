import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  TrendingUp,
  Target,
  Gift,
  Plane,
  Clock,
  ThumbsUp,
  AlertTriangle,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AIAnalyticsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    automationRate: 0,
    avgHandleTime: '0m 0s',
    totalSessions: 0,
    completedSessions: 0,
    escalatedSessions: 0,
  });
  const [topIntents, setTopIntents] = useState<{ name: string; count: number; percent: number }[]>([]);
  const [promoStats, setPromoStats] = useState({ presented: 0, accepted: 0, acceptanceRate: 0 });
  const [escalationReasons, setEscalationReasons] = useState<{ reason: string; count: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();

    const channel = supabase
      .channel('ai_sessions_analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_sessions' }, () => {
        fetchAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalytics = async () => {
    const { data: sessions, error } = await supabase
      .from('ai_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
      return;
    }

    if (!sessions || sessions.length === 0) {
      setLoading(false);
      return;
    }

    // Calculate metrics
    const total = sessions.length;
    const completed = sessions.filter((s: any) => s.status === 'completed').length;
    const escalated = sessions.filter((s: any) => s.status === 'escalated').length;
    const automationRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate avg handle time
    const completedWithTime = sessions.filter((s: any) => s.status === 'completed' && s.ended_at && s.started_at);
    let avgMs = 0;
    if (completedWithTime.length > 0) {
      const totalMs = completedWithTime.reduce((sum: number, s: any) => {
        return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime());
      }, 0);
      avgMs = totalMs / completedWithTime.length;
    }
    const avgMins = Math.floor(avgMs / 60000);
    const avgSecs = Math.floor((avgMs % 60000) / 1000);
    const avgHandleTime = `${avgMins}m ${avgSecs}s`;

    setMetrics({
      automationRate,
      avgHandleTime,
      totalSessions: total,
      completedSessions: completed,
      escalatedSessions: escalated,
    });

    // Calculate top intents
    const intentCounts: Record<string, number> = {};
    sessions.forEach((s: any) => {
      if (s.intent) {
        intentCounts[s.intent] = (intentCounts[s.intent] || 0) + 1;
      }
    });
    const sortedIntents = Object.entries(intentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      }));
    setTopIntents(sortedIntents);

    // Calculate promo stats
    const withPromo = sessions.filter((s: any) => s.promo);
    const promoAccepted = withPromo.filter((s: any) => s.status === 'completed' && s.outcome);
    setPromoStats({
      presented: withPromo.length,
      accepted: promoAccepted.length,
      acceptanceRate: withPromo.length > 0 ? Math.round((promoAccepted.length / withPromo.length) * 100) : 0,
    });

    // Escalation reasons (from escalated sessions' intents)
    const escalationCounts: Record<string, number> = {};
    sessions.filter((s: any) => s.status === 'escalated').forEach((s: any) => {
      const reason = s.intent || 'Unknown';
      escalationCounts[reason] = (escalationCounts[reason] || 0) + 1;
    });
    setEscalationReasons(
      Object.entries(escalationCounts).map(([reason, count]) => ({ reason, count }))
    );

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="h-full flex flex-col bg-card border-border">
        <CardHeader className="pb-3 flex-shrink-0 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardHeader className="pb-3 flex-shrink-0 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Automation Rate */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Automation Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{metrics.automationRate}%</p>
                <Progress value={metrics.automationRate} className="h-1 mt-2" />
              </div>

              {/* Avg Handle Time */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Avg Handle Time</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{metrics.avgHandleTime}</p>
                <p className="text-[10px] text-muted-foreground mt-1">AI-only sessions</p>
              </div>

              {/* Total Sessions */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">Total Sessions</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{metrics.totalSessions}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{metrics.completedSessions} completed</p>
              </div>

              {/* Escalations */}
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-orange-600 font-medium">Escalations</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{metrics.escalatedSessions}</p>
                <p className="text-[10px] text-muted-foreground mt-1">transferred to agents</p>
              </div>
            </div>

            {/* Top Intents */}
            {topIntents.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Top Intents
                </h4>
                <div className="space-y-2">
                  {topIntents.map((intent, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-24 text-xs truncate">{intent.name}</div>
                      <div className="flex-1">
                        <Progress value={intent.percent} className="h-2" />
                      </div>
                      <div className="w-10 text-xs text-right text-muted-foreground">{intent.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promo Stats */}
            {promoStats.presented > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-pink-600" />
                  <span className="text-sm font-medium">Promo Acceptance Rate</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{promoStats.presented}</p>
                    <p className="text-[10px] text-muted-foreground">Presented</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{promoStats.accepted}</p>
                    <p className="text-[10px] text-muted-foreground">Accepted</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-pink-600">{promoStats.acceptanceRate}%</p>
                    <p className="text-[10px] text-muted-foreground">Rate</p>
                  </div>
                </div>
              </div>
            )}

            {/* Escalation Reasons */}
            {escalationReasons.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  Escalation Reasons
                </h4>
                <div className="space-y-1.5">
                  {escalationReasons.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-orange-500/10 border border-orange-500/20"
                    >
                      <span className="text-xs">{item.reason}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
