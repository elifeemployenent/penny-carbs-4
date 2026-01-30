import React from 'react';
import AppHeader from '@/components/customer/AppHeader';
import BannerCarousel from '@/components/customer/BannerCarousel';
import ServiceCards from '@/components/customer/ServiceCards';
import PopularItems from '@/components/customer/PopularItems';
import CartButton from '@/components/customer/CartButton';
import BottomNav from '@/components/customer/BottomNav';

const Index: React.FC = () => {
  const handleSearch = (query: string) => {
    // Navigate to search page with query
    console.log('Search:', query);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader onSearch={handleSearch} />
      
      <main>
        {/* Banner Carousel */}
        <BannerCarousel />
        
        {/* Service Type Cards */}
        <ServiceCards />
        
        {/* Popular Items by Service Type */}
        <PopularItems 
          serviceType="indoor_events" 
          title="🎉 Popular for Events" 
          gradientClass="text-gradient-events"
        />
        
        <PopularItems 
          serviceType="cloud_kitchen" 
          title="👨‍🍳 Most Ordered from Cloud Kitchen" 
          gradientClass="text-gradient-kitchen"
        />
        
        <PopularItems 
          serviceType="homemade" 
          title="🏠 Homemade Favorites" 
          gradientClass="text-gradient-homemade"
        />
      </main>

      <CartButton />
      <BottomNav />
    </div>
  );
};

export default Index;
