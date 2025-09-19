import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Edit, X, FileText, Eye, EyeOff } from 'lucide-react';

interface FooterPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FooterPagesManagement: React.FC = () => {
  const [pages, setPages] = useState<FooterPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    content: string;
    is_active: boolean;
  }>({
    title: '',
    content: '',
    is_active: true
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, ensure the footer_pages table exists and has default content
      await initializeDefaultPages();

      const { data, error: fetchError } = await supabase
        .from('footer_pages')
        .select('*')
        .order('slug');

      if (fetchError) throw fetchError;

      setPages(data || []);
    } catch (err: any) {
      console.error('Error fetching pages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultPages = async () => {
    try {
      // Check if pages already exist
      const { data: existingPages } = await supabase
        .from('footer_pages')
        .select('slug');

      const existingSlugs = existingPages?.map(p => p.slug) || [];

      const defaultPages = [
        {
          slug: 'about',
          title: 'Ποιοί είμαστε',
          content: `# Ποιοί είμαστε

## Η Αποστολή μας
Το MetroBusiness δημιουργήθηκε με στόχο να συνδέσει τις τοπικές επιχειρήσεις της Θεσσαλονίκης με τους επιβάτες του νέου μετρό.

## Το Όραμά μας
Οραματιζόμαστε μια Θεσσαλονίκη όπου κάθε διαδρομή με το μετρό είναι μια ευκαιρία για ανακάλυψη.`,
          is_active: true
        },
        {
          slug: 'how-it-works',
          title: 'Πώς λειτουργεί',
          content: `# Πώς λειτουργεί

## Για τους Χρήστες
1. **Αναζήτηση** - Επιλέξτε τη στάση μετρό που σας ενδιαφέρει
2. **Ανακάλυψη** - Δείτε επιχειρήσεις και προσφορές σε ακτίνα 200 μέτρων
3. **Επίσκεψη** - Χρησιμοποιήστε την πλοήγηση για να φτάσετε στην επιχείρηση

## Για τις Επιχειρήσεις
1. **Εγγραφή** - Καταχωρήστε την επιχείρησή σας
2. **Προσφορές** - Δημιουργήστε ελκυστικές προσφορές
3. **Ανάπτυξη** - Αποκτήστε νέους πελάτες`,
          is_active: true
        },
        {
          slug: 'contact',
          title: 'Επικοινωνία',
          content: `# Επικοινωνία

## Στοιχεία Επικοινωνίας
- **Email:** info@buybymetro.gr
- **Τηλέφωνο:** +30 2310 123 456
- **Διεύθυνση:** Τσιμισκή 100, 54622 Θεσσαλονίκη

## Ωράριο Εξυπηρέτησης
- Δευτέρα - Παρασκευή: 9:00 - 18:00
- Σάββατο: 10:00 - 15:00
- Κυριακή: Κλειστά`,
          is_active: true
        },
        {
          slug: 'terms',
          title: 'Όροι Χρήσης',
          content: `# Όροι Χρήσης

## 1. Αποδοχή Όρων
Με την πρόσβαση και χρήση της πλατφόρμας MetroBusiness, αποδέχεστε πλήρως τους παρόντες όρους χρήσης.

## 2. Περιγραφή Υπηρεσίας
Το MetroBusiness είναι μια ψηφιακή πλατφόρμα που συνδέει τις τοπικές επιχειρήσεις της Θεσσαλονίκης με τους επιβάτες του μετρό.

## 3. Υποχρεώσεις Χρηστών
- Παροχή ακριβών στοιχείων
- Σεβασμός των δικαιωμάτων άλλων χρηστών
- Συμμόρφωση με την ισχύουσα νομοθεσία`,
          is_active: true
        },
        {
          slug: 'privacy',
          title: 'Πολιτική Απορρήτου',
          content: `# Πολιτική Απορρήτου

## 1. Συλλογή Προσωπικών Δεδομένων
Συλλέγουμε μόνο τα απαραίτητα δεδομένα για τη λειτουργία της πλατφόρμας.

## 2. Χρήση Δεδομένων
Χρησιμοποιούμε τα δεδομένα σας για:
- Παροχή και βελτίωση των υπηρεσιών μας
- Εξατομίκευση της εμπειρίας χρήσης
- Επικοινωνία σχετικά με την υπηρεσία

## 3. Προστασία Δεδομένων
Λαμβάνουμε σοβαρά μέτρα για την προστασία των προσωπικών σας δεδομένων.`,
          is_active: true
        },
        {
          slug: 'cookies',
          title: 'Πολιτική Cookies',
          content: `# Πολιτική Cookies

## Τι είναι τα Cookies
Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύονται στη συσκευή σας όταν επισκέπτεστε μια ιστοσελίδα.

## Τύποι Cookies που Χρησιμοποιούμε
- **Απαραίτητα Cookies:** Απαιτούνται για τη βασική λειτουργία
- **Cookies Ανάλυσης:** Μας βοηθούν να βελτιώσουμε την υπηρεσία
- **Cookies Marketing:** Για εξατομικευμένες προσφορές
- **Cookies Προτιμήσεων:** Θυμούνται τις ρυθμίσεις σας`,
          is_active: true
        }
      ];

      // Insert missing pages
      for (const page of defaultPages) {
        if (!existingSlugs.includes(page.slug)) {
          const { error: insertError } = await supabase
            .from('footer_pages')
            .insert([page]);

          if (insertError) {
            console.error(`Error inserting page ${page.slug}:`, insertError);
          }
        }
      }
    } catch (err) {
      console.error('Error initializing default pages:', err);
    }
  };

  const handleEdit = (page: FooterPage) => {
    setEditingPage(page.id);
    setEditFormData({
      title: page.title,
      content: page.content,
      is_active: page.is_active
    });
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingPage(null);
    setEditFormData({
      title: '',
      content: '',
      is_active: true
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (pageId: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error: updateError } = await supabase
        .from('footer_pages')
        .update({
          title: editFormData.title,
          content: editFormData.content,
          is_active: editFormData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId);

      if (updateError) throw updateError;

      setSuccess('Η σελίδα ενημερώθηκε με επιτυχία!');
      setEditingPage(null);
      await fetchPages();

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving page:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('footer_pages')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId);

      if (error) throw error;

      await fetchPages();
      setSuccess(`Η σελίδα ${!currentStatus ? 'ενεργοποιήθηκε' : 'απενεργοποιήθηκε'} με επιτυχία!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText size={20} className="mr-2" />
            Διαχείριση Σελίδων Footer
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Επεξεργαστείτε το περιεχόμενο των σελίδων που εμφανίζονται στο footer
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-700 text-sm">{success}</div>
        </div>
      )}

      <div className="space-y-4">
        {pages.map((page) => (
          <div key={page.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {editingPage === page.id ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Επεξεργασία: {page.slug}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(page.id)}
                      disabled={saving}
                      className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={16} className="mr-2" />
                      {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X size={16} className="mr-2" />
                      Ακύρωση
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Τίτλος Σελίδας
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Εισάγετε τον τίτλο της σελίδας"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Περιεχόμενο (Markdown)
                    </label>
                    <textarea
                      value={editFormData.content}
                      onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-sm"
                      rows={20}
                      placeholder="Εισάγετε το περιεχόμενο σε μορφή Markdown..."
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Υποστηρίζεται Markdown: # για τίτλους, ## για υπότιτλους, **bold**, *italic*, - για λίστες
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`active-${page.id}`}
                      checked={editFormData.is_active}
                      onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor={`active-${page.id}`} className="text-sm text-gray-700">
                      Ενεργή σελίδα (ορατή στο footer)
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <FileText size={20} className="text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-sm text-gray-500">/{page.slug}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            page.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {page.is_active ? 'Ενεργή' : 'Ανενεργή'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(page.id, page.is_active)}
                      className={`p-2 rounded hover:bg-gray-100 ${
                        page.is_active ? 'text-red-600' : 'text-green-600'
                      }`}
                      title={page.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                    >
                      {page.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleEdit(page)}
                      className="p-2 text-indigo-600 hover:bg-gray-100 rounded"
                      title="Επεξεργασία"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                  <div className="whitespace-pre-wrap line-clamp-4">
                    {page.content.substring(0, 200)}
                    {page.content.length > 200 && '...'}
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Τελευταία ενημέρωση: {new Date(page.updated_at).toLocaleDateString('el-GR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Οδηγίες Χρήσης</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Κάντε κλικ στο κουμπί επεξεργασίας για να αλλάξετε το περιεχόμενο μιας σελίδας</li>
          <li>• Χρησιμοποιήστε Markdown για μορφοποίηση (# για τίτλους, ## για υπότιτλους, **bold**)</li>
          <li>• Απενεργοποιήστε σελίδες που δεν θέλετε να εμφανίζονται στο footer</li>
          <li>• Οι αλλαγές εφαρμόζονται αμέσως μετά την αποθήκευση</li>
        </ul>
      </div>
    </div>
  );
};

export default FooterPagesManagement;