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
} from 'lucide-react';

export const AIAnalyticsPanel = () => {
  // Demo analytics data
  const metrics = {
    automationRate: 92,
    avgHandleTime: '3m 24s',
    intentConfidence: 94,
    customerConfirmation: 89,
  };

  const topIntents = [
    { name: 'Add a Line', count: 156, percent: 35 },
    { name: 'Roaming', count: 98, percent: 22 },
    { name: 'Billing Explanation', count: 87, percent: 19 },
    { name: 'Device Support', count: 65, percent: 14 },
    { name: 'Plan Changes', count: 44, percent: 10 },
  ];

  const promoStats = {
    presented: 128,
    accepted: 63,
    acceptanceRate: 49,
  };

  const roamingStats = {
    total: 412,
    avgSpend: 74,
  };

  const escalationReasons = [
    { reason: 'Technical Issue', count: 12 },
    { reason: 'Customer Request', count: 8 },
    { reason: 'Complex Billing', count: 5 },
  ];

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

              {/* Intent Confidence */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">Intent Confidence</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{metrics.intentConfidence}%</p>
                <Progress value={metrics.intentConfidence} className="h-1 mt-2" />
              </div>

              {/* Customer Confirmation */}
              <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="h-4 w-4 text-pink-600" />
                  <span className="text-xs text-pink-600 font-medium">Understanding Confirmed</span>
                </div>
                <p className="text-2xl font-bold text-pink-600">{metrics.customerConfirmation}%</p>
                <Progress value={metrics.customerConfirmation} className="h-1 mt-2" />
              </div>
            </div>

            {/* Top Intents */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Top Intents This Week
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

            {/* Promo Stats */}
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

            {/* Roaming Stats */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Roaming Activations</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{roamingStats.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total Activations</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">${roamingStats.avgSpend}</p>
                  <p className="text-[10px] text-muted-foreground">Avg Spend/Traveler</p>
                </div>
              </div>
            </div>

            {/* Escalation Reasons */}
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
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
