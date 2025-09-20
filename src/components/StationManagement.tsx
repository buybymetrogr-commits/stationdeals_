import React, { useEffect, useRef, useState } from 'react';
import { MetroStation } from '../types';
import { MapPin, Save, Edit, X, Power, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StationManagementProps {
  onSave: (stations: MetroStation[]) => void;
}

interface ExtendedMetroStation extends MetroStation {
  active?: boolean;
}

const StationManagement: React.FC<StationManagementProps> = ({ onSave }) => {
  const [stations, setStations] = useState<ExtendedMetroStation[]>([]);
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const hasChanges = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const initialize = async () => {
      await checkUserRole();
      await fetchStations();
    };
    initialize();

    return () => {
      isMountedRef.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (stations.length > 0 && isMountedRef.current) {
      initMap(stations);
    }
  }, [stations]);

  useEffect(() => {
    if (mapInstanceRef.current && isMountedRef.current) {
      const L = window.L;
      addMarkersToMap(L, stations);
    }
  }, [editingStation]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        return null;
      }

      // Get user role from database
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = roleData?.role || null;
      setUserRole(role);
      return role;
    } catch (err) {
      console.error('Error checking user role:', err);
      setUserRole(null);
      return null;
    }
  };

  const isAdmin = userRole === 'admin';

  const handleStationEdit = (stationId: string) => {
    if (!isAdmin) {
      setError('Δεν έχετε δικαίωμα να επεξεργαστείτε τις στάσεις του μετρό.');
      return;
    }
    
    setEditingStation(stationId);
    const station = stations.find(s => s.id === stationId);
    if (station && mapInstanceRef.current && isMountedRef.current) {
      mapInstanceRef.current.setView([station.location.lat, station.location.lng], 16);
    }
  };

  const handleNameEdit = (stationId: string, currentName: string) => {
    if (!isAdmin) {
      setError('Δεν έχετε δικαίωμα να αλλάξετε τα ονόματα των στάσεων.');
      return;
    }
    
    setEditingName(stationId);
    setTempName(currentName);
  };

  const handleNameSave = (stationId: string) => {
    if (!tempName.trim()) {
      setError('Το όνομα της στάσης δεν μπορεί να είναι κενό.');
      return;
    }

    setStations(prev => prev.map(s => 
      s.id === stationId ? { ...s, name: tempName.trim() } : s
    ));
    
    setEditingName(null);
    setTempName('');
    hasChanges.current = true;
  };

  const handleNameCancel = () => {
    setEditingName(null);
    setTempName('');
  };

  const handleStatusChange = (stationId: string, status: ExtendedMetroStation['status']) => {
    if (!isAdmin) {
      setError('Δεν έχετε δικαίωμα να αλλάξετε την κατάσταση των στάσεων.');
      return;
    }
    
    setStations(prev => prev.map(s => 
      s.id === stationId ? { ...s, status } : s
    ));
    hasChanges.current = true;
  };

  const handleToggleActive = (stationId: string) => {
    if (!isAdmin) {
      setError('Δεν έχετε δικαίωμα να ενεργοποιήσετε/απενεργοποιήσετε στάσεις.');
      return;
    }
    
    setStations(prev => prev.map(s => 
      s.id === stationId ? { ...s, active: !s.active } : s
    ));
    hasChanges.current = true;
  };

  const handleCoordinateChange = (stationId: string, field: 'lat' | 'lng', value: number) => {
    if (!isAdmin) {
      setError('Δεν έχετε δικαίωμα να αλλάξετε τις συντεταγμένες των στάσεων.');
      return;
    }

    setStations(prev => prev.map(s => 
      s.id === stationId 
        ? { ...s, location: { ...s.location, [field]: value } }
        : s
    ));
    hasChanges.current = true;

    // Update marker position on map
    const marker = markersRef.current.get(stationId);
    if (marker && mapInstanceRef.current && isMountedRef.current) {
      const station = stations.find(s => s.id === stationId);
      if (station) {
        const newLat = field === 'lat' ? value : station.location.lat;
        const newLng = field === 'lng' ? value : station.location.lng;
        marker.setLatLng([newLat, newLng]);
        mapInstanceRef.current.setView([newLat, newLng], mapInstanceRef.current.getZoom());
      }
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setError('Δεν έχετε δικαίωμα να κάνετε αλλαγές στις στάσεις του μετρό.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Update each station individually to get better error handling
      for (const station of stations) {
        const { error } = await supabase
          .from('metro_stations')
          .update({
            name: station.name,
            lat: station.location.lat,
            lng: station.location.lng,
            lines: station.lines,
            status: station.status,
            active: station.active !== false
          })
          .eq('id', station.id);

        if (error) {
          console.error('Error updating station:', station.id, error);
          throw new Error(`Σφάλμα κατά την ενημέρωση της στάσης ${station.name}: ${error.message}`);
        }
      }

      onSave(stations);
      hasChanges.current = false;
      setEditingStation(null);
      alert('Οι αλλαγές αποθηκεύτηκαν με επιτυχία!');
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message);
      alert(`Προέκυψε σφάλμα κατά την αποθήκευση: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from('metro_stations')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedData = data.map(station => ({
        id: (station as any).id,
        name: (station as any).name,
        location: {
          lat: (station as any).lat,
          lng: (station as any).lng
        },
        lines: (station as any).lines,
        status: (station as any).status as 'planned' | 'under-construction' | 'operational',
        active: (station as any).active !== false // Default to true if not set
      }));

      setStations(transformedData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const initMap = async (stationsData: ExtendedMetroStation[]) => {
    if (!mapRef.current || !isMountedRef.current) return;

    try {
      const L = await import('leaflet');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current).setView([40.6401, 22.9444], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      // Force a resize after initialization with mount check
      setTimeout(() => {
        if (isMountedRef.current && mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch (error) {
            console.warn('Map invalidateSize failed:', error);
          }
        }
      }, 100);

      addMarkersToMap(L, stationsData);
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map');
    }
  };

  const addMarkersToMap = (L: any, stationsData: ExtendedMetroStation[]) => {
    if (!mapInstanceRef.current || !isMountedRef.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    stationsData.forEach(station => {
      const isEditing = editingStation === station.id;
      const isActive = station.active !== false;

      // Create custom icon
      const icon = L.divIcon({
        html: `
          <div class="relative">
            <div class="flex items-center justify-center w-8 h-8 rounded-full ${
              !isActive ? 'bg-gray-400' :
              isEditing ? 'bg-blue-500' :
              station.status === 'operational' ? 'bg-green-500' :
              station.status === 'under-construction' ? 'bg-orange-500' :
              'bg-gray-500'
            } text-white text-sm font-bold shadow-lg ${
              isEditing ? 'ring-2 ring-blue-300 ring-offset-2' : ''
            } cursor-${isEditing ? 'move' : 'pointer'} ${
              !isActive ? 'opacity-60' : ''
            }">
              M
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded text-xs font-medium shadow-md ${
              !isActive ? 'opacity-60' : ''
            }">
              ${station.name}${!isActive ? ' (Ανενεργή)' : ''}
            </div>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Create marker
      const marker = L.marker([station.location.lat, station.location.lng], {
        icon,
        draggable: isEditing && isAdmin,
        title: station.name
      }).addTo(mapInstanceRef.current);

      // Add drag events only if editing and user is admin
      if (isEditing && isAdmin) {
        marker.on('dragstart', () => {
          const el = marker.getElement();
          if (el) el.style.cursor = 'grabbing';
        });

        marker.on('drag', () => {
          if (!isMountedRef.current) return;
          
          const pos = marker.getLatLng();
          setStations(prev => prev.map(s => 
            s.id === station.id 
              ? { ...s, location: { lat: pos.lat, lng: pos.lng } }
              : s
          ));
        });

        marker.on('dragend', () => {
          if (!isMountedRef.current) return;
          
          const el = marker.getElement();
          if (el) el.style.cursor = 'grab';
          hasChanges.current = true;
        });
      }

      markersRef.current.set(station.id, marker);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Περιορισμένη Πρόσβαση</h3>
        <p>Δεν έχετε δικαίωμα πρόσβασης στη διαχείριση των στάσεων του μετρό. Μόνο διαχειριστές μπορούν να κάνουν αλλαγές.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Διαχείριση Στάσεων Μετρό</h2>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges.current}
          className="flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
        >
          <Save size={16} className="mr-2" />
          {saving ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 space-y-2 max-h-[600px] overflow-y-auto">
          <h3 className="font-medium text-gray-900 mb-4">Στάσεις</h3>
          <div className="space-y-3">
            {stations.map(station => (
              <div
                key={station.id}
                className={`p-3 rounded-lg border ${
                  editingStation === station.id
                    ? 'bg-blue-50 border-blue-200'
                    : station.active === false
                    ? 'bg-gray-50 border-gray-300 opacity-75'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center flex-1">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    {editingName === station.id ? (
                      <div className="flex items-center flex-1 gap-2">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleNameSave(station.id);
                            } else if (e.key === 'Escape') {
                              handleNameCancel();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleNameSave(station.id)}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Αποθήκευση"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleNameCancel}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Ακύρωση"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span 
                        className={`font-medium text-sm cursor-pointer hover:text-blue-600 ${
                          station.active === false ? 'text-gray-500' : ''
                        }`}
                        onClick={() => handleNameEdit(station.id, station.name)}
                        title="Κάντε κλικ για επεξεργασία ονόματος"
                      >
                        {station.name}
                        {station.active === false && ' (Ανενεργή)'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Toggle Active/Inactive */}
                    <button
                      onClick={() => handleToggleActive(station.id)}
                      className={`p-1 rounded ${
                        station.active === false 
                          ? 'text-gray-500 hover:text-green-600' 
                          : 'text-green-600 hover:text-red-600'
                      }`}
                      title={station.active === false ? 'Ενεργοποίηση' : 'Απενεργοποίηση'}
                    >
                      <Power size={14} />
                    </button>
                    
                    {/* Edit Position */}
                    {editingStation === station.id ? (
                      <button
                        onClick={() => setEditingStation(null)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Τέλος επεξεργασίας"
                      >
                        <X size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStationEdit(station.id)}
                        className="p-1 text-blue-500 hover:text-blue-700"
                        title="Επεξεργασία θέσης"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                {editingStation === station.id && (
                  <div className="mt-3 space-y-3">
                    {/* Coordinates */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Συντεταγμένες
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Γεωγραφικό Πλάτος</label>
                          <input
                            type="number"
                            step="0.000001"
                            value={station.location.lat}
                            onChange={(e) => handleCoordinateChange(station.id, 'lat', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="40.6363"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Γεωγραφικό Μήκος</label>
                          <input
                            type="number"
                            step="0.000001"
                            value={station.location.lng}
                            onChange={(e) => handleCoordinateChange(station.id, 'lng', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="22.9386"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status buttons */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Κατάσταση
                      </label>
                      <div className="grid grid-cols-1 gap-1">
                        <button
                          onClick={() => handleStatusChange(station.id, 'planned')}
                          className={`px-2 py-1 text-xs rounded-full ${
                            station.status === 'planned'
                              ? 'bg-gray-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Σχεδιασμένος
                        </button>
                        <button
                          onClick={() => handleStatusChange(station.id, 'under-construction')}
                          className={`px-2 py-1 text-xs rounded-full ${
                            station.status === 'under-construction'
                              ? 'bg-orange-500 text-white'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                        >
                          Υπό Κατασκευή
                        </button>
                        <button
                          onClick={() => handleStatusChange(station.id, 'operational')}
                          className={`px-2 py-1 text-xs rounded-full ${
                            station.status === 'operational'
                              ? 'bg-green-500 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          Σε Λειτουργία
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-blue-600">
                      Σύρετε τον δείκτη στον χάρτη ή αλλάξτε τις συντεταγμένες για να αλλάξετε τη θέση
                    </p>
                  </div>
                )}

                {/* Always show current coordinates and status */}
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div>{station.location.lat.toFixed(6)}, {station.location.lng.toFixed(6)}</div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      station.status === 'operational' ? 'bg-green-100 text-green-700' :
                      station.status === 'under-construction' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {station.status === 'operational' ? 'Λειτουργεί' :
                       station.status === 'under-construction' ? 'Υπό κατασκευή' :
                       'Σχεδιασμένος'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      station.active === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {station.active === false ? 'Ανενεργή' : 'Ενεργή'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div ref={mapRef} className="h-[600px] w-full" />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Οδηγίες</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Κάντε κλικ στο όνομα της στάσης για να το επεξεργαστείτε</li>
          <li>• Χρησιμοποιήστε το κουμπί ενεργοποίησης/απενεργοποίησης για να ελέγξετε την ορατότητα</li>
          <li>• Πατήστε το εικονίδιο επεξεργασίας για να αλλάξετε τη θέση στον χάρτη</li>
          <li>• Αλλάξτε την κατάσταση της στάσης με τα κουμπιά που εμφανίζονται</li>
          <li>• Εισάγετε τις ακριβείς συντεταγμένες στα πεδία ή σύρετε τον δείκτη στον χάρτη</li>
          <li>• Πατήστε "Αποθήκευση Αλλαγών" για να αποθηκεύσετε τις αλλαγές</li>
        </ul>
      </div>
    </div>
  );
};

export default StationManagement;