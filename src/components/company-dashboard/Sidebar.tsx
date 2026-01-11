import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  GitBranch,
  MessageSquare,
  Phone,
  Mail,
  Headphones,
  Building2,
  Users,
  History,
  Target,
  Settings,
  Key,
  ChevronDown,
  ChevronRight,
  Zap,
  Code2,
} from 'lucide-react';

export type SidebarSection =
  | 'dashboard'
  | 'ai-agents'
  | 'knowledge-base'
  | 'workflows'
  | 'integrations'
  | 'whatsapp'
  | 'avaya'
  | 'email'
  | 'zendesk'
  | 'salesforce'
  | 'hubspot'
  | 'zoho'
  | 'pipedrive'
  | 'custom'
  | 'call-history'
  | 'leads'
  | 'human-agents'
  | 'settings'
  | 'api-keys';

interface SidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}

interface NavItem {
  id: SidebarSection;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(['main', 'integrations', 'operations']);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const navGroups = [
    {
      id: 'main',
      label: 'MAIN',
      items: [
        { id: 'dashboard' as SidebarSection, label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { id: 'ai-agents' as SidebarSection, label: 'AI Agents', icon: <Bot className="h-4 w-4" /> },
        { id: 'knowledge-base' as SidebarSection, label: 'Knowledge Base', icon: <BookOpen className="h-4 w-4" /> },
        { id: 'workflows' as SidebarSection, label: 'Workflows', icon: <GitBranch className="h-4 w-4" /> },
      ],
    },
    {
      id: 'integrations',
      label: 'INTEGRATIONS',
      items: [
        {
          id: 'integrations' as SidebarSection,
          label: 'Overview',
          icon: <Zap className="h-4 w-4" />,
        },
        {
          id: 'whatsapp' as SidebarSection,
          label: 'WhatsApp',
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          id: 'avaya' as SidebarSection,
          label: 'Voice (Avaya)',
          icon: <Phone className="h-4 w-4" />,
        },
        {
          id: 'email' as SidebarSection,
          label: 'Email',
          icon: <Mail className="h-4 w-4" />,
        },
        {
          id: 'zendesk' as SidebarSection,
          label: 'Zendesk',
          icon: <Headphones className="h-4 w-4" />,
        },
        {
          id: 'salesforce' as SidebarSection,
          label: 'Salesforce',
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          id: 'hubspot' as SidebarSection,
          label: 'HubSpot',
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          id: 'zoho' as SidebarSection,
          label: 'Zoho CRM',
          icon: <Building2 className="h-4 w-4" />,
        },
        {
          id: 'pipedrive' as SidebarSection,
          label: 'Pipedrive',
          icon: <Target className="h-4 w-4" />,
        },
        {
          id: 'custom' as SidebarSection,
          label: 'Custom (BYO)',
          icon: <Code2 className="h-4 w-4" />,
        },
      ],
    },
    {
      id: 'operations',
      label: 'OPERATIONS',
      items: [
        { id: 'call-history' as SidebarSection, label: 'Call History', icon: <History className="h-4 w-4" /> },
        { id: 'leads' as SidebarSection, label: 'Leads', icon: <Target className="h-4 w-4" /> },
        { id: 'human-agents' as SidebarSection, label: 'Human Agents', icon: <Users className="h-4 w-4" /> },
      ],
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      items: [
        { id: 'settings' as SidebarSection, label: 'Company Settings', icon: <Settings className="h-4 w-4" /> },
        { id: 'api-keys' as SidebarSection, label: 'API Keys', icon: <Key className="h-4 w-4" /> },
      ],
    },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo Header */}
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-primary">lyriq.ai</h1>
          <span className="text-xs text-muted-foreground">AI Contact Center Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                {group.label}
                {expandedGroups.includes(group.id) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>

              {expandedGroups.includes(group.id) && (
                <div className="mt-1 space-y-1">
                  {group.items.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-2 px-2',
                        activeSection === item.id && 'bg-primary/10 text-primary font-medium'
                      )}
                      onClick={() => onSectionChange(item.id)}
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* User/Company Info Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Company Admin</p>
            <p className="text-xs text-muted-foreground truncate">Admin Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
};
