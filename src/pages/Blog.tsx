import React, { useState } from 'react';
import { ArrowLeft, Calendar, User, ArrowRight, Tag, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Το Μετρό Θεσσαλονίκης Αλλάζει την Πόλη',
    excerpt: 'Πώς το νέο μετρό επηρεάζει τις τοπικές επιχειρήσεις και δημιουργεί νέες ευκαιρίες για ανάπτυξη.',
    content: 'Το μετρό Θεσσαλονίκης αποτελεί έναν καταλύτη αλλαγής για την πόλη...',
    author: 'Ομάδα MetroBusiness',
    date: '15 Ιανουαρίου 2025',
    readTime: '5 λεπτά',
    category: 'Μετρό',
    image: 'https://images.pexels.com/photos/3987020/pexels-photo-3987020.jpeg'
  },
  {
    id: '2',
    title: '5 Τρόποι να Αυξήσετε τις Πωλήσεις σας με το MetroBusiness',
    excerpt: 'Πρακτικές συμβουλές για επιχειρήσεις που θέλουν να αξιοποιήσουν στο μέγιστο την πλατφόρμα μας.',
    content: 'Η τοποθεσία κοντά σε στάση μετρό είναι μόνο η αρχή...',
    author: 'Μάρκος Παπαδόπουλος',
    date: '10 Ιανουαρίου 2025',
    readTime: '7 λεπτά',
    category: 'Επιχειρήσεις',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg'
  },
  {
    id: '3',
    title: 'Οι Καλύτερες Προσφορές του Μήνα',
    excerpt: 'Ανακαλύψτε τις πιο δημοφιλείς προσφορές που προσφέρουν οι επιχειρήσεις κοντά στο μετρό.',
    content: 'Κάθε μήνα συγκεντρώνουμε τις καλύτερες προσφορές...',
    author: 'Ελένη Κωνσταντίνου',
    date: '5 Ιανουαρίου 2025',
    readTime: '4 λεπτά',
    category: 'Προσφορές',
    image: 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg'
  },
  {
    id: '4',
    title: 'Πώς να Βρείτε την Ιδανική Επιχείρηση για τις Ανάγκες σας',
    excerpt: 'Οδηγός για καταναλωτές: χρησιμοποιήστε τα φίλτρα και τις λειτουργίες αναζήτησης αποτελεσματικά.',
    content: 'Η αναζήτηση της κατάλληλης επιχείρησης μπορεί να είναι εύκολη...',
    author: 'Νίκος Γεωργίου',
    date: '28 Δεκεμβρίου 2024',
    readTime: '6 λεπτά',
    category: 'Οδηγοί',
    image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg'
  }
];

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Μετρό': return 'bg-blue-100 text-blue-800';
      case 'Επιχειρήσεις': return 'bg-green-100 text-green-800';
      case 'Προσφορές': return 'bg-rose-100 text-rose-800';
      case 'Οδηγοί': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Επιστροφή στο blog
          </button>

          <article className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-64 md:h-80 overflow-hidden">
              <img 
                src={selectedPost.image} 
                alt={selectedPost.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedPost.category)}`}>
                  <Tag size={14} className="mr-1" />
                  {selectedPost.category}
                </span>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar size={14} className="mr-1" />
                  {selectedPost.date}
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock size={14} className="mr-1" />
                  {selectedPost.readTime}
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
              
              <div className="flex items-center mb-6">
                <User size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-600">{selectedPost.author}</span>
              </div>

              <div className="prose max-w-none">
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {selectedPost.excerpt}
                </p>
                
                <div className="text-gray-700 leading-relaxed space-y-4">
                  <p>
                    {selectedPost.content} Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad 
                    minim veniam, quis nostrud exercitation ullamco laboris.
                  </p>
                  
                  <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                    eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
                    sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Κύρια Σημεία</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Αυξημένη προσβασιμότητα για τις επιχειρήσεις</li>
                    <li>Νέες ευκαιρίες για τους καταναλωτές</li>
                    <li>Βιώσιμη αστική ανάπτυξη</li>
                    <li>Ενίσχυση της τοπικής οικονομίας</li>
                  </ul>
                  
                  <p>
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
                    doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
                    veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Επιστροφή στην αρχική
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog</h1>
          <p className="text-gray-600 text-lg">
            Ενημερωθείτε για τα νέα του μετρό, συμβουλές για επιχειρήσεις και τις καλύτερες προσφορές της πόλης.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article 
              key={post.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                    <Tag size={12} className="mr-1" />
                    {post.category}
                  </span>
                  <div className="flex items-center text-gray-500 text-xs">
                    <Clock size={12} className="mr-1" />
                    {post.readTime}
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-500 text-sm">
                    <User size={14} className="mr-1" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar size={14} className="mr-1" />
                    <span>{post.date}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-rose-600 text-sm font-medium hover:text-rose-700">
                    Διαβάστε περισσότερα
                    <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-8 mt-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Μείνετε Ενημερωμένοι</h2>
          <p className="mb-6 text-rose-100">
            Εγγραφείτε στο newsletter μας για να λαμβάνετε τα νέα του μετρό και τις καλύτερες προσφορές.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Το email σας"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-6 py-3 bg-white text-rose-600 rounded-lg hover:bg-gray-100 transition-colors font-medium">
              Εγγραφή
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;