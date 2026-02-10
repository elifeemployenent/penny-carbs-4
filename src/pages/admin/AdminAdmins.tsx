import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Shield,
  ShieldCheck,
  Loader2,
  UserSearch
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AdminNavbar from '@/components/admin/AdminNavbar';

type PermLevel = 'none' | 'read' | 'write';

interface FormData {
  user_id: string;
  perm_items: PermLevel;
  perm_orders: PermLevel;
  perm_assign_orders: PermLevel;
  perm_cooks: PermLevel;
  perm_delivery_staff: PermLevel;
  perm_reports: PermLevel;
  perm_settlements: PermLevel;
  perm_categories: PermLevel;
  perm_banners: PermLevel;
  perm_locations: PermLevel;
  perm_special_offers: PermLevel;
}

interface AdminUser {
  id: string;
  user_id: string;
  perm_items: PermLevel;
  perm_orders: PermLevel;
  perm_assign_orders: PermLevel;
  perm_cooks: PermLevel;
  perm_delivery_staff: PermLevel;
  perm_reports: PermLevel;
  perm_settlements: PermLevel;
  perm_categories: PermLevel;
  perm_banners: PermLevel;
  perm_locations: PermLevel;
  perm_special_offers: PermLevel;
  created_at: string;
  profile?: {
    name: string;
    mobile_number: string;
  };
}

interface SearchedUser {
  user_id: string;
  name: string;
  mobile_number: string;
}

const PERM_KEYS = [
  { key: 'perm_items', label: 'Items' },
  { key: 'perm_orders', label: 'Orders' },
  { key: 'perm_assign_orders', label: 'Assign Orders' },
  { key: 'perm_cooks', label: 'Cooks' },
  { key: 'perm_delivery_staff', label: 'Delivery Staff' },
  { key: 'perm_categories', label: 'Categories' },
  { key: 'perm_banners', label: 'Banners' },
  { key: 'perm_locations', label: 'Locations' },
  { key: 'perm_special_offers', label: 'Special Offers' },
  { key: 'perm_reports', label: 'Reports' },
  { key: 'perm_settlements', label: 'Settlements' },
] as const;

const DEFAULT_PERMS: Record<string, PermLevel> = Object.fromEntries(
  PERM_KEYS.map(({ key }) => [key, 'none'])
);

const LEVEL_BADGE: Record<PermLevel, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  none: { label: 'No Access', variant: 'outline' },
  read: { label: 'View', variant: 'secondary' },
  write: { label: 'Full', variant: 'default' },
};

