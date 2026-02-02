import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calculator, Users, UtensilsCrossed, Plus, Minus, X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FoodItem {
  id: string;
  name: string;
  price: number;
  is_vegetarian: boolean;
  serves_persons: number | null;
  category_id: string | null;
  category?: {
    id: string;
    name: string;
  };
}

interface SelectedItem {
  item: FoodItem;
  requiredQuantity: number;
}

interface FoodQuantityCalculatorProps {
  serviceType: 'indoor_events' | 'cloud_kitchen';
  triggerClassName?: string;
}

const FoodQuantityCalculator: React.FC<FoodQuantityCalculatorProps> = ({
  serviceType,
  triggerClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [guestCount, setGuestCount] = useState<number>(50);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch food items with serves_persons field
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['food-items-with-serves', serviceType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_items')
        .select(`
          id,
          name,
          price,
          is_vegetarian,
          serves_persons,
          category_id,
          food_categories!category_id (
            id,
            name
          )
        `)
        .eq('service_type', serviceType)
        .eq('is_available', true)
        .not('serves_persons', 'is', null)
        .order('name');

      if (error) throw error;
      
      return data.map(item => ({
        ...item,
        category: item.food_categories,
      })) as FoodItem[];
    },
    enabled: isOpen,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['food-categories', serviceType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_categories')
        .select('*')
        .eq('is_active', true)
        .or(`service_type.eq.${serviceType},service_types.cs.{${serviceType}}`)
        .order('display_order');

      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  // Calculate required quantity
  const calculateRequiredQuantity = (servesPersons: number, guests: number): number => {
    return Math.ceil(guests / servesPersons);
  };

  // Add item to selection
  const handleAddItem = (item: FoodItem) => {
    if (!item.serves_persons) return;
    
    const requiredQuantity = calculateRequiredQuantity(item.serves_persons, guestCount);
    const newItems = new Map(selectedItems);
    newItems.set(item.id, { item, requiredQuantity });
    setSelectedItems(newItems);
  };

  // Remove item from selection
  const handleRemoveItem = (itemId: string) => {
    const newItems = new Map(selectedItems);
    newItems.delete(itemId);
    setSelectedItems(newItems);
  };

  // Adjust quantity manually
  const handleAdjustQuantity = (itemId: string, delta: number) => {
    const selected = selectedItems.get(itemId);
    if (!selected) return;
    
    const newQuantity = Math.max(1, selected.requiredQuantity + delta);
    const newItems = new Map(selectedItems);
    newItems.set(itemId, { ...selected, requiredQuantity: newQuantity });
    setSelectedItems(newItems);
  };

  // Recalculate all quantities when guest count changes
  const handleGuestCountChange = (newCount: number) => {
    setGuestCount(newCount);
    
    const newItems = new Map<string, SelectedItem>();
    selectedItems.forEach((selected, itemId) => {
      if (selected.item.serves_persons) {
        const requiredQuantity = calculateRequiredQuantity(selected.item.serves_persons, newCount);
        newItems.set(itemId, { item: selected.item, requiredQuantity });
      }
    });
    setSelectedItems(newItems);
  };

  // Calculate totals
  const totalCost = useMemo(() => {
    let total = 0;
    selectedItems.forEach(({ item, requiredQuantity }) => {
      total += item.price * requiredQuantity;
    });
    return total;
  }, [selectedItems]);

  const serviceLabel = serviceType === 'indoor_events' ? 'Indoor Events' : 'Cloud Kitchen';
  const themeColor = serviceType === 'indoor_events' ? 'indoor-events' : 'cloud-kitchen';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          <Calculator className="h-4 w-4 mr-2" />
          Food Quantity Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Food Quantity Calculator - {serviceLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
          {/* Left Panel - Item Selection */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Guest Count */}
            <Card className={`mb-4 border-${themeColor}/30`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Users className={`h-8 w-8 text-${themeColor}`} />
                  <div className="flex-1">
                    <Label htmlFor="guestCount" className="text-sm font-medium">
                      Number of Guests
                    </Label>
                    <Input
                      id="guestCount"
                      type="number"
                      min={1}
                      value={guestCount}
                      onChange={(e) => handleGuestCountChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search & Filter */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Available Items */}
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-2">
                {itemsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {items?.length === 0
                        ? 'No items with serving info configured'
                        : 'No items match your search'}
                    </p>
                    <p className="text-xs mt-1">
                      Add "Serves X persons" to items in Admin → Items
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-all ${
                          isSelected ? `border-${themeColor} bg-${themeColor}/5` : 'hover:border-muted-foreground/30'
                        }`}
                        onClick={() => !isSelected && handleAddItem(item)}
                      >
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {item.is_vegetarian && (
                                <Badge variant="outline" className="text-success border-success text-xs">
                                  Veg
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ₹{item.price}/unit • Serves {item.serves_persons} persons
                            </div>
                          </div>
                          {isSelected ? (
                            <Badge className={`bg-${themeColor}`}>Added</Badge>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Calculation Results */}
          <div className="lg:w-80 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Required Quantities
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {selectedItems.size === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                    <div>
                      <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select items to calculate quantities</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="flex-1 -mx-4 px-4">
                      <div className="space-y-3">
                        {Array.from(selectedItems.values()).map(({ item, requiredQuantity }) => (
                          <div key={item.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  1 unit serves {item.serves_persons} persons
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => handleAdjustQuantity(item.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className={`text-lg font-bold text-${themeColor} min-w-[2rem] text-center`}>
                                  {requiredQuantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => handleAdjustQuantity(item.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-medium">
                                ₹{(item.price * requiredQuantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Summary */}
                    <div className={`mt-4 pt-4 border-t border-${themeColor}/30`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">For {guestCount} guests</span>
                        <span className="text-sm">{selectedItems.size} items</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Estimated Total</span>
                        <span className={`text-xl font-bold text-${themeColor}`}>
                          ₹{totalCost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FoodQuantityCalculator;
