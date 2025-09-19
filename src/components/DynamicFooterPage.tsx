import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface FooterPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_active: boolean;
}

const DynamicFooterPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<FooterPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPage(slug);
    }
  }, [slug]);

  const fetchPage = async (pageSlug: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('footer_pages')
        .select('*')
        .eq('slug', pageSlug)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Η σελίδα δεν βρέθηκε ή δεν είναι διαθέσιμη');
        } else {
          throw fetchError;
        }
        return;
      }

      setPage(data);
    } catch (err: any) {
      console.error('Error fetching page:', err);
      setError('Σφάλμα κατά τη φόρτωση της σελίδας');
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown parser for basic formatting
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-800 mb-3 mt-6">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-800 mb-4 mt-8">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mb-6">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Lists
      .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="text-gray-600 leading-relaxed mb-4">')
      // Wrap in paragraphs
      .replace(/^(?!<[h|l])/gm, '<p class="text-gray-600 leading-relaxed mb-4">');

    // Close any unclosed paragraphs
    if (!html.endsWith('</p>') && !html.endsWith('</h1>') && !html.endsWith('</h2>') && !html.endsWith('</h3>') && !html.endsWith('</li>')) {
      html += '</p>';
    }

    // Wrap lists
    html = html.replace(/(<li.*?<\/li>\s*)+/g, '<ul class="space-y-2 mb-4">$&</ul>');

    return html;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Επιστροφή στην αρχική
          </button>

          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Σελίδα δεν βρέθηκε</h1>
            <p className="text-gray-600 mb-6">
              {error || 'Η σελίδα που ζητήσατε δεν υπάρχει ή δεν είναι διαθέσιμη.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Επιστροφή στην αρχική
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Επιστροφή στην αρχική
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
          />
        </div>
      </div>
    </div>
  );
};

export default DynamicFooterPage;