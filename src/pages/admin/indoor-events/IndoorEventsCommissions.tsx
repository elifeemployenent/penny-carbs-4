import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import IndoorEventsShell from './IndoorEventsShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Percent, DollarSign, Clock, CheckCircle } from 'lucide-react';

const IndoorEventsCommissions: React.FC = () => {
  // Get referrals for indoor_events orders
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['indoor-events-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id, commission_percent, commission_amount, status, created_at, paid_at,
          order:orders(
            id, order_number, service_type, total_amount, event_date,
            profile:profiles!orders_customer_id_fkey(name)
          ),
          referrer:profiles!referrals_referrer_id_fkey(name, mobile_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Filter for indoor_events orders
      return data.filter((r: any) => r.order?.service_type === 'indoor_events');
    },
  });

  const totals = {
    pending: referrals?.filter((r: any) => r.status === 'pending').reduce((sum, r: any) => sum + r.commission_amount, 0) || 0,
    approved: referrals?.filter((r: any) => r.status === 'approved').reduce((sum, r: any) => sum + r.commission_amount, 0) || 0,
    paid: referrals?.filter((r: any) => r.status === 'paid').reduce((sum, r: any) => sum + r.commission_amount, 0) || 0,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    approved: 'bg-blue-500',
    paid: 'bg-green-500',
  };

  return (
    <IndoorEventsShell title="Commission Tracking">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
            <p className="text-lg font-bold text-yellow-600">₹{totals.pending.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-blue-600">₹{totals.approved.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-green-600">₹{totals.paid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : referrals?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Percent className="h-12 w-12 mx-auto mb-3 opacity-50" />
            No commissions tracked yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {referrals?.map((ref: any) => (
            <Card key={ref.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm">{ref.order?.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Referrer: {ref.referrer?.name || 'Unknown'} ({ref.referrer?.mobile_number})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Customer: {ref.order?.profile?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs capitalize">
                      <span className={`mr-1.5 h-2 w-2 rounded-full ${statusColors[ref.status]}`} />
                      {ref.status}
                    </Badge>
                    <p className="font-bold text-indoor-events mt-1">₹{ref.commission_amount?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{ref.commission_percent}%</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Order: ₹{ref.order?.total_amount?.toLocaleString()} • {ref.order?.event_date ? format(new Date(ref.order.event_date), 'dd MMM yyyy') : ''}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </IndoorEventsShell>
  );
};

export default IndoorEventsCommissions;
