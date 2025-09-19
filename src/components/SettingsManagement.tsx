import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Settings, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    checkUserRole();
    fetchSettings();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setUserRole(roleData?.role || null);
    } catch (err) {
      console.error('Error checking user role:', err);
      setUserRole(null);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('*')
        .order('key');

      if (fetchError) throw fetchError;

      setSettings(data || []);
      
      // Initialize form data
      const initialFormData: Record<string, string> = {};
      data?.forEach(setting => {
        initialFormData[setting.key] = setting.value;
      });
      setFormData(initialFormData);

    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (userRole !== 'admin') {
      setError('Δεν έχετε δικαίωμα να αλλάξετε τις ρυθμίσεις');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate station deals distance
      const stationDealsDistance = parseInt(formData.station_deals_distance);
      if (isNaN(stationDealsDistance) || stationDealsDistance < 50 || stationDealsDistance > 1000) {
        setError('Η απόσταση για τα Station Deals πρέπει να είναι μεταξύ 50 και 1000 μέτρων');
        return;
      }

      // Update each setting
      for (const setting of settings) {
        const newValue = formData[setting.key];
        if (newValue !== setting.value) {
          const { error: updateError } = await supabase
            .from('app_settings')
            .update({ 
              value: newValue,
              updated_at: new Date().toISOString()
            })
            .eq('key', setting.key);

          if (updateError) throw updateError;
        }
      }

      setSuccess('Οι ρυθμίσεις αποθηκεύτηκαν με επιτυχία!');
      await fetchSettings(); // Refresh data

    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    setSuccess(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Περιορισμένη Πρόσβαση</h3>
        <p>Δεν έχετε δικαίωμα πρόσβασης στις ρυθμίσεις της εφαρμογής. Μόνο διαχειριστές μπορούν να κάνουν αλλαγές.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings size={20} className="mr-2" />
            Ρυθμίσεις Εφαρμογής
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Διαχειριστείτε τις γενικές ρυθμίσεις της εφαρμογής
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
        >
          <Save size={16} className="mr-2" />
          {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-green-700 text-sm">{success}</div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Ρυθμίσεις Station Deals</h3>
          <p className="text-sm text-gray-600 mt-1">
            Ρυθμίστε τις παραμέτρους για την εμφάνιση των προσφορών κοντά στις στάσεις μετρό
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Station Deals Distance Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              Μέγιστη Απόσταση για Station Deals (μέτρα)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="50"
                max="1000"
                step="10"
                value={formData.station_deals_distance || '200'}
                onChange={(e) => handleInputChange('station_deals_distance', e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-sm text-gray-600">μέτρα</span>
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  Τρέχουσα τιμή: <span className="font-medium">{formData.station_deals_distance || '200'}μ</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Εύρος: 50μ - 1000μ (προτεινόμενο: 200μ)
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Επεξήγηση:</strong> Αυτή η ρύθμιση καθορίζει σε ποια απόσταση από τις στάσεις μετρό 
                θα εμφανίζονται οι προσφορές στο Station Deals tab. Μικρότερη απόσταση = λιγότερες προσφορές 
                αλλά πιο κοντά στις στάσεις.
              </p>
            </div>
          </div>

          {/* Visual Distance Indicator */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Οπτική Αναπαράσταση Απόστασης</h4>
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* Metro Station */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold">
                  M
                </div>
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                  Στάση Μετρό
                </div>
                
                {/* Distance Circle Visualization */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-rose-300 rounded-full flex items-center justify-center"
                  style={{ 
                    width: `${Math.min(200, Math.max(60, (parseInt(formData.station_deals_distance || '200') / 200) * 200))}px`,
                    height: `${Math.min(200, Math.max(60, (parseInt(formData.station_deals_distance || '200') / 200) * 200))}px`
                  }}
                >
                  <div className="text-xs text-rose-600 font-medium bg-white px-2 py-1 rounded shadow">
                    {formData.station_deals_distance || '200'}μ
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-4 text-xs text-gray-500">
              Οι επιχειρήσεις εντός αυτής της ακτίνας θα εμφανίζονται στα Station Deals
            </div>
          </div>

          {/* Other App Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Γενικές Ρυθμίσεις</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Όνομα Εφαρμογής
                </label>
                <input
                  type="text"
                  value={formData.app_name || ''}
                  onChange={(e) => handleInputChange('app_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="MetroBusiness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Περιγραφή Εφαρμογής
                </label>
                <input
                  type="text"
                  value={formData.app_description || ''}
                  onChange={(e) => handleInputChange('app_description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Επιχειρήσεις κοντά στο Μετρό Θεσσαλονίκης"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Προεπισκόπηση Αλλαγών</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Τρέχουσες Ρυθμίσεις</h4>
              <div className="space-y-2 text-sm">
                {settings.map(setting => (
                  <div key={setting.key} className="flex justify-between py-1">
                    <span className="text-gray-600">{setting.description}:</span>
                    <span className="font-medium text-gray-900">
                      {setting.key === 'station_deals_distance' ? `${setting.value}μ` : setting.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Νέες Ρυθμίσεις</h4>
              <div className="space-y-2 text-sm">
                {settings.map(setting => {
                  const hasChanged = formData[setting.key] !== setting.value;
                  return (
                    <div key={setting.key} className="flex justify-between py-1">
                      <span className="text-gray-600">{setting.description}:</span>
                      <span className={`font-medium ${hasChanged ? 'text-rose-600' : 'text-gray-900'}`}>
                        {setting.key === 'station_deals_distance' 
                          ? `${formData[setting.key] || setting.value}μ` 
                          : formData[setting.key] || setting.value}
                        {hasChanged && <span className="ml-1 text-xs">(αλλαγμένο)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;