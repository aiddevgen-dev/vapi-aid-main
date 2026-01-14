import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GitBranch,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Zap,
  Bot,
  UserCheck,
  Webhook,
  Wrench,
  ArrowRightLeft,
} from 'lucide-react';

interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: 'completed' | 'in_progress' | 'failed';
  startedAt: string;
  completedAt?: string;
  nodes: {
    id: string;
    type: 'trigger' | 'ai_handling' | 'transfer_human' | 'webhook' | 'tool_call' | 'complete';
    label: string;
    status: 'completed' | 'active' | 'pending' | 'skipped';
    details?: string;
  }[];
}

// Execution history
const executions: WorkflowExecution[] = [
  {
    id: '0',
    workflowName: 'Inbound Call Orchestration',
    status: 'completed',
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    completedAt: new Date(Date.now() - 1500000).toISOString(),
    nodes: [
      { id: '1', type: 'trigger', label: 'Call Received', status: 'completed', details: 'Inbound +1 (555) 123-4567' },
      { id: '2', type: 'ai_handling', label: 'AI Greets Caller', status: 'completed', details: 'Sara: "Hello, how can I help?"' },
      { id: '3', type: 'tool_call', label: 'Lookup Customer', status: 'completed', details: 'CRM: Found existing customer' },
      { id: '4', type: 'ai_handling', label: 'AI Qualifies Lead', status: 'completed', details: 'Intent: Schedule demo' },
      { id: '5', type: 'webhook', label: 'Check Calendar', status: 'completed', details: 'Google Calendar API' },
      { id: '6', type: 'tool_call', label: 'Book Appointment', status: 'completed', details: 'Slot: Jan 15, 2pm' },
      { id: '7', type: 'webhook', label: 'Send Confirmation', status: 'completed', details: 'Email + SMS sent' },
      { id: '8', type: 'tool_call', label: 'Update CRM', status: 'completed', details: 'Deal stage: Demo Scheduled' },
      { id: '9', type: 'webhook', label: 'Notify Sales Team', status: 'completed', details: 'Slack #sales-alerts' },
      { id: '10', type: 'complete', label: 'Call Completed', status: 'completed', details: 'Duration: 4m 32s' },
    ],
  },
  {
    id: '1',
    workflowName: 'Lead Follow-up',
    status: 'completed',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3300000).toISOString(),
    nodes: [
      { id: '1', type: 'trigger', label: 'Trigger', status: 'completed', details: 'HubSpot webhook' },
      { id: '2', type: 'ai_handling', label: 'AI Handling', status: 'completed', details: 'Sara AI responded' },
      { id: '3', type: 'tool_call', label: 'Tool Call', status: 'completed', details: 'CRM updated' },
      { id: '4', type: 'webhook', label: 'Webhook', status: 'completed', details: 'Slack notified' },
      { id: '5', type: 'complete', label: 'Complete', status: 'completed' },
    ],
  },
  {
    id: '2',
    workflowName: 'Support Escalation',
    status: 'completed',
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 6600000).toISOString(),
    nodes: [
      { id: '1', type: 'trigger', label: 'Trigger', status: 'completed', details: 'Inbound call' },
      { id: '2', type: 'ai_handling', label: 'AI Handling', status: 'completed', details: 'Intent detected' },
      { id: '3', type: 'transfer_human', label: 'Transfer', status: 'completed', details: 'Escalated to agent' },
      { id: '4', type: 'tool_call', label: 'Tool Call', status: 'completed', details: 'Ticket created' },
      { id: '5', type: 'complete', label: 'Complete', status: 'completed' },
    ],
  },
  {
    id: '3',
    workflowName: 'Appointment Reminder',
    status: 'in_progress',
    startedAt: new Date(Date.now() - 120000).toISOString(),
    nodes: [
      { id: '1', type: 'trigger', label: 'Trigger', status: 'completed', details: 'Calendar event' },
      { id: '2', type: 'ai_handling', label: 'AI Handling', status: 'active', details: 'Call in progress' },
      { id: '3', type: 'tool_call', label: 'Tool Call', status: 'pending' },
      { id: '4', type: 'complete', label: 'Complete', status: 'pending' },
    ],
  },
];

