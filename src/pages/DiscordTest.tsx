/**
 * Minimal Discord Activity Test Page
 * Barebones version to test basic functionality
 */
export default function DiscordTest() {
  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      minHeight: '100vh',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🎯 Discord Activity Test</h1>
      <p>If you can see this, the app is loading in Discord.</p>
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        background: 'rgba(255,255,255,0.2)', 
        borderRadius: '8px' 
      }}>
        <strong>Status:</strong> ✅ Basic rendering working
      </div>
    </div>
  );
}