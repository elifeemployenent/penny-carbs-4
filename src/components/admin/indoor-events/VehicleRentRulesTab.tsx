import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Car, IndianRupee, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';

interface VehicleRentRule {
  id: string;
  vehicle_type: string;
  minimum_rent: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const VehicleRentRulesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<VehicleRentRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<VehicleRentRule | null>(null);
  
  // Form state
  const [vehicleType, setVehicleType] = useState('');
  const [minimumRent, setMinimumRent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['vehicle-rent-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_rent_rules')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as VehicleRentRule[];
    },
  });

  const resetForm = () => {
    setVehicleType('');
    setMinimumRent('');
    setIsActive(true);
    setEditingRule(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (rule: VehicleRentRule) => {
    setEditingRule(rule);
    setVehicleType(rule.vehicle_type);
    setMinimumRent(rule.minimum_rent.toString());
    setIsActive(rule.is_active);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!vehicleType.trim() || !minimumRent) {
        throw new Error('Please fill all required fields');
      }

      const rentAmount = parseFloat(minimumRent);
      if (isNaN(rentAmount) || rentAmount < 0) {
        throw new Error('Invalid rent amount');
      }

      if (editingRule) {
        // Update existing
        const { error } = await supabase
          .from('vehicle_rent_rules')
          .update({
            vehicle_type: vehicleType.trim(),
            minimum_rent: rentAmount,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRule.id);

        if (error) throw error;
      } else {
        // Create new
        const maxOrder = rules?.reduce((max, r) => Math.max(max, r.display_order), 0) || 0;
        
        const { error } = await supabase
          .from('vehicle_rent_rules')
          .insert({
            vehicle_type: vehicleType.trim(),
            minimum_rent: rentAmount,
            is_active: isActive,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-rent-rules'] });
      toast({
        title: editingRule ? 'Rule Updated' : 'Rule Added',
        description: `Vehicle rent rule for "${vehicleType}" has been ${editingRule ? 'updated' : 'added'}`,
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save rule',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicle_rent_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-rent-rules'] });
      toast({ title: 'Rule Deleted' });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete rule',
        variant: 'destructive',
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('vehicle_rent_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-rent-rules'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vehicle Rent Rules</h3>
          <p className="text-sm text-muted-foreground">Minimum rent for different vehicle types</p>
        </div>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-1" /> Add Rule
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : rules?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Car className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No vehicle rent rules configured</p>
            <Button variant="link" onClick={openAddDialog}>
              Add your first rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules?.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indoor-events/10 p-2 text-indoor-events">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{rule.vehicle_type}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {rule.minimum_rent.toLocaleString()} minimum
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => 
                        toggleActiveMutation.mutate({ id: rule.id, isActive: checked })
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setRuleToDelete(rule);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Vehicle Rent Rule' : 'Add Vehicle Rent Rule'}
            </DialogTitle>
            <DialogDescription>
              Set the minimum rent for this vehicle type
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Vehicle Type *</Label>
              <Input
                id="vehicle-type"
                placeholder="e.g. Passenger Auto, Mini Van"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimum-rent">Minimum Rent (₹) *</Label>
              <Input
                id="minimum-rent"
                type="number"
                placeholder="150"
                value={minimumRent}
                onChange={(e) => setMinimumRent(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-active">Active</Label>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRule ? 'Update' : 'Add'} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rent Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the rent rule for "{ruleToDelete?.vehicle_type}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => ruleToDelete && deleteMutation.mutate(ruleToDelete.id)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleRentRulesTab;
