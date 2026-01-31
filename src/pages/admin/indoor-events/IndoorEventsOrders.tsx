import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import IndoorEventsShell from './IndoorEventsShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Search, Calendar, Users, MapPin, Phone, ChefHat } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface IndoorEventOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  guest_count: number | null;
  event_date: string | null;
  event_details: string | null;
  delivery_address: string | null;
  order_type: string | null;
  created_at: string;
  customer_id: string;
  panchayat_id: string;
  ward_number: number;
  assigned_cook_id: string | null;
  event_type: { id: string; name: string; icon: string } | null;
  panchayat: { name: string } | null;
  profile: { name: string; mobile_number: string } | null;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  preparing: 'bg-orange-500',
  ready: 'bg-purple-500',
  out_for_delivery: 'bg-indigo-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-destructive',
};

const IndoorEventsOrders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<IndoorEventOrder | null>(null);

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['indoor-events-orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, guest_count, event_date, 
          event_details, delivery_address, order_type, created_at, customer_id,
          panchayat_id, ward_number, assigned_cook_id,
          event_type:event_types(id, name, icon),
          panchayat:panchayats(name),
          profile:profiles!orders_customer_id_fkey(name, mobile_number)
        `)
        .eq('service_type', 'indoor_events')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as OrderStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as IndoorEventOrder[];
    },
  });

  const filteredOrders = orders?.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(s) ||
      o.profile?.name?.toLowerCase().includes(s) ||
      o.profile?.mobile_number?.includes(s)
    );
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      refetch();
      setSelectedOrder(null);
    }
  };

  return (
    <IndoorEventsShell title="All Event Bookings">
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order #, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredOrders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No event bookings found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders?.map((order) => (
            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedOrder(order)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium">{order.order_number}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        <span className={`mr-1.5 h-2 w-2 rounded-full ${statusColors[order.status]}`} />
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{order.profile?.name || 'Unknown'}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
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
                        Ward {order.ward_number}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-indoor-events">₹{order.total_amount?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">{order.event_type?.icon} {order.event_type?.name || 'Event'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono">{selectedOrder.order_number}</span>
                  <Badge variant="outline" className="capitalize">
                    <span className={`mr-1.5 h-2 w-2 rounded-full ${statusColors[selectedOrder.status]}`} />
                    {selectedOrder.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.event_type?.icon} {selectedOrder.event_type?.name || 'Event'} • {selectedOrder.order_type === 'full_event' ? 'Full Planning' : 'Quick Booking'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Customer Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Customer</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p className="font-medium">{selectedOrder.profile?.name}</p>
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {selectedOrder.profile?.mobile_number}
                    </p>
                  </CardContent>
                </Card>

                {/* Event Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p>{selectedOrder.event_date ? format(new Date(selectedOrder.event_date), 'PPP') : 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Guests</p>
                        <p>{selectedOrder.guest_count || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p>Ward {selectedOrder.ward_number}, {selectedOrder.panchayat?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Venue Address</p>
                      <p>{selectedOrder.delivery_address || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Details / Planning Info */}
                {selectedOrder.event_details && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Planning Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-lg overflow-x-auto">
                        {selectedOrder.event_details}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {/* Amount */}
                <Card className="bg-indoor-events/5 border-indoor-events/20">
                  <CardContent className="py-4 flex items-center justify-between">
                    <span className="font-medium">Total Amount</span>
                    <span className="text-xl font-bold text-indoor-events">
                      ₹{selectedOrder.total_amount?.toLocaleString() || 0}
                    </span>
                  </CardContent>
                </Card>

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'pending' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}>
                      Confirm Order
                    </Button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}>
                      Start Preparing
                    </Button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}>
                      Mark Delivered
                    </Button>
                  )}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </IndoorEventsShell>
  );
};

export default IndoorEventsOrders;
