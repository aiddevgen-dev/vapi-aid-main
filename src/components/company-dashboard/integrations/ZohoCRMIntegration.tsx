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
  ArrowLeftRight,
  Link2,
  Users,
  Phone,
  FileText,
  Activity,
  Settings,
  Edit,
  Zap,
  Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ZohoCRMIntegrationProps {
  onBack: () => void;
}

export const ZohoCRMIntegration: React.FC<ZohoCRMIntegrationProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // OAuth Configuration
  const [oauthConfig] = useState({
    datacenter: 'US',
    orgId: 'org123456',
    connectedAs: 'admin@company.com',
    connectedAt: '2024-01-09T11:20:00Z',
    modules: ['Leads', 'Contacts', 'Deals', 'Calls', 'Tasks'],
  });

  // Sync Settings
  const [syncSettings, setSyncSettings] = useState({
    syncLeads: true,
    syncContacts: true,
    syncDeals: true,
    createCallLogs: true,
    updateLeadStatus: true,
    autoCreateRecords: true,
  });

  // Module Mappings
  const [moduleMappings] = useState([
    { zohoModule: 'Leads', lyriqEntity: 'Leads', records: 1456, enabled: true },
    { zohoModule: 'Contacts', lyriqEntity: 'Customers', records: 3892, enabled: true },
    { zohoModule: 'Deals', lyriqEntity: 'Opportunities', records: 234, enabled: true },
    { zohoModule: 'Calls', lyriqEntity: 'Call History', records: 8934, enabled: true },
    { zohoModule: 'Tasks', lyriqEntity: 'Follow-ups', records: 567, enabled: false },
    { zohoModule: 'Accounts', lyriqEntity: 'Companies', records: 0, enabled: false },
  ]);

  // Field Mappings for Leads
  const [leadFieldMappings] = useState([
    { zoho: 'First_Name', lyriq: 'lead.first_name', sync: true },
    { zoho: 'Last_Name', lyriq: 'lead.last_name', sync: true },
    { zoho: 'Email', lyriq: 'lead.email', sync: true },
    { zoho: 'Phone', lyriq: 'lead.phone_number', sync: true },
    { zoho: 'Company', lyriq: 'lead.company', sync: true },
    { zoho: 'Lead_Status', lyriq: 'lead.status', sync: true },
    { zoho: 'Lead_Source', lyriq: 'lead.source', sync: false },
    { zoho: 'Description', lyriq: 'lead.notes', sync: true },
  ]);

  // Automations
  const [automations] = useState([
    { trigger: 'Call Completed', action: 'Create Call Log in Zoho CRM', enabled: true },
    { trigger: 'Lead Status Changed', action: 'Update Lead Status in Zoho', enabled: true },
    { trigger: 'New Lead in Zoho', action: 'Import Lead to LYRIQ', enabled: true },
    { trigger: 'Deal Won', action: 'Update Deal Stage in Zoho', enabled: true },
    { trigger: 'Follow-up Scheduled', action: 'Create Task in Zoho', enabled: false },
  ]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: 'Sync Complete',
        description: 'Successfully synchronized 156 records with Zoho CRM.',
      });
    }, 3000);
  };

  const handleReconnect = () => {
    toast({
      title: 'Redirecting to Zoho',
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
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Zoho CRM Integration</h1>
              <p className="text-sm text-muted-foreground">Lead management and call logging</p>
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
                <p className="text-sm text-muted-foreground">Synced Leads</p>
                <p className="text-2xl font-bold">1,456</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Call Logs</p>
                <p className="text-2xl font-bold">8,934</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacts</p>
                <p className="text-2xl font-bold">3,892</p>
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
                <p className="text-2xl font-bold">8m ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="modules">Module Mapping</TabsTrigger>
          <TabsTrigger value="fields">Field Mapping</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
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
                <CardDescription>Connected Zoho CRM organization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Data Center</span>
                    <span className="font-medium">{oauthConfig.datacenter}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Organization ID</span>
                    <span className="font-medium">{oauthConfig.orgId}</span>
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
                  <Button variant="outline" className="flex-1 text-destructive">
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
                <CardDescription>Configure synchronization behavior</CardDescription>
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

        {/* Module Mapping */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Module Mapping
              </CardTitle>
              <CardDescription>Map Zoho CRM modules to LYRIQ entities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zoho Module</TableHead>
                    <TableHead></TableHead>
                    <TableHead>LYRIQ Entity</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleMappings.map((mapping, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{mapping.zohoModule}</TableCell>
                      <TableCell><ArrowLeftRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell>{mapping.lyriqEntity}</TableCell>
                      <TableCell>{mapping.records.toLocaleString()}</TableCell>
                      <TableCell><Switch checked={mapping.enabled} /></TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => toast({ title: 'Configure Module', description: `Configuring ${mapping.zohoModule} sync settings` })}>Configure</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Mapping */}
        <TabsContent value="fields">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lead Field Mapping</CardTitle>
                <CardDescription>Map Zoho CRM Lead fields to LYRIQ lead fields</CardDescription>
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
                    <TableHead>Zoho Field</TableHead>
                    <TableHead></TableHead>
                    <TableHead>LYRIQ Field</TableHead>
                    <TableHead>Sync</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadFieldMappings.map((mapping, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{mapping.zoho}</TableCell>
                      <TableCell><ArrowLeftRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell className="font-mono text-sm">{mapping.lyriq}</TableCell>
                      <TableCell><Switch checked={mapping.sync} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Mapping', description: `Editing ${mapping.zoho} → ${mapping.lyriq}` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Delete Mapping', description: `Removed ${mapping.zoho} mapping`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  Zoho CRM Automations
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
                      <Button variant="outline" size="sm" onClick={() => toast({ title: 'Configure Automation', description: `Configuring "${automation.trigger}" automation` })}>Configure</Button>
                      <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Delete Automation', description: `Removed "${automation.trigger}" automation`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
