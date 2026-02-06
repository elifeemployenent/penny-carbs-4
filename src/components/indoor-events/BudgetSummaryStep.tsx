import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UtensilsCrossed, Sparkles, Users, AlertCircle } from 'lucide-react';
import type { PlannerData } from '@/pages/IndoorEventsPlanner';

interface BudgetSummaryStepProps {
  plannerData: PlannerData;
  totals: {
    foodTotal: number;
    serviceTotal: number;
    grandTotal: number;
    perPersonCost: number;
  };
  onNext: () => void;
  onBack: () => void;
}

const BudgetSummaryStep: React.FC<BudgetSummaryStepProps> = ({
  plannerData,
  totals,
  onNext,
  onBack,
}) => {
  const enabledServices = plannerData.selectedServices.filter((s) => s.enabled);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-display font-bold">Budget Summary</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your estimated costs
        </p>
      </div>

      {/* Event Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{plannerData.eventType?.icon || '🎉'}</span>
            <div>
              <h3 className="font-semibold">{plannerData.eventType?.name || 'Event'}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {plannerData.guestCount} guests
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-indoor-events" />
            Food Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {plannerData.selectedFoods.length > 0 ? (
            <>
              {plannerData.selectedFoods.map((food) => (
                <div key={food.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {food.name} × {food.quantity}
                  </span>
                  <span className="font-medium">
                    ₹{(food.price * food.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Food Total</span>
                <span className="text-indoor-events">
                  ₹{totals.foodTotal.toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No food items selected</p>
          )}
        </CardContent>
      </Card>

      {/* Services Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indoor-events" />
            Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {enabledServices.length > 0 ? (
            <>
              {enabledServices.map((service) => {
                const servicePrice = service.priceType === 'per_guest'
                  ? service.price * plannerData.guestCount
                  : service.price;
                return (
                  <div key={service.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {service.name}
                      {service.priceType === 'per_guest' && ` (₹${service.price}/guest)`}
                    </span>
                    <span className="font-medium">
                      ₹{servicePrice.toLocaleString()}
                    </span>
                  </div>
                );
              })}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Service Total</span>
                <span className="text-indoor-events">
                  ₹{totals.serviceTotal.toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No services selected</p>
          )}
        </CardContent>
      </Card>

      {/* Grand Total */}
      <Card className="bg-indoor-events text-white">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Estimated Grand Total</span>
            <span className="text-2xl font-bold">
              ₹{totals.grandTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-white/80">
            <span className="text-sm">Cost Per Person</span>
            <Badge variant="secondary" className="bg-white/20 text-white">
              ₹{Math.round(totals.perPersonCost).toLocaleString()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              This is an estimated budget
            </p>
            <p className="text-amber-700 dark:text-amber-300">
              Final confirmation after admin review. Prices may vary based on availability and customizations.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          className="flex-1 bg-indoor-events hover:bg-indoor-events/90"
          onClick={onNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default BudgetSummaryStep;
