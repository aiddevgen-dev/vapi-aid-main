import React, { useState } from 'react';
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
} from 'lucide-react';
import { KnowledgeEntryForm, KnowledgeEntry } from './KnowledgeEntryForm';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockEntries: KnowledgeEntry[] = [
  {
    id: '1',
    title: 'Return Policy',
    content: 'Our return policy allows customers to return items within 30 days of purchase for a full refund...',
    category: 'Policies',
    tags: ['returns', 'refunds', 'policy'],
    status: 'active',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    title: 'Product Warranty Information',
    content: 'All products come with a 1-year manufacturer warranty covering defects in materials and workmanship...',
    category: 'Products',
    tags: ['warranty', 'products'],
    status: 'active',
    updatedAt: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    title: 'Business Hours',
    content: 'Our customer service is available Monday through Friday, 9 AM to 6 PM EST...',
    category: 'Company',
    tags: ['hours', 'contact'],
    status: 'active',
    updatedAt: '2024-01-13T09:00:00Z',
  },
  {
    id: '4',
    title: 'Shipping Information',
    content: 'We offer free standard shipping on orders over $50. Express shipping is available for an additional fee...',
    category: 'Shipping',
    tags: ['shipping', 'delivery'],
    status: 'active',
    updatedAt: '2024-01-12T16:45:00Z',
  },
  {
    id: '5',
    title: 'Price Match Policy',
    content: 'We offer price matching on identical items found at major retailers within 14 days of purchase...',
    category: 'Policies',
    tags: ['pricing', 'policy'],
    status: 'inactive',
    updatedAt: '2024-01-10T11:15:00Z',
  },
];

const categories = ['All', 'Products', 'Policies', 'Shipping', 'Company', 'FAQ'];

export const KnowledgeBaseList: React.FC = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(mockEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<KnowledgeEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const { toast } = useToast();

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
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
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
