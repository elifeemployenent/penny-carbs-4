import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, CalendarDays, Users, MapPin, Phone, Zap, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventTypeSelector from '@/components/events/EventTypeSelector';
import QuickBookingFoodSelection from '@/components/indoor-events/QuickBookingFoodSelection';
import BottomNav from '@/components/customer/BottomNav';
import type { EventType } from '@/types/events';
import type { FoodItem } from '@/hooks/useIndoorEventItems';

interface SelectedItem {
  item: FoodItem;
  quantity: number;
}

const IndoorEventsQuickBooking: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { selectedPanchayat, selectedWardNumber } = useLocation();

  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [eventTime, setEventTime] = useState('');
  const [guestCount, setGuestCount] = useState<number>(50);
  const [contactNumber, setContactNumber] = useState(profile?.mobile_number || '');
  const [eventDetails, setEventDetails] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const minDate = addDays(startOfDay(new Date()), 1);

  // Calculate totals from selected items
  const totalItemsCount = Array.from(selectedItems.values()).reduce((sum, { quantity }) => sum + quantity, 0);
  const estimatedTotal = Array.from(selectedItems.values()).reduce(
    (sum, { item, quantity }) => sum + (item.price * quantity), 
    0
  );

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to submit a booking request",
        variant: "destructive",
      });
      navigate('/customer-auth');
      return;
    }

    if (!selectedEventType) {
      toast({
        title: "Event Type Required",
        description: "Please select an event type",
        variant: "destructive",
      });
      return;
    }

    if (!eventDate) {
      toast({
        title: "Date Required",
        description: "Please select an event date",
        variant: "destructive",
      });
      return;
    }

    if (isBefore(eventDate, minDate)) {
      toast({
        title: "Invalid Date",
        description: "Event must be at least 1 day in advance",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPanchayat || !selectedWardNumber) {
      toast({
        title: "Location Required",
        description: "Please select your location from the home page",
        variant: "destructive",
      });
      return;
    }

    if (!contactNumber.trim()) {
      toast({
        title: "Contact Required",
        description: "Please provide a contact number",
        variant: "destructive",
      });
      return;
    }

    if (!deliveryAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please provide the event venue address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `IE-${Date.now().toString(36).toUpperCase()}`;

      // Build selected items summary for event details
      const itemsSummary = totalItemsCount > 0 
        ? Array.from(selectedItems.values())
            .map(({ item, quantity }) => `${item.name} x${quantity}`)
            .join(', ')
        : 'No specific dishes selected';

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          service_type: 'indoor_events',
          event_type_id: selectedEventType.id,
          event_date: eventDate.toISOString(),
          guest_count: guestCount,
          event_details: `Quick Booking | Time: ${eventTime || 'Not specified'} | Contact: ${contactNumber} | Items: ${itemsSummary} | ${eventDetails}`,
          delivery_address: deliveryAddress,
          panchayat_id: selectedPanchayat.id,
          ward_number: selectedWardNumber,
          status: 'pending',
          order_type: 'food_only',
          total_amount: estimatedTotal || 0,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Insert order items if any selected
      if (totalItemsCount > 0 && orderData) {
        const orderItems = Array.from(selectedItems.values()).map(({ item, quantity }) => ({
          order_id: orderData.id,
          food_item_id: item.id,
          quantity,
          unit_price: item.price,
          total_price: item.price * quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error inserting order items:', itemsError);
        }
      }

      setIsSubmitted(true);
      toast({
        title: "Booking Request Submitted!",
        description: "We will contact you with a quotation soon.",
      });
    } catch (error: any) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-50 w-full border-b bg-indoor-events text-white">
          <div className="container flex h-14 items-center gap-4 px-4">
            <Zap className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Quick Booking</h1>
          </div>
        </header>

        <main className="container px-4 py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-2xl font-display font-bold">Request Submitted!</h2>
            <p className="text-muted-foreground max-w-sm">
              Your event booking request has been submitted. Our team will review and contact you with a quotation.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => navigate('/orders')}>
                View My Bookings
              </Button>
              <Button onClick={() => navigate('/')} className="bg-indoor-events hover:bg-indoor-events/90">
                Back to Home
              </Button>
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-indoor-events text-white">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/indoor-events')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Zap className="h-6 w-6" />
          <h1 className="text-lg font-semibold">Quick Booking</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Info */}
        <Card className="border-indoor-events/30 bg-indoor-events/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-foreground mb-1">Simple & Quick</p>
            <p className="text-muted-foreground">
              Fill in basic details. No dish selection needed. Admin will send you a quotation.
            </p>
          </CardContent>
        </Card>

        {/* Event Type Selection */}
        <EventTypeSelector
          selectedEventType={selectedEventType}
          onSelect={setSelectedEventType}
        />

        {/* Food Selection */}
        <QuickBookingFoodSelection
          selectedItems={selectedItems}
          onItemsChange={setSelectedItems}
        />

        {/* Event Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    disabled={(date) => isBefore(date, minDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Event Time */}
            <div className="space-y-2">
              <Label>Event Time (Optional)</Label>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>

            {/* Guest Count */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Guests *
              </Label>
              <Input
                type="number"
                min={10}
                max={1000}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 50)}
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Number *
              </Label>
              <Input
                type="tel"
                placeholder="Your phone number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label>Special Instructions (Optional)</Label>
              <Textarea
                placeholder="Any special requirements, dietary restrictions, etc..."
                value={eventDetails}
                onChange={(e) => setEventDetails(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Event Venue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Full Address *</Label>
              <Textarea
                placeholder="Enter complete venue address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
              {selectedPanchayat && selectedWardNumber && (
                <p className="text-xs text-muted-foreground">
                  📍 Ward {selectedWardNumber}, {selectedPanchayat.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          className="w-full bg-indoor-events hover:bg-indoor-events/90"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedEventType || !eventDate}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Booking Request'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Status: pending_admin_review • You will be contacted with quotation
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default IndoorEventsQuickBooking;
