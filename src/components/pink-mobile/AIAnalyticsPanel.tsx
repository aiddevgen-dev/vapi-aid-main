import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  TrendingUp,
  Target,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  ThumbsUp,
  AlertTriangle,
  BarChart3,
  Loader2,
  Phone,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AIAnalyticsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    completedCalls: 0,
    inProgressCalls: 0,
    inboundCalls: 0,
    outboundCalls: 0,
    avgHandleTime: '0m 0s',
    completionRate: 0,
  });
  const [callsByDirection, setCallsByDirection] = useState<{ name: string; count: number; percent: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ time: string; count: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();

    const channel = supabase
      .channel('calls_analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => {
        fetchAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all calls
      const { data: calls, error } = await supabase
        .from('calls')
        .select('id, call_direction, call_status, started_at, ended_at, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
        return;
      }

      if (!calls || calls.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate metrics
      const total = calls.length;
      const completed = calls.filter((c: any) => c.call_status === 'completed').length;
      const inProgress = calls.filter((c: any) => c.call_status === 'in-progress').length;
      const inbound = calls.filter((c: any) => c.call_direction === 'inbound').length;
      const outbound = calls.filter((c: any) => c.call_direction === 'outbound').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate avg handle time from completed calls
      const completedWithTime = calls.filter((c: any) => c.call_status === 'completed' && c.ended_at && c.started_at);
      let avgMs = 0;
      if (completedWithTime.length > 0) {
        const totalMs = completedWithTime.reduce((sum: number, c: any) => {
          return sum + (new Date(c.ended_at).getTime() - new Date(c.started_at).getTime());
        }, 0);
        avgMs = totalMs / completedWithTime.length;
      }
      const avgMins = Math.floor(avgMs / 60000);
      const avgSecs = Math.floor((avgMs % 60000) / 1000);
      const avgHandleTime = `${avgMins}m ${avgSecs}s`;

      setMetrics({
        totalCalls: total,
        completedCalls: completed,
        inProgressCalls: inProgress,
        inboundCalls: inbound,
        outboundCalls: outbound,
        avgHandleTime,
        completionRate,
      });

      // Call distribution by direction
      setCallsByDirection([
        { name: 'Outbound', count: outbound, percent: total > 0 ? Math.round((outbound / total) * 100) : 0 },
        { name: 'Inbound', count: inbound, percent: total > 0 ? Math.round((inbound / total) * 100) : 0 },
      ]);

      // Recent activity by hour (last 24 hours)
      const now = new Date();
      const hourBuckets: Record<string, number> = {};
      for (let i = 0; i < 6; i++) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        const key = hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        hourBuckets[key] = 0;
      }

      calls.forEach((c: any) => {
        const callTime = new Date(c.created_at);
        const hourDiff = (now.getTime() - callTime.getTime()) / (1000 * 60 * 60);
        if (hourDiff <= 6) {
          const key = callTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          if (hourBuckets[key] !== undefined) {
            hourBuckets[key]++;
          }
        }
      });

      setRecentActivity(
        Object.entries(hourBuckets)
          .map(([time, count]) => ({ time, count }))
          .reverse()
      );

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchAnalytics:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full flex flex-col bg-card border-border">
        <CardHeader className="pb-2 lg:pb-3 pt-2 lg:pt-3 px-2 lg:px-4 flex-shrink-0 border-b">
          <CardTitle className="text-sm lg:text-base flex items-center gap-1.5 lg:gap-2">
            <BarChart3 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            <span className="truncate">Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 lg:h-6 lg:w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardHeader className="pb-2 lg:pb-3 pt-2 lg:pt-3 px-2 lg:px-4 flex-shrink-0 border-b">
        <CardTitle className="text-sm lg:text-base flex items-center gap-1.5 lg:gap-2">
          <BarChart3 className="h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
          <span className="truncate">Analytics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-2 lg:p-4 space-y-2 lg:space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-1.5 lg:gap-3">
              {/* Total Calls */}
              <div className="p-2 lg:p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-1 lg:gap-2 mb-0.5 lg:mb-1">
                  <Phone className="h-3 w-3 lg:h-4 lg:w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-[9px] lg:text-xs text-purple-600 font-medium truncate">Total</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-purple-600">{metrics.totalCalls}</p>
                <p className="text-[8px] lg:text-[10px] text-muted-foreground mt-0.5 lg:mt-1">All time</p>
              </div>

              {/* Completion Rate */}
              <div className="p-2 lg:p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-1 lg:gap-2 mb-0.5 lg:mb-1">
                  <Bot className="h-3 w-3 lg:h-4 lg:w-4 text-green-600 flex-shrink-0" />
                  <span className="text-[9px] lg:text-xs text-green-600 font-medium truncate">Done</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-green-600">{metrics.completionRate}%</p>
                <Progress value={metrics.completionRate} className="h-0.5 lg:h-1 mt-1 lg:mt-2" />
              </div>

              {/* Avg Handle Time */}
              <div className="p-2 lg:p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center gap-1 lg:gap-2 mb-0.5 lg:mb-1">
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-[9px] lg:text-xs text-blue-600 font-medium truncate">Avg</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-blue-600">3m 25s</p>
                <p className="text-[8px] lg:text-[10px] text-muted-foreground mt-0.5 lg:mt-1">Completed</p>
              </div>

              {/* Active Calls */}
              <div className="p-2 lg:p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center gap-1 lg:gap-2 mb-0.5 lg:mb-1">
                  <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-orange-600 flex-shrink-0" />
                  <span className="text-[9px] lg:text-xs text-orange-600 font-medium truncate">Active</span>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-orange-600">{metrics.inProgressCalls}</p>
                <p className="text-[8px] lg:text-[10px] text-muted-foreground mt-0.5 lg:mt-1">In progress</p>
              </div>
            </div>

            {/* Call Direction Breakdown */}
            <div>
              <h4 className="text-[9px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 lg:mb-2">
                Direction
              </h4>
              <div className="space-y-1 lg:space-y-2">
                {callsByDirection.map((item, i) => (
                  <div key={i} className="flex items-center gap-1 lg:gap-2">
                    <div className="flex items-center gap-0.5 lg:gap-1 w-14 lg:w-24 flex-shrink-0">
                      {item.name === 'Outbound' ? (
                        <PhoneOutgoing className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-pink-500" />
                      ) : (
                        <PhoneIncoming className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-blue-500" />
                      )}
                      <span className="text-[9px] lg:text-xs truncate">{item.name.slice(0, 3)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Progress
                        value={item.percent}
                        className={`h-1.5 lg:h-2 ${item.name === 'Outbound' ? '[&>div]:bg-pink-500' : '[&>div]:bg-blue-500'}`}
                      />
                    </div>
                    <div className="w-6 lg:w-10 text-[9px] lg:text-xs text-right text-muted-foreground flex-shrink-0">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call Stats Summary */}
            <div className="p-2 lg:p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-2">
                <ThumbsUp className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                <span className="text-[10px] lg:text-sm font-medium">Summary</span>
              </div>
              <div className="grid grid-cols-3 gap-1 lg:gap-2 text-center">
                <div>
                  <p className="text-sm lg:text-lg font-bold text-pink-600">{metrics.outboundCalls}</p>
                  <p className="text-[8px] lg:text-[10px] text-muted-foreground">Out</p>
                </div>
                <div>
                  <p className="text-sm lg:text-lg font-bold text-blue-600">{metrics.inboundCalls}</p>
                  <p className="text-[8px] lg:text-[10px] text-muted-foreground">In</p>
                </div>
                <div>
                  <p className="text-sm lg:text-lg font-bold text-green-600">{metrics.completedCalls}</p>
                  <p className="text-[8px] lg:text-[10px] text-muted-foreground">Done</p>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div>
              <h4 className="text-[9px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 lg:mb-2 flex items-center gap-1 lg:gap-2">
                <Target className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                Status
              </h4>
              <div className="space-y-1 lg:space-y-1.5">
                <div className="flex items-center justify-between p-1.5 lg:p-2 rounded bg-green-500/10 border border-green-500/20">
                  <span className="text-[9px] lg:text-xs flex items-center gap-1">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-500"></div>
                    Completed
                  </span>
                  <Badge variant="outline" className="text-[8px] lg:text-[10px] px-1">
                    {metrics.completedCalls}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-1.5 lg:p-2 rounded bg-orange-500/10 border border-orange-500/20">
                  <span className="text-[9px] lg:text-xs flex items-center gap-1">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-orange-500 animate-pulse"></div>
                    Active
                  </span>
                  <Badge variant="outline" className="text-[8px] lg:text-[10px] px-1">
                    {metrics.inProgressCalls}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
