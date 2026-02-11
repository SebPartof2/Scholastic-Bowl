import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Rankings from './pages/Rankings'
import TeamDetail from './pages/TeamDetail'
import Matchup from './pages/Matchup'
import EnterResults from './pages/EnterResults'
import Seasons from './pages/Seasons'
import Teams from './pages/Teams'
import Scrape from './pages/Scrape'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/rankings" replace />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="/matchup" element={<Matchup />} />
        <Route path="/admin/enter" element={<EnterResults />} />
        <Route path="/admin/seasons" element={<Seasons />} />
        <Route path="/admin/scrape" element={<Scrape />} />
      </Routes>
    </Layout>
  )
}
