'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/Header'
import { Bell, Globe, Shield, Eye, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AppSettings {
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    showEmail: boolean
    showPhone: boolean
  }
  language: string
  timezone: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false
    },
    language: 'en',
    timezone: 'UTC'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
    setLoading(false)
  }, [])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('appSettings', JSON.stringify(settings))
      
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current: any = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Header title="Settings" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Header title="Settings" />
      


      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) => updateSettings('notifications.email', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-gray-500">Receive push notifications in browser</p>
            </div>
            <Switch
              checked={settings.notifications.push}
              onCheckedChange={(checked) => updateSettings('notifications.push', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Communications</Label>
              <p className="text-sm text-gray-500">Receive updates about new features and offers</p>
            </div>
            <Switch
              checked={settings.notifications.marketing}
              onCheckedChange={(checked) => updateSettings('notifications.marketing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>
            Control your privacy and data visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <Select
              value={settings.privacy.profileVisibility}
              onValueChange={(value) => updateSettings('privacy.profileVisibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Email in Profile</Label>
              <p className="text-sm text-gray-500">Make your email visible to other users</p>
            </div>
            <Switch
              checked={settings.privacy.showEmail}
              onCheckedChange={(checked) => updateSettings('privacy.showEmail', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Phone in Profile</Label>
              <p className="text-sm text-gray-500">Make your phone number visible to other users</p>
            </div>
            <Switch
              checked={settings.privacy.showPhone}
              onCheckedChange={(checked) => updateSettings('privacy.showPhone', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
          <CardDescription>
            Set your language and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => updateSettings('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => updateSettings('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800">Clear All Data</h4>
              <p className="text-sm text-red-600 mt-1">
                This will permanently delete all your data and cannot be undone.
              </p>
              <Button variant="destructive" size="sm" className="mt-3">
                Clear All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}