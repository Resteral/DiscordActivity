/**
 * Home Page Component
 * Main landing page with navigation to Discord activity
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4">🏒 Zealot Hockey</h1>
        <p className="text-xl mb-8">Professional Tournament Management</p>
        
        <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-3">
            <a 
              href="#/activity" 
              className="block bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg transition-colors"
            >
              Discord Activity
            </a>
            <a 
              href="#/test" 
              className="block bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg transition-colors"
            >
              Test Page
            </a>
          </div>
        </div>

        <div className="text-sm opacity-75">
          <p>Site is working correctly - Discord integration ready</p>
        </div>
      </div>
    </div>
  )
}