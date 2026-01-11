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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Phone,
  Settings,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Shield,
  Globe,
  Server,
  Headphones,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Edit,
  TestTube,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AvayaIntegrationProps {
  onBack: () => void;
}

interface SIPTrunk {
  id: string;
  name: string;
  host: string;
  port: string;
  transport: string;
  status: 'active' | 'inactive' | 'error';
  callsToday: number;
}

interface PhoneNumber {
  id: string;
  number: string;
  type: 'inbound' | 'outbound' | 'both';
  assignedTo: string;
  status: 'active' | 'inactive';
}

interface RoutingRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export const AvayaIntegration: React.FC<AvayaIntegrationProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [showAddTrunk, setShowAddTrunk] = useState(false);
  const [showAddNumber, setShowAddNumber] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);

  // SIP Configuration
  const [sipConfig, setSipConfig] = useState({
    primaryHost: 'sip.avaya.company.com',
    primaryPort: '5060',
    backupHost: 'sip-backup.avaya.company.com',
    backupPort: '5060',
    transport: 'TLS',
    codec: 'G.711',
    username: 'lyriq_prod',
    realm: 'avaya.company.com',
    registrationExpiry: '3600',
    keepAliveInterval: '30',
  });

  // Mock SIP Trunks
  const [sipTrunks] = useState<SIPTrunk[]>([
    { id: '1', name: 'Primary Trunk', host: 'sip.avaya.company.com', port: '5060', transport: 'TLS', status: 'active', callsToday: 234 },
    { id: '2', name: 'Backup Trunk', host: 'sip-backup.avaya.company.com', port: '5060', transport: 'TLS', status: 'inactive', callsToday: 0 },
  ]);

  // Mock Phone Numbers
  const [phoneNumbers] = useState<PhoneNumber[]>([
    { id: '1', number: '+1 (555) 100-0001', type: 'inbound', assignedTo: 'Sales AI Agent', status: 'active' },
    { id: '2', number: '+1 (555) 100-0002', type: 'inbound', assignedTo: 'Support AI Agent', status: 'active' },
    { id: '3', number: '+1 (555) 100-0003', type: 'outbound', assignedTo: 'Outbound Campaign', status: 'active' },
    { id: '4', number: '+1 (555) 100-0004', type: 'both', assignedTo: 'General Queue', status: 'inactive' },
  ]);

  // Mock Routing Rules
  const [routingRules] = useState<RoutingRule[]>([
    { id: '1', name: 'Sales Hours Routing', condition: 'Time: 9AM-5PM EST & Caller Intent: Sales', action: 'Route to Sales AI Agent', priority: 1, enabled: true },
    { id: '2', name: 'After Hours Support', condition: 'Time: Outside Business Hours', action: 'Route to Support AI Agent', priority: 2, enabled: true },
    { id: '3', name: 'VIP Customer Routing', condition: 'Caller ID in VIP List', action: 'Route to Human Agent', priority: 0, enabled: true },
    { id: '4', name: 'Overflow Handling', condition: 'Queue Wait > 2 minutes', action: 'Offer Callback Option', priority: 3, enabled: false },
  ]);

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      toast({
        title: 'Connection Successful',
        description: 'SIP trunk connection verified. All endpoints responding.',
      });
    }, 2000);
  };

  const handleSaveConfig = () => {
    toast({
      title: 'Configuration Saved',
      description: 'Avaya SIP configuration has been updated.',
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
              <Phone className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Avaya Voice Integration</h1>
              <p className="text-sm text-muted-foreground">SIP trunk configuration and call routing</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={isConnected ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'}>
            {isConnected ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
            {isTesting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
            Test Connection
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Trunks</p>
                <p className="text-2xl font-bold">{sipTrunks.filter(t => t.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <PhoneCall className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Calls Today</p>
                <p className="text-2xl font-bold">{sipTrunks.reduce((sum, t) => sum + t.callsToday, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone Numbers</p>
                <p className="text-2xl font-bold">{phoneNumbers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Routing Rules</p>
                <p className="text-2xl font-bold">{routingRules.filter(r => r.enabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="sip-config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sip-config">SIP Configuration</TabsTrigger>
          <TabsTrigger value="trunks">SIP Trunks</TabsTrigger>
          <TabsTrigger value="numbers">Phone Numbers</TabsTrigger>
          <TabsTrigger value="routing">Call Routing</TabsTrigger>
          <TabsTrigger value="ivr">IVR Settings</TabsTrigger>
        </TabsList>

        {/* SIP Configuration */}
        <TabsContent value="sip-config">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Primary SIP Server
                </CardTitle>
                <CardDescription>Main SIP trunk connection settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Host / IP Address</Label>
                    <Input value={sipConfig.primaryHost} onChange={(e) => setSipConfig({ ...sipConfig, primaryHost: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input value={sipConfig.primaryPort} onChange={(e) => setSipConfig({ ...sipConfig, primaryPort: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transport Protocol</Label>
                    <Select value={sipConfig.transport} onValueChange={(v) => setSipConfig({ ...sipConfig, transport: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UDP">UDP</SelectItem>
                        <SelectItem value="TCP">TCP</SelectItem>
                        <SelectItem value="TLS">TLS (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Codec</Label>
                    <Select value={sipConfig.codec} onValueChange={(v) => setSipConfig({ ...sipConfig, codec: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="G.711">G.711 (Best Quality)</SelectItem>
                        <SelectItem value="G.729">G.729 (Low Bandwidth)</SelectItem>
                        <SelectItem value="Opus">Opus (Adaptive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication
                </CardTitle>
                <CardDescription>SIP authentication credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={sipConfig.username} onChange={(e) => setSipConfig({ ...sipConfig, username: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value="••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Realm</Label>
                  <Input value={sipConfig.realm} onChange={(e) => setSipConfig({ ...sipConfig, realm: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Backup SIP Server
                </CardTitle>
                <CardDescription>Failover connection settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Host / IP Address</Label>
                    <Input value={sipConfig.backupHost} onChange={(e) => setSipConfig({ ...sipConfig, backupHost: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input value={sipConfig.backupPort} onChange={(e) => setSipConfig({ ...sipConfig, backupPort: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-sm">Auto Failover</p>
                    <p className="text-xs text-muted-foreground">Automatically switch to backup on primary failure</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>Registration and keep-alive settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Registration Expiry (seconds)</Label>
                    <Input value={sipConfig.registrationExpiry} onChange={(e) => setSipConfig({ ...sipConfig, registrationExpiry: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Keep-Alive Interval (seconds)</Label>
                    <Input value={sipConfig.keepAliveInterval} onChange={(e) => setSipConfig({ ...sipConfig, keepAliveInterval: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSaveConfig} className="w-full">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SIP Trunks */}
        <TabsContent value="trunks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>SIP Trunks</CardTitle>
                <CardDescription>Manage your SIP trunk connections</CardDescription>
              </div>
              <Button onClick={() => setShowAddTrunk(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Trunk
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Transport</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Calls Today</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sipTrunks.map((trunk) => (
                    <TableRow key={trunk.id}>
                      <TableCell className="font-medium">{trunk.name}</TableCell>
                      <TableCell>{trunk.host}</TableCell>
                      <TableCell>{trunk.port}</TableCell>
                      <TableCell><Badge variant="outline">{trunk.transport}</Badge></TableCell>
                      <TableCell>
                        <Badge className={trunk.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}>
                          {trunk.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{trunk.callsToday}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Trunk', description: `Editing ${trunk.name}...` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Trunk Deleted', description: `${trunk.name} has been removed.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phone Numbers */}
        <TabsContent value="numbers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Phone Numbers</CardTitle>
                <CardDescription>Manage phone numbers and their assignments</CardDescription>
              </div>
              <Button onClick={() => setShowAddNumber(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Number
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phoneNumbers.map((number) => (
                    <TableRow key={number.id}>
                      <TableCell className="font-medium">{number.number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {number.type === 'inbound' && <PhoneIncoming className="h-3 w-3" />}
                          {number.type === 'outbound' && <PhoneOutgoing className="h-3 w-3" />}
                          {number.type === 'both' && <PhoneCall className="h-3 w-3" />}
                          {number.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{number.assignedTo}</TableCell>
                      <TableCell>
                        <Badge className={number.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}>
                          {number.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Number', description: `Editing ${number.number}...` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Number Deleted', description: `${number.number} has been removed.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Call Routing */}
        <TabsContent value="routing">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Call Routing Rules</CardTitle>
                <CardDescription>Define how incoming calls are routed to agents</CardDescription>
              </div>
              <Button onClick={() => setShowAddRule(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routingRules.sort((a, b) => a.priority - b.priority).map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Badge variant="outline">{rule.priority}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{rule.condition}</TableCell>
                      <TableCell>{rule.action}</TableCell>
                      <TableCell>
                        <Switch checked={rule.enabled} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Rule', description: `Editing "${rule.name}"...` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Rule Deleted', description: `"${rule.name}" has been removed.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IVR Settings */}
        <TabsContent value="ivr">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>IVR Menu Configuration</CardTitle>
                <CardDescription>Configure interactive voice response menus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <Input placeholder="Thank you for calling. Press 1 for Sales, 2 for Support..." />
                </div>
                <div className="space-y-2">
                  <Label>Menu Timeout (seconds)</Label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-sm">Use AI for IVR</p>
                    <p className="text-xs text-muted-foreground">Let AI handle natural language IVR interactions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DTMF Menu Options</CardTitle>
                <CardDescription>Map keypad inputs to actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: '1', action: 'Route to Sales AI Agent' },
                    { key: '2', action: 'Route to Support AI Agent' },
                    { key: '3', action: 'Check Order Status' },
                    { key: '0', action: 'Speak to Human Agent' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {item.key}
                      </div>
                      <Input defaultValue={item.action} className="flex-1" />
                      <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Option Deleted', description: `Key ${item.key} option has been removed.`, variant: 'destructive' })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => toast({ title: 'Add Menu Option', description: 'Opening menu option configuration...' })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Option
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
