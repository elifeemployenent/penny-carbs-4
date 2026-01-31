import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import IndoorEventsShell from './IndoorEventsShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, Users, Calendar, MapPin } from 'lucide-react';

const IndoorEventsReports: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['indoor-events-reports', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, guest_count, event_date, created_at,
          panchayat_id, ward_number,
          panchayat:panchayats(name)
        `)
        .eq('service_type', 'indoor_events');

      if (dateRange !== 'all') {
        const daysAgo = dateRange === '7d' ? 7 : 30;
        const startDate = startOfDay(subDays(new Date(), daysAgo)).toISOString();
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const stats = {
    totalOrders: reportData?.length || 0,
    totalRevenue: reportData?.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
    totalGuests: reportData?.reduce((sum, o) => sum + (o.guest_count || 0), 0) || 0,
    completedOrders: reportData?.filter(o => o.status === 'delivered').length || 0,
    pendingOrders: reportData?.filter(o => o.status === 'pending').length || 0,
    cancelledOrders: reportData?.filter(o => o.status === 'cancelled').length || 0,
  };

  // Group by panchayat
  const byPanchayat = reportData?.reduce((acc: any, order: any) => {
    const name = order.panchayat?.name || 'Unknown';
    if (!acc[name]) {
      acc[name] = { count: 0, revenue: 0, guests: 0 };
    }
    acc[name].count++;
    if (order.status === 'delivered') {
      acc[name].revenue += order.total_amount || 0;
    }
    acc[name].guests += order.guest_count || 0;
    return acc;
  }, {} as Record<string, { count: number; revenue: number; guests: number }>) || {};

  const panchayatData = Object.entries(byPanchayat)
    .sort((a: any, b: any) => b[1].revenue - a[1].revenue)
    .slice(0, 10);

  return (
    <IndoorEventsShell title="Event Reports">
      {/* Date Filter */}
      <div className="flex gap-2 mb-6">
        <Button
          size="sm"
          variant={dateRange === '7d' ? 'default' : 'outline'}
          onClick={() => setDateRange('7d')}
        >
          Last 7 Days
        </Button>
        <Button
          size="sm"
          variant={dateRange === '30d' ? 'default' : 'outline'}
          onClick={() => setDateRange('30d')}
        >
          Last 30 Days
        </Button>
        <Button
          size="sm"
          variant={dateRange === 'all' ? 'default' : 'outline'}
          onClick={() => setDateRange('all')}
        >
          All Time
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-indoor-events" />
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-2xl font-bold">{stats.totalGuests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Guests</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <p className="text-2xl font-bold">{stats.completedOrders}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Pending: {stats.pendingOrders}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Completed: {stats.completedOrders}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Cancelled: {stats.cancelledOrders}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* By Panchayat */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Revenue by Panchayat (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {panchayatData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available</p>
              ) : (
                <div className="space-y-2">
                  {panchayatData.map(([name, data]: any) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">{data.count} orders • {data.guests} guests</p>
                      </div>
                      <p className="font-bold text-indoor-events">₹{data.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </IndoorEventsShell>
  );
};

export default IndoorEventsReports;
