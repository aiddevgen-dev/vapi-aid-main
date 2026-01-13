import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Bot,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  PhoneIncoming,
  PhoneOutgoing,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  status: 'active' | 'inactive';
  phoneNumber: string;
  voiceProvider: string;
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  successRate: number;
  createdAt: string;
}

interface AIAgentCardProps {
  agent: AIAgent;
  onEdit: (agent: AIAgent) => void;
  onDelete: (agent: AIAgent) => void;
  onDuplicate: (agent: AIAgent) => void;
  onToggleStatus: (agent: AIAgent) => void;
  onViewAnalytics: (agent: AIAgent) => void;
  onViewDetails?: (agent: AIAgent) => void;
}

export const AIAgentCard: React.FC<AIAgentCardProps> = ({
  agent,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onViewAnalytics,
  onViewDetails,
}) => {
  const isSaraAI = agent.id === 'sara-ai-pink-mobile';

  const avatarColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];

  const getAvatarColor = (name: string) => {
    if (isSaraAI) return 'bg-gradient-to-br from-pink-500 to-purple-600';
    const index = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${isSaraAI ? 'border-2 border-pink-500/50 bg-gradient-to-br from-pink-500/5 to-purple-500/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getAvatarColor(agent.name)}`}>
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{agent.name}</h3>
                {isSaraAI && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-pink-500 text-white rounded font-medium">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{agent.description}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isSaraAI ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(agent)}>
                    <Edit className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem onClick={() => onViewAnalytics(agent)}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </DropdownMenuItem> */}
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onEdit(agent)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Agent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(agent)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewAnalytics(agent)}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(agent)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'} ${isSaraAI && agent.status === 'active' ? 'animate-pulse' : ''}`} />
            <span className="text-sm text-muted-foreground">
              {agent.status === 'active' ? 'Active' : 'Inactive'}
              {isSaraAI && ' (VAPI)'}
            </span>
          </div>
          <Switch
            checked={agent.status === 'active'}
            onCheckedChange={() => onToggleStatus(agent)}
            disabled={isSaraAI}
          />
        </div>

        {/* Phone Number */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{agent.phoneNumber}</span>
        </div>

        {/* Voice Provider Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {agent.voiceProvider}
          </Badge>
        </div>

        {/* Call Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-green-500/10 border-green-500/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <PhoneIncoming className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-500">Inbound</span>
            </div>
            <div className="text-xl font-bold text-green-500">{agent.inboundCalls}</div>
          </div>
          <div className="rounded-lg border bg-blue-500/10 border-blue-500/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <PhoneOutgoing className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-500">Outbound</span>
            </div>
            <div className="text-xl font-bold text-blue-500">{agent.outboundCalls}</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Success Rate</span>
          <span className="font-semibold text-green-500">{agent.successRate}%</span>
        </div>
      </CardContent>
    </Card>
  );
};
