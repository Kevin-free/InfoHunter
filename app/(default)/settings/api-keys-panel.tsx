'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Plus, Copy, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getJwt } from '@/components/lib/networkUtils';

interface ApiKey {
  id: number;
  api_key: string;
  title: string;
  user_id: string;
  created_at: string;
  status: string;
}

interface ApiKeysPanelProps {
  userId: string | undefined;
}

export function ApiKeysPanel({ userId }: ApiKeysPanelProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyTitle, setNewKeyTitle] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchApiKeys();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const token = getJwt();
      const response = await fetch('/api/apikeys', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch API keys');

      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyTitle.trim()) {
      toast.error('Please enter a title for your API key');
      return;
    }

    try {
      setIsCreatingKey(true);
      const token = getJwt();
      const response = await fetch('/api/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newKeyTitle
        })
      });

      if (!response.ok) throw new Error('Failed to create API key');

      const data = await response.json();
      setNewKeyValue(data.apiKey.api_key);
      setShowNewKey(true);
      await fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setIsCreatingKey(false);
    }
  };

  const deleteApiKey = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this API key? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const token = getJwt();
      const response = await fetch(`/api/apikeys/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete API key');

      toast.success('API key deleted successfully');
      await fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('API key copied to clipboard'))
      .catch((err) => toast.error('Failed to copy API key'));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setNewKeyTitle('');
      setNewKeyValue('');
      setShowNewKey(false);
    }
  };

  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return '';
    // Show first 10 and last 4 characters
    const prefix = apiKey.slice(0, 10);
    const suffix = apiKey.slice(-4);
    return `${prefix}......${suffix}`;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Create and manage API keys for programmatic access
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new API key</DialogTitle>
                <DialogDescription>
                  Provide a descriptive name for your API key. You will only be
                  shown the key once after creation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Production Server"
                    value={newKeyTitle}
                    onChange={(e) => setNewKeyTitle(e.target.value)}
                    disabled={showNewKey}
                  />
                </div>

                {showNewKey && (
                  <div className="space-y-2">
                    <Label htmlFor="key" className="font-medium">
                      Your API Key
                    </Label>
                    <div className="flex relative">
                      <Input
                        id="key"
                        value={newKeyValue}
                        readOnly
                        className="font-mono pr-10 bg-muted"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => copyToClipboard(newKeyValue)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-amber-500 mt-2">
                      Please copy it now and write it down somewhere safe.
                    </p>
                    <p className="text-sm font-bold text-amber-500">
                      You will not be able to see it again.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                {!showNewKey ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleDialogOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createApiKey} disabled={isCreatingKey}>
                      {isCreatingKey ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Key'
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => handleDialogOpenChange(false)}>
                    Done
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center my-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>You haven't created any API keys yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-3">Title</div>
                <div className="col-span-5">API Key</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-1"></div>
              </div>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="grid grid-cols-12 gap-4 p-4 border rounded-lg items-center"
                >
                  <div className="col-span-3 font-medium">{key.title}</div>
                  <div className="col-span-5">
                    <code className="px-2 py-1 bg-muted rounded text-xs">
                      {maskApiKey(key.api_key)}
                    </code>
                  </div>
                  <div className="col-span-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        key.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {key.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteApiKey(key.id)}
                      title="Delete API key"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
