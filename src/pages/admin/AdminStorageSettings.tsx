import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Cloud, Settings, Eye, EyeOff } from 'lucide-react';
import {
  useStorageProviders,
  useCreateStorageProvider,
  useUpdateStorageProvider,
  useDeleteStorageProvider,
  StorageProvider,
} from '@/hooks/useStorageProviders';

const PROVIDER_PRESETS: Record<string, { label: string; fields: { key: string; label: string; placeholder: string; secret?: boolean }[] }> = {
  cloudinary: {
    label: 'Cloudinary',
    fields: [
      { key: 'cloud_name', label: 'Cloud Name', placeholder: 'your-cloud-name' },
      { key: 'upload_preset', label: 'Upload Preset (unsigned)', placeholder: 'my_unsigned_preset' },
      { key: 'api_key', label: 'API Key (optional)', placeholder: 'API key for signed uploads', secret: true },
      { key: 'api_secret', label: 'API Secret (optional)', placeholder: 'API secret', secret: true },
    ],
  },
  aws_s3: {
    label: 'AWS S3',
    fields: [
      { key: 'bucket', label: 'Bucket Name', placeholder: 'my-bucket' },
      { key: 'region', label: 'Region', placeholder: 'us-east-1' },
      { key: 'access_key_id', label: 'Access Key ID', placeholder: 'AKIA...', secret: true },
      { key: 'secret_access_key', label: 'Secret Access Key', placeholder: 'Secret key', secret: true },
    ],
  },
  imagekit: {
    label: 'ImageKit',
    fields: [
      { key: 'public_key', label: 'Public Key', placeholder: 'public_xxx' },
      { key: 'private_key', label: 'Private Key', placeholder: 'private_xxx', secret: true },
      { key: 'url_endpoint', label: 'URL Endpoint', placeholder: 'https://ik.imagekit.io/your_id' },
    ],
  },
  backblaze: {
    label: 'Backblaze B2',
    fields: [
      { key: 'bucket_id', label: 'Bucket ID', placeholder: 'bucket-id' },
      { key: 'key_id', label: 'Application Key ID', placeholder: 'Key ID', secret: true },
      { key: 'application_key', label: 'Application Key', placeholder: 'Application key', secret: true },
    ],
  },
  do_spaces: {
    label: 'DigitalOcean Spaces',
    fields: [
      { key: 'space_name', label: 'Space Name', placeholder: 'my-space' },
      { key: 'region', label: 'Region', placeholder: 'nyc3' },
      { key: 'access_key', label: 'Access Key', placeholder: 'Access key', secret: true },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'Secret key', secret: true },
    ],
  },
  wasabi: {
    label: 'Wasabi',
    fields: [
      { key: 'bucket', label: 'Bucket Name', placeholder: 'my-bucket' },
      { key: 'region', label: 'Region', placeholder: 'us-east-1' },
      { key: 'access_key', label: 'Access Key', placeholder: 'Access key', secret: true },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'Secret key', secret: true },
    ],
  },
  custom: {
    label: 'Custom Endpoint',
    fields: [
      { key: 'endpoint_url', label: 'Upload Endpoint URL', placeholder: 'https://api.example.com/upload' },
      { key: 'auth_header', label: 'Authorization Header', placeholder: 'Bearer xxx', secret: true },
      { key: 'response_url_path', label: 'Response URL JSON Path', placeholder: 'data.url' },
    ],
  },
};

const AdminStorageSettings: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { data: providers, isLoading } = useStorageProviders();
  const createProvider = useCreateStorageProvider();
  const updateProvider = useUpdateStorageProvider();
  const deleteProvider = useDeleteStorageProvider();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [priority, setPriority] = useState(10);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const isSuperAdmin = role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Settings className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
        <p className="mt-2 text-muted-foreground">Only Super Admins can manage storage settings</p>
        <Button className="mt-6" onClick={() => navigate('/admin')}>Go Back</Button>
      </div>
    );
  }

  const handleAddProvider = () => {
    if (!selectedPreset) return;
    createProvider.mutate(
      {
        provider_name: selectedPreset,
        credentials,
        priority,
      },
      {
        onSuccess: () => {
          setAddDialogOpen(false);
          setSelectedPreset('');
          setCredentials({});
          setPriority(10);
        },
      }
    );
  };

  const toggleSecret = (providerId: string, key: string) => {
    const k = `${providerId}-${key}`;
    setVisibleSecrets((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const preset = selectedPreset ? PROVIDER_PRESETS[selectedPreset] : null;

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <main className="p-4 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">External Storage Providers</h2>
            <p className="text-sm text-muted-foreground">
              Configure external storage for image uploads. The highest-priority enabled provider is used first; Supabase Storage is the fallback.
            </p>
          </div>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Provider</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Storage Provider</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Provider Type</Label>
                  <Select value={selectedPreset} onValueChange={(v) => { setSelectedPreset(v); setCredentials({}); }}>
                    <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROVIDER_PRESETS).map(([key, p]) => (
                        <SelectItem key={key} value={key}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {preset && preset.fields.map((field) => (
                  <div key={field.key}>
                    <Label>{field.label}</Label>
                    <Input
                      type={field.secret ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={credentials[field.key] || ''}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    />
                  </div>
                ))}

                <div>
                  <Label>Priority (higher = preferred)</Label>
                  <Input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                  />
                </div>

                <Button
                  onClick={handleAddProvider}
                  disabled={!selectedPreset || createProvider.isPending}
                  className="w-full"
                >
                  {createProvider.isPending ? 'Adding...' : 'Add Provider'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Default Supabase info */}
        <Card className="mb-4 border-dashed">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Cloud className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Supabase Storage (Default)</h4>
              <p className="text-sm text-muted-foreground">
                Built-in storage. Used as fallback when no external provider is enabled.
              </p>
            </div>
            <Badge variant="secondary">Fallback</Badge>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading providers...</p>
        ) : providers && providers.length > 0 ? (
          <div className="space-y-4">
            {providers.map((provider) => {
              const presetInfo = PROVIDER_PRESETS[provider.provider_name];
              return (
                <Card key={provider.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">
                          {presetInfo?.label || provider.provider_name}
                        </CardTitle>
                        <Badge variant={provider.is_enabled ? 'default' : 'secondary'}>
                          {provider.is_enabled ? 'Active' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline">Priority: {provider.priority}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.is_enabled}
                          onCheckedChange={(checked) =>
                            updateProvider.mutate({ id: provider.id, is_enabled: checked })
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Provider?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the storage provider configuration permanently.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProvider.mutate(provider.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {presetInfo?.fields.map((field) => {
                        const val = (provider.credentials as Record<string, string>)?.[field.key] || '';
                        const isVisible = visibleSecrets[`${provider.id}-${field.key}`];
                        return (
                          <div key={field.key}>
                            <Label className="text-xs text-muted-foreground">{field.label}</Label>
                            <div className="flex items-center gap-1">
                              <Input
                                readOnly
                                type={field.secret && !isVisible ? 'password' : 'text'}
                                value={val}
                                className="text-sm"
                              />
                              {field.secret && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0"
                                  onClick={() => toggleSecret(provider.id, field.key)}
                                >
                                  {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No external providers configured. All uploads use Supabase Storage.
          </p>
        )}
      </main>
    </div>
  );
};

export default AdminStorageSettings;
