import { HashRouter, Route, Routes } from 'react-router'
import HomePage from './pages/Home'
import { DiscordReady } from './components/discord/DiscordReady'

export default function App() {
  return (
    <DiscordReady>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </HashRouter>
    </DiscordReady>
  )
}
