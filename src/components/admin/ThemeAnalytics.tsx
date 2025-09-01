'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { 
  Palette, 
  TrendingUp, 
  Users, 
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ThemeUsage {
  themeId: string
  themeName: string
  count: number
  percentage: string
}

interface DailyUsage {
  date: string
  count: number
}

interface RecentSelection {
  id: string
  themeId: string
  themeName: string
  selectedAt: string
  user: {
    email: string
    name: string | null
  }
  catalogue: {
    name: string
  }
}

interface ThemeAnalyticsData {
  totalSelections: number
  uniqueUsers: number
  timeRange: number
  themeUsage: ThemeUsage[]
  dailyUsage: DailyUsage[]
  recentSelections: RecentSelection[]
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
]

export function ThemeAnalytics() {
  const [data, setData] = useState<ThemeAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/theme-analytics?timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch theme analytics')
      }
      
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      console.error('Error fetching theme analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const exportData = () => {
    if (!data) return
    
    const csvContent = [
      ['Theme ID', 'Theme Name', 'Usage Count', 'Percentage'].join(','),
      ...data.themeUsage.map(theme => 
        [theme.themeId, theme.themeName, theme.count, theme.percentage].join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `theme-analytics-${timeRange}days.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Theme Analytics</h2>
          <div className="animate-spin">
            <RefreshCw className="h-5 w-5" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Theme Analytics</h2>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-2">Error loading analytics</div>
            <div className="text-gray-600">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Theme Analytics
        </h2>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Selections</p>
                <p className="text-2xl font-bold">{data.totalSelections.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold">{data.uniqueUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Range</p>
                <p className="text-2xl font-bold">{data.timeRange} days</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. per Day</p>
                <p className="text-2xl font-bold">
                  {Math.round(data.totalSelections / data.timeRange)}
                </p>
              </div>
              <Palette className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usage">Theme Usage</TabsTrigger>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Usage Distribution</CardTitle>
                <CardDescription>
                  Number of times each theme was selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.themeUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="themeName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Popularity</CardTitle>
                <CardDescription>
                  Percentage distribution of theme usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.themeUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ themeName, percentage }) => `${themeName} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.themeUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage Trends</CardTitle>
              <CardDescription>
                Theme selections over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Theme Selections"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Theme Selections</CardTitle>
              <CardDescription>
                Latest theme selections by users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentSelections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No recent theme selections found
                  </div>
                ) : (
                  data.recentSelections.map((selection) => (
                    <div key={selection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div>
                          <div className="font-medium">{selection.themeName}</div>
                          <div className="text-sm text-gray-600">
                            {selection.user.name || selection.user.email} • {selection.catalogue.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{selection.themeId}</Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(selection.selectedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}