import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash, MapPin, Search } from 'lucide-react';
import { Business, BusinessCategory, BusinessHours, BusinessTier } from '../types';
import { categories } from '../data/categories';
import { getTierConfig } from '../utils/tierUtils';
import { supabase } from '../lib/supabase';

interface BusinessFormProps {
  business?: Business;
  onClose: () => void;
  onSave: () => void;
}

const DEFAULT_HOURS: BusinessHours[] = [
  { day: 'Δευτέρα', open: '09:00', close: '21:00', closed: false },
  { day: 'Τρίτη', open: '09:00', close: '21:00', closed: false },
  { day: 'Τετάρτη', open: '09:00', close: '21:00', closed: false },
  { day: 'Πέμπτη', open: '09:00', close: '21:00', closed: false },
  { day: 'Παρασκευή', open: '09:00', close: '21:00', closed: false },
  { day: 'Σάββατο', open: '09:00', close: '15:00', closed: false },
  { day: 'Κυριακή', open: '', close: '', closed: true }
];

const TIER_OPTIONS: { value: BusinessTier; label: string; description: string }[] = [
  { value: 'next-door', label: 'Next door', description: 'Γειτονικό κατάστημα' },
  { value: 'unicorns', label: 'Unicorns', description: 'Μοναδικό κατάστημα' },
  { value: 'classics', label: 'Classics', description: 'Κλασικό κατάστημα' }
];

