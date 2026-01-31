import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import IndoorEventsShell from './IndoorEventsShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Users, Calendar, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const IndoorEventsPlanning: React.FC = () => {
  const navigate = useNavigate();

  // Get pending indoor_events orders (planning requests awaiting review)
  const { data: requests, isLoading } = useQuery({
    queryKey: ['indoor-events-planning'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, guest_count, event_date, 
          event_details, delivery_address, order_type, created_at,
          panchayat_id, ward_number,
          event_type:event_types(id, name, icon),
          panchayat:panchayats(name),
          profile:profiles!orders_customer_id_fkey(name, mobile_number)
        `)
        .eq('service_type', 'indoor_events')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <IndoorEventsShell title="Planning Requests">
      <Card className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-200">
          <strong>Info:</strong> These are new requests awaiting admin review and quotation. Click on a request to view details and update status in the Orders section.
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : requests?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            No pending planning requests
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests?.map((req: any) => (
            <Card
              key={req.id}
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-indoor-events/50"
              onClick={() => navigate('/admin/indoor-events/orders')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm">{req.order_number}</span>
                      <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                        New Request
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{req.profile?.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {req.event_date ? format(new Date(req.event_date), 'dd MMM') : 'No date'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {req.guest_count || '?'} guests
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {req.profile?.mobile_number}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{req.event_type?.icon} {req.event_type?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      {req.order_type === 'full_event' ? 'Full Planning' : 'Quick Booking'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </IndoorEventsShell>
  );
};

export default IndoorEventsPlanning;
