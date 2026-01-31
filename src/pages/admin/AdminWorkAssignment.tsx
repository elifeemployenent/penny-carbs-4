import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, ChefHat, Truck, ClipboardList, Loader2 } from 'lucide-react';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { format } from 'date-fns';

const AdminWorkAssignment: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  // Fetch pending orders (not yet assigned)
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-assignment', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          panchayats(name)
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'pending') {
        query = query.is('assigned_cook_id', null).not('status', 'eq', 'cancelled');
      } else if (activeTab === 'cook-assigned') {
        query = query.not('assigned_cook_id', 'is', null).is('assigned_delivery_id', null).not('status', 'eq', 'cancelled');
      } else {
        query = query.not('assigned_cook_id', 'is', null).not('assigned_delivery_id', 'is', null);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch available cooks
  const { data: cooks } = useQuery({
    queryKey: ['available-cooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cooks')
        .select('id, kitchen_name, mobile_number, panchayat_id')
        .eq('is_active', true)
        .eq('is_available', true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch available delivery staff
  const { data: deliveryStaff } = useQuery({
    queryKey: ['available-delivery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_staff')
        .select('id, name, mobile_number, panchayat_id')
        .eq('is_active', true)
        .eq('is_approved', true)
        .eq('is_available', true);
      if (error) throw error;
      return data;
    },
  });

  const assignCook = async (orderId: string, cookId: string) => {
    setAssigningOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          assigned_cook_id: cookId,
          cook_assigned_at: new Date().toISOString(),
          cook_assignment_status: 'pending',
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({ title: 'Cook Assigned', description: 'Order assigned to cook successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-assignment'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setAssigningOrderId(null);
    }
  };

  const assignDelivery = async (orderId: string, deliveryId: string) => {
    setAssigningOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          assigned_delivery_id: deliveryId,
          delivery_status: 'assigned',
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({ title: 'Delivery Assigned', description: 'Delivery staff assigned successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-assignment'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setAssigningOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      confirmed: 'default',
      preparing: 'default',
      ready: 'default',
      out_for_delivery: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <main className="p-4">
        <div className="mb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Work Assignment
            </h1>
            <p className="text-sm text-muted-foreground">Assign cooks and delivery staff to orders</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Unassigned
            </TabsTrigger>
            <TabsTrigger value="cook-assigned">
              Needs Delivery
            </TabsTrigger>
            <TabsTrigger value="assigned">
              Fully Assigned
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'pending' && 'Orders Awaiting Cook Assignment'}
                  {activeTab === 'cook-assigned' && 'Orders Awaiting Delivery Assignment'}
                  {activeTab === 'assigned' && 'Fully Assigned Orders'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assign Cook</TableHead>
                          <TableHead>Assign Delivery</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.order_number}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(order.created_at), 'dd MMM, HH:mm')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.service_type.replace('_', ' ')}</Badge>
                            </TableCell>
                            <TableCell>₹{order.total_amount}</TableCell>
                            <TableCell>
                              {order.panchayats?.name || '-'}
                              <div className="text-xs text-muted-foreground">Ward {order.ward_number}</div>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>
                              {order.assigned_cook_id ? (
                                <Badge variant="default" className="gap-1">
                                  <ChefHat className="h-3 w-3" />
                                  Assigned
                                </Badge>
                              ) : (
                                <Select
                                  onValueChange={(cookId) => assignCook(order.id, cookId)}
                                  disabled={assigningOrderId === order.id}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select cook" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover">
                                    {cooks?.map((cook) => (
                                      <SelectItem key={cook.id} value={cook.id}>
                                        {cook.kitchen_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                            <TableCell>
                              {order.assigned_delivery_id ? (
                                <Badge variant="default" className="gap-1">
                                  <Truck className="h-3 w-3" />
                                  Assigned
                                </Badge>
                              ) : (
                                <Select
                                  onValueChange={(deliveryId) => assignDelivery(order.id, deliveryId)}
                                  disabled={assigningOrderId === order.id || !order.assigned_cook_id}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder={order.assigned_cook_id ? "Select delivery" : "Assign cook first"} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover">
                                    {deliveryStaff?.map((staff) => (
                                      <SelectItem key={staff.id} value={staff.id}>
                                        {staff.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <ClipboardList className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>No orders in this category</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminWorkAssignment;
