import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  ChefHat,
  Clock,
  ShoppingBag,
  Users,
  Truck,
  BarChart3,
  Settings,
  UtensilsCrossed,
  Timer
} from 'lucide-react';
import FoodQuantityCalculator from '@/components/admin/FoodQuantityCalculator';

const CloudKitchenModule: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const isAdmin = role === 'super_admin' || role === 'admin';

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['cloud-kitchen-stats'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, status, cook_status, total_amount, created_at')
        .eq('service_type', 'cloud_kitchen');

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders?.filter(o => o.created_at.startsWith(today)) || [];

      const newOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const cooking = orders?.filter(o => o.cook_status === 'preparing').length || 0;
      const ready = orders?.filter(o => o.status === 'ready').length || 0;
      const todayRevenue = todayOrders.filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      return { newOrders, cooking, ready, todayOrders: todayOrders.length, todayRevenue };
    },
    enabled: isAdmin
  });

  // Fetch slots
  const { data: slots } = useQuery({
    queryKey: ['cloud-kitchen-slots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cloud_kitchen_slots')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Settings className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
        <Button className="mt-6" onClick={() => navigate('/admin')}>
          Go Back
        </Button>
      </div>
    );
  }

  const menuItems = [
    { 
      icon: Clock, 
      label: 'Time Slot Management', 
      path: '/admin/cloud-kitchen/slots',
      description: 'Configure meal slots & cut-off times'
    },
    { 
      icon: UtensilsCrossed, 
      label: 'Menu Control', 
      path: '/admin/cloud-kitchen/menu',
      description: 'Manage slot-wise menu items'
    },
    { 
      icon: ShoppingBag, 
      label: 'Live Orders', 
      path: '/admin/cloud-kitchen/orders',
      description: 'View & manage active orders',
      badge: stats?.newOrders,
      badgeVariant: 'destructive' as const
    },
    { 
      icon: ChefHat, 
      label: 'Cook Assignment', 
      path: '/admin/cloud-kitchen/cooks',
      description: 'Auto/manual cook assignment'
    },
    { 
      icon: Truck, 
      label: 'Delivery Assignment', 
      path: '/admin/cloud-kitchen/delivery',
      description: 'Assign delivery staff'
    },
    { 
      icon: BarChart3, 
      label: 'Sales Reports', 
      path: '/admin/cloud-kitchen/reports',
      description: 'Panchayat & ward-wise reports'
    },
  ];

  const statusFlow = [
    { label: 'New', color: 'bg-yellow-500' },
    { label: 'Accepted', color: 'bg-blue-500' },
    { label: 'Cooking', color: 'bg-orange-500' },
    { label: 'Ready', color: 'bg-purple-500' },
    { label: 'Out for Delivery', color: 'bg-indigo-500' },
    { label: 'Delivered', color: 'bg-green-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-cloud-kitchen text-white">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <ChefHat className="h-6 w-6" />
            <h1 className="font-display text-lg font-semibold">Cloud Kitchen</h1>
          </div>
          <FoodQuantityCalculator 
            serviceType="cloud_kitchen" 
            triggerClassName="text-white border-white/30 hover:bg-white/20 hover:text-white"
          />
        </div>
      </header>

      <main className="p-4 pb-20">
        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats?.newOrders || 0}</p>
              <p className="text-xs text-muted-foreground">New Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats?.cooking || 0}</p>
              <p className="text-xs text-muted-foreground">Cooking</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.ready || 0}</p>
              <p className="text-xs text-muted-foreground">Ready</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">₹{stats?.todayRevenue?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">Today's Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Slots */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Active Time Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {slots?.map((slot) => (
                <Badge key={slot.id} variant="outline" className="flex items-center gap-1">
                  <span className="capitalize">{slot.slot_type.replace('_', ' ')}</span>
                  <span className="text-muted-foreground">
                    ({slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)})
                  </span>
                </Badge>
              ))}
              {(!slots || slots.length === 0) && (
                <span className="text-sm text-muted-foreground">No active slots configured</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Flow */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Order Status Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusFlow.map((status, index) => (
                <div key={status.label} className="flex items-center gap-1">
                  <span className={`h-3 w-3 rounded-full ${status.color}`} />
                  <span className="text-xs">{status.label}</span>
                  {index < statusFlow.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <Card 
              key={item.path}
              className="cursor-pointer transition-all hover:shadow-md hover:border-cloud-kitchen/50"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-xl bg-cloud-kitchen/10 p-3 text-cloud-kitchen">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{item.label}</h4>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant={item.badgeVariant || 'secondary'} className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CloudKitchenModule;
