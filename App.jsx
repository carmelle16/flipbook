import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './Layout'
import Dashboard from './Pages/Dashboard'
import CreateFlipbook from './Pages/CreateFlipbook'
import FlipbookViewer from './Pages/FlipbookViewer'
import Studio from './Pages/Studio'

// Create a QueryClient instance
const queryClient = new QueryClient()

export default function App() {
  const [currentPage, setCurrentPage] = React.useState('Dashboard')

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout currentPageName={currentPage}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateFlipbook />} />
            <Route path="/viewer/:id" element={<FlipbookViewer />} />
            <Route path="/studio/:id" element={<Studio />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  )
}
