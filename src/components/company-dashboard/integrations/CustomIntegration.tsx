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
  Code2,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Play,
  Copy,
  Settings,
  Webhook,
  Key,
  Braces,
  FileJson,
  Send,
  History,
  Edit,
  Eye,
  EyeOff,
  ChevronRight,
  AlertTriangle,
  Zap,
  TestTube,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomIntegrationProps {
  onBack: () => void;
}

interface CustomEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  trigger: string;
  status: 'active' | 'inactive' | 'error';
  lastTriggered: string | null;
  successRate: number;
}

interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  success: boolean;
}

export const CustomIntegration: React.FC<CustomIntegrationProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [showCreateEndpoint, setShowCreateEndpoint] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);

  // Current endpoint being edited/created
  const [currentEndpoint, setCurrentEndpoint] = useState({
    name: '',
    method: 'POST' as const,
    url: '',
    trigger: 'call_completed',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Authorization', value: 'Bearer {{api_key}}', enabled: true },
    ] as RequestHeader[],
    body: `{
  "event": "{{trigger_type}}",
  "call_id": "{{call.id}}",
  "customer_phone": "{{call.customer_phone}}",
  "agent_name": "{{agent.name}}",
  "duration": {{call.duration}},
  "summary": "{{call.summary}}",
  "sentiment": "{{call.sentiment}}",
  "timestamp": "{{timestamp}}"
}`,
    retryOnFail: true,
    retryCount: 3,
    timeout: 30,
  });

  // Mock custom endpoints
  const [endpoints] = useState<CustomEndpoint[]>([
    { id: '1', name: 'CRM Update Webhook', method: 'POST', url: 'https://api.mycrm.com/webhooks/calls', trigger: 'Call Completed', status: 'active', lastTriggered: '2024-01-15T10:30:00Z', successRate: 98.5 },
    { id: '2', name: 'Slack Notification', method: 'POST', url: 'https://hooks.slack.com/services/xxx', trigger: 'Call Escalated', status: 'active', lastTriggered: '2024-01-15T09:45:00Z', successRate: 100 },
    { id: '3', name: 'Analytics Event', method: 'POST', url: 'https://analytics.company.com/events', trigger: 'Any Call Event', status: 'active', lastTriggered: '2024-01-15T10:28:00Z', successRate: 99.2 },
    { id: '4', name: 'Legacy System Sync', method: 'PUT', url: 'https://legacy.company.com/api/sync', trigger: 'Lead Created', status: 'error', lastTriggered: '2024-01-15T08:00:00Z', successRate: 45.0 },
    { id: '5', name: 'Billing Webhook', method: 'POST', url: 'https://billing.company.com/usage', trigger: 'Call Completed', status: 'inactive', lastTriggered: null, successRate: 0 },
  ]);

  // Request logs
  const [requestLogs] = useState<RequestLog[]>([
    { id: '1', timestamp: '2024-01-15T10:30:02Z', endpoint: 'CRM Update Webhook', method: 'POST', statusCode: 200, duration: 245, success: true },
    { id: '2', timestamp: '2024-01-15T10:28:15Z', endpoint: 'Analytics Event', method: 'POST', statusCode: 200, duration: 123, success: true },
    { id: '3', timestamp: '2024-01-15T09:45:30Z', endpoint: 'Slack Notification', method: 'POST', statusCode: 200, duration: 89, success: true },
    { id: '4', timestamp: '2024-01-15T08:00:05Z', endpoint: 'Legacy System Sync', method: 'PUT', statusCode: 500, duration: 30000, success: false },
    { id: '5', timestamp: '2024-01-15T07:55:12Z', endpoint: 'CRM Update Webhook', method: 'POST', statusCode: 200, duration: 198, success: true },
  ]);

  const triggers = [
    { value: 'call_completed', label: 'Call Completed' },
    { value: 'call_started', label: 'Call Started' },
    { value: 'call_escalated', label: 'Call Escalated' },
    { value: 'call_failed', label: 'Call Failed' },
    { value: 'lead_created', label: 'Lead Created' },
    { value: 'lead_updated', label: 'Lead Updated' },
    { value: 'ticket_created', label: 'Ticket Created' },
    { value: 'sentiment_negative', label: 'Negative Sentiment Detected' },
    { value: 'any_event', label: 'Any Event' },
  ];

  const availableVariables = [
    { category: 'Call', variables: ['call.id', 'call.customer_phone', 'call.duration', 'call.summary', 'call.sentiment', 'call.transcript', 'call.recording_url', 'call.direction', 'call.outcome'] },
    { category: 'Agent', variables: ['agent.id', 'agent.name', 'agent.type', 'agent.phone_number'] },
    { category: 'Customer', variables: ['customer.name', 'customer.email', 'customer.phone', 'customer.company'] },
    { category: 'Lead', variables: ['lead.id', 'lead.name', 'lead.email', 'lead.phone', 'lead.status', 'lead.intent'] },
    { category: 'System', variables: ['timestamp', 'trigger_type', 'api_key', 'company_id'] },
  ];

  const handleTestRequest = () => {
    setIsTesting(true);
    setTestResponse(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestResponse(JSON.stringify({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req_abc123'
        },
        body: {
          success: true,
          message: 'Webhook received successfully',
          processed_at: new Date().toISOString()
        }
      }, null, 2));
      toast({
        title: 'Test Successful',
        description: 'Request completed with status 200',
      });
    }, 1500);
  };

  const handleSaveEndpoint = () => {
    setShowCreateEndpoint(false);
    toast({
      title: 'Endpoint Saved',
      description: `${currentEndpoint.name} has been created successfully.`,
    });
  };

  const addHeader = () => {
    setCurrentEndpoint({
      ...currentEndpoint,
      headers: [...currentEndpoint.headers, { key: '', value: '', enabled: true }],
    });
  };

  const removeHeader = (index: number) => {
    setCurrentEndpoint({
      ...currentEndpoint,
      headers: currentEndpoint.headers.filter((_, i) => i !== index),
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500/10 text-green-500';
      case 'POST': return 'bg-blue-500/10 text-blue-500';
      case 'PUT': return 'bg-orange-500/10 text-orange-500';
      case 'PATCH': return 'bg-purple-500/10 text-purple-500';
      case 'DELETE': return 'bg-red-500/10 text-red-500';
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
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Code2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Custom Integration Builder</h1>
              <p className="text-sm text-muted-foreground">Build your own integrations with HTTP requests</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowCreateEndpoint(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Endpoint
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Webhook className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Endpoints</p>
                <p className="text-2xl font-bold">{endpoints.filter(e => e.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requests Today</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">97.8%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed Today</p>
                <p className="text-2xl font-bold">28</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="logs">Request Logs</TabsTrigger>
          <TabsTrigger value="variables">Variables Reference</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        {/* Endpoints */}
        <TabsContent value="endpoints">
          <Card>
            <CardHeader>
              <CardTitle>Custom Endpoints</CardTitle>
              <CardDescription>HTTP endpoints that are triggered by call events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((endpoint) => (
                    <TableRow key={endpoint.id}>
                      <TableCell className="font-medium">{endpoint.name}</TableCell>
                      <TableCell>
                        <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-[200px] truncate">{endpoint.url}</TableCell>
                      <TableCell>{endpoint.trigger}</TableCell>
                      <TableCell>
                        <Badge className={
                          endpoint.status === 'active' ? 'bg-green-500/10 text-green-500' :
                          endpoint.status === 'error' ? 'bg-red-500/10 text-red-500' :
                          'bg-muted text-muted-foreground'
                        }>
                          {endpoint.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {endpoint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={endpoint.successRate >= 90 ? 'text-green-500' : endpoint.successRate >= 70 ? 'text-orange-500' : 'text-red-500'}>
                          {endpoint.successRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {endpoint.lastTriggered ? new Date(endpoint.lastTriggered).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setShowTestPanel(true)}>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit Endpoint', description: `Editing "${endpoint.name}"...` })}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Endpoint Deleted', description: `"${endpoint.name}" has been removed.`, variant: 'destructive' })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Request Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Request Logs</CardTitle>
              <CardDescription>Recent HTTP requests and their responses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-[100px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{log.endpoint}</TableCell>
                      <TableCell>
                        <Badge className={getMethodColor(log.method)}>{log.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={log.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                          {log.statusCode}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.duration}ms</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Request Details', description: `Viewing details for ${log.endpoint} request...` })}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variables Reference */}
        <TabsContent value="variables">
          <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
              <CardDescription>Use these variables in your request URLs, headers, and body with {"{{variable}}"} syntax</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {availableVariables.map((category) => (
                  <div key={category.category}>
                    <h4 className="font-medium mb-3">{category.category} Variables</h4>
                    <div className="flex flex-wrap gap-2">
                      {category.variables.map((variable) => (
                        <code
                          key={variable}
                          className="px-2 py-1 bg-muted rounded text-sm font-mono cursor-pointer hover:bg-muted/80"
                          onClick={() => {
                            navigator.clipboard.writeText(`{{${variable}}}`);
                            toast({ title: 'Copied', description: `{{${variable}}} copied to clipboard` });
                          }}
                        >
                          {`{{${variable}}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Global Settings */}
        <TabsContent value="settings">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Request Settings
                </CardTitle>
                <CardDescription>Default settings for all custom endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Timeout (seconds)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>Max Retry Attempts</Label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label>Retry Delay (seconds)</Label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-sm">Exponential Backoff</p>
                    <p className="text-xs text-muted-foreground">Increase delay between retries</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
                <CardDescription>Manage API keys for use in requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { name: 'Primary API Key', masked: 'sk_live_...x4Kp' },
                    { name: 'CRM Integration', masked: 'crm_...7bNm' },
                    { name: 'Slack Webhook', masked: 'xoxb-...9dFg' },
                  ].map((key, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{key.name}</p>
                        <code className="text-xs text-muted-foreground">{key.masked}</code>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Show API Key', description: `Revealing ${key.name}...` })}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => toast({ title: 'Edit API Key', description: `Editing ${key.name}...` })}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full" onClick={() => toast({ title: 'Add API Key', description: 'Opening API key configuration...' })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add API Key
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Endpoint Dialog */}
      <Dialog open={showCreateEndpoint} onOpenChange={setShowCreateEndpoint}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Endpoint</DialogTitle>
            <DialogDescription>Build an HTTP endpoint that triggers on call events</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Endpoint Name</Label>
                <Input
                  placeholder="e.g., CRM Update Webhook"
                  value={currentEndpoint.name}
                  onChange={(e) => setCurrentEndpoint({ ...currentEndpoint, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Event</Label>
                <Select value={currentEndpoint.trigger} onValueChange={(v) => setCurrentEndpoint({ ...currentEndpoint, trigger: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggers.map((trigger) => (
                      <SelectItem key={trigger.value} value={trigger.value}>{trigger.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Request Configuration */}
            <div className="space-y-2">
              <Label>Request URL</Label>
              <div className="flex gap-2">
                <Select value={currentEndpoint.method} onValueChange={(v: any) => setCurrentEndpoint({ ...currentEndpoint, method: v })}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="https://api.example.com/webhook"
                  value={currentEndpoint.url}
                  onChange={(e) => setCurrentEndpoint({ ...currentEndpoint, url: e.target.value })}
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            {/* Headers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Headers</Label>
                <Button variant="outline" size="sm" onClick={addHeader}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Header
                </Button>
              </div>
              <div className="space-y-2">
                {currentEndpoint.headers.map((header, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Switch
                      checked={header.enabled}
                      onCheckedChange={(v) => {
                        const newHeaders = [...currentEndpoint.headers];
                        newHeaders[index].enabled = v;
                        setCurrentEndpoint({ ...currentEndpoint, headers: newHeaders });
                      }}
                    />
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) => {
                        const newHeaders = [...currentEndpoint.headers];
                        newHeaders[index].key = e.target.value;
                        setCurrentEndpoint({ ...currentEndpoint, headers: newHeaders });
                      }}
                      className="w-[200px] font-mono"
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => {
                        const newHeaders = [...currentEndpoint.headers];
                        newHeaders[index].value = e.target.value;
                        setCurrentEndpoint({ ...currentEndpoint, headers: newHeaders });
                      }}
                      className="flex-1 font-mono"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeHeader(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Body */}
            <div className="space-y-2">
              <Label>Request Body (JSON)</Label>
              <Textarea
                value={currentEndpoint.body}
                onChange={(e) => setCurrentEndpoint({ ...currentEndpoint, body: e.target.value })}
                className="font-mono min-h-[200px]"
                placeholder='{"key": "{{variable}}"}'
              />
              <p className="text-xs text-muted-foreground">Use {"{{variable}}"} syntax to insert dynamic values</p>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-medium text-sm">Retry on Fail</p>
                </div>
                <Switch
                  checked={currentEndpoint.retryOnFail}
                  onCheckedChange={(v) => setCurrentEndpoint({ ...currentEndpoint, retryOnFail: v })}
                />
              </div>
              <div className="space-y-2">
                <Label>Retry Count</Label>
                <Input
                  type="number"
                  value={currentEndpoint.retryCount}
                  onChange={(e) => setCurrentEndpoint({ ...currentEndpoint, retryCount: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={currentEndpoint.timeout}
                  onChange={(e) => setCurrentEndpoint({ ...currentEndpoint, timeout: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Test Panel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Test Request</Label>
                <Button variant="outline" size="sm" onClick={handleTestRequest} disabled={isTesting}>
                  {isTesting ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                  Test
                </Button>
              </div>
              {testResponse && (
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm font-mono overflow-x-auto">{testResponse}</pre>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateEndpoint(false)}>Cancel</Button>
            <Button onClick={handleSaveEndpoint}>Save Endpoint</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
