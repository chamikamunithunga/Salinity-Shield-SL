import { Map, History, Bell, FileText, X } from 'lucide-react'

const menuItems = [
  { id: 'Live Map', icon: Map, label: 'Live Map' },
  { id: 'History', icon: History, label: 'History' },
  { id: 'Alert Settings', icon: Bell, label: 'Alert Settings' },
  { id: 'Reports', icon: FileText, label: 'Reports' },
]

export default function Sidebar({ activeView, setActiveView, sidebarOpen, setSidebarOpen }) {
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-navy-800 text-white flex flex-col border-r border-navy-700
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-navy-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-400">Salinity Shield</h1>
            <p className="text-sm text-navy-300 mt-1">Early Warning System</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-navy-300 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-navy-700">
          <p className="text-xs text-navy-400 text-center">
            © 2024 Salinity Shield SL
          </p>
        </div>
      </div>
    </>
  )
}

