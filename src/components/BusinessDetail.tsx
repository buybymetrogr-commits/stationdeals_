import React, { useEffect, useRef } from 'react';
import { Business, BusinessCategory } from '../types';
import { formatDistance } from '../utils/distance';
import { getTierBadge } from '../utils/tierUtils';
import { X, MapPin, Phone, Facebook, Clock, Tag, Calendar, Navigation, ExternalLink, Share2, Copy } from 'lucide-react';

interface BusinessDetailProps {
  business: Business;
  category: BusinessCategory;
  onClose: () => void;
}

const BusinessDetail: React.FC<BusinessDetailProps> = ({ business, category, onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const tierBadge = getTierBadge(business.tier);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (mapRef.current) {
      initMap();
    }

    return () => {
      isMountedRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [business]);

  const initMap = async () => {
    if (!mapRef.current || !isMountedRef.current) return;

    try {
      const L = await import('leaflet');
      
      if (!mapRef.current || !isMountedRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current, {
        center: [business.location.lat, business.location.lng],
        zoom: 16,
        zoomControl: true,
        attributionControl: false
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Create custom business icon
      const businessIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-500 shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([business.location.lat, business.location.lng], {
        icon: businessIcon,
        title: business.name
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-sm mb-1">${business.name}</h3>
          <p class="text-xs text-gray-600 mb-2">${business.address}</p>
          <div class="flex gap-2">
            <button 
              onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${business.location.lat},${business.location.lng}', '_blank')"
              class="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Google Maps
            </button>
            <button 
              onclick="window.open('https://maps.apple.com/?daddr=${business.location.lat},${business.location.lng}', '_blank')"
              class="flex-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
            >
              Apple Maps
            </button>
          </div>
        </div>
      `);

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Force map resize after initialization with mount check
      setTimeout(() => {
        if (isMountedRef.current && mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch (error) {
            console.warn('Map invalidateSize failed:', error);
          }
        }
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const isOpen = React.useMemo(() => {
    const now = new Date();
    const dayIndex = now.getDay();
    const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    const today = business.hours.find(h => h.day === dayNames[dayIndex]);
    
    if (!today || today.closed) return false;
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [openHour, openMinute] = today.open.split(':').map(Number);
    const [closeHour, closeMinute] = today.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;
    
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime < closeTime;
    }
    
    return currentTime >= openTime && currentTime < closeTime;
  }, [business.hours]);

  const formatExpiryDate = (validUntil: string): string => {
    const date = new Date(validUntil);
    return date.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isExpired = (validUntil: string): boolean => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    return expiryDate < today;
  };

  const isExpiringSoon = (validUntil: string): boolean => {
    const expiryDate = new Date(validUntil);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const handleNavigate = (service: 'google' | 'apple') => {
    const lat = business.location.lat;
    const lng = business.location.lng;
    
    if (service === 'google') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://maps.apple.com/?daddr=${lat},${lng}`, '_blank');
    }
  };

  const shareOffer = (offer: any, platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    // Update page meta tags dynamically for this offer
    updateMetaTags(offer);
    
    const offerText = `🎉 ${offer.title} στο ${business.name}!\n\n${offer.description || ''}\n\n💰 Έκπτωση: ${offer.discount_text}\n📍 ${business.address}\n\n#MetroBusiness #Προσφορές #Θεσσαλονίκη`;
    const cleanUrl = 'https://buybymetro.gr'; // Clean production URL
    
    switch (platform) {
      case 'facebook':
        // Create a specific URL for this offer
        const offerUrl = `${cleanUrl}?offer=${offer.id}&business=${business.id}`;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(offerUrl)}&quote=${encodeURIComponent(offerText)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
        break;
        
      case 'twitter':
        const twitterText = `🎉 ${offer.title} στο ${business.name}! 💰 ${offer.discount_text} #MetroBusiness #Προσφορές #Θεσσαλονίκη`;
        const offerUrlTwitter = `${cleanUrl}?offer=${offer.id}&business=${business.id}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(offerUrlTwitter)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
        break;
        
      case 'whatsapp':
        const offerUrlWhatsapp = `${cleanUrl}?offer=${offer.id}&business=${business.id}`;
        const whatsappText = `${offerText}\n\nΔείτε περισσότερα: ${offerUrlWhatsapp}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
        window.open(whatsappUrl, '_blank');
        break;
        
      case 'copy':
        const offerUrlCopy = `${cleanUrl}?offer=${offer.id}&business=${business.id}`;
        const copyText = `${offerText}\n\nΔείτε περισσότερα: ${offerUrlCopy}`;
        
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(copyText).then(() => {
            alert('Το κείμενο της προσφοράς αντιγράφηκε!');
          }).catch(() => {
            fallbackCopyTextToClipboard(copyText);
          });
        } else {
          fallbackCopyTextToClipboard(copyText);
        }
        break;
    }
  };

  const updateMetaTags = (offer: any) => {
    // Update Open Graph meta tags for better social sharing
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const updateTwitterTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Update meta tags with offer information
    updateMetaTag('og:title', `${offer.title} - ${business.name} | MetroBusiness`);
    updateMetaTag('og:description', `${offer.description || offer.title} - Έκπτωση: ${offer.discount_text}`);
    updateMetaTag('og:image', offer.image_url || 'https://images.pexels.com/photos/3987020/pexels-photo-3987020.jpeg');
    updateMetaTag('og:url', `https://buybymetro.gr?offer=${offer.id}&business=${business.id}`);
    
    // Update Twitter Card tags
    updateTwitterTag('twitter:title', `${offer.title} - ${business.name} | MetroBusiness`);
    updateTwitterTag('twitter:description', `${offer.description || offer.title} - Έκπτωση: ${offer.discount_text}`);
    updateTwitterTag('twitter:image', offer.image_url || 'https://images.pexels.com/photos/3987020/pexels-photo-3987020.jpeg');

    // Update page title
    document.title = `${offer.title} - ${business.name} | MetroBusiness`;
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Το κείμενο της προσφοράς αντιγράφηκε!');
      } else {
        alert('Δεν ήταν δυνατή η αντιγραφή. Παρακαλώ αντιγράψτε το κείμενο χειροκίνητα.');
      }
    } catch (err) {
      alert('Δεν ήταν δυνατή η αντιγραφή. Παρακαλώ αντιγράψτε το κείμενο χειροκίνητα.');
    }
    
    document.body.removeChild(textArea);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-800">{business.name}</h2>
              {tierBadge && (
                <span className={tierBadge.className}>
                  <span className="mr-1">{tierBadge.icon}</span>
                  {tierBadge.label}
                </span>
              )}
            </div>
            
            {/* Contact Info and Hours in header */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Contact Info */}
              {business.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-1" />
                  <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline">
                    {business.phone}
                  </a>
                </div>
              )}
              
              {business.website && (
                <div className="flex items-center text-gray-600">
                  <Facebook className="w-4 h-4 mr-1" />
                  <a 
                    href={business.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {business.website.replace(/^https?:\/\/(www\.)?/, '')}
                    <ExternalLink size={12} className="ml-1" />
                  </a>
                </div>
              )}
              
              {/* Current Status */}
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isOpen ? 'Ανοιχτό τώρα' : 'Κλειστό τώρα'}
                </span>
              </div>
              
              {/* Today's hours */}
              {(() => {
                const now = new Date();
                const dayIndex = now.getDay();
                const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
                const today = business.hours.find(h => h.day === dayNames[dayIndex]);
                
                if (today) {
                  return (
                    <div className="flex items-center text-gray-600">
                      <span className="text-xs">
                        Σήμερα: {today.closed ? 'Κλειστό' : `${today.open} - ${today.close}`}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {/* Map Section */}
          <div className="relative h-64 md:h-80 bg-gray-100">
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Map Controls Overlay */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
                  isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {isOpen ? 'Ανοιχτό' : 'Κλειστό'}
                </span>
                
                <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {category.name}
                </span>
              </div>

              {/* Navigation Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleNavigate('google')}
                  className="flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
                  title="Πλοήγηση με Google Maps"
                >
                  <Navigation size={14} className="mr-1" />
                  Google
                </button>
                <button
                  onClick={() => handleNavigate('apple')}
                  className="flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
                  title="Πλοήγηση με Apple Maps"
                >
                  <Navigation size={14} className="mr-1" />
                  Apple
                </button>
              </div>
            </div>

            {/* Address Overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{business.address}</p>
                    {business.distance !== undefined && business.distance !== null && (
                      <p className="text-xs text-gray-600 mt-1">
                        {formatDistance(business.distance)} από την πιο κοντινή στάση μετρό
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              {business.offers && business.offers.length > 0 && (
                <div className="flex items-center">
                  <Tag size={16} className="text-rose-500 mr-1" />
                  <span className="text-sm text-rose-600 font-medium">
                    {business.offers.length} ενεργ{business.offers.length === 1 ? 'ή προσφορά' : 'ές προσφορές'}
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-gray-700 mb-6">{business.description}</p>
            
            {/* Offers Section - Full Width */}
            {business.offers && business.offers.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Tag className="w-5 h-5 text-rose-500 mr-2" />
                  Προσφορές ({business.offers.length})
                </h3>
                
                <div className="space-y-4">
                  {business.offers.map((offer) => (
                    <div key={offer.id} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-rose-50 to-pink-50 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{offer.title}</h4>
                          {offer.description && (
                            <p className="text-sm text-gray-600 mb-2">{offer.description}</p>
                          )}
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-3 py-1 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full">
                              {offer.discount_text}
                            </span>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar size={12} className="mr-1" />
                              <span className={`${
                                isExpired(offer.valid_until) ? 'text-red-600 font-medium' :
                                isExpiringSoon(offer.valid_until) ? 'text-orange-600 font-medium' :
                                'text-gray-500'
                              }`}>
                                {isExpired(offer.valid_until) ? 'Έληξε' : 
                                 `Ισχύει έως ${formatExpiryDate(offer.valid_until)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        {offer.image_url && (
                          <div className="w-16 h-16 ml-4 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={offer.image_url} 
                              alt={offer.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Pick Me Up Button */}
                      <div className="mt-4 pt-3 border-t border-rose-200">
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              if (mapInstanceRef.current && markerRef.current) {
                                mapInstanceRef.current.setView([business.location.lat, business.location.lng], 17);
                                markerRef.current.openPopup();
                                // Scroll to map
                                const mapElement = mapRef.current;
                                if (mapElement) {
                                  mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }
                            }}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-success-500 to-success-600 text-white text-sm font-medium rounded-full hover:from-success-600 hover:to-success-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                          >
                            <Navigation size={14} className="mr-2" />
                            Pick me up
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Δεν υπάρχουν διαθέσιμες προσφορές</p>
              </div>
            )}

          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-center items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => handleNavigate('google')}
              className="flex items-center px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
            >
              <Navigation size={16} className="mr-2" />
              Πλοήγηση
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;