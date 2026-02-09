'use client'

import { useState, useEffect } from 'react'
import { fetchPrograms } from '@/lib/api'
import type { Program, Risk, Milestone } from '@/lib/mockData'

export default function AdminPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'programs' | 'risks' | 'milestones'>('programs')

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPrograms()
        setPrograms(data)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getAllRisks = (): Risk[] => {
    return programs.flatMap(program => program.risks || [])
  }

  const getAllMilestones = (): Milestone[] => {
    return programs.flatMap(program => program.milestones || [])
  }

  const getDatabaseStats = () => {
    const risks = getAllRisks()
    const milestones = getAllMilestones()
    
    return {
      totalPrograms: programs.length,
      totalRisks: risks.length,
      totalMilestones: milestones.length,
      completedPrograms: programs.filter(p => p.status === 'Completed').length,
      atRiskPrograms: programs.filter(p => p.status === 'At Risk').length,
      offTrackPrograms: programs.filter(p => p.status === 'Off Track').length,
      onTrackPrograms: programs.filter(p => p.status === 'On Track').length,
      highRisks: risks.filter(r => r.severity === 'High').length,
      mediumRisks: risks.filter(r => r.severity === 'Medium').length,
      lowRisks: risks.filter(r => r.severity === 'Low').length,
      completedMilestones: milestones.filter(m => m.status === 'Completed').length,
      overdueMilestones: milestones.filter(m => m.status === 'Overdue').length,
      lastUpdated: new Date().toLocaleString()
    }
  }

  const stats = getDatabaseStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-deep p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-violet"></div>
            <p className="mt-4 text-slate-400">Loading database...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-deep p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
        
        {/* Database Statistics */}
        <div className="bg-surface rounded-lg border border-white/10 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Database Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-accent-violet/10 p-4 rounded-lg border border-accent-violet/20">
              <div className="text-2xl font-bold text-accent-violet">{stats.totalPrograms}</div>
              <div className="text-sm text-slate-400">Total Programs</div>
            </div>
            <div className="bg-accent-rose/10 p-4 rounded-lg border border-accent-rose/20">
              <div className="text-2xl font-bold text-accent-rose">{stats.totalRisks}</div>
              <div className="text-sm text-slate-400">Total Risks</div>
            </div>
            <div className="bg-accent-emerald/10 p-4 rounded-lg border border-accent-emerald/20">
              <div className="text-2xl font-bold text-accent-emerald">{stats.totalMilestones}</div>
              <div className="text-sm text-slate-400">Total Milestones</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="text-2xl font-bold text-slate-300">{stats.completedPrograms}</div>
              <div className="text-sm text-slate-400">Completed Programs</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-accent-emerald/10 p-4 rounded-lg border border-accent-emerald/20">
              <div className="text-lg font-semibold text-accent-emerald">{stats.onTrackPrograms}</div>
              <div className="text-sm text-slate-400">On Track</div>
            </div>
            <div className="bg-accent-amber/10 p-4 rounded-lg border border-accent-amber/20">
              <div className="text-lg font-semibold text-accent-amber">{stats.atRiskPrograms}</div>
              <div className="text-sm text-slate-400">At Risk</div>
            </div>
            <div className="bg-accent-rose/10 p-4 rounded-lg border border-accent-rose/20">
              <div className="text-lg font-semibold text-accent-rose">{stats.offTrackPrograms}</div>
              <div className="text-sm text-slate-400">Off Track</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="text-lg font-semibold text-slate-300">{stats.completedMilestones}</div>
              <div className="text-sm text-slate-400">Completed Milestones</div>
            </div>
          </div>
          
          <div className="text-sm text-slate-500 mt-4">
            Last Updated: {stats.lastUpdated}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-surface rounded-lg border border-white/10 mb-6">
          <div className="border-b border-white/10">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('programs')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'programs'
                    ? 'border-accent-violet text-accent-violet'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Programs ({programs.length})
              </button>
              <button
                onClick={() => setActiveTab('risks')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'risks'
                    ? 'border-accent-violet text-accent-violet'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Risks ({stats.totalRisks})
              </button>
              <button
                onClick={() => setActiveTab('milestones')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'milestones'
                    ? 'border-accent-violet text-accent-violet'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Milestones ({stats.totalMilestones})
              </button>
            </nav>
          </div>
        </div>

        {/* Programs Table */}
        {activeTab === 'programs' && (
          <div className="bg-surface rounded-lg border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-surface-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product Line</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pipeline Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Launch Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Milestones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {programs.map((program) => (
                    <tr key={program.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">{program.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-white">{program.name}</div>
                        <div className="text-xs text-slate-500 max-w-xs truncate">{program.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          program.status === 'On Track' ? 'bg-accent-emerald/20 text-accent-emerald' :
                          program.status === 'At Risk' ? 'bg-accent-amber/20 text-accent-amber' :
                          program.status === 'Off Track' ? 'bg-accent-rose/20 text-accent-rose' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {program.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{program.owner}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{program.team}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{program.productLine}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{program.pipelineStage}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-slate-300">{program.progress}%</div>
                          <div className="ml-2 w-16 bg-white/5 rounded-full h-2">
                            <div 
                              className="bg-accent-violet h-2 rounded-full" 
                              style={{ width: `${program.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{program.launchDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{program.risks?.length || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{program.milestones?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Risks Table */}
        {activeTab === 'risks' && (
          <div className="bg-surface rounded-lg border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-surface-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Program ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mitigation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {getAllRisks().map((risk) => (
                    <tr key={risk.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">{risk.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{risk.programId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{risk.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          risk.severity === 'High' ? 'bg-accent-rose/20 text-accent-rose' :
                          risk.severity === 'Medium' ? 'bg-accent-amber/20 text-accent-amber' :
                          'bg-accent-emerald/20 text-accent-emerald'
                        }`}>
                          {risk.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 max-w-xs">{risk.description}</td>
                      <td className="px-6 py-4 text-sm text-slate-400 max-w-xs">{risk.mitigation}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          risk.status === 'Open' ? 'bg-accent-rose/20 text-accent-rose' :
                          'bg-accent-emerald/20 text-accent-emerald'
                        }`}>
                          {risk.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Milestones Table */}
        {activeTab === 'milestones' && (
          <div className="bg-surface rounded-lg border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-surface-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Program ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Completed Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {getAllMilestones().map((milestone) => (
                    <tr key={milestone.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">{milestone.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{milestone.programId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{milestone.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{milestone.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{milestone.completedDate || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          milestone.status === 'Completed' ? 'bg-accent-emerald/20 text-accent-emerald' :
                          milestone.status === 'Overdue' ? 'bg-accent-rose/20 text-accent-rose' :
                          'bg-accent-violet/20 text-accent-violet'
                        }`}>
                          {milestone.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
