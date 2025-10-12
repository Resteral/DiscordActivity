import { HashRouter, Route, Routes } from 'react-router'
import HomePage from './pages/Home'
import DiscordActivity from './pages/DiscordActivity'
import DiscordTest from './pages/DiscordTest'
import { DiscordReady } from './components/discord/DiscordReady'

export default function App() {
  return (
    <DiscordReady>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/activity" element={<DiscordActivity />} />
          <Route path="/test" element={<DiscordTest />} />
        </Routes>
      </HashRouter>
    </DiscordReady>
  )
}
