import { useState } from 'react'
import { Header } from './components/layout/Header'
import { HomePage } from './pages/HomePage'
import { DesignerPage } from './pages/DesignerPage'
import { GalleryPage } from './pages/GalleryPage'
import { ProfilePage } from './pages/ProfilePage'
import { Toaster } from './components/ui/toaster'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />
      case 'designer':
        return <DesignerPage />
      case 'gallery':
        return <GalleryPage onNavigate={setCurrentPage} />
      case 'profile':
        return <ProfilePage />
      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main>
        {renderPage()}
      </main>
      <Toaster />
    </div>
  )
}

export default App