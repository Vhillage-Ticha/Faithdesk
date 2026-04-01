'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ContributionsPage() {
  const [contributions, setContributions] = useState([])
  const [members, setMembers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    member_id: '',
    service_id: '',
    type: 'Tithe',
    amount: '',
    payment_method: 'Cash',
    reference: '',
    contributed_on: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchAll()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/')
  }

  const fetchAll = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const [contribRes, membersRes, servicesRes] = await Promise.all([
      supabase.from('contributions').select('*, members(full_name), services(title, service_date)').eq('church_id', session.user.id).order('contributed_on', { ascending: false }),
      supabase.from('members').select('id, full_name').eq('church_id', session.user.id).eq('status', 'active').order('full_name'),
      supabase.from('services').select('id, title, service_date').eq('church_id', session.user.id).order('service_date', { ascending: false }).limit(20),
    ])

    setContributions(contribRes.data || [])
    setMembers(membersRes.data || [])
    setServices(servicesRes.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const payload = {
      ...form,
      church_id: session.user.id,
      amount: parseFloat(form.amount),
      member_id: form.member_id || null,
      service_id: form.service_id || null,
    }
    const { error } = await supabase.from('contributions').insert([payload])
    if (error) {
      setError(error.message)
    } else {
      setForm({ member_id: '', service_id: '', type: 'Tithe', amount: '', payment_method: 'Cash', reference: '', contributed_on: new Date().toISOString().split('T')[0], notes: '' })
      setShowForm(false)
      fetchAll()
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this contribution record?')) return
    await supabase.from('contributions').delete().eq('id', id)
    fetchAll()
  }

  const filtered = contributions.filter(c => {
    const memberName = c.members?.full_name || ''
    const matchSearch = memberName.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === '' || c.type === filterType
    const matchMonth = filterMonth === '' || c.contributed_on?.startsWith(filterMonth)
    return matchSearch && matchType && matchMonth
  })

  const totalAmount = filtered.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  const thisMonthTotal = contributions
    .filter(c => c.contributed_on?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  const titheTotal = contributions
    .filter(c => c.type === 'Tithe' && c.contributed_on?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  const offeringTotal = contributions
    .filter(c => c.type === 'Offering' && c.contributed_on?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-xl font-bold text-green-600">FaithDesk</a>
        <a href="/dashboard" className="text-sm text-gray-500 hover:underline">Back to dashboard</a>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Contributions</h2>
            <p className="text-gray-500 text-sm mt-1">{contributions.length} total records</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            {showForm ? 'Cancel' : '+ Record contribution'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">This month total</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">GHS {thisMonthTotal.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-5">
            <p className="text-sm text-green-600">Tithes this month</p>
            <p className="text-2xl font-bold text-green-700 mt-1">GHS {titheTotal.toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <p className="text-sm text-blue-600">Offerings this month</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">GHS {offeringTotal.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Filtered total</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">GHS {totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-medium text-gray-800 mb-4">Record new contribution</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member (optional)</label>
                <select value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Anonymous / General</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contribution type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="Tithe">Tithe</option>
                  <option value="Offering">Offering</option>
                  <option value="Pledge">Pledge</option>
                  <option value="Welfare">Welfare</option>
                  <option value="Building Fund">Building Fund</option>
                  <option value="Special Offering">Special Offering</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (GHS)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" step="0.01" className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="Cash">Cash</option>
                  <option value="MoMo">Mobile Money (MoMo)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.contributed_on} onChange={(e) => setForm({ ...form, contributed_on: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service (optional)</label>
                <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Not linked to a service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.title} — {new Date(s.service_date).toDateString()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / MoMo number (optional)</label>
                <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. MoMo transaction ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Any additional notes" />
              </div>
              {error && <p className="text-red-500 text-sm col-span-2">{error}</p>}
              <div className="col-span-2">
                <button type="submit" disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save contribution'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by member or type..." className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All types</option>
              <option value="Tithe">Tithe</option>
              <option value="Offering">Offering</option>
              <option value="Pledge">Pledge</option>
              <option value="Welfare">Welfare</option>
              <option value="Building Fund">Building Fund</option>
              <option value="Special Offering">Special Offering</option>
              <option value="Other">Other</option>
            </select>
            <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading contributions...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-lg">No contributions found</p>
            <p className="text-gray-400 text-sm mt-1">{contributions.length === 0 ? 'Click "+ Record contribution" to get started' : 'Try adjusting your filters'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800 text-sm">{c.members?.full_name || 'Anonymous'}</p>
                      {c.notes && <p className="text-gray-400 text-xs">{c.notes}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        c.type === 'Tithe' ? 'bg-green-100 text-green-700' :
                        c.type === 'Offering' ? 'bg-blue-100 text-blue-700' :
                        c.type === 'Pledge' ? 'bg-purple-100 text-purple-700' :
                        c.type === 'Building Fund' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">GHS {parseFloat(c.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.payment_method}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(c.contributed_on).toDateString()}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
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