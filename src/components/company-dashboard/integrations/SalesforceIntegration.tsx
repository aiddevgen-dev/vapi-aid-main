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
  Database,
  Users,
  Phone,
  FileText,
  Activity,
  Settings,
  TestTube,
  Edit,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SalesforceIntegrationProps {
  onBack: () => void;
}

interface FieldMapping {
  id: string;
  lyriqField: string;
  salesforceObject: string;
  salesforceField: string;
  direction: 'lyriq_to_sf' | 'sf_to_lyriq' | 'bidirectional';
  enabled: boolean;
}

interface SyncLog {
  id: string;
  timestamp: string;
  type: string;
  records: number;
  status: 'success' | 'partial' | 'failed';
  message: string;
}

export const SalesforceIntegration: React.FC<SalesforceIntegrationProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddMapping, setShowAddMapping] = useState(false);

  // OAuth Configuration
  const [oauthConfig] = useState({
    instanceUrl: 'https://company.my.salesforce.com',
    clientId: '3MVG9...xxxx',
    connectedAs: 'admin@company.com',
    connectedAt: '2024-01-10T14:30:00Z',
    tokenExpiry: '2024-02-10T14:30:00Z',
  });

  // Sync Settings
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: '15',
    syncDirection: 'bidirectional',
    createMissingRecords: true,
    updateExistingRecords: true,
    deleteRemovedRecords: false,
  });

  // Field Mappings
  const [fieldMappings] = useState<FieldMapping[]>([
    { id: '1', lyriqField: 'call.customer_phone', salesforceObject: 'Contact', salesforceField: 'Phone', direction: 'bidirectional', enabled: true },
    { id: '2', lyriqField: 'call.customer_email', salesforceObject: 'Contact', salesforceField: 'Email', direction: 'bidirectional', enabled: true },
    { id: '3', lyriqField: 'call.summary', salesforceObject: 'Task', salesforceField: 'Description', direction: 'lyriq_to_sf', enabled: true },
    { id: '4', lyriqField: 'call.duration', salesforceObject: 'Task', salesforceField: 'CallDurationInSeconds', direction: 'lyriq_to_sf', enabled: true },
    { id: '5', lyriqField: 'call.outcome', salesforceObject: 'Task', salesforceField: 'Status', direction: 'lyriq_to_sf', enabled: true },
    { id: '6', lyriqField: 'lead.name', salesforceObject: 'Lead', salesforceField: 'Name', direction: 'sf_to_lyriq', enabled: true },
    { id: '7', lyriqField: 'lead.company', salesforceObject: 'Lead', salesforceField: 'Company', direction: 'sf_to_lyriq', enabled: false },
  ]);

  // Sync Logs
  const [syncLogs] = useState<SyncLog[]>([
    { id: '1', timestamp: '2024-01-15T10:30:00Z', type: 'Full Sync', records: 1245, status: 'success', message: 'All records synchronized successfully' },
    { id: '2', timestamp: '2024-01-15T10:15:00Z', type: 'Incremental', records: 23, status: 'success', message: 'New call records synced to Tasks' },
    { id: '3', timestamp: '2024-01-15T10:00:00Z', type: 'Incremental', records: 5, status: 'partial', message: '3 of 5 records synced, 2 skipped (missing required fields)' },
    { id: '4', timestamp: '2024-01-15T09:45:00Z', type: 'Incremental', records: 12, status: 'success', message: 'Contact records updated' },
    { id: '5', timestamp: '2024-01-15T09:30:00Z', type: 'Webhook', records: 1, status: 'success', message: 'New lead imported from Salesforce' },
  ]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: 'Sync Complete',
        description: 'Successfully synchronized 47 records with Salesforce.',
      });
    }, 3000);
  };

  const handleReconnect = () => {
    toast({
      title: 'Redirecting to Salesforce',
      description: 'Opening OAuth authorization flow...',
    });
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'lyriq_to_sf': return <ArrowRight className="h-4 w-4" />;
      case 'sf_to_lyriq': return <ArrowLeft className="h-4 w-4" />;
      case 'bidirectional': return <ArrowLeftRight className="h-4 w-4" />;
      default: return null;
    }
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
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Salesforce Integration</h1>
              <p className="text-sm text-muted-foreground">CRM sync and data mapping</p>
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
                <p className="text-2xl font-bold">2,847</p>
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
                <p className="text-sm text-muted-foreground">Call Activities</p>
                <p className="text-2xl font-bold">12,459</p>
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
                <p className="text-sm text-muted-foreground">Leads Imported</p>
                <p className="text-2xl font-bold">892</p>
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
                <p className="text-2xl font-bold">5m ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
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
                <CardDescription>Connected Salesforce organization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Instance URL</span>
                    <span className="font-medium">{oauthConfig.instanceUrl}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Connected As</span>
                    <span className="font-medium">{oauthConfig.connectedAs}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Connected At</span>
                    <span className="font-medium">{new Date(oauthConfig.connectedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Token Expires</span>
                    <span className="font-medium">{new Date(oauthConfig.tokenExpiry).toLocaleDateString()}</span>
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
                  <Database className="h-5 w-5" />
                  Salesforce Objects
                </CardTitle>
                <CardDescription>Objects available for synchronization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Contact', enabled: true, records: 2847 },
                    { name: 'Lead', enabled: true, records: 892 },
                    { name: 'Task', enabled: true, records: 12459 },
                    { name: 'Account', enabled: false, records: 0 },
                    { name: 'Opportunity', enabled: false, records: 0 },
                    { name: 'Case', enabled: true, records: 456 },
                  ].map((obj) => (
                    <div key={obj.name} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Switch checked={obj.enabled} />
                        <span className="font-medium">{obj.name}</span>
                      </div>
                      <Badge variant="outline">{obj.records.toLocaleString()} records</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Field Mapping */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Field Mappings</CardTitle>
                <CardDescription>Map LYRIQ fields to Salesforce objects and fields</CardDescription>
              </div>
              <Button onClick={() => setShowAddMapping(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mapping
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LYRIQ Field</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Salesforce Object</TableHead>
                    <TableHead>Salesforce Field</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldMappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-mono text-sm">{mapping.lyriqField}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {getDirectionIcon(mapping.direction)}
                          {mapping.direction === 'bidirectional' ? 'Both' : mapping.direction === 'lyriq_to_sf' ? 'To SF' : 'From SF'}
                        </Badge>
                      </TableCell>
                      <TableCell>{mapping.salesforceObject}</TableCell>
                      <TableCell className="font-mono text-sm">{mapping.salesforceField}</TableCell>
                      <TableCell>
                        <Switch checked={mapping.enabled} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Mapping', description: `Editing ${mapping.lyriqField} → ${mapping.salesforceField}` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Delete Mapping', description: `Removed ${mapping.lyriqField} mapping`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Settings */}
        <TabsContent value="sync">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Sync Configuration
                </CardTitle>
                <CardDescription>Configure how data is synchronized</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-sm">Auto Sync</p>
                    <p className="text-xs text-muted-foreground">Automatically sync data at regular intervals</p>
                  </div>
                  <Switch checked={syncSettings.autoSync} onCheckedChange={(v) => setSyncSettings({ ...syncSettings, autoSync: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Sync Interval</Label>
                  <Select value={syncSettings.syncInterval} onValueChange={(v) => setSyncSettings({ ...syncSettings, syncInterval: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Every 5 minutes</SelectItem>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="1440">Once daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sync Direction</Label>
                  <Select value={syncSettings.syncDirection} onValueChange={(v) => setSyncSettings({ ...syncSettings, syncDirection: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lyriq_to_sf">LYRIQ → Salesforce</SelectItem>
                      <SelectItem value="sf_to_lyriq">Salesforce → LYRIQ</SelectItem>
                      <SelectItem value="bidirectional">Bidirectional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Record Handling
                </CardTitle>
                <CardDescription>How to handle records during sync</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-sm">Create Missing Records</p>
                    <p className="text-xs text-muted-foreground">Create new records in destination if not found</p>
                  </div>
                  <Switch checked={syncSettings.createMissingRecords} onCheckedChange={(v) => setSyncSettings({ ...syncSettings, createMissingRecords: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-sm">Update Existing Records</p>
                    <p className="text-xs text-muted-foreground">Update records that already exist</p>
                  </div>
                  <Switch checked={syncSettings.updateExistingRecords} onCheckedChange={(v) => setSyncSettings({ ...syncSettings, updateExistingRecords: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-sm">Delete Removed Records</p>
                    <p className="text-xs text-muted-foreground">Delete records that were removed from source</p>
                  </div>
                  <Switch checked={syncSettings.deleteRemovedRecords} onCheckedChange={(v) => setSyncSettings({ ...syncSettings, deleteRemovedRecords: v })} />
                </div>
                <Button className="w-full">Save Settings</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sync Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Logs</CardTitle>
              <CardDescription>Recent sync activity and status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.type}</TableCell>
                      <TableCell>{log.records}</TableCell>
                      <TableCell>
                        <Badge className={
                          log.status === 'success' ? 'bg-green-500/10 text-green-600' :
                          log.status === 'partial' ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-red-500/10 text-red-600'
                        }>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {log.message}
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Salesforce Automations
              </CardTitle>
              <CardDescription>Automated actions triggered by call events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { trigger: 'Call Completed', action: 'Create Task in Salesforce with call summary', enabled: true },
                  { trigger: 'New Lead Created', action: 'Import lead from Salesforce to LYRIQ', enabled: true },
                  { trigger: 'Call Escalated', action: 'Update Contact record with escalation notes', enabled: true },
                  { trigger: 'CSAT Score Received', action: 'Update Task with satisfaction score', enabled: false },
                  { trigger: 'Appointment Scheduled', action: 'Create Event in Salesforce calendar', enabled: true },
                ].map((automation, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Switch checked={automation.enabled} />
                      <div>
                        <p className="font-medium">{automation.trigger}</p>
                        <p className="text-sm text-muted-foreground">{automation.action}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'Configure Automation', description: `Configuring "${automation.trigger}" automation` })}>Configure</Button>
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