const AdminAdmins: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  
  const [mobileSearch, setMobileSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    ...DEFAULT_PERMS,
  } as FormData);

  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) fetchAdmins();
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const adminIds = data?.map(a => a.user_id) || [];
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, mobile_number')
          .in('user_id', adminIds);

        const adminsWithProfiles = data?.map(admin => ({
          ...admin,
          profile: profiles?.find(p => p.user_id === admin.user_id),
        })) || [];

        setAdmins(adminsWithProfiles as AdminUser[]);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({ title: 'Error', description: 'Failed to fetch admin users', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchByMobile = async () => {
    if (!mobileSearch.trim() || mobileSearch.length < 3) {
      toast({ title: 'Enter Mobile Number', description: 'Please enter at least 3 digits to search', variant: 'destructive' });
      return;
    }
    setIsSearching(true);
    setSearchResults([]);
    setSelectedUser(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, mobile_number')
        .ilike('mobile_number', `%${mobileSearch}%`)
        .limit(10);
      if (error) throw error;
      setSearchResults(data || []);
      if (data?.length === 0) toast({ title: 'No Users Found', description: 'No users found with that mobile number' });
    } catch (error) {
      console.error('Error searching users:', error);
      toast({ title: 'Error', description: 'Failed to search users', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: SearchedUser) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, user_id: user.user_id }));
    setSearchResults([]);
  };

  const handleOpenDialog = (admin?: AdminUser) => {
    if (admin) {
      setEditingAdmin(admin);
      setSelectedUser(admin.profile ? { user_id: admin.user_id, name: admin.profile.name, mobile_number: admin.profile.mobile_number } : null);
      const perms: Record<string, PermLevel> = {};
      PERM_KEYS.forEach(({ key }) => { perms[key] = (admin as any)[key] || 'none'; });
      setFormData({ user_id: admin.user_id, ...DEFAULT_PERMS, ...perms } as FormData);
    } else {
      setEditingAdmin(null);
      setSelectedUser(null);
      setMobileSearch('');
      setSearchResults([]);
      setFormData({ user_id: '', ...DEFAULT_PERMS } as FormData);
    }
    setIsDialogOpen(true);
  };

  const handleSaveAdmin = async () => {
    if (!formData.user_id) {
      toast({ title: 'Validation Error', description: 'User ID is required', variant: 'destructive' });
      return;
    }
    try {
      const { user_id, ...perms } = formData;
      const permissionData = { user_id, ...perms };

      if (editingAdmin) {
        const { error } = await supabase.from('admin_permissions').update(permissionData).eq('id', editingAdmin.id);
        if (error) throw error;
        toast({ title: 'Admin permissions updated' });
      } else {
        const { error: roleError } = await supabase.from('user_roles').insert({ user_id: formData.user_id, role: 'admin' });
        if (roleError && !roleError.message.includes('duplicate')) throw roleError;
        const { error } = await supabase.from('admin_permissions').insert(permissionData);
        if (error) throw error;
        toast({ title: 'Admin added successfully' });
      }
      setIsDialogOpen(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error saving admin:', error);
      toast({ title: 'Error', description: 'Failed to save admin', variant: 'destructive' });
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (!confirm('Are you sure you want to remove admin permissions for this user?')) return;
    try {
      const { error } = await supabase.from('admin_permissions').delete().eq('id', admin.id);
      if (error) throw error;
      await supabase.from('user_roles').delete().eq('user_id', admin.user_id).eq('role', 'admin');
      setAdmins(prev => prev.filter(a => a.id !== admin.id));
      toast({ title: 'Admin removed successfully' });
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({ title: 'Error', description: 'Failed to remove admin', variant: 'destructive' });
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const name = admin.profile?.name?.toLowerCase() || '';
    const mobile = admin.profile?.mobile_number || '';
    return name.includes(searchQuery.toLowerCase()) || mobile.includes(searchQuery);
  });

  const getActivePerms = (admin: AdminUser) =>
    PERM_KEYS.filter(({ key }) => (admin as any)[key] !== 'none');

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Access Denied - Super Admin Only</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-[6.5rem]">
      <AdminNavbar />

      <div className="border-b bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Admin Management</h2>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or mobile..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <main className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Shield className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">No admins found</h2>
            <p className="text-sm text-muted-foreground">Add admin users to help manage the platform</p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Admin
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAdmins.map(admin => (
              <Card key={admin.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{admin.profile?.name || 'Unknown User'}</h3>
                        <p className="text-sm text-muted-foreground">{admin.profile?.mobile_number || admin.user_id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(admin)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAdmin(admin)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {getActivePerms(admin).map(({ key, label }) => {
                      const level = (admin as any)[key] as PermLevel;
                      const badge = LEVEL_BADGE[level];
                      return (
                        <Badge key={key} variant={badge.variant} className="text-xs">
                          {label}: {badge.label}
                        </Badge>
                      );
                    })}
                    {getActivePerms(admin).length === 0 && (
                      <span className="text-xs text-muted-foreground">No permissions assigned</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAdmin ? 'Edit Admin Permissions' : 'Add New Admin'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!editingAdmin && (
              <div className="space-y-3">
                <Label>Search User by Mobile Number *</Label>
                <div className="flex gap-2">
                  <Input
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    placeholder="Enter mobile number..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchByMobile()}
                  />
                  <Button type="button" onClick={handleSearchByMobile} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserSearch className="h-4 w-4" />}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 rounded-md border p-2">
                    <p className="text-xs text-muted-foreground">Select a user:</p>
                    {searchResults.map(user => (
                      <div key={user.user_id} className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-muted" onClick={() => handleSelectUser(user)}>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.mobile_number}</p>
                        </div>
                        <Button variant="ghost" size="sm">Select</Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="rounded-md border border-primary bg-primary/5 p-3">
                    <p className="text-sm font-medium text-primary">Selected User:</p>
                    <p className="font-semibold">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.mobile_number}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {PERM_KEYS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label className="text-sm font-normal min-w-[120px]">{label}</Label>
                    <Select
                      value={formData[key] || 'none'}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, [key]: val as PermLevel }))}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Access</SelectItem>
                        <SelectItem value="read">View Only</SelectItem>
                        <SelectItem value="write">Full Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAdmin}>{editingAdmin ? 'Save Changes' : 'Add Admin'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAdmins;
