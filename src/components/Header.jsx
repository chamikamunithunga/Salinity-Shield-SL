import { RefreshCw, Wifi, WifiOff, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header({ onRefresh, isLoading, onMenuClick }) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Simulate online status
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.1) // 90% chance of being online
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-navy-800 border-b border-navy-700 px-4 lg:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 lg:gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-white hover:text-blue-400 transition-colors"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg lg:text-2xl font-bold text-white">Salinity Shield SL</h2>
        <div className="hidden sm:flex items-center gap-2">
          {isOnline ? (
            <Wifi className="text-green-400" size={20} />
          ) : (
            <WifiOff className="text-red-400" size={20} />
          )}
          <span className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
            {isOnline ? 'System Online' : 'System Offline'}
          </span>
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
      >
        <RefreshCw 
          size={18} 
          className={isLoading ? 'animate-spin' : ''} 
        />
        <span className="hidden sm:inline">Refresh Data</span>
        <span className="sm:hidden">Refresh</span>
      </button>
    </header>
  )
}

