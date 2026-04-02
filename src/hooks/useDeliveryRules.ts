import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryRule {
  id: string;
  service_type: string;
  rule_name: string;
  min_delivery_charge: number;
  free_delivery_above: number | null;
  per_km_charge: number | null;
  max_delivery_charge: number | null;
  charge_above_threshold: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryRuleInput {
  service_type: string;
  rule_name: string;
  min_delivery_charge: number;
  free_delivery_above?: number | null;
  per_km_charge?: number | null;
  max_delivery_charge?: number | null;
  charge_above_threshold?: number | null;
  is_active?: boolean;
}

export const useDeliveryRules = (serviceType?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rules, isLoading, error } = useQuery({
    queryKey: ['delivery-rules', serviceType],
    queryFn: async () => {
      let query = supabase
        .from('delivery_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DeliveryRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: DeliveryRuleInput) => {
      const { data, error } = await supabase
        .from('delivery_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-rules'] });
      toast({ title: 'Rule Created', description: 'Delivery rule has been created successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('delivery_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-rules'] });
      toast({ title: 'Rule Updated', description: 'Delivery rule has been updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('delivery_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-rules'] });
      toast({ title: 'Rule Deleted', description: 'Delivery rule has been deleted successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return { rules, isLoading, error, createRule, updateRule, deleteRule };
};
