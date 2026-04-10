'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function StaffPage() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'viewer',
  })
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      fetchStaff(session.user.id)
    }
    init()
  }, [router])

  const fetchStaff = async (churchId) => {
    const { data, error } = await supabase
      .from('church_users')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false })
    if (!error) setStaffList(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          church_name: session.user.user_metadata?.church_name,
          role: form.role,
          church_id: session.user.id,
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setSaving(false)
      return
    }

    const { error: dbError } = await supabase
      .from('church_users')
      .insert([{
        church_id: session.user.id,
        email: form.email,
        full_name: form.full_name,
        role: form.role,
      }])

    if (dbError) {
      setError(dbError.message)
    } else {
      setSuccess(`Account created for ${form.full_name}! They can log in with ${form.email}`)
      setForm({ full_name: '', email: '', password: '', role: 'viewer' })
      setShowForm(false)
      fetchStaff(session.user.id)
    }
    setSaving(false)
  }

  const handleDelete = async (id, email) => {
    if (!confirm(`Remove ${email} from your staff list?`)) return
    await supabase.from('church_users').delete().eq('id', id)
    const { data: { session } } = await supabase.auth.getSession()
    fetchStaff(session.user.id)
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    finance: 'bg-green-100 text-green-700',
    secretary: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600',
  }

  const roleDescriptions = {
    admin: 'Full access to everything',
    finance: 'Contributions and reports only',
    secretary: 'Members and attendance only',
    viewer: 'Read-only access',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold text-green-600">FaithDesk</a>
        <a href="/dashboard" className="text-sm text-gray-500 hover:underline">Back to dashboard</a>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Staff & Access</h2>
            <p className="text-gray-500 text-sm mt-1">Manage who can access your FaithDesk account</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            {showForm ? 'Cancel' : '+ Invite staff'}
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-blue-800 text-sm mb-2">Role access levels</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(roleDescriptions).map(([role, desc]) => (
              <div key={role} className="bg-white rounded-lg p-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[role]}`}>{role}</span>
                <p className="text-xs text-gray-500 mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-800 mb-4">Invite new staff member</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Abena Mensah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="abena@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary password</label>
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="They can change this later" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="admin">Admin — full access</option>
                  <option value="finance">Finance — contributions and reports</option>
                  <option value="secretary">Secretary — members and attendance</option>
                  <option value="viewer">Viewer — read only</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm col-span-2">{error}</p>}
              <div className="col-span-2">
                <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                  {saving ? 'Creating account...' : 'Create staff account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading staff...</p>
        ) : staffList.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-lg">No staff members yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "+ Invite staff" to give someone access</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{staff.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{staff.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[staff.role] || 'bg-gray-100 text-gray-600'}`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(staff.id, staff.email)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}