const nodeIcons: Record<string, React.ReactNode> = {
  trigger: <Zap className="h-5 w-5" />,
  ai_handling: <Bot className="h-5 w-5" />,
  transfer_human: <UserCheck className="h-5 w-5" />,
  webhook: <Webhook className="h-5 w-5" />,
  tool_call: <Wrench className="h-5 w-5" />,
  complete: <CheckCircle2 className="h-5 w-5" />,
};

const nodeColors: Record<string, { bg: string; border: string; shadow: string }> = {
  trigger: { bg: 'from-purple-500 to-purple-700', border: 'border-purple-400/50', shadow: 'shadow-purple-500/40' },
  ai_handling: { bg: 'from-violet-500 to-violet-700', border: 'border-violet-400/50', shadow: 'shadow-violet-500/40' },
  transfer_human: { bg: 'from-amber-500 to-amber-700', border: 'border-amber-400/50', shadow: 'shadow-amber-500/40' },
  webhook: { bg: 'from-fuchsia-500 to-fuchsia-700', border: 'border-fuchsia-400/50', shadow: 'shadow-fuchsia-500/40' },
  tool_call: { bg: 'from-pink-500 to-pink-700', border: 'border-pink-400/50', shadow: 'shadow-pink-500/40' },
  complete: { bg: 'from-indigo-500 to-indigo-700', border: 'border-indigo-400/50', shadow: 'shadow-indigo-500/40' },
};

interface WorkflowHistoryPanelProps {
  variant?: 'full' | 'compact';
}