const BusinessForm: React.FC<BusinessFormProps> = ({ business, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isMapInitialized = useRef(false);
  const isMountedRef = useRef(true);
  
  const [formData, setFormData] = useState({
    name: business?.name || '',
    description: business?.description || '',
    categoryId: business?.categoryId || categories[0].id,
    tier: business?.tier || 'next-door' as BusinessTier,
    address: business?.address || '',
    lat: business?.location.lat || 40.6337,
    lng: business?.location.lng || 22.9406,
    phone: business?.phone || '',
    website: business?.website || '',
    photos: business?.photos || [''],
    hours: business?.hours || DEFAULT_HOURS
  });

  useEffect(() => {
    isMountedRef.current = true;
    
    if (mapRef.current && !isMapInitialized.current) {
      initMap();
    }

    return () => {
      isMountedRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        isMapInitialized.current = false;
      }
    };
  }, []);

  useEffect(() => {
    // Update marker position when coordinates change
    if (mapInstanceRef.current && markerRef.current && isMountedRef.current) {
      markerRef.current.setLatLng([formData.lat, formData.lng]);
      mapInstanceRef.current.setView([formData.lat, formData.lng], mapInstanceRef.current.getZoom());
    }
  }, [formData.lat, formData.lng]);

  const initMap = async () => {
    if (!mapRef.current || isMapInitialized.current || !isMountedRef.current) return;

    try {
      setMapLoading(true);
      
      // Import Leaflet
      const L = await import('leaflet');
      
      if (!mapRef.current || !isMountedRef.current) return;

      // Wait a bit for the container to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isMountedRef.current) return;

      const map = L.map(mapRef.current, {
        center: [formData.lat, formData.lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: true
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Create custom business icon
      const businessIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500 shadow-lg border-2 border-white cursor-move">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([formData.lat, formData.lng], {
        icon: businessIcon,
        draggable: true,
        title: 'Σύρετε για να αλλάξετε τη θέση'
      }).addTo(map);

      marker.on('dragend', async () => {
        if (!isMountedRef.current) return;
        
        const position = marker.getLatLng();
        setFormData(prev => ({
          ...prev,
          lat: position.lat,
          lng: position.lng
        }));

        // Reverse geocoding to get address
        await reverseGeocode(position.lat, position.lng);
      });

      // Click on map to place marker
      map.on('click', async (e: any) => {
        if (!isMountedRef.current) return;
        
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        
        setFormData(prev => ({
          ...prev,
          lat,
          lng
        }));

        // Reverse geocoding to get address
        await reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      isMapInitialized.current = true;

      // Add popup with instructions
      marker.bindPopup(`
        <div class="text-center p-2">
          <p class="font-medium text-sm mb-1">${formData.name || 'Νέα Επιχείρηση'}</p>
          <p class="text-xs text-gray-600">Σύρετε τον δείκτη ή κάντε κλικ στον χάρτη<br>για να αλλάξετε τη θέση</p>
        </div>
      `).openPopup();

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
      setError('Σφάλμα κατά τη φόρτωση του χάρτη. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setMapLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!isMountedRef.current) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=el`
      );
      const data = await response.json();
      if (data.display_name && isMountedRef.current) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name
        }));
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.address.trim() || !isMountedRef.current) return;

    setSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address + ', Θεσσαλονίκη')}&limit=1&accept-language=el`
      );
      const data = await response.json();

      if (data && data[0] && isMountedRef.current) {
        const { lat, lon: lng } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lng);
        
        setFormData(prev => ({
          ...prev,
          lat: newLat,
          lng: newLng
        }));

        if (mapInstanceRef.current && markerRef.current && isMountedRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 16);
          markerRef.current.setLatLng([newLat, newLng]);
        }
      } else {
        setError('Δεν βρέθηκε η διεύθυνση. Παρακαλώ δοκιμάστε μια πιο συγκεκριμένη διεύθυνση.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      setError('Σφάλμα κατά την αναζήτηση διεύθυνσης');
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Πρέπει να συνδεθείτε για να προσθέσετε επιχείρηση');

      const businessData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.categoryId,
        tier: formData.tier,
        address: formData.address,
        lat: formData.lat,
        lng: formData.lng,
        phone: formData.phone,
        website: formData.website,
        owner_id: user.id
      };

      let businessId: string;

      if (business) {
        // Update existing business - the RLS policy will handle ownership verification
        const { error: updateError, data } = await supabase
          .from('businesses')
          .update(businessData)
          .eq('id', business.id)
          .select();

        if (updateError) throw updateError;
        if (!data || data.length === 0) {
          throw new Error('You do not have permission to edit this business');
        }
        businessId = business.id;
      } else {
        const { error: insertError, data } = await supabase
          .from('businesses')
          .insert([businessData])
          .select();

        if (insertError) throw insertError;
        if (!data || data.length === 0) throw new Error('Failed to create business');
        businessId = data[0].id;
      }

      // Handle photos
      const validPhotos = formData.photos.filter(url => url.trim());
      if (validPhotos.length > 0) {
        // Delete existing photos first
        await supabase
          .from('business_photos')
          .delete()
          .eq('business_id', businessId);

        const photoData = validPhotos.map((url, index) => ({
          business_id: businessId,
          url,
          order: index
        }));

        const { error: photoError } = await supabase
          .from('business_photos')
          .insert(photoData);

        if (photoError) throw photoError;
      }

      // Handle business hours
      const hoursData = formData.hours.map(hour => ({
        business_id: businessId,
        day: hour.day,
        open: hour.closed ? null : hour.open,
        close: hour.closed ? null : hour.close,
        closed: hour.closed
      }));

      // Delete existing hours first
      await supabase
        .from('business_hours')
        .delete()
        .eq('business_id', businessId);

      const { error: hoursError } = await supabase
        .from('business_hours')
        .insert(hoursData);

      if (hoursError) throw hoursError;

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (index: number, field: keyof BusinessHours, value: string | boolean) => {
    const newHours = [...formData.hours];
    if (field === 'closed') {
      newHours[index] = {
        ...newHours[index],
        closed: value as boolean,
        open: value ? '' : newHours[index].open || '09:00',
        close: value ? '' : newHours[index].close || '21:00'
      };
    } else {
      newHours[index] = {
        ...newHours[index],
        [field]: value
      };
    }
    setFormData({ ...formData, hours: newHours });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {business ? 'Επεξεργασία' : 'Νέα'} Επιχείρηση
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Όνομα Επιχείρησης *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Κατηγορία *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {TIER_OPTIONS.map((tier) => {
                    const config = getTierConfig(tier.value);
                    return (
                      <label
                        key={tier.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.tier === tier.value
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tier"
                          value={tier.value}
                          checked={formData.tier === tier.value}
                          onChange={(e) => setFormData({ ...formData, tier: e.target.value as BusinessTier })}
                          className="mr-3"
                        />
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${config.bgColor} ${config.textColor}`}>
                            <span className="mr-1">{config.icon}</span>
                            {config.label}
                          </span>
                          <span className="text-sm text-gray-600">{tier.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Διεύθυνση *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="π.χ. Τσιμισκή 126, Θεσσαλονίκη"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={searchingAddress}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    title="Αναζήτηση στον χάρτη"
                  >
                    {searchingAddress ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Search size={20} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Εισάγετε τη διεύθυνση και πατήστε αναζήτηση, ή κάντε κλικ στον χάρτη
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Γεωγραφικό Πλάτος
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Γεωγραφικό Μήκος
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Περιγραφή
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  rows={3}
                  placeholder="Περιγράψτε την επιχείρησή σας..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Τηλέφωνο
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="2310123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ιστοσελίδα
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Φωτογραφίες
                </label>
                <div className="space-y-2">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={photo}
                        onChange={(e) => {
                          const newPhotos = [...formData.photos];
                          newPhotos[index] = e.target.value;
                          setFormData({ ...formData, photos: newPhotos });
                        }}
                        placeholder="URL φωτογραφίας"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newPhotos = formData.photos.filter((_, i) => i !== index);
                          setFormData({ ...formData, photos: newPhotos });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photos: [...formData.photos, ''] })}
                    className="flex items-center text-sm text-rose-500 hover:text-rose-600"
                  >
                    <Plus size={16} className="mr-1" />
                    Προσθήκη φωτογραφίας
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ωράριο Λειτουργίας
                </label>
                <div className="space-y-2">
                  {formData.hours.map((hour, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-20 text-sm">{hour.day}</span>
                      <input
                        type="time"
                        value={hour.open}
                        onChange={(e) => handleHoursChange(index, 'open', e.target.value)}
                        disabled={hour.closed}
                        className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={hour.close}
                        onChange={(e) => handleHoursChange(index, 'close', e.target.value)}
                        disabled={hour.closed}
                        className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={hour.closed}
                          onChange={(e) => handleHoursChange(index, 'closed', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Κλειστά</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                  <MapPin size={16} className="mr-2" />
                  Τοποθεσία στον Χάρτη
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Κάντε κλικ στον χάρτη για να τοποθετήσετε την επιχείρηση</li>
                  <li>• Σύρετε τον κόκκινο δείκτη για να αλλάξετε τη θέση</li>
                  <li>• Χρησιμοποιήστε την αναζήτηση διεύθυνσης για γρήγορη εύρεση</li>
                  <li>• Η διεύθυνση θα ενημερωθεί αυτόματα</li>
                </ul>
              </div>

              <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100 relative">
                {mapLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Φόρτωση χάρτη...</p>
                    </div>
                  </div>
                )}
                <div 
                  ref={mapRef} 
                  className="h-[500px] w-full"
                  style={{ minHeight: '500px' }}
                />
              </div>

              <div className="text-xs text-gray-500 text-center">
                Χρησιμοποιείται το OpenStreetMap για την εμφάνιση του χάρτη
              </div>
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Ακύρωση
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Αποθήκευση...
              </>
            ) : (
              'Αποθήκευση'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessForm;