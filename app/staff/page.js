'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMembers: 0,
    presentLastService: 0,
    thisMonthOffering: 0,
    totalDepartments: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/')
          return
        }
        setUser(session.user)
        await fetchStats(session.user.id)
      } catch (err) {
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const fetchStats = async (churchId) => {
    const thisMonth = new Date().toISOString().slice(0, 7)
    const [membersRes, departmentsRes, contributionsRes, servicesRes] = await Promise.all([
      supabase.from('members').select('id', { count: 'exact' }).eq('church_id', churchId).eq('status', 'active'),
      supabase.from('departments').select('id', { count: 'exact' }).eq('church_id', churchId),
      supabase.from('contributions').select('amount').eq('church_id', churchId).gte('contributed_on', thisMonth + '-01'),
      supabase.from('services').select('id').eq('church_id', churchId).order('service_date', { ascending: false }).limit(1),
    ])
    const totalMembers = membersRes.count || 0
    const totalDepartments = departmentsRes.count || 0
    const thisMonthOffering = (contributionsRes.data || []).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    let presentLastService = 0
    if (servicesRes.data && servicesRes.data.length > 0) {
      const lastServiceId = servicesRes.data[0].id
      const attendanceRes = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('service_id', lastServiceId)
        .eq('present', true)
      presentLastService = attendanceRes.count || 0
    }
    setStats({ totalMembers, presentLastService, thisMonthOffering, totalDepartments })
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

  const churchName = user?.user_metadata?.church_name || 'Your Church'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-600">FaithDesk</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{churchName}</span>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome, {churchName}</h2>
          <p className="text-gray-500 mt-1">Here is an overview of your church activity</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Active members</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalMembers}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-5">
            <p className="text-sm text-green-600">Last service attendance</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{stats.presentLastService}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <p className="text-sm text-blue-600">This month offering</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">GHS {stats.thisMonthOffering.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Departments</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalDepartments}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <a href="/members" className="bg-white rounded-xl border border-gray-100 p-6 hover:border-green-300 transition">
            <p className="font-medium text-gray-800 text-lg mb-1">Members</p>
            <p className="text-sm text-gray-500">Manage your congregation</p>
          </a>
          <a href="/attendance" className="bg-white rounded-xl border border-gray-100 p-6 hover:border-green-300 transition">
            <p className="font-medium text-gray-800 text-lg mb-1">Attendance</p>
            <p className="text-sm text-gray-500">Track Sunday services</p>
          </a>
          <a href="/contributions" className="bg-white rounded-xl border border-gray-100 p-6 hover:border-green-300 transition">
            <p className="font-medium text-gray-800 text-lg mb-1">Contributions</p>
            <p className="text-sm text-gray-500">Tithes and offerings</p>
          </a>
          <a href="/departments" className="bg-white rounded-xl border border-gray-100 p-6 hover:border-green-300 transition">
            <p className="font-medium text-gray-800 text-lg mb-1">Departments</p>
            <p className="text-sm text-gray-500">Manage groups</p>
          </a>
          <a href="/reports" className="bg-white rounded-xl border border-gray-100 p-6 hover:border-green-300 transition">
            <p className="font-medium text-gray-800 text-lg mb-1">Reports</p>
            <p className="text-sm text-gray-500">Financial summaries</p>
          </a>
          <a href="/staff" className="bg-white rounded-xl border border-gray-100 p-6 hover:border-green-300 transition">
            <p className="font-medium text-gray-800 text-lg mb-1">Staff & Access</p>
            <p className="text-sm text-gray-500">Manage staff roles</p>
          </a>
          <a href="/settings" className="bg-white rounded-xl border border-gray-100 p-6 hover:border-green-300 transition">
            <p className="font-medium text-gray-800 text-lg mb-1">Settings</p>
            <p className="text-sm text-gray-500">Church profile</p>
          </a>
        </div>
      </div>
    </div>
  )
}