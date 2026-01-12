import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Upload,
  Sparkles,
  BookOpen,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { KnowledgeEntryForm, KnowledgeEntry } from './KnowledgeEntryForm';
import { useToast } from '@/hooks/use-toast';

// Pink Mobile Knowledge Base Data
const mockEntries: KnowledgeEntry[] = [
  {
    id: '1',
    title: 'Pink Mobile Unlimited Plan',
    content: 'Pink Mobile Unlimited Plan - $49.99/month. Features: Unlimited talk & text nationwide, Unlimited 5G/4G LTE data (slower speeds after 50GB), Mobile hotspot 15GB, International texting to 200+ countries, Free Pink Music streaming, No annual contract. Activation fee: $25 (waived online). AutoPay discount: $5/month off.',
    category: 'Plans',
    tags: ['unlimited', 'plans', 'pricing', '5G'],
    status: 'active',
    updatedAt: '2024-12-01T10:30:00Z',
  },
  {
    id: '2',
    title: 'Pink Mobile Basic Plan',
    content: 'Pink Mobile Basic Plan - $29.99/month. Features: Unlimited talk & text, 5GB high-speed data (2G speeds after), No mobile hotspot, Domestic coverage only, No contract required. Best for light data users who primarily use WiFi. Can upgrade to Unlimited anytime with no penalty.',
    category: 'Plans',
    tags: ['basic', 'plans', 'budget', 'pricing'],
    status: 'active',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '3',
    title: 'Pink Mobile Family Plan',
    content: 'Pink Mobile Family Plan - Starting at $35/line/month. 4+ lines required for best pricing. Features per line: Unlimited talk, text, and data, Shared family controls, 10GB mobile hotspot each. Pricing: 2 lines $80/mo ($40/line), 3 lines $105/mo ($35/line), 4 lines $120/mo ($30/line), 5+ lines $25/line/month. Add tablets/watches at $10/month.',
    category: 'Plans',
    tags: ['family', 'plans', 'multi-line', 'pricing'],
    status: 'active',
    updatedAt: '2024-11-28T14:20:00Z',
  },
  {
    id: '4',
    title: 'Billing & Payment Options',
    content: 'Payment Methods: Credit/Debit cards (Visa, Mastercard, Amex, Discover), Bank account (ACH), Pink Mobile gift cards, PayPal. Billing Cycle: Bills generated on activation date monthly, Payment due 21 days after, Late fee $5 after 15 days. AutoPay Benefits: $5/month discount per line, Never miss payment. To set up AutoPay say "I want to set up AutoPay".',
    category: 'Billing',
    tags: ['billing', 'payment', 'autopay'],
    status: 'active',
    updatedAt: '2024-11-25T09:00:00Z',
  },
  {
    id: '5',
    title: 'Network Coverage & 5G',
    content: '5G Coverage available in 500+ cities with speeds up to 1Gbps. Compatible devices required (iPhone 12+, Samsung S21+). 4G LTE Coverage: 99% population coverage, 25-50 Mbps average. Check coverage at pinkmobile.com/coverage. Domestic roaming included free. International roaming with Global Pass $10/day.',
    category: 'Network',
    tags: ['coverage', '5G', '4G', 'network'],
    status: 'active',
    updatedAt: '2024-11-20T16:45:00Z',
  },
  {
    id: '6',
    title: 'Device Upgrades & Trade-In',
    content: 'Upgrade eligible after 12 months. Trade-In Values: iPhone 14 Pro up to $650, iPhone 13 up to $400, Samsung S23 up to $500, Samsung S22 up to $350. How to Trade In: Check value at pinkmobile.com/tradein, Back up & factory reset, Ship with prepaid label or bring to store, Credit applied in 2-3 billing cycles. Financing: 0% APR for 24 months on qualified credit.',
    category: 'Devices',
    tags: ['upgrade', 'trade-in', 'devices', 'financing'],
    status: 'active',
    updatedAt: '2024-11-15T11:15:00Z',
  },
  {
    id: '7',
    title: 'Troubleshooting - No Service',
    content: 'Quick Fixes for No Service: 1) Toggle Airplane Mode on/off, 2) Restart device, 3) Check coverage at pinkmobile.com/coverage, 4) Remove and reinsert SIM card, 5) Check for carrier settings update. If issues persist: Reset network settings, Contact us for network outage info, Visit store for SIM replacement. Common causes: SIM damage, Account suspension, Device compatibility.',
    category: 'Support',
    tags: ['troubleshooting', 'no service', 'signal', 'help'],
    status: 'active',
    updatedAt: '2024-11-10T08:30:00Z',
  },
  {
    id: '8',
    title: 'Account Security & PIN',
    content: 'Account PIN: 4-digit PIN required for account changes, Set during account creation, Required for SIM swaps, plan changes, adding lines. To Reset PIN: Online at pinkmobile.com/security, Call with last 4 SSN + billing zip, Store with valid photo ID. Two-Factor Authentication available via SMS or authenticator app. SIM swap protection enabled by default.',
    category: 'Security',
    tags: ['security', 'PIN', 'account', '2FA'],
    status: 'active',
    updatedAt: '2024-11-05T14:00:00Z',
  },
  {
    id: '9',
    title: 'International Roaming & Travel',
    content: 'Global Pass $10/day: Use phone in 200+ countries, Unlimited talk & text, 5GB high-speed data per day, Only charged on days used. International Calling from US: Mexico/Canada included in Unlimited plans, Other countries $0.25-$3.00/min, International Calling Pack $15/month for discounts. Before travel: Verify destination coverage, Enable roaming in settings.',
    category: 'International',
    tags: ['international', 'roaming', 'travel', 'global'],
    status: 'active',
    updatedAt: '2024-10-28T10:00:00Z',
  },
  {
    id: '10',
    title: 'Customer Support Hours',
    content: 'Phone Support 1-800-PINK-MOB: Mon-Fri 6AM-11PM EST, Sat-Sun 8AM-9PM EST. AI Assistant Sara available 24/7. Live Chat at pinkmobile.com/chat same hours, avg wait under 2 mins. Store locations at pinkmobile.com/stores, most open 10AM-8PM. Social: Twitter @PinkMobileHelp, Facebook /PinkMobile, response within 1 hour during business hours.',
    category: 'Support',
    tags: ['support', 'contact', 'hours', 'help'],
    status: 'active',
    updatedAt: '2024-10-20T09:00:00Z',
  },
];

