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
  Headphones,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ZendeskIntegrationProps {
  onBack: () => void;
}

export const ZendeskIntegration: React.FC<ZendeskIntegrationProps> = ({ onBack }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [settings, setSettings] = useState({
    subdomain: 'yourcompany',
    email: 'admin@company.com',
    apiKey: 'sk-zendesk-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    autoCreateTickets: true,
    syncCallTranscripts: true,
    assignToGroup: 'support',
    defaultPriority: 'normal',
  });
  const { toast } = useToast();

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      toast({
        title: 'Connection Successful',
        description: 'Successfully connected to Zendesk API.',
      });
    }, 2000);
  };

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Zendesk integration settings have been updated.',
    });
  };

  const fieldMappings = [
    { source: 'customer_phone', destination: 'Phone', status: 'mapped' },
    { source: 'customer_email', destination: 'Email', status: 'mapped' },
    { source: 'call_transcript', destination: 'Description', status: 'mapped' },
    { source: 'ai_agent_name', destination: 'Custom: Agent', status: 'mapped' },
    { source: 'call_duration', destination: 'Custom: Duration', status: 'mapped' },
    { source: 'sentiment', destination: 'Priority', status: 'pending' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Headphones className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Zendesk Integration</h1>
              <p className="text-muted-foreground">Customer support and ticketing</p>
            </div>
          </div>
        </div>
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Connection Settings
            </CardTitle>
            <CardDescription>Configure your Zendesk API connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Zendesk Subdomain</Label>
              <div className="flex gap-2">
                <Input
                  id="subdomain"
                  value={settings.subdomain}
                  onChange={(e) => setSettings({ ...settings, subdomain: e.target.value })}
                />
                <span className="flex items-center text-sm text-muted-foreground">.zendesk.com</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Token</Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="gap-2"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Test Connection
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automation Settings</CardTitle>
            <CardDescription>Configure automatic ticket creation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Auto-Create Tickets</p>
                <p className="text-xs text-muted-foreground">Create ticket after each call</p>
              </div>
              <Switch
                checked={settings.autoCreateTickets}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoCreateTickets: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Sync Call Transcripts</p>
                <p className="text-xs text-muted-foreground">Include transcript in ticket</p>
              </div>
              <Switch
                checked={settings.syncCallTranscripts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, syncCallTranscripts: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Assign to Group</Label>
              <Select
                value={settings.assignToGroup}
                onValueChange={(value) => setSettings({ ...settings, assignToGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Support Team</SelectItem>
                  <SelectItem value="sales">Sales Team</SelectItem>
                  <SelectItem value="billing">Billing Team</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Priority</Label>
              <Select
                value={settings.defaultPriority}
                onValueChange={(value) => setSettings({ ...settings, defaultPriority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Field Mapping</CardTitle>
          <CardDescription>Map call data to Zendesk ticket fields</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Field</TableHead>
                <TableHead>Zendesk Field</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fieldMappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{mapping.source}</TableCell>
                  <TableCell>{mapping.destination}</TableCell>
                  <TableCell>
                    {mapping.status === 'mapped' ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mapped
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast({ title: 'Edit Mapping', description: `Editing ${mapping.source} → ${mapping.destination}` })}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Last 5 tickets created via integration</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">#45892</TableCell>
                <TableCell>Call follow-up: Billing inquiry</TableCell>
                <TableCell>2 mins ago</TableCell>
                <TableCell><Badge>Open</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">#45891</TableCell>
                <TableCell>Call follow-up: Technical support</TableCell>
                <TableCell>15 mins ago</TableCell>
                <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">#45890</TableCell>
                <TableCell>Call follow-up: Account question</TableCell>
                <TableCell>1 hour ago</TableCell>
                <TableCell><Badge className="bg-green-500/10 text-green-600 border-green-500/30">Solved</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
