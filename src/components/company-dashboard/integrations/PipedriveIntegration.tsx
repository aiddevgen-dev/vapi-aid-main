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
  DollarSign,
  Activity,
  Settings,
  Edit,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PipedriveIntegrationProps {
  onBack: () => void;
}

interface Pipeline {
  id: string;
  name: string;
  stages: string[];
  deals: number;
  value: string;
  enabled: boolean;
}

export const PipedriveIntegration: React.FC<PipedriveIntegrationProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // API Configuration
  const [apiConfig] = useState({
    companyDomain: 'company.pipedrive.com',
    apiToken: 'pd_...x7Kp',
    connectedAs: 'admin@company.com',
    connectedAt: '2024-01-11T15:45:00Z',
  });

  // Sync Settings
  const [syncSettings, setSyncSettings] = useState({
    syncPersons: true,
    syncOrganizations: true,
    syncDeals: true,
    logActivities: true,
    createNotes: true,
    updateDealStages: true,
  });

  // Pipelines
  const [pipelines] = useState<Pipeline[]>([
    { id: '1', name: 'Sales Pipeline', stages: ['Lead In', 'Contact Made', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won'], deals: 89, value: '$234,500', enabled: true },
    { id: '2', name: 'Enterprise Pipeline', stages: ['Qualified', 'Discovery', 'Proposal', 'Contract', 'Closed'], deals: 12, value: '$890,000', enabled: true },
    { id: '3', name: 'Partner Pipeline', stages: ['Inquiry', 'Evaluation', 'Partnership'], deals: 8, value: '$56,000', enabled: false },
  ]);

  // Person Field Mappings
  const [personMappings] = useState([
    { pipedrive: 'name', lyriq: 'lead.name', sync: true },
    { pipedrive: 'email', lyriq: 'lead.email', sync: true },
    { pipedrive: 'phone', lyriq: 'lead.phone_number', sync: true },
    { pipedrive: 'org_id.name', lyriq: 'lead.company', sync: true },
    { pipedrive: 'label', lyriq: 'lead.status', sync: true },
    { pipedrive: 'notes', lyriq: 'lead.notes', sync: false },
  ]);

  // Activity Types
  const [activityTypes] = useState([
    { type: 'Call', icon: '📞', logOnComplete: true, includeRecording: false },
    { type: 'Meeting', icon: '📅', logOnComplete: true, includeRecording: false },
    { type: 'Email', icon: '📧', logOnComplete: true, includeRecording: false },
    { type: 'Task', icon: '✅', logOnComplete: false, includeRecording: false },
  ]);

  // Automations
  const [automations] = useState([
    { trigger: 'Call Completed', action: 'Log Activity in Pipedrive', enabled: true },
    { trigger: 'Positive Outcome', action: 'Move Deal to next stage', enabled: true },
    { trigger: 'Meeting Scheduled', action: 'Create Activity in Pipedrive', enabled: true },
    { trigger: 'Deal Stage Changed', action: 'Update lead status in LYRIQ', enabled: true },
    { trigger: 'New Person Added', action: 'Import as Lead in LYRIQ', enabled: false },
    { trigger: 'Deal Won', action: 'Send notification to team', enabled: true },
  ]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: 'Sync Complete',
        description: 'Successfully synchronized 78 records with Pipedrive.',
      });
    }, 3000);
  };

  const handleReconnect = () => {
    toast({
      title: 'Redirecting to Pipedrive',
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
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pipedrive Integration</h1>
              <p className="text-sm text-muted-foreground">Sales pipeline and activity tracking</p>
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
                <p className="text-sm text-muted-foreground">Synced Persons</p>
                <p className="text-2xl font-bold">2,341</p>
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
                <p className="text-2xl font-bold">109</p>
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
                <p className="text-sm text-muted-foreground">Activities</p>
                <p className="text-2xl font-bold">5,678</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">$1.18M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
        </TabsList>

        {/* Connection */}
        <TabsContent value="connection">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  API Connection
                </CardTitle>
                <CardDescription>Connected Pipedrive account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Company Domain</span>
                    <span className="font-medium">{apiConfig.companyDomain}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">API Token</span>
                    <span className="font-mono text-sm">{apiConfig.apiToken}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Connected As</span>
                    <span className="font-medium">{apiConfig.connectedAs}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Connected At</span>
                    <span className="font-medium">{new Date(apiConfig.connectedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleReconnect} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive" onClick={() => {
                    setIsConnected(false);
                    toast({ title: 'Disconnected', description: 'Pipedrive integration has been disconnected.' });
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
                  Sync Options
                </CardTitle>
                <CardDescription>Configure what data to synchronize</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(syncSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                    </div>
                    <Switch checked={value} onCheckedChange={(v) => setSyncSettings({ ...syncSettings, [key]: v })} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pipelines */}
        <TabsContent value="pipelines">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipelines</CardTitle>
              <CardDescription>Configure which pipelines integrate with call outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Switch checked={pipeline.enabled} />
                        <div>
                          <p className="font-medium">{pipeline.name}</p>
                          <p className="text-sm text-muted-foreground">{pipeline.deals} deals • {pipeline.value} total value</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toast({ title: 'Configure Stages', description: `Configuring stages for ${pipeline.name}...` })}>Configure Stages</Button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {pipeline.stages.map((stage, i) => (
                        <React.Fragment key={stage}>
                          <Badge variant="outline" className="shrink-0">{stage}</Badge>
                          {i < pipeline.stages.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Call Outcome to Stage Mapping</h4>
                <p className="text-sm text-muted-foreground mb-4">Map call outcomes to automatic deal stage transitions</p>
                <div className="space-y-2">
                  {[
                    { outcome: 'Demo Scheduled', action: 'Move to "Demo Scheduled"' },
                    { outcome: 'Proposal Requested', action: 'Move to "Proposal Sent"' },
                    { outcome: 'Verbal Agreement', action: 'Move to "Negotiation"' },
                    { outcome: 'Deal Closed', action: 'Move to "Won"' },
                    { outcome: 'Not Interested', action: 'Mark as Lost' },
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

        {/* Field Mapping */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Person Field Mapping</CardTitle>
                <CardDescription>Map Pipedrive Person fields to LYRIQ lead fields</CardDescription>
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
                    <TableHead>Pipedrive Field</TableHead>
                    <TableHead></TableHead>
                    <TableHead>LYRIQ Field</TableHead>
                    <TableHead>Sync</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personMappings.map((mapping, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{mapping.pipedrive}</TableCell>
                      <TableCell><ArrowLeftRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell className="font-mono text-sm">{mapping.lyriq}</TableCell>
                      <TableCell><Switch checked={mapping.sync} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Mapping', description: `Editing ${mapping.pipedrive} → ${mapping.lyriq}` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Delete Mapping', description: `Removed ${mapping.pipedrive} mapping.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Configuration</CardTitle>
              <CardDescription>Configure how call activities are logged in Pipedrive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityTypes.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{activity.icon}</span>
                      <div>
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-sm text-muted-foreground">Activity type in Pipedrive</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={activity.logOnComplete} />
                        <span className="text-sm">Log on complete</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toast({ title: 'Configure Activity', description: `Configuring ${activity.type} activity settings...` })}>Configure</Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Activity Details to Include</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Call Duration', enabled: true },
                    { label: 'Call Summary', enabled: true },
                    { label: 'Call Outcome', enabled: true },
                    { label: 'AI Agent Name', enabled: true },
                    { label: 'Transcript Link', enabled: false },
                    { label: 'Recording URL', enabled: false },
                  ].map((detail, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="text-sm">{detail.label}</span>
                      <Switch checked={detail.enabled} />
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
                  Pipedrive Automations
                </CardTitle>
                <CardDescription>Automated actions triggered by events</CardDescription>
              </div>
              <Button onClick={() => toast({ title: 'Create Automation', description: 'Opening automation builder...' })}>
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {automations.map((automation, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
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
      </Tabs>
    </div>
  );
};
