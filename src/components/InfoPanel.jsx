import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, AlertCircle as ErrorIcon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function InfoPanel({ currentRisk, wse, riverSlope, error }) {
  const getRiskConfig = (risk) => {
    switch (risk) {
      case 'Danger':
        return {
          color: 'bg-red-500',
          borderColor: 'border-red-500',
          textColor: 'text-red-500',
          icon: AlertTriangle,
          label: 'Danger',
        }
      case 'Caution':
        return {
          color: 'bg-yellow-500',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-500',
          icon: AlertCircle,
          label: 'Caution',
        }
      case 'Safe':
        return {
          color: 'bg-green-500',
          borderColor: 'border-green-500',
          textColor: 'text-green-500',
          icon: CheckCircle,
          label: 'Safe',
        }
      default:
        return {
          color: 'bg-gray-500',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-500',
          icon: AlertCircle,
          label: 'Unknown',
        }
    }
  }

  const riskConfig = getRiskConfig(currentRisk)
  const RiskIcon = riskConfig.icon

  // Generate sample data for the last 7 days
  const generateChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, index) => ({
      day,
      level: (Math.random() * 2 + 1.5).toFixed(2),
    }))
  }

  const chartData = generateChartData()

  return (
    <div className="w-full lg:w-80 bg-navy-800 border-t lg:border-t-0 lg:border-l border-navy-700 overflow-y-auto max-h-[50vh] lg:max-h-none">
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-start gap-3">
            <ErrorIcon className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-1">Data Fetch Error</h4>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
        )}
        
        {/* Risk Level Card */}
        <div className={`bg-navy-700 rounded-lg p-6 border-2 ${riskConfig.borderColor}`}>
          <div className="flex items-center gap-3 mb-4">
            <RiskIcon className={riskConfig.textColor} size={24} />
            <h3 className="text-lg font-semibold text-white">Current Risk Level</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-3xl font-bold ${riskConfig.textColor}`}>
              {riskConfig.label}
            </span>
            <div className={`w-12 h-12 rounded-full ${riskConfig.color} flex items-center justify-center`}>
              <RiskIcon className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="bg-navy-700 rounded-lg p-4 lg:p-5 border border-navy-600">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs lg:text-sm font-medium text-navy-300">Water Surface Elevation</h4>
              <TrendingUp className="text-blue-400" size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-bold text-white">{wse}</span>
              <span className="text-xs lg:text-sm text-navy-400">m</span>
            </div>
            <p className="text-xs text-navy-400 mt-1">WSE</p>
          </div>

          <div className="bg-navy-700 rounded-lg p-4 lg:p-5 border border-navy-600">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs lg:text-sm font-medium text-navy-300">River Slope</h4>
              <TrendingUp className="text-blue-400" size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-bold text-white">{riverSlope}</span>
              <span className="text-xs lg:text-sm text-navy-400">m/m</span>
            </div>
            <p className="text-xs text-navy-400 mt-1">Gradient</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-navy-700 rounded-lg p-5 border border-navy-600">
          <h4 className="text-sm font-medium text-white mb-4">Water Level Trend (7 Days)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334e68" />
              <XAxis 
                dataKey="day" 
                stroke="#9fb3c8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9fb3c8"
                style={{ fontSize: '12px' }}
                label={{ value: 'Level (m)', angle: -90, position: 'insideLeft', style: { fill: '#9fb3c8', fontSize: '12px' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#243b53', 
                  border: '1px solid #334e68',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="level" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

