import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import MapView from './components/MapView'
import InfoPanel from './components/InfoPanel'
import { fetchHydrologyData } from './firebase'
import { DEFAULT_REACH_ID } from './config'

function App() {
  const [activeView, setActiveView] = useState('Live Map')
  const [isLoading, setIsLoading] = useState(false)
  const [currentRisk, setCurrentRisk] = useState('Caution') // 'Safe', 'Caution', 'Danger'
  const [wse, setWse] = useState(2.45)
  const [riverSlope, setRiverSlope] = useState(0.0012)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState(null)

  // Fetch data on component mount
  useEffect(() => {
    handleRefresh()
  }, [])

  const handleRefresh = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Call Firebase Cloud Function using the SDK
      const result = await fetchHydrologyData({
        reach_id: DEFAULT_REACH_ID
      })

      // Firebase callable functions return data directly in result.data
      const data = result.data

      // Check for error in response
      if (data.error || (data.current_wse === null && data.current_slope === null)) {
        const errorMsg = data.error || data.message || 'No data available'
        setError(errorMsg)
        console.error('API Error:', errorMsg, data.details || '')
        // Keep existing values on error
      } else {
        // Update state with fetched data
        setWse(parseFloat(data.current_wse).toFixed(2))
        setRiverSlope(parseFloat(data.current_slope).toFixed(4))
        
        // Map risk levels: Firebase returns "Warning", UI uses "Caution"
        const riskLevel = data.risk_level === 'Warning' ? 'Caution' : data.risk_level
        setCurrentRisk(riskLevel)
      }
    } catch (err) {
      // Handle Firebase function errors
      let errorMessage = 'Failed to fetch data'
      if (err.code === 'functions/invalid-argument') {
        errorMessage = err.message || 'Invalid Reach ID. Please update the Reach ID in your configuration.'
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.details?.message) {
        errorMessage = err.details.message
      }
      
      // Add helpful hint if it's about Reach ID
      if (errorMessage.includes('Reach ID') || errorMessage.includes('reach_id')) {
        errorMessage += ' Visit NASA Hydrocron API documentation to find valid Reach IDs.'
      }
      
      setError(errorMessage)
      console.error('Firebase function error:', err)
      // Keep existing values on error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onRefresh={handleRefresh} 
          isLoading={isLoading}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 relative min-h-[400px] lg:min-h-0">
            <MapView currentRisk={currentRisk} />
          </div>
          <InfoPanel 
            currentRisk={currentRisk}
            wse={wse}
            riverSlope={riverSlope}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}

export default App

