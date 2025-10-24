/**
 * Discord Test Page
 * Absolute minimal page to verify basic functionality
 */
export default function DiscordTest() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        🎯 Discord Test
      </h1>
      <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
        Basic rendering test - if you see this, React is working
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: '1rem',
        borderRadius: '8px'
      }}>
        <p style={{ fontWeight: '600' }}>✅ Status: Working</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>No JavaScript errors</p>
      </div>
    </div>
  )
}