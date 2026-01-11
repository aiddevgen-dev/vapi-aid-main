import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  ArrowRight,
  ArrowLeftRight,
  Link2,
  Users,
  Phone,
  Target,
  DollarSign,
  Activity,
  Settings,
  Edit,
  Zap,
  MessageSquare,
  Mail,
  TestTube,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HubSpotIntegrationProps {
  onBack: () => void;
}

interface Pipeline {
  id: string;
  name: string;
  stages: number;
  deals: number;
  enabled: boolean;
}

export const HubSpotIntegration: React.FC<HubSpotIntegrationProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // OAuth Configuration
  const [oauthConfig] = useState({
    portalId: '12345678',
    hubDomain: 'company.hubspot.com',
    connectedAs: 'admin@company.com',
    connectedAt: '2024-01-08T09:15:00Z',
    scopes: ['contacts', 'deals', 'tickets', 'timeline', 'automation'],
  });

  // Sync Settings
  const [syncSettings, setSyncSettings] = useState({
    syncContacts: true,
    syncDeals: true,
    syncTickets: true,
    createTimelineEvents: true,
    autoCreateDeals: false,
    logCallsAsEngagements: true,
  });

  // Pipelines
  const [pipelines] = useState<Pipeline[]>([
    { id: '1', name: 'Sales Pipeline', stages: 7, deals: 156, enabled: true },
    { id: '2', name: 'Enterprise Pipeline', stages: 5, deals: 23, enabled: true },
    { id: '3', name: 'Partner Pipeline', stages: 4, deals: 45, enabled: false },
  ]);

  // Contact Properties
  const [contactProperties] = useState([
    { hubspot: 'firstname', lyriq: 'lead.first_name', sync: true },
    { hubspot: 'lastname', lyriq: 'lead.last_name', sync: true },
    { hubspot: 'email', lyriq: 'lead.email', sync: true },
    { hubspot: 'phone', lyriq: 'lead.phone_number', sync: true },
    { hubspot: 'company', lyriq: 'lead.company', sync: true },
    { hubspot: 'hs_lead_status', lyriq: 'lead.status', sync: true },
    { hubspot: 'last_call_date', lyriq: 'call.last_date', sync: true },
    { hubspot: 'total_calls', lyriq: 'call.count', sync: false },
  ]);

  // Automations
  const [automations] = useState([
    { id: '1', trigger: 'Call Completed', action: 'Log engagement on Contact timeline', enabled: true },
    { id: '2', trigger: 'Positive Call Outcome', action: 'Move Deal to next stage', enabled: true },
    { id: '3', trigger: 'Meeting Scheduled', action: 'Create Meeting engagement', enabled: true },
    { id: '4', trigger: 'Call Escalated', action: 'Create Ticket in HubSpot', enabled: true },
    { id: '5', trigger: 'New Contact in HubSpot', action: 'Import as Lead in LYRIQ', enabled: false },
    { id: '6', trigger: 'Deal Won', action: 'Send celebration notification', enabled: true },
  ]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: 'Sync Complete',
        description: 'Successfully synchronized 234 records with HubSpot.',
      });
    }, 3000);
  };

  const handleReconnect = () => {
    toast({
      title: 'Redirecting to HubSpot',
      description: 'Opening OAuth authorization flow...',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">HubSpot Integration</h1>
              <p className="text-sm text-muted-foreground">CRM, deals, and engagement tracking</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={isConnected ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'}>
            {isConnected ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync Now
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Synced Contacts</p>
                <p className="text-2xl font-bold">5,892</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">224</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Call Engagements</p>
                <p className="text-2xl font-bold">8,341</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-2xl font-bold">3m ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="contacts">Contact Sync</TabsTrigger>
          <TabsTrigger value="deals">Deals & Pipelines</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="timeline">Timeline Events</TabsTrigger>
        </TabsList>

        {/* Connection */}
        <TabsContent value="connection">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  OAuth Connection
                </CardTitle>
                <CardDescription>Connected HubSpot portal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Portal ID</span>
                    <span className="font-medium">{oauthConfig.portalId}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Hub Domain</span>
                    <span className="font-medium">{oauthConfig.hubDomain}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Connected As</span>
                    <span className="font-medium">{oauthConfig.connectedAs}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Connected At</span>
                    <span className="font-medium">{new Date(oauthConfig.connectedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleReconnect} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive" onClick={() => {
                    setIsConnected(false);
                    toast({ title: 'Disconnected', description: 'HubSpot integration has been disconnected.' });
                  }}>
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Authorized Scopes
                </CardTitle>
                <CardDescription>Permissions granted to LYRIQ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {oauthConfig.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary" className="capitalize">
                      {scope}
                    </Badge>
                  ))}
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium text-sm">Sync Contacts</p>
                      <p className="text-xs text-muted-foreground">Import and sync HubSpot contacts</p>
                    </div>
                    <Switch checked={syncSettings.syncContacts} onCheckedChange={(v) => setSyncSettings({ ...syncSettings, syncContacts: v })} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium text-sm">Sync Deals</p>
                      <p className="text-xs text-muted-foreground">Track deal progress from calls</p>
                    </div>
                    <Switch checked={syncSettings.syncDeals} onCheckedChange={(v) => setSyncSettings({ ...syncSettings, syncDeals: v })} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium text-sm">Log as Engagements</p>
                      <p className="text-xs text-muted-foreground">Record calls as HubSpot engagements</p>
                    </div>
                    <Switch checked={syncSettings.logCallsAsEngagements} onCheckedChange={(v) => setSyncSettings({ ...syncSettings, logCallsAsEngagements: v })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact Sync */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contact Property Mapping</CardTitle>
                <CardDescription>Map HubSpot contact properties to LYRIQ lead fields</CardDescription>
              </div>
              <Button onClick={() => toast({ title: 'Add Mapping', description: 'Opening field mapping dialog...' })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mapping
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>HubSpot Property</TableHead>
                    <TableHead></TableHead>
                    <TableHead>LYRIQ Field</TableHead>
                    <TableHead>Sync</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactProperties.map((prop, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{prop.hubspot}</TableCell>
                      <TableCell><ArrowLeftRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell className="font-mono text-sm">{prop.lyriq}</TableCell>
                      <TableCell><Switch checked={prop.sync} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Mapping', description: `Editing ${prop.hubspot} → ${prop.lyriq}` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Delete Mapping', description: `Removed ${prop.hubspot} mapping.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deals & Pipelines */}
        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipelines</CardTitle>
              <CardDescription>Configure which pipelines to integrate with call outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Switch checked={pipeline.enabled} />
                      <div>
                        <p className="font-medium">{pipeline.name}</p>
                        <p className="text-sm text-muted-foreground">{pipeline.stages} stages • {pipeline.deals} active deals</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast({ title: 'Map Stages', description: `Configuring stage mapping for ${pipeline.name}...` })}>Map Stages</Button>
                      <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Pipeline Settings', description: `Opening ${pipeline.name} settings...` })}><Settings className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Deal Stage Mapping</h4>
                <p className="text-sm text-muted-foreground mb-4">Map call outcomes to deal stage transitions</p>
                <div className="space-y-2">
                  {[
                    { outcome: 'Positive Call', action: 'Move to next stage' },
                    { outcome: 'Meeting Scheduled', action: 'Move to "Meeting Booked"' },
                    { outcome: 'Not Interested', action: 'Move to "Closed Lost"' },
                    { outcome: 'Deal Closed', action: 'Move to "Closed Won"' },
                  ].map((mapping, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <Badge variant="outline">{mapping.outcome}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>{mapping.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automations */}
        <TabsContent value="automations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  HubSpot Automations
                </CardTitle>
                <CardDescription>Automated actions triggered by call events</CardDescription>
              </div>
              <Button onClick={() => toast({ title: 'Create Automation', description: 'Opening automation builder...' })}>
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automations.map((automation) => (
                  <div key={automation.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Switch checked={automation.enabled} />
                      <div>
                        <p className="font-medium">{automation.trigger}</p>
                        <p className="text-sm text-muted-foreground">{automation.action}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast({ title: 'Configure Automation', description: `Configuring "${automation.trigger}" automation...` })}>Configure</Button>
                      <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Delete Automation', description: `Removed "${automation.trigger}" automation.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Events */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Event Configuration</CardTitle>
              <CardDescription>Configure how call events appear on HubSpot contact timelines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-medium text-sm">Create Timeline Events</p>
                  <p className="text-xs text-muted-foreground">Log all calls as timeline events on contacts</p>
                </div>
                <Switch checked={syncSettings.createTimelineEvents} onCheckedChange={(v) => setSyncSettings({ ...syncSettings, createTimelineEvents: v })} />
              </div>

              <div>
                <h4 className="font-medium mb-3">Event Types to Log</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Phone className="h-4 w-4" />, label: 'Inbound Calls', enabled: true },
                    { icon: <Phone className="h-4 w-4" />, label: 'Outbound Calls', enabled: true },
                    { icon: <MessageSquare className="h-4 w-4" />, label: 'Chat Sessions', enabled: true },
                    { icon: <Mail className="h-4 w-4" />, label: 'Email Sent', enabled: true },
                    { icon: <Target className="h-4 w-4" />, label: 'AI Agent Handoff', enabled: true },
                    { icon: <AlertCircle className="h-4 w-4" />, label: 'Escalations', enabled: true },
                  ].map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        {event.icon}
                        <span className="text-sm">{event.label}</span>
                      </div>
                      <Switch checked={event.enabled} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Event Details to Include</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Call Duration', enabled: true },
                    { label: 'Call Summary (AI Generated)', enabled: true },
                    { label: 'Sentiment Analysis', enabled: true },
                    { label: 'Transcript Link', enabled: true },
                    { label: 'Recording Link', enabled: false },
                    { label: 'AI Agent Name', enabled: true },
                  ].map((detail, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                      <span className="text-sm">{detail.label}</span>
                      <Switch checked={detail.enabled} />
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={() => toast({ title: 'Settings Saved', description: 'Timeline event settings have been saved.' })}>Save Timeline Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
