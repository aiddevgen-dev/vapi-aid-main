import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, X, Plus, Sparkles, Loader2 } from 'lucide-react';

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'active' | 'inactive';
  sourceUrl?: string;
  updatedAt: string;
}

interface KnowledgeEntryFormProps {
  entry: KnowledgeEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<KnowledgeEntry>) => void;
}

const categories = ['Products', 'Policies', 'Shipping', 'Company', 'FAQ', 'Troubleshooting', 'Pricing'];

export const KnowledgeEntryForm: React.FC<KnowledgeEntryFormProps> = ({
  entry,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Products',
    tags: [] as string[],
    sourceUrl: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [tagInput, setTagInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        content: entry.content,
        category: entry.category,
        tags: entry.tags,
        sourceUrl: entry.sourceUrl || '',
        status: entry.status,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'Products',
        tags: [],
        sourceUrl: '',
        status: 'active',
      });
    }
  }, [entry, isOpen]);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleGenerateEmbedding = () => {
    setIsGenerating(true);
    // Simulate embedding generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {entry ? 'Edit Knowledge Entry' : 'Add Knowledge Entry'}
          </DialogTitle>
          <DialogDescription>
            Add content that AI agents can reference during conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Return Policy"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Enter the knowledge content..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.content.length} characters
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Source URL */}
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
            <Input
              id="sourceUrl"
              type="url"
              placeholder="https://..."
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label>Status</Label>
              <p className="text-sm text-muted-foreground">
                Active entries are available to AI agents
              </p>
            </div>
            <Switch
              checked={formData.status === 'active'}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
              }
            />
          </div>

          {/* Generate Embeddings */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Vector Embeddings</p>
                <p className="text-xs text-muted-foreground">
                  Generate embeddings for semantic search
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateEmbedding}
                disabled={isGenerating || !formData.content}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.title || !formData.content}>
            {entry ? 'Save Changes' : 'Add Entry'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
