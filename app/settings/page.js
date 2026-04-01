'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [form, setForm] = useState({
    church_name: '',
    denomination: '',
    city: '',
    phone: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/')
      return
    }
    setUser(session.user)
    setForm({
      church_name: session.user.user_metadata?.church_name || '',
      denomination: session.user.user_metadata?.denomination || '',
      city: session.user.user_metadata?.city || '',
      phone: session.user.user_metadata?.phone || '',
    })
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const { error } = await supabase.auth.updateUser({
      data: {
        church_name: form.church_name,
        denomination: form.denomination,
        city: form.city,
        phone: form.phone,
      }
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Church profile updated successfully!')
    }
    setSaving(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword
    })
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess('Password updated successfully!')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    }
    setSavingPassword(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold text-green-600">FaithDesk</a>
        <a href="/dashboard" className="text-sm text-gray-500 hover:underline">Back to dashboard</a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your church profile and account</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="font-medium text-gray-800 mb-1">Account info</h3>
          <p className="text-sm text-gray-500 mb-4">Your login email address</p>
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700">
            {user?.email}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="font-medium text-gray-800 mb-1">Church profile</h3>
          <p className="text-sm text-gray-500 mb-4">Update your church information</p>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Church name</label>
              <input
                type="text"
                value={form.church_name}
                onChange={(e) => setForm({ ...form, church_name: e.target.value })}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Grace Assembly Church"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Denomination</label>
              <select
                value={form.denomination}
                onChange={(e) => setForm({ ...form, denomination: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select denomination</option>
                <option value="Pentecostal">Pentecostal</option>
                <option value="Catholic">Catholic</option>
                <option value="Anglican">Anglican</option>
                <option value="Methodist">Methodist</option>
                <option value="Baptist">Baptist</option>
                <option value="Presbyterian">Presbyterian</option>
                <option value="Charismatic">Charismatic</option>
                <option value="Independent">Independent</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Accra"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+233 XX XXX XXXX"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="font-medium text-gray-800 mb-1">Change password</h3>
          <p className="text-sm text-gray-500 mb-4">Update your account password</p>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Repeat new password"
              />
            </div>
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-600 text-sm">{passwordSuccess}</p>}
            <button
              type="submit"
              disabled={savingPassword}
              className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {savingPassword ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-red-100 p-6">
          <h3 className="font-medium text-red-600 mb-1">Sign out</h3>
          <p className="text-sm text-gray-500 mb-4">Sign out of your FaithDesk account</p>
          <button
            onClick={handleLogout}
            className="border border-red-200 text-red-500 px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </div>

      </div>
    </div>
  )
}