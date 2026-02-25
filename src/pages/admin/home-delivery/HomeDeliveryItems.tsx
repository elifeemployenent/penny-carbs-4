import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Leaf, Clock, UtensilsCrossed, Edit2 } from 'lucide-react';
import { useHomeDeliveryItems, useToggleHomeDeliveryItem, useToggleComingSoon, useUpdateHomeDeliveryItemSet, type HomeDeliveryItem } from '@/hooks/useHomeDeliveryItems';
import { Skeleton } from '@/components/ui/skeleton';

interface HomeDeliveryItemsProps {
  onBack: () => void;
}

const HomeDeliveryItems: React.FC<HomeDeliveryItemsProps> = ({ onBack }) => {
  const { data: items, isLoading } = useHomeDeliveryItems();
  const toggleItem = useToggleHomeDeliveryItem();
  const toggleComingSoon = useToggleComingSoon();
  const updateItemSet = useUpdateHomeDeliveryItemSet();

  const [editItemOpen, setEditItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HomeDeliveryItem | null>(null);
  const [setSize, setSetSize] = useState(1);
  const [minOrderSets, setMinOrderSets] = useState(1);

  const availableCount = items?.filter(i => i.is_available).length || 0;
  const totalCount = items?.length || 0;

  const openEditDialog = (item: HomeDeliveryItem) => {
    setSelectedItem(item);
    setSetSize(item.set_size || 1);
    setMinOrderSets(item.min_order_sets || 1);
    setEditItemOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;
    await updateItemSet.mutateAsync({
      itemId: selectedItem.id,
      setSize,
      minOrderSets,
    });
    setEditItemOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">Home Delivery Items</h2>
          <p className="text-sm text-muted-foreground">
            {availableCount} available / {totalCount} total items
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{availableCount}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{totalCount - availableCount}</p>
            <p className="text-xs text-muted-foreground">Unavailable</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Homemade Food Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : items?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No homemade items found. Add items from Admin → Items with service type "Homemade".
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Set Size</TableHead>
                    <TableHead>Min Sets</TableHead>
                    <TableHead>Prep Time</TableHead>
                    <TableHead className="text-right">Coming Soon</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.images?.[0]?.image_url && (
                            <img
                              src={item.images[0].image_url}
                              alt={item.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-1">
                              {item.is_vegetarian && (
                                <Leaf className="h-3 w-3 text-green-600" />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.category_name ? (
                          <Badge variant="secondary" className="text-xs">
                            {item.category_name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">₹{item.price}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.set_size || 1} pcs/set</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.min_order_sets || 1} sets min</Badge>
                      </TableCell>
                      <TableCell>
                        {item.preparation_time_minutes ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {item.preparation_time_minutes}m
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={item.is_coming_soon_home_delivery}
                          onCheckedChange={(checked) =>
                            toggleComingSoon.mutate({ itemId: item.id, isComingSoon: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={(checked) =>
                            toggleItem.mutate({ itemId: item.id, isAvailable: checked })
                          }
                          disabled={item.is_coming_soon_home_delivery}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>ℹ️ Tip:</strong> To add new homemade items, go to Admin → Items and create items 
            with service type "Homemade". They will automatically appear here.
          </p>
        </CardContent>
      </Card>

      {/* Edit Set Configuration Dialog */}
      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Set Configuration - {selectedItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Set Size (pieces per set)</Label>
              <Input
                type="number"
                min="1"
                value={setSize}
                onChange={(e) => setSetSize(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                e.g., 5 samosas per set
              </p>
            </div>

            <div className="space-y-2">
              <Label>Minimum Order Sets</Label>
              <Input
                type="number"
                min="1"
                value={minOrderSets}
                onChange={(e) => setMinOrderSets(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                e.g., minimum 3 sets required
              </p>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium">
                Customer will order minimum: {setSize * minOrderSets} pieces
              </p>
              <p className="text-sm text-muted-foreground">
                ({minOrderSets} sets × {setSize} pieces/set)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItemOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} disabled={updateItemSet.isPending}>
              {updateItemSet.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeDeliveryItems;
