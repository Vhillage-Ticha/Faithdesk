'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ReportsPage() {
  const [contributions, setContributions] = useState([])
  const [members, setMembers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
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
      supabase.from('contributions').select('*, members(full_name)').eq('church_id', session.user.id).order('contributed_on', { ascending: false }),
      supabase.from('members').select('*').eq('church_id', session.user.id),
      supabase.from('services').select('*').eq('church_id', session.user.id).order('service_date', { ascending: false }),
    ])

    setContributions(contribRes.data || [])
    setMembers(membersRes.data || [])
    setServices(servicesRes.data || [])
    setLoading(false)
  }

  const monthContributions = contributions.filter(c => c.contributed_on?.startsWith(selectedMonth))

  const totalThisMonth = monthContributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  const titheTotal = monthContributions.filter(c => c.type === 'Tithe').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  const offeringTotal = monthContributions.filter(c => c.type === 'Offering').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  const pledgeTotal = monthContributions.filter(c => c.type === 'Pledge').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
  const otherTotal = monthContributions.filter(c => !['Tithe', 'Offering', 'Pledge'].includes(c.type)).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)

  const byType = [
    { type: 'Tithe', total: titheTotal, color: 'bg-green-100 text-green-700' },
    { type: 'Offering', total: offeringTotal, color: 'bg-blue-100 text-blue-700' },
    { type: 'Pledge', total: pledgeTotal, color: 'bg-purple-100 text-purple-700' },
    { type: 'Other', total: otherTotal, color: 'bg-gray-100 text-gray-600' },
  ].filter(t => t.total > 0)

  const byMethod = ['Cash', 'MoMo', 'Bank Transfer', 'Cheque'].map(method => ({
    method,
    total: monthContributions.filter(c => c.payment_method === method).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
    count: monthContributions.filter(c => c.payment_method === method).length,
  })).filter(m => m.total > 0)

  const topGivers = Object.values(
    monthContributions
      .filter(c => c.members?.full_name)
      .reduce((acc, c) => {
        const name = c.members.full_name
        if (!acc[name]) acc[name] = { name, total: 0 }
        acc[name].total += parseFloat(c.amount || 0)
        return acc
      }, {})
  ).sort((a, b) => b.total - a.total).slice(0, 5)

  const activeMembers = members.filter(m => m.status === 'active').length
  const totalMembers = members.length

  const printReport = () => {
    window.print()
  }

  const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between print:hidden">
        <a href="/dashboard" className="text-xl font-bold text-green-600">FaithDesk</a>
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-sm text-gray-500 hover:underline">Back to dashboard</a>
          <button
            onClick={printReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            Print / Export PDF
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
            <p className="text-gray-500 text-sm mt-1">Financial and membership summary</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Select month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-gray-800">FaithDesk — Financial Report</h1>
          <p className="text-gray-500">{monthName}</p>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading report...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-sm text-gray-500">Total collected</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">GHS {totalThisMonth.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{monthName}</p>
              </div>
              <div className="bg-green-50 rounded-xl border border-green-100 p-5">
                <p className="text-sm text-green-600">Total tithes</p>
                <p className="text-2xl font-bold text-green-700 mt-1">GHS {titheTotal.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                <p className="text-sm text-blue-600">Total offerings</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">GHS {offeringTotal.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{monthContributions.length}</p>
                <p className="text-xs text-gray-400 mt-1">this month</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-medium text-gray-800 mb-4">By contribution type</h3>
                {byType.length === 0 ? (
                  <p className="text-gray-400 text-sm">No contributions this month</p>
                ) : (
                  <div className="space-y-3">
                    {byType.map(t => (
                      <div key={t.type} className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.color}`}>{t.type}</span>
                        <span className="font-medium text-gray-800 text-sm">GHS {t.total.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Total</span>
                      <span className="font-bold text-gray-800">GHS {totalThisMonth.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-medium text-gray-800 mb-4">By payment method</h3>
                {byMethod.length === 0 ? (
                  <p className="text-gray-400 text-sm">No contributions this month</p>
                ) : (
                  <div className="space-y-3">
                    {byMethod.map(m => (
                      <div key={m.method} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">{m.method}</p>
                          <p className="text-xs text-gray-400">{m.count} transaction{m.count !== 1 ? 's' : ''}</p>
                        </div>
                        <span className="font-medium text-gray-800 text-sm">GHS {m.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-medium text-gray-800 mb-4">Top givers this month</h3>
                {topGivers.length === 0 ? (
                  <p className="text-gray-400 text-sm">No linked member contributions this month</p>
                ) : (
                  <div className="space-y-3">
                    {topGivers.map((g, i) => (
                      <div key={g.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                          <p className="text-sm text-gray-700">{g.name}</p>
                        </div>
                        <span className="font-medium text-gray-800 text-sm">GHS {g.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-medium text-gray-800 mb-4">Membership summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Total members</p>
                    <span className="font-medium text-gray-800">{totalMembers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Active members</p>
                    <span className="font-medium text-green-600">{activeMembers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Visitors</p>
                    <span className="font-medium text-blue-600">{members.filter(m => m.status === 'visitor').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Inactive</p>
                    <span className="font-medium text-gray-400">{members.filter(m => m.status === 'inactive').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Total services held</p>
                    <span className="font-medium text-gray-800">{services.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-800 mb-4">All contributions — {monthName}</h3>
              {monthContributions.length === 0 ? (
                <p className="text-gray-400 text-sm">No contributions recorded for this month</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthContributions.map(c => (
                      <tr key={c.id}>
                        <td className="py-3 text-sm text-gray-700">{c.members?.full_name || 'Anonymous'}</td>
                        <td className="py-3 text-sm text-gray-600">{c.type}</td>
                        <td className="py-3 text-sm font-medium text-gray-800">GHS {parseFloat(c.amount).toFixed(2)}</td>
                        <td className="py-3 text-sm text-gray-600">{c.payment_method}</td>
                        <td className="py-3 text-sm text-gray-600">{new Date(c.contributed_on).toDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td className="py-3 text-sm font-bold text-gray-800" colSpan={2}>Total</td>
                      <td className="py-3 text-sm font-bold text-gray-800">GHS {totalThisMonth.toFixed(2)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}