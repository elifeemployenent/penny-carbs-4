import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface HomeDeliveryItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_vegetarian: boolean;
  is_available: boolean;
  is_coming_soon_home_delivery: boolean;
  preparation_time_minutes: number | null;
  category_id: string | null;
  category_name?: string;
  set_size: number | null;
  min_order_sets: number | null;
  images: {
    id: string;
    image_url: string;
    is_primary: boolean;
  }[];
}

export function useHomeDeliveryItems() {
  return useQuery({
    queryKey: ['home-delivery-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_items')
        .select(`
          id,
          name,
          description,
          price,
          is_vegetarian,
          is_available,
          is_coming_soon_home_delivery,
          preparation_time_minutes,
          category_id,
          set_size,
          min_order_sets,
          food_categories!food_items_category_id_fkey(name),
          images:food_item_images(id, image_url, is_primary)
        `)
        .or('service_types.cs.{homemade},service_type.eq.homemade')
        .order('name');

      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        category_name: item.food_categories?.name || null,
      })) as HomeDeliveryItem[];
    },
  });
}

export function useAvailableHomemadeItems() {
  return useQuery({
    queryKey: ['available-homemade-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_items')
        .select(`
          id,
          name,
          description,
          price,
          is_vegetarian,
          is_available,
          preparation_time_minutes,
          category_id,
          service_types,
          images:food_item_images(id, image_url, is_primary)
        `)
        .eq('is_available', true)
        .or('service_types.cs.{homemade},service_type.eq.homemade')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useToggleHomeDeliveryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
      const { error } = await supabase
        .from('food_items')
        .update({ is_available: isAvailable } as any)
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-delivery-items'] });
      toast({ title: 'Item availability updated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useToggleComingSoon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isComingSoon }: { itemId: string; isComingSoon: boolean }) => {
      const { error } = await supabase
        .from('food_items')
        .update({ is_coming_soon_home_delivery: isComingSoon } as any)
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-delivery-items'] });
      toast({ title: 'Coming Soon status updated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateHomeDeliveryItemSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      setSize,
      minOrderSets,
    }: {
      itemId: string;
      setSize: number;
      minOrderSets: number;
    }) => {
      const { error } = await supabase
        .from('food_items')
        .update({ set_size: setSize, min_order_sets: minOrderSets })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-delivery-items'] });
      toast({ title: 'Set configuration updated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update set configuration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
