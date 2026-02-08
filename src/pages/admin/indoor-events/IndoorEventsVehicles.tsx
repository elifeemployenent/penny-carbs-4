import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import IndoorEventsShell from './IndoorEventsShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Car, Plus, Trash2, Phone, IndianRupee, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import VehicleRentRulesTab from '@/components/admin/indoor-events/VehicleRentRulesTab';

const IndoorEventsVehicles: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('vehicles');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Get vehicles with order info
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['indoor-event-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indoor_event_vehicles')
        .select(`
          id, vehicle_number, vehicle_type, rent_amount, driver_name, driver_mobile, notes, created_at, order_id,
          order:orders(order_number, event_date, guest_count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Get rent rules for vehicle type dropdown
  const { data: rentRules } = useQuery({
    queryKey: ['vehicle-rent-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_rent_rules')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data;
    },
  });

  // Get confirmed/preparing indoor event orders for dropdown
  const { data: orders } = useQuery({
    queryKey: ['indoor-events-for-vehicle'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, event_date')
        .eq('service_type', 'indoor_events')
        .in('status', ['confirmed', 'preparing'])
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rent = rentAmount ? parseFloat(rentAmount) : 0;
      
      if (editingVehicle) {
        // Update existing
        const { error } = await supabase
          .from('indoor_event_vehicles')
          .update({
            order_id: selectedOrderId,
            vehicle_number: vehicleNumber,
            vehicle_type: vehicleType || null,
            rent_amount: rent,
            driver_name: driverName || null,
            driver_mobile: driverMobile,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingVehicle.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from('indoor_event_vehicles').insert({
          order_id: selectedOrderId,
          vehicle_number: vehicleNumber,
          vehicle_type: vehicleType || null,
          rent_amount: rent,
          driver_name: driverName || null,
          driver_mobile: driverMobile,
          notes: notes || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indoor-event-vehicles'] });
      toast({ title: editingVehicle ? 'Vehicle updated' : 'Vehicle added successfully' });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Failed to save vehicle', description: err.message, variant: 'destructive' });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('indoor_event_vehicles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indoor-event-vehicles'] });
      toast({ title: 'Vehicle removed' });
    },
  });

  const resetForm = () => {
    setSelectedOrderId('');
    setVehicleNumber('');
    setVehicleType('');
    setDriverName('');
    setDriverMobile('');
    setRentAmount('');
    setNotes('');
    setEditingVehicle(null);
  };

  const openEditDialog = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setSelectedOrderId(vehicle.order_id || '');
    setVehicleNumber(vehicle.vehicle_number || '');
    setVehicleType(vehicle.vehicle_type || '');
    setDriverName(vehicle.driver_name || '');
    setDriverMobile(vehicle.driver_mobile || '');
    setRentAmount(vehicle.rent_amount?.toString() || '');
    setNotes(vehicle.notes || '');
    setIsAddOpen(true);
  };

  const handleVehicleTypeChange = (type: string) => {
    setVehicleType(type);
    // Auto-fill minimum rent from rules
    const rule = rentRules?.find(r => r.vehicle_type === type);
    if (rule) {
      setRentAmount(rule.minimum_rent.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !vehicleNumber || !driverMobile) {
      toast({ title: 'Fill required fields', variant: 'destructive' });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <IndoorEventsShell title="Rental Vehicles">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="rent-rules">Rent Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage vehicle details for events</p>
            <Button size="sm" onClick={() => { resetForm(); setIsAddOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Vehicle
            </Button>
          </div>

          {vehiclesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : vehicles?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                No vehicles added yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {vehicles?.map((v: any) => (
                <Card key={v.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-indoor-events/10 p-2 text-indoor-events">
                          <Car className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-mono font-medium">{v.vehicle_number}</p>
                          {v.vehicle_type && (
                            <Badge variant="secondary" className="text-xs mb-1">
                              {v.vehicle_type}
                            </Badge>
                          )}
                          <p className="text-sm">{v.driver_name || 'Unknown driver'}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {v.driver_mobile}
                          </p>
                          {v.rent_amount > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <IndianRupee className="h-3 w-3" /> {v.rent_amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs font-mono">
                          {(v.order as any)?.order_number}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(v.order as any)?.event_date
                            ? format(new Date((v.order as any).event_date), 'dd MMM')
                            : ''}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(v)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteVehicleMutation.mutate(v.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {v.notes && (
                      <p className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                        {v.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rent-rules">
          <VehicleRentRulesTab />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle for Event'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Order *</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order..." />
                </SelectTrigger>
                <SelectContent>
                  {orders?.map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.order_number} • {o.event_date ? format(new Date(o.event_date), 'dd MMM') : 'No date'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={handleVehicleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type..." />
                </SelectTrigger>
                <SelectContent>
                  {rentRules?.map((rule: any) => (
                    <SelectItem key={rule.id} value={rule.vehicle_type}>
                      {rule.vehicle_type} (Min: ₹{rule.minimum_rent})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Number *</Label>
              <Input
                placeholder="KL-XX-XXXX"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input
                  placeholder="Driver name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Mobile *</Label>
                <Input
                  placeholder="Phone number"
                  value={driverMobile}
                  onChange={(e) => setDriverMobile(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rent Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Rent amount"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </IndoorEventsShell>
  );
};

export default IndoorEventsVehicles;
