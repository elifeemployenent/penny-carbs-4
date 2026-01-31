import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import IndoorEventsShell from './IndoorEventsShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Car, Plus, Trash2, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const IndoorEventsVehicles: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [notes, setNotes] = useState('');

  // Get vehicles with order info
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['indoor-event-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indoor_event_vehicles')
        .select(`
          id, vehicle_number, driver_name, driver_mobile, notes, created_at, order_id,
          order:orders(order_number, event_date, guest_count)
        `)
        .order('created_at', { ascending: false });

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

  const addVehicleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('indoor_event_vehicles').insert({
        order_id: selectedOrderId,
        vehicle_number: vehicleNumber,
        driver_name: driverName || null,
        driver_mobile: driverMobile,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indoor-event-vehicles'] });
      toast({ title: 'Vehicle added successfully' });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Failed to add vehicle', description: err.message, variant: 'destructive' });
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
    setDriverName('');
    setDriverMobile('');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !vehicleNumber || !driverMobile) {
      toast({ title: 'Fill required fields', variant: 'destructive' });
      return;
    }
    addVehicleMutation.mutate();
  };

  return (
    <IndoorEventsShell title="Rental Vehicles">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Manage vehicle details for events</p>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Vehicle for Event</DialogTitle>
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
                <Label>Vehicle Number *</Label>
                <Input
                  placeholder="KL-XX-XXXX"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>
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
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  placeholder="Any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={addVehicleMutation.isPending}>
                {addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
                      <p className="text-sm">{v.driver_name || 'Unknown driver'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {v.driver_mobile}
                      </p>
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
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 mt-1 text-destructive"
                      onClick={() => deleteVehicleMutation.mutate(v.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
    </IndoorEventsShell>
  );
};

export default IndoorEventsVehicles;
