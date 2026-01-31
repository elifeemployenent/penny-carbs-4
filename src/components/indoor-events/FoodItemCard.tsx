import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Leaf } from 'lucide-react';
import type { FoodItem } from '@/hooks/useIndoorEventItems';

interface FoodItemCardProps {
  item: FoodItem;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, quantity, onQuantityChange }) => {
  const primaryImage = item.images?.find(img => img.is_primary)?.image_url || 
                       item.images?.[0]?.image_url;

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl">
              🍽️
            </div>
          )}
          {item.is_vegetarian && (
            <div className="absolute top-1 left-1 h-5 w-5 rounded bg-success flex items-center justify-center">
              <Leaf className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
              {item.category && (
                <Badge variant="secondary" className="text-[10px] mt-0.5">
                  {item.category.name}
                </Badge>
              )}
            </div>
            <span className="text-sm font-semibold text-indoor-events whitespace-nowrap">
              ₹{item.price}
            </span>
          </div>
          
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center justify-end gap-2 mt-2">
            {quantity > 0 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onQuantityChange(quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onQuantityChange(quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-indoor-events text-indoor-events hover:bg-indoor-events/10"
                onClick={() => onQuantityChange(1)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FoodItemCard;
