import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import IndoorEventsShell from './IndoorEventsShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ChefHat, Calendar, Users, MapPin, Check } from 'lucide-react';
import { format } from 'date-fns';

const IndoorEventsCooks: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCooks, setSelectedCooks] = useState<Record<string, string>>({});

  // Get confirmed orders without cook assigned
  const { data: ordersNeedingCook, isLoading: ordersLoading } = useQuery({
    queryKey: ['indoor-events-cook-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, guest_count, event_date, 
          delivery_address, panchayat_id, ward_number, assigned_cook_id,
          event_type:event_types(name, icon),
          panchayat:panchayats(name),
          profile:profiles!orders_customer_id_fkey(name)
        `)
        .eq('service_type', 'indoor_events')
        .in('status', ['confirmed', 'preparing'])
        .is('assigned_cook_id', null)
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Get available cooks for indoor events
  const { data: cooks, isLoading: cooksLoading } = useQuery({
    queryKey: ['indoor-events-cooks-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cooks')
        .select(`
          id, kitchen_name, mobile_number, panchayat_id, is_available, rating,
          panchayat:panchayats(name)
        `)
        .eq('is_active', true)
        .contains('allowed_order_types', ['indoor_events'])
        .order('rating', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const assignCookMutation = useMutation({
    mutationFn: async ({ orderId, cookId }: { orderId: string; cookId: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          assigned_cook_id: cookId,
          cook_assigned_at: new Date().toISOString(),
          cook_assignment_status: 'pending'
        })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indoor-events-cook-assignment'] });
      toast({ title: 'Cook assigned successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to assign cook', description: err.message, variant: 'destructive' });
    },
  });

  const handleAssign = (orderId: string) => {
    const cookId = selectedCooks[orderId];
    if (!cookId) {
      toast({ title: 'Select a cook first', variant: 'destructive' });
      return;
    }
    assignCookMutation.mutate({ orderId, cookId });
  };

  const isLoading = ordersLoading || cooksLoading;

  return (
    <IndoorEventsShell title="Cook Assignment">
      {/* Available Cooks Summary */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Available Cooks ({cooks?.filter(c => c.is_available).length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {cooks?.filter(c => c.is_available).slice(0, 5).map((cook: any) => (
              <Badge key={cook.id} variant="outline" className="text-xs">
                {cook.kitchen_name} ({(cook.panchayat as any)?.name || 'N/A'})
              </Badge>
            ))}
            {(cooks?.filter(c => c.is_available).length || 0) > 5 && (
              <Badge variant="secondary" className="text-xs">+{cooks!.filter(c => c.is_available).length - 5} more</Badge>
            )}
            {cooks?.filter(c => c.is_available).length === 0 && (
              <span className="text-sm text-muted-foreground">No available cooks</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders needing cook */}
      <h3 className="text-sm font-medium mb-3">Orders Needing Cook Assignment</h3>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : ordersNeedingCook?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
            All confirmed orders have cooks assigned
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ordersNeedingCook?.map((order: any) => (
            <Card key={order.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-medium">{order.order_number}</p>
                    <p className="text-sm">{order.profile?.name}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{order.status}</Badge>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {order.event_date ? format(new Date(order.event_date), 'dd MMM yyyy') : 'No date'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {order.guest_count || '?'} guests
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Ward {order.ward_number}, {order.panchayat?.name}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Select
                    value={selectedCooks[order.id] || ''}
                    onValueChange={(v) => setSelectedCooks(prev => ({ ...prev, [order.id]: v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select cook..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cooks?.filter(c => c.is_available).map((cook: any) => (
                        <SelectItem key={cook.id} value={cook.id}>
                          {cook.kitchen_name} • ⭐{cook.rating || 0} • {(cook.panchayat as any)?.name || 'N/A'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => handleAssign(order.id)}
                    disabled={!selectedCooks[order.id] || assignCookMutation.isPending}
                  >
                    Assign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </IndoorEventsShell>
  );
};

export default IndoorEventsCooks;
