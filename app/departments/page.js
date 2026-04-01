'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchDepartments()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const fetchDepartments = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('church_id', session.user.id)
      .order('name', { ascending: true })
    if (!error) setDepartments(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase
      .from('departments')
      .insert([{ ...form, church_id: session.user.id }])
    if (error) {
      setError(error.message)
    } else {
      setForm({ name: '', description: '' })
      setShowForm(false)
      fetchDepartments()
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return
    await supabase.from('departments').delete().eq('id', id)
    fetchDepartments()
  }

  const defaultDepartments = [
    'Choir', 'Ushers', 'Youth Ministry', 'Children Ministry',
    'Women Fellowship', 'Men Fellowship', 'Prayer Team', 'Media Team',
    'Finance Team', 'Evangelism', 'Welfare', 'Sanctuary Keepers'
  ]

  const addDefault = async (name) => {
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('departments').insert([{ name, description: '', church_id: session.user.id }])
    fetchDepartments()
  }

  const existingNames = departments.map(d => d.name)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold text-green-600">FaithDesk</a>
        <a href="/dashboard" className="text-sm text-gray-500 hover:underline">Back to dashboard</a>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Departments</h2>
            <p className="text-gray-500 text-sm mt-1">{departments.length} departments</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            {showForm ? 'Cancel' : '+ Add department'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-800 mb-4">Add new department</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Choir, Ushers, Youth Ministry"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Brief description of this department"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save department'}
              </button>
            </form>
          </div>
        )}

        {departments.length === 0 && !showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Quick add common departments</h3>
            <p className="text-sm text-gray-500 mb-4">Click any to add it instantly</p>
            <div className="flex flex-wrap gap-2">
              {defaultDepartments.map((name) => (
                <button
                  key={name}
                  onClick={() => addDefault(name)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-green-400 hover:text-green-700 transition"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {departments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h3 className="font-medium text-gray-800 mb-2 text-sm">Quick add more departments</h3>
            <div className="flex flex-wrap gap-2">
              {defaultDepartments.filter(n => !existingNames.includes(n)).map((name) => (
                <button
                  key={name}
                  onClick={() => addDefault(name)}
                  className="border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-600 hover:border-green-400 hover:text-green-700 transition"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading departments...</p>
        ) : departments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-lg">No departments yet</p>
            <p className="text-gray-400 text-sm mt-1">Add departments or use the quick add buttons above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{dept.name}</h3>
                  {dept.description && (
                    <p className="text-sm text-gray-500 mt-1">{dept.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="text-red-400 hover:text-red-600 text-sm ml-4 flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}