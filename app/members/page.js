'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    gender: '',
    date_of_birth: '',
    status: 'active',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchMembers()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const fetchMembers = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('church_id', session.user.id)
      .order('full_name', { ascending: true })
    if (!error) setMembers(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase
      .from('members')
      .insert([{ ...form, church_id: session.user.id }])
    if (error) {
      setError(error.message)
    } else {
      setForm({ full_name: '', phone: '', email: '', gender: '', date_of_birth: '', status: 'active' })
      setShowForm(false)
      fetchMembers()
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this member?')) return
    await supabase.from('members').delete().eq('id', id)
    fetchMembers()
  }

  const getAge = (dob) => {
    if (!dob) return null
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const getAgeGroup = (dob) => {
    const age = getAge(dob)
    if (age === null) return null
    if (age < 13) return 'children'
    if (age < 25) return 'youth'
    if (age < 60) return 'adult'
    return 'senior'
  }

  const filtered = members.filter(m => {
    const matchSearch = m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search))
    const matchGender = filterGender === '' || m.gender === filterGender
    const matchStatus = filterStatus === '' || m.status === filterStatus
    const matchAge = filterAge === '' || getAgeGroup(m.date_of_birth) === filterAge
    return matchSearch && matchGender && matchStatus && matchAge
  })

  const clearFilters = () => {
    setSearch('')
    setFilterGender('')
    setFilterStatus('')
    setFilterAge('')
  }

  const activeFilters = [filterGender, filterStatus, filterAge].filter(f => f !== '').length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold text-green-600">FaithDesk</a>
        <a href="/dashboard" className="text-sm text-gray-500 hover:underline">Back to dashboard</a>
      </nav>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Members</h2>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} of {members.length} members</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            {showForm ? 'Cancel' : '+ Add member'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-800 mb-4">Add new member</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Kofi Mensah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="+233 XX XXX XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="kofi@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm col-span-2">{error}</p>}
              <div className="col-span-2">
                <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save member'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone..." className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select value={filterAge} onChange={(e) => setFilterAge(e.target.value)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All age groups</option>
              <option value="children">Children (under 13)</option>
              <option value="youth">Youth (13-24)</option>
              <option value="adult">Adult (25-59)</option>
              <option value="senior">Senior (60+)</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="mt-2 text-sm text-green-600 hover:underline">
              Clear all filters ({activeFilters} active)
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading members...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-lg">No members found</p>
            <p className="text-gray-400 text-sm mt-1">{members.length === 0 ? 'Click "+ Add member" to get started' : 'Try adjusting your filters'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gender</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Age</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800 text-sm">{member.full_name}</p>
                      <p className="text-gray-400 text-xs">{member.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.gender || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getAge(member.date_of_birth) !== null ? <span>{getAge(member.date_of_birth)} yrs</span> : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.status === 'active' ? 'bg-green-100 text-green-700' : member.status === 'visitor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(member.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
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