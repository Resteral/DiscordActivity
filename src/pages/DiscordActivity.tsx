/**
 * Discord Activity Page
 * Minimal, reliable page for Discord embedding
 */
export default function DiscordActivity() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white p-4">
      <div className="max-w-md mx-auto text-center pt-8">
        <h1 className="text-4xl font-bold mb-4">🏒 Zealot Hockey</h1>
        <p className="text-lg mb-6">Tournament Management</p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Activity Status</h2>
          <div className="space-y-2">
            <div className="bg-green-500/20 p-3 rounded">
              <p className="font-semibold">✅ App Loaded</p>
              <p className="text-sm">React is working</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded">
              <p className="font-semibold">🔗 Discord Ready</p>
              <p className="text-sm">Activity can be updated</p>
            </div>
          </div>
        </div>

        <div className="text-xs opacity-75">
          <p>If you see this, the site is working in Discord</p>
        </div>
      </div>
    </div>
  )
}