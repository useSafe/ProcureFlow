import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { onProcurementsChange, onCabinetsChange } from '@/lib/storage'; // Updated imports
import { Procurement, Cabinet } from '@/types/procurement';
import { FileText, Archive, Clock, AlertTriangle, TrendingUp, FolderOpen } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, LabelList } from 'recharts';

const Dashboard: React.FC = () => {
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);

  useEffect(() => {
    const unsubProcurements = onProcurementsChange(setProcurements);
    const unsubCabinets = onCabinetsChange(setCabinets);

    return () => {
      unsubProcurements();
      unsubCabinets();
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      total: (procurements || []).length,
      active: (procurements || []).filter(p => p.status === 'active').length,
      archived: (procurements || []).filter(p => p.status === 'archived').length,
      critical: (procurements || []).filter(p => p.urgencyLevel === 'critical').length,
    }
  }, [procurements]);

  const locationStats = useMemo(() => {
    return cabinets.map(c => ({
      cabinetId: c.id,
      cabinetName: c.name,
      count: (procurements || []).filter(p => p.cabinetId === c.id).length
    })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  }, [cabinets, procurements]);

  const pieData = [
    { name: 'Active', value: metrics.active, fill: '#10b981' },
    { name: 'Archived', value: metrics.archived, fill: '#64748b' },
  ];

  // Top 5 cabinets
  const topCabinets = locationStats.slice(0, 5);

  // Recent 5 activities
  const recentProcurements = [...(procurements || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const chartConfig = {
    active: { label: 'Active', color: '#10b981' },
    archived: { label: 'Archived', color: '#64748b' },
  };

  const metricCards = [
    {
      title: 'Total Files',
      value: metrics.total,
      icon: FileText,
      bg: 'bg-blue-600',
      text: 'text-white'
    },
    {
      title: 'Active',
      value: metrics.active,
      icon: FolderOpen,
      bg: 'bg-emerald-500',
      text: 'text-white'
    },
    {
      title: 'Archived',
      value: metrics.archived,
      icon: Archive,
      bg: 'bg-slate-500',
      text: 'text-white'
    },
    {
      title: 'Critical',
      value: metrics.critical,
      icon: AlertTriangle,
      bg: 'bg-red-500',
      text: 'text-white'
    },
  ];

  return (
    <div className="space-y-6 h-full overflow-auto pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Overview of your file tracking system</p>
        </div>
      </div>

      {/* Primary Metrics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="relative overflow-hidden border-none bg-[#0f172a] text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-400">{card.title}</p>
                  <div className="text-3xl font-bold">{card.value}</div>
                </div>
                <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center shadow-lg`}>
                  <Icon className={`h-6 w-6 ${card.text}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Modern Doughnut Chart - Status Distribution */}
        <Card className="border-none bg-[#0f172a] text-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="archivedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748b" stopOpacity={1} />
                      <stop offset="100%" stopColor="#475569" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? 'url(#activeGradient)' : 'url(#archivedGradient)'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-4xl font-bold text-white">{metrics.total}</span>
                <span className="text-sm text-slate-400">Total Files</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modern Vertical Bar Chart - Top Cabinets */}
        <Card className="border-none bg-[#0f172a] text-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-400" />
              Top Cabinets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCabinets} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="cabinetName"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barGradient)"
                    radius={[8, 8, 0, 0]}
                    barSize={50}
                  >
                    <LabelList dataKey="count" position="top" fill="#fff" fontSize={12} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-none bg-[#0f172a] text-white shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Clock className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProcurements.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No recent activities</p>
            ) : (
              recentProcurements.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#1e293b] hover:bg-[#253045] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${p.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' :
                      'bg-slate-500/20 text-slate-500'
                      }`}>
                      {p.status === 'active' ? <FileText className="h-5 w-5" /> :
                        <Archive className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{p.prNumber}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-medium ${p.status === 'active' ? 'text-emerald-500' :
                      'text-slate-500'
                      }`}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