const categories = ['All', 'Plans', 'Billing', 'Network', 'Devices', 'Support', 'Security', 'International'];

export const KnowledgeBaseList: React.FC = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(mockEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<KnowledgeEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle PDF/Document Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, TXT, or Word document.',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    toast({
      title: 'Processing Document',
      description: `Extracting content from ${file.name}...`,
    });

    try {
      // For now, create a placeholder entry from the file
      // In production, this would call an API to extract text from PDF
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newEntry: KnowledgeEntry = {
        id: Date.now().toString(),
        title: fileName,
        content: `[Imported from ${file.name}]\n\nThis document has been uploaded and is ready for content extraction. In production, the text content would be automatically extracted from the PDF/document and stored here for Sara AI to reference during customer calls.\n\nFile size: ${(file.size / 1024).toFixed(1)} KB\nUploaded: ${new Date().toLocaleString()}`,
        category: 'Support',
        tags: ['imported', 'document', file.type.includes('pdf') ? 'pdf' : 'doc'],
        status: 'active',
        updatedAt: new Date().toISOString(),
      };

      setEntries([newEntry, ...entries]);

      toast({
        title: 'Document Imported',
        description: `"${fileName}" has been added to the knowledge base.`,
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to process the document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear all entries
  const handleClearAll = () => {
    setEntries([]);
    toast({
      title: 'Knowledge Base Cleared',
      description: 'All entries have been removed.',
    });
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || entry.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDelete = (entry: KnowledgeEntry) => {
    setDeletingEntry(entry);
  };

  const confirmDelete = () => {
    if (deletingEntry) {
      setEntries(entries.filter((e) => e.id !== deletingEntry.id));
      toast({
        title: 'Entry Deleted',
        description: `"${deletingEntry.title}" has been removed.`,
      });
      setDeletingEntry(null);
    }
  };

  const handleSave = (entryData: Partial<KnowledgeEntry>) => {
    if (editingEntry) {
      setEntries(entries.map((e) =>
        e.id === editingEntry.id ? { ...e, ...entryData, updatedAt: new Date().toISOString() } : e
      ));
      toast({
        title: 'Entry Updated',
        description: `"${entryData.title}" has been updated.`,
      });
    } else {
      const newEntry: KnowledgeEntry = {
        id: Date.now().toString(),
        title: entryData.title || '',
        content: entryData.content || '',
        category: entryData.category || 'General',
        tags: entryData.tags || [],
        status: 'active',
        updatedAt: new Date().toISOString(),
      };
      setEntries([newEntry, ...entries]);
      toast({
        title: 'Entry Created',
        description: `"${newEntry.title}" has been added.`,
      });
    }
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const toggleEntryStatus = (entry: KnowledgeEntry) => {
    setEntries(entries.map((e) =>
      e.id === entry.id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e
    ));
  };

  const generateEmbeddings = () => {
    toast({
      title: 'Generating Embeddings',
      description: 'Processing knowledge base entries...',
    });
    setTimeout(() => {
      toast({
        title: 'Embeddings Generated',
        description: `Successfully processed ${entries.length} entries.`,
      });
    }, 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground">Manage content for AI agent responses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={generateEmbeddings}>
            <Sparkles className="h-4 w-4" />
            Generate Embeddings
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm py-1 px-3">
          {entries.length} Total Entries
        </Badge>
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 py-1 px-3">
          {entries.filter((e) => e.status === 'active').length} Active
        </Badge>
        <Badge variant="secondary" className="py-1 px-3">
          {categories.length - 1} Categories
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.txt,.doc,.docx"
          className="hidden"
        />
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Upload PDF
            </>
          )}
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={handleClearAll}
          disabled={entries.length === 0}
        >
          <Trash2 className="h-4 w-4" />
          Clear All
        </Button>
      </div>

      {/* Table */}
      {filteredEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Entries Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || categoryFilter !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Add your first knowledge base entry'}
            </p>
            {!searchQuery && categoryFilter === 'All' && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                        {entry.content}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                      {entry.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {entry.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{entry.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        entry.status === 'active'
                          ? 'bg-green-500/10 text-green-500 border-green-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }
                    >
                      {entry.status === 'active' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(entry.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(entry)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleEntryStatus(entry)}>
                          {entry.status === 'active' ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(entry)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Entry Form Dialog */}
      <KnowledgeEntryForm
        entry={editingEntry}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingEntry?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
