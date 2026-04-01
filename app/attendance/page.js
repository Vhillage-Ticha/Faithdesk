'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AttendancePage() {
  const [services, setServices] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [attendance, setAttendance] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    title: '',
    service_date: new Date().toISOString().split('T')[0],
    service_type: 'Sunday Service',
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchServices()
    fetchMembers()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const fetchServices = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('church_id', session.user.id)
      .order('service_date', { ascending: false })
    setServices(data || [])
    setLoading(false)
  }

  const fetchMembers = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('church_id', session.user.id)
      .eq('status', 'active')
      .order('full_name', { ascending: true })
    setMembers(data || [])
  }

  const handleCreateService = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase
      .from('services')
      .insert([{ ...form, church_id: session.user.id }])
      .select()
    if (!error && data) {
      setShowForm(false)
      setForm({ title: '', service_date: new Date().toISOString().split('T')[0], service_type: 'Sunday Service' })
      fetchServices()
      openService(data[0])
    }
    setSaving(false)
  }

  const openService = async (service) => {
    setSelectedService(service)
    setSearch('')
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('service_id', service.id)
    const attendanceMap = {}
    if (data) {
      data.forEach(a => { attendanceMap[a.member_id] = a.present })
    }
    setAttendance(attendanceMap)
  }

  const toggleAttendance = (memberId) => {
    setAttendance(prev => ({ ...prev, [memberId]: !prev[memberId] }))
  }

  const markAll = (present) => {
    const all = {}
    members.forEach(m => { all[m.id] = present })
    setAttendance(all)
  }

  const saveAttendance = async () => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('attendance').delete().eq('service_id', selectedService.id)
    const records = members.map(m => ({
      service_id: selectedService.id,
      member_id: m.id,
      church_id: session.user.id,
      present: attendance[m.id] || false
    }))
    await supabase.from('attendance').insert(records)
    setSaving(false)
    alert('Attendance saved successfully!')
  }

  const handleDeleteService = async (id) => {
    if (!confirm('Delete this service record?')) return
    await supabase.from('services').delete().eq('id', id)
    if (selectedService?.id === id) setSelectedService(null)
    fetchServices()
  }

  const presentCount = Object.values(attendance).filter(Boolean).length
  const absentCount = members.length - presentCount

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.phone && m.phone.includes(search))
  )

  if (selectedService) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <a href="/dashboard" className="text-xl font-bold text-green-600">FaithDesk</a>
          <button onClick={() => setSelectedService(null)} className="text-sm text-gray-500 hover:underline">Back to services</button>
        </nav>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedService.title}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {new Date(selectedService.service_date).toDateString()} — {selectedService.service_type}
              </p>
            </div>
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save attendance'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{members.length}</p>
              <p className="text-sm text-gray-500 mt-1">Total members</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-sm text-green-600 mt-1">Present</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{absentCount}</p>
              <p className="text-sm text-red-500 mt-1">Absent</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member by name or phone..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => markAll(true)}
                className="border border-green-300 bg-green-50 text-green-700 rounded-lg px-3 py-2 text-sm hover:bg-green-100 transition"
              >
                Mark all present
              </button>
              <button
                onClick={() => markAll(false)}
                className="border border-red-300 bg-red-50 text-red-600 rounded-lg px-3 py-2 text-sm hover:bg-red-100 transition"
              >
                Mark all absent
              </button>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400">No active members found.</p>
              <a href="/members" className="text-green-600 text-sm hover:underline mt-2 block">Add members first</a>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-gray-400">No member found matching your search</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Gender</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMembers.map((member) => {
                    const isPresent = attendance[member.id] === true
                    const isAbsent = attendance[member.id] === false && member.id in attendance
                    return (
                      <tr
                        key={member.id}
                        onClick={() => toggleAttendance(member.id)}
                        className={`cursor-pointer transition ${
                          isPresent ? 'bg-green-50 hover:bg-green-100' :
                          isAbsent ? 'bg-red-50 hover:bg-red-100' :
                          'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800 text-sm">{member.full_name}</p>
                          <p className="text-gray-400 text-xs">{member.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.gender || '-'}</td>
                        <td className="px-6 py-4">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              Present
                            </span>
                          ) : isAbsent ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-medium px-3 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Absent
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Click to mark</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
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
            <h2 className="text-2xl font-bold text-gray-800">Attendance</h2>
            <p className="text-gray-500 text-sm mt-1">{services.length} service records</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            {showForm ? 'Cancel' : '+ New service'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-800 mb-4">Create new service</h3>
            <form onSubmit={handleCreateService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Sunday Morning Service"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service type</label>
                <select
                  value={form.service_type}
                  onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Sunday Service">Sunday Service</option>
                  <option value="Midweek Service">Midweek Service</option>
                  <option value="Prayer Meeting">Prayer Meeting</option>
                  <option value="Special Service">Special Service</option>
                  <option value="Youth Service">Youth Service</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={form.service_date}
                  onChange={(e) => setForm({ ...form, service_date: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create and take attendance'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading services...</p>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-lg">No service records yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "+ New service" to record attendance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{service.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(service.service_date).toDateString()} — {service.service_type}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openService(service)}
                    className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition"
                  >
                    Take attendance
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}