import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import ItemPage from './pages/ItemPage'
import UploadPage from './pages/UploadPage'
import CallbackPage from './pages/CallbackPage'
import ReviewPage from './pages/ReviewPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/item/:slug" element={<ItemPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/callback" element={<CallbackPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="bg-[#0f172a] text-slate-400 text-sm py-6 mt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>
                <span className="text-white font-semibold">Servicely Bazaar</span> — Community marketplace for Change Sets
              </span>
              <span className="text-slate-500 text-xs">Powered by GitHub</span>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Page not found</h1>
      <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
      <a
        href="/"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        Back to marketplace
      </a>
    </div>
  )
}
