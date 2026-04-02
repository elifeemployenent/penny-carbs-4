import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

const PendingCartBanner: React.FC = () => {
  const navigate = useNavigate();
  const { itemCount, clearCart } = useCart();
  const [dismissed, setDismissed] = React.useState(() => 
    sessionStorage.getItem('pending_cart_dismissed') === 'true'
  );

  if (dismissed || itemCount === 0) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pending_cart_dismissed', 'true');
  };

  return (
    <div className="sticky top-0 z-50 bg-primary text-primary-foreground px-3 py-2 flex items-center justify-between gap-2 shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <ShoppingCart className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium truncate">
          {itemCount} item{itemCount > 1 ? 's' : ''} in cart
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs px-2.5 bg-green-800 text-white hover:bg-green-900"
          onClick={() => navigate('/cart')}
        >
          View Cart
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs px-2 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
          onClick={async () => {
            await clearCart();
            handleDismiss();
          }}
        >
          Clear
        </Button>
        <button onClick={handleDismiss} className="p-0.5 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PendingCartBanner;
