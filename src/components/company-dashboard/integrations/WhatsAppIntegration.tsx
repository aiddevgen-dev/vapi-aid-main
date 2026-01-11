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
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  Phone,
  Plus,
  Edit,
  Trash2,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppIntegrationProps {
  onBack: () => void;
}

export const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    businessAccountId: 'WABA-123456789',
    phoneNumberId: 'PN-987654321',
    accessToken: 'EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    webhookUrl: 'https://api.yourcompany.com/webhooks/whatsapp',
    autoRespond: true,
    routeToAI: true,
  });
  const { toast } = useToast();

  const phoneNumbers = [
    { number: '+1 (555) 100-0001', name: 'Main Support', status: 'active', messages: 1234 },
    { number: '+1 (555) 100-0002', name: 'Sales Line', status: 'active', messages: 856 },
    { number: '+1 (555) 100-0003', name: 'After Hours', status: 'inactive', messages: 0 },
  ];

  const templateMessages = [
    { name: 'appointment_reminder', status: 'approved', language: 'en', category: 'UTILITY' },
    { name: 'order_confirmation', status: 'approved', language: 'en', category: 'TRANSACTIONAL' },
    { name: 'support_followup', status: 'pending', language: 'en', category: 'UTILITY' },
    { name: 'promotion_summer', status: 'rejected', language: 'en', category: 'MARKETING' },
  ];

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'WhatsApp integration settings have been updated.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'rejected':
      case 'inactive':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">WhatsApp Business</h1>
              <p className="text-muted-foreground">Connect with customers via WhatsApp</p>
            </div>
          </div>
        </div>
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
            <CardDescription>WhatsApp Business API configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Account ID</Label>
              <Input value={settings.businessAccountId} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input value={settings.phoneNumberId} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input type="password" value={settings.accessToken} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input value={settings.webhookUrl} readOnly className="bg-muted font-mono text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Behavior Settings</CardTitle>
            <CardDescription>Configure message handling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Auto-Respond</p>
                <p className="text-xs text-muted-foreground">Automatically acknowledge incoming messages</p>
              </div>
              <Switch
                checked={settings.autoRespond}
                onCheckedChange={(checked) => setSettings({ ...settings, autoRespond: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Route to AI Agent</p>
                <p className="text-xs text-muted-foreground">Let AI handle incoming messages</p>
              </div>
              <Switch
                checked={settings.routeToAI}
                onCheckedChange={(checked) => setSettings({ ...settings, routeToAI: checked })}
              />
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Phone Numbers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Phone Numbers</CardTitle>
            <CardDescription>WhatsApp Business phone numbers</CardDescription>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Number
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phoneNumbers.map((phone, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono">{phone.number}</TableCell>
                  <TableCell>{phone.name}</TableCell>
                  <TableCell>
                    <Badge className={phone.status === 'active'
                      ? 'bg-green-500/10 text-green-500 border-green-500/30'
                      : 'bg-muted text-muted-foreground border-border'
                    }>
                      {phone.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{phone.messages.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Template Messages</CardTitle>
            <CardDescription>Pre-approved message templates for WhatsApp</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templateMessages.map((template, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.category}</Badge>
                  </TableCell>
                  <TableCell>{template.language.toUpperCase()}</TableCell>
                  <TableCell>{getStatusBadge(template.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
