import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Mail,
  Settings,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Shield,
  Send,
  FileText,
  Edit,
  Copy,
  Eye,
  TestTube,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailIntegrationProps {
  onBack: () => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'follow-up' | 'summary' | 'notification' | 'survey';
  lastModified: string;
  status: 'active' | 'draft';
}

interface SenderIdentity {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  default: boolean;
}

export const EmailIntegration: React.FC<EmailIntegrationProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showAddSender, setShowAddSender] = useState(false);
  const [connectionType, setConnectionType] = useState<'smtp' | 'api'>('api');

  // SMTP Configuration
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.sendgrid.net',
    port: '587',
    username: 'apikey',
    encryption: 'TLS',
  });

  // API Configuration
  const [apiConfig, setApiConfig] = useState({
    provider: 'sendgrid',
    apiKey: 'SG.xxxx...xxxx',
  });

  // Mock Email Templates
  const [templates] = useState<EmailTemplate[]>([
    { id: '1', name: 'Call Summary', subject: 'Summary of your recent call with {{agent_name}}', type: 'summary', lastModified: '2024-01-15', status: 'active' },
    { id: '2', name: 'Follow-up Email', subject: 'Following up on our conversation', type: 'follow-up', lastModified: '2024-01-14', status: 'active' },
    { id: '3', name: 'CSAT Survey', subject: 'How did we do? Quick feedback request', type: 'survey', lastModified: '2024-01-12', status: 'active' },
    { id: '4', name: 'Ticket Created', subject: 'Support ticket #{{ticket_id}} created', type: 'notification', lastModified: '2024-01-10', status: 'active' },
    { id: '5', name: 'Appointment Reminder', subject: 'Reminder: Your appointment on {{date}}', type: 'notification', lastModified: '2024-01-08', status: 'draft' },
  ]);

  // Mock Sender Identities
  const [senders] = useState<SenderIdentity[]>([
    { id: '1', name: 'LYRIQ Support', email: 'support@lyriq.ai', verified: true, default: true },
    { id: '2', name: 'LYRIQ Sales', email: 'sales@lyriq.ai', verified: true, default: false },
    { id: '3', name: 'No Reply', email: 'noreply@lyriq.ai', verified: true, default: false },
    { id: '4', name: 'New Sender', email: 'new@company.com', verified: false, default: false },
  ]);

  // Trigger Rules
  const [triggerRules] = useState([
    { id: '1', trigger: 'Call Completed', action: 'Send Call Summary', enabled: true },
    { id: '2', trigger: 'Call Escalated', action: 'Send Escalation Notification', enabled: true },
    { id: '3', trigger: 'Ticket Created', action: 'Send Ticket Confirmation', enabled: true },
    { id: '4', trigger: 'After 24 Hours', action: 'Send Follow-up Email', enabled: false },
    { id: '5', trigger: 'CSAT < 3', action: 'Send Apology Email', enabled: true },
  ]);

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      toast({
        title: 'Connection Successful',
        description: 'Email service connection verified. Test email sent.',
      });
    }, 2000);
  };

  const handleSaveConfig = () => {
    toast({
      title: 'Configuration Saved',
      description: 'Email integration settings have been updated.',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'summary': return 'bg-blue-500/10 text-blue-500';
      case 'follow-up': return 'bg-green-500/10 text-green-500';
      case 'notification': return 'bg-orange-500/10 text-orange-500';
      case 'survey': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
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
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Email Integration</h1>
              <p className="text-sm text-muted-foreground">SMTP/API configuration and email automation</p>
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
            Send Test Email
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emails Sent Today</p>
                <p className="text-2xl font-bold">142</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold">98.5%</p>
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
                <p className="text-sm text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold">45.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="senders">Sender Identities</TabsTrigger>
          <TabsTrigger value="triggers">Trigger Rules</TabsTrigger>
        </TabsList>

        {/* Connection Settings */}
        <TabsContent value="connection">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Connection Method</CardTitle>
                <CardDescription>Choose how to connect to your email service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${connectionType === 'api' ? 'border-primary bg-primary/5' : 'border-border'}`}
                    onClick={() => setConnectionType('api')}
                  >
                    <div className="font-medium">API Integration</div>
                    <p className="text-sm text-muted-foreground">Use provider's API (Recommended)</p>
                  </div>
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${connectionType === 'smtp' ? 'border-primary bg-primary/5' : 'border-border'}`}
                    onClick={() => setConnectionType('smtp')}
                  >
                    <div className="font-medium">SMTP</div>
                    <p className="text-sm text-muted-foreground">Traditional SMTP connection</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {connectionType === 'api' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    API Configuration
                  </CardTitle>
                  <CardDescription>Connect via email provider API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Provider</Label>
                    <Select value={apiConfig.provider} onValueChange={(v) => setApiConfig({ ...apiConfig, provider: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="ses">Amazon SES</SelectItem>
                        <SelectItem value="postmark">Postmark</SelectItem>
                        <SelectItem value="resend">Resend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input type="password" value={apiConfig.apiKey} onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })} />
                  </div>
                  <Button onClick={handleSaveConfig} className="w-full">
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    SMTP Configuration
                  </CardTitle>
                  <CardDescription>Traditional SMTP server settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SMTP Host</Label>
                      <Input value={smtpConfig.host} onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input value={smtpConfig.port} onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={smtpConfig.username} onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value="••••••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>Encryption</Label>
                    <Select value={smtpConfig.encryption} onValueChange={(v) => setSmtpConfig({ ...smtpConfig, encryption: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="SSL">SSL</SelectItem>
                        <SelectItem value="TLS">TLS (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveConfig} className="w-full">
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Manage automated email templates with dynamic variables</CardDescription>
              </div>
              <Button onClick={() => setShowAddTemplate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">{template.subject}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(template.type)}>{template.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={template.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}>
                          {template.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{template.lastModified}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Template', description: `Editing "${template.name}" template...` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Template Duplicated', description: `"${template.name}" has been duplicated.` })}><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Template Deleted', description: `"${template.name}" has been removed.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Template Variables Reference */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Available Template Variables</CardTitle>
              <CardDescription>Use these variables in your email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  '{{customer_name}}', '{{customer_email}}', '{{agent_name}}', '{{call_duration}}',
                  '{{call_summary}}', '{{ticket_id}}', '{{date}}', '{{time}}',
                  '{{company_name}}', '{{support_email}}', '{{csat_score}}', '{{callback_link}}'
                ].map((variable) => (
                  <code key={variable} className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {variable}
                  </code>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sender Identities */}
        <TabsContent value="senders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sender Identities</CardTitle>
                <CardDescription>Manage verified sender email addresses</CardDescription>
              </div>
              <Button onClick={() => setShowAddSender(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sender
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender Name</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {senders.map((sender) => (
                    <TableRow key={sender.id}>
                      <TableCell className="font-medium">{sender.name}</TableCell>
                      <TableCell>{sender.email}</TableCell>
                      <TableCell>
                        {sender.verified ? (
                          <Badge className="bg-green-500/10 text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch checked={sender.default} disabled={!sender.verified} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Sender', description: `Editing ${sender.name} (${sender.email})...` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Sender Deleted', description: `${sender.email} has been removed.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trigger Rules */}
        <TabsContent value="triggers">
          <Card>
            <CardHeader>
              <CardTitle>Email Trigger Rules</CardTitle>
              <CardDescription>Configure when automated emails are sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {triggerRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Switch checked={rule.enabled} />
                      <div>
                        <p className="font-medium">{rule.trigger}</p>
                        <p className="text-sm text-muted-foreground">{rule.action}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast({ title: 'Configure Rule', description: `Configuring "${rule.trigger}" trigger rule...` })}>Configure</Button>
                      <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Rule Deleted', description: `"${rule.trigger}" rule has been removed.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => toast({ title: 'Add Trigger Rule', description: 'Opening rule configuration...' })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trigger Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