export const WorkflowHistoryPanel = ({ variant = 'full' }: WorkflowHistoryPanelProps) => {
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px] animate-pulse">Running</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px]">Failed</Badge>;
      default:
        return null;
    }
  };

  const handleViewExecution = (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    setIsVisualizationOpen(true);
  };

  if (variant === 'compact') {
    return (
      <>
        <Card className="h-full flex flex-col bg-card border-border border-2 border-purple-500/30">
          <CardHeader className="pb-2 pt-3 flex-shrink-0">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <ArrowRightLeft className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold">Orchestration</span>
                  <p className="text-[10px] text-muted-foreground font-normal">Workflow Runs</p>
                </div>
              </div>
              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                {executions.length}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden pt-2 pb-3">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-2">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    className="p-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-purple-500/40 transition-colors cursor-pointer"
                    onClick={() => handleViewExecution(execution)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{execution.workflowName}</span>
                      {getStatusBadge(execution.status)}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{execution.nodes.length} steps</span>
                      <span>{formatTime(execution.startedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Visualization Dialog */}
        <Dialog open={isVisualizationOpen} onOpenChange={setIsVisualizationOpen}>
          <DialogContent className="max-w-4xl p-0 border-purple-500/30">
            <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/50 to-violet-950/50">
              <DialogTitle className="text-lg font-semibold text-white">
                {selectedExecution?.workflowName}
              </DialogTitle>
              <DialogDescription className="text-sm text-purple-200/70">
                {selectedExecution && formatTime(selectedExecution.startedAt)}
              </DialogDescription>
            </div>

            <div className="bg-gradient-to-br from-[#1e1033] via-[#1a0a2e] to-[#0f0518] h-[400px] relative overflow-x-auto overflow-y-hidden">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Scrollable workflow area */}
              <div className="h-full p-6 flex items-center" style={{ width: 'max-content', minWidth: '100%' }}>
                <div className="flex items-center gap-4 flex-nowrap">
                    {selectedExecution?.nodes.map((node, idx) => {
                      const colors = nodeColors[node.type];
                      const isActive = node.status === 'active';
                      const isCompleted = node.status === 'completed';
                      const isPending = node.status === 'pending';
                      const isLast = idx === (selectedExecution?.nodes.length || 0) - 1;

                      return (
                        <div key={node.id} className="flex items-center">
                          {/* Node Card */}
                          <div className={`
                            relative flex flex-col items-center p-4 rounded-xl border-2 min-w-[140px] max-w-[160px]
                            ${isCompleted || isActive
                              ? `bg-gradient-to-br ${colors.bg} ${colors.border} shadow-lg ${colors.shadow}`
                              : 'bg-gray-800/50 border-gray-600/50'}
                            ${isActive ? 'animate-pulse' : ''}
                            ${isPending ? 'opacity-40' : ''}
                          `}>
                            {/* Step number */}
                            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                              ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-purple-400 text-white' : 'bg-gray-600 text-gray-300'}
                            `}>
                              {idx + 1}
                            </div>

                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2
                              ${isCompleted || isActive ? 'bg-white/20' : 'bg-gray-700/50'}
                            `}>
                              <span className={isCompleted || isActive ? 'text-white' : 'text-gray-400'}>
                                {nodeIcons[node.type]}
                              </span>
                            </div>

                            {/* Label */}
                            <span className={`text-sm font-semibold text-center leading-tight
                              ${isCompleted || isActive ? 'text-white' : 'text-gray-400'}
                            `}>
                              {node.label}
                            </span>

                            {/* Details */}
                            {node.details && (
                              <span className={`text-[11px] mt-1 text-center leading-tight
                                ${isCompleted || isActive ? 'text-white/70' : 'text-gray-500'}
                              `}>
                                {node.details}
                              </span>
                            )}

                            {/* Status indicator */}
                            {isCompleted && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </div>
                            )}
                            {isActive && (
                              <span className="text-[10px] text-white/80 mt-2 animate-pulse">Running...</span>
                            )}
                          </div>

                          {/* Arrow connector */}
                          {!isLast && (
                            <div className="flex items-center mx-1">
                              <div className={`w-8 h-0.5 ${isCompleted ? 'bg-purple-400' : 'bg-gray-600'}`} />
                              <div className={`w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent
                                ${isCompleted ? 'border-l-[8px] border-l-purple-400' : 'border-l-[8px] border-l-gray-600'}
                              `} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-purple-500/20 bg-gradient-to-r from-purple-950/30 to-violet-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-purple-300/70">
                {selectedExecution?.status === 'in_progress' ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span>Live</span>
                  </>
                ) : selectedExecution?.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>Failed</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400/60 text-xs">← Scroll to see all steps →</span>
                <Button variant="outline" size="sm" onClick={() => setIsVisualizationOpen(false)} className="border-purple-500/30 hover:bg-purple-500/10">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Full variant for company dashboard
  return (
    <>
      <Card className="border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-semibold">Workflow Orchestration</span>
                <p className="text-sm text-muted-foreground font-normal">Recent workflow executions</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {executions.length} runs
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-purple-500/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      execution.status === 'completed' ? 'bg-green-500/10' :
                      execution.status === 'in_progress' ? 'bg-purple-500/10' : 'bg-red-500/10'
                    }`}>
                      {execution.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : execution.status === 'in_progress' ? (
                        <GitBranch className="h-5 w-5 text-purple-500 animate-pulse" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{execution.workflowName}</p>
                      <p className="text-sm text-muted-foreground">
                        {execution.nodes.length} steps
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(execution.status)}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(execution.startedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mini node preview */}
                <div className="flex items-center gap-2 mb-3">
                  {execution.nodes.map((node, idx) => (
                    <div key={node.id} className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        node.status === 'completed' ? 'bg-purple-500/20 text-purple-400' :
                        node.status === 'active' ? 'bg-purple-500/30 text-purple-300 animate-pulse' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {nodeIcons[node.type]}
                      </div>
                      {idx < execution.nodes.length - 1 && (
                        <div className={`w-4 h-0.5 ${
                          node.status === 'completed' ? 'bg-purple-500/40' : 'bg-gray-500/20'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewExecution(execution)}
                  className="w-full gap-2 border-purple-500/30 hover:bg-purple-500/10"
                >
                  <Eye className="h-4 w-4" />
                  View Orchestration
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visualization Dialog - Same as compact */}
      <Dialog open={isVisualizationOpen} onOpenChange={setIsVisualizationOpen}>
        <DialogContent className="max-w-4xl p-0 border-purple-500/30">
          <div className="px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/50 to-violet-950/50">
            <DialogTitle className="text-lg font-semibold text-white">
              {selectedExecution?.workflowName}
            </DialogTitle>
            <DialogDescription className="text-sm text-purple-200/70">
              {selectedExecution && formatTime(selectedExecution.startedAt)}
            </DialogDescription>
          </div>

          <div className="bg-gradient-to-br from-[#1e1033] via-[#1a0a2e] to-[#0f0518] h-[400px] relative overflow-x-auto overflow-y-hidden">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Scrollable workflow area */}
            <div className="h-full p-6 flex items-center" style={{ width: 'max-content', minWidth: '100%' }}>
              <div className="flex items-center gap-4 flex-nowrap">
                  {selectedExecution?.nodes.map((node, idx) => {
                    const colors = nodeColors[node.type];
                    const isActive = node.status === 'active';
                    const isCompleted = node.status === 'completed';
                    const isPending = node.status === 'pending';
                    const isLast = idx === (selectedExecution?.nodes.length || 0) - 1;

                    return (
                      <div key={node.id} className="flex items-center">
                        {/* Node Card */}
                        <div className={`
                          relative flex flex-col items-center p-4 rounded-xl border-2 min-w-[140px] max-w-[160px]
                          ${isCompleted || isActive
                            ? `bg-gradient-to-br ${colors.bg} ${colors.border} shadow-lg ${colors.shadow}`
                            : 'bg-gray-800/50 border-gray-600/50'}
                          ${isActive ? 'animate-pulse' : ''}
                          ${isPending ? 'opacity-40' : ''}
                        `}>
                          {/* Step number */}
                          <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-purple-400 text-white' : 'bg-gray-600 text-gray-300'}
                          `}>
                            {idx + 1}
                          </div>

                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2
                            ${isCompleted || isActive ? 'bg-white/20' : 'bg-gray-700/50'}
                          `}>
                            <span className={isCompleted || isActive ? 'text-white' : 'text-gray-400'}>
                              {nodeIcons[node.type]}
                            </span>
                          </div>

                          {/* Label */}
                          <span className={`text-sm font-semibold text-center leading-tight
                            ${isCompleted || isActive ? 'text-white' : 'text-gray-400'}
                          `}>
                            {node.label}
                          </span>

                          {/* Details */}
                          {node.details && (
                            <span className={`text-[11px] mt-1 text-center leading-tight
                              ${isCompleted || isActive ? 'text-white/70' : 'text-gray-500'}
                            `}>
                              {node.details}
                            </span>
                          )}

                          {/* Status indicator */}
                          {isCompleted && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                          )}
                          {isActive && (
                            <span className="text-[10px] text-white/80 mt-2 animate-pulse">Running...</span>
                          )}
                        </div>

                        {/* Arrow connector */}
                        {!isLast && (
                          <div className="flex items-center mx-1">
                            <div className={`w-8 h-0.5 ${isCompleted ? 'bg-purple-400' : 'bg-gray-600'}`} />
                            <div className={`w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent
                              ${isCompleted ? 'border-l-[8px] border-l-purple-400' : 'border-l-[8px] border-l-gray-600'}
                            `} />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-purple-500/20 bg-gradient-to-r from-purple-950/30 to-violet-950/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-purple-300/70">
              {selectedExecution?.status === 'in_progress' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span>Live</span>
                </>
              ) : selectedExecution?.status === 'completed' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>Failed</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400/60 text-xs">← Scroll to see all steps →</span>
              <Button variant="outline" size="sm" onClick={() => setIsVisualizationOpen(false)} className="border-purple-500/30 hover:bg-purple-500/10">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
