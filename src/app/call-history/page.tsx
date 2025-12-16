'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Clock, 
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  DollarSign,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface Call {
  id: string;
  retellCallId: string;
  callType: 'phone' | 'web';
  direction: 'inbound' | 'outbound';
  status: string;
  agentId?: string | null;
  agentVersion?: number | null;
  fromNumber?: string | null;
  toNumber?: string | null;
  duration?: number | null;
  totalDurationSeconds?: number | null;
  startTime?: Date | null;
  endTime?: Date | null;
  recordingUrl?: string | null;
  transcript?: string | null;
  cost?: number | null;
  tokensUsed?: number | null;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CallStats {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  totalDuration: number;
  totalCost: number;
  averageDuration: number;
}

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const actionButtonClass = cn(
    "inline-flex items-center justify-center h-8 px-4 rounded-md text-sm font-semibold transition-colors",
    "bg-foreground text-background hover:bg-foreground/90",
    "disabled:opacity-60 disabled:cursor-not-allowed"
  );
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [callTypeFilter, setCallTypeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  useEffect(() => {
    loadCalls();
    loadStats();
  }, [statusFilter, callTypeFilter, directionFilter, dateRange]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (callTypeFilter !== 'all') params.append('callType', callTypeFilter);
      if (directionFilter !== 'all') params.append('direction', directionFilter);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      params.append('limit', '100');

      const response = await fetch(`/api/calls?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCalls(data.data.calls.map((call: any) => ({
          ...call,
          startTime: call.startTime ? new Date(call.startTime) : null,
          endTime: call.endTime ? new Date(call.endTime) : null,
          createdAt: new Date(call.createdAt),
          updatedAt: new Date(call.updatedAt),
        })));
      }
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const response = await fetch(`/api/calls/stats?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCalls(), loadStats()]);
    setRefreshing(false);
  };

  const formatDuration = (seconds: number | null | undefined, totalDurationSeconds?: number | null) => {
    // Preferir totalDurationSeconds (duración oficial de Retell) si está disponible
    const durationToUse = totalDurationSeconds || seconds;
    if (!durationToUse) return 'N/A';
    const mins = Math.floor(durationToUse / 60);
    const secs = durationToUse % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCost = (cost: number | null | undefined | any) => {
    if (!cost || cost === 0) return 'N/A';
    // Convertir a número si es Decimal de Prisma u otro tipo (esperamos centavos)
    const costNumberRaw = typeof cost === 'number' ? cost : Number(cost);
    if (isNaN(costNumberRaw)) return 'N/A';
    const dollars = costNumberRaw / 100;
    return `$${dollars.toFixed(3)}`;
  };

  const formatTokens = (tokens: number | null | undefined) => {
    if (!tokens || tokens === 0) return 'N/A';
    return tokens.toLocaleString();
  };

  const calculateCostPerMinute = (cost: number | null | undefined | any, durationSeconds: number | null | undefined, totalDurationSeconds?: number | null) => {
    if (!cost || cost === 0) return null;
    // Convertir a número si es Decimal de Prisma u otro tipo (esperamos centavos)
    const costNumberRaw = typeof cost === 'number' ? cost : Number(cost);
    if (isNaN(costNumberRaw) || costNumberRaw === 0) return null;
    const durationToUse = totalDurationSeconds || durationSeconds;
    if (!durationToUse || durationToUse === 0) return null;
    const minutes = durationToUse / 60;
    const dollars = costNumberRaw / 100;
    return (dollars / minutes).toFixed(3);
  };

  const formatPhoneNumber = (number: string | null | undefined) => {
    if (!number) return 'N/A';
    // Formatear número E.164 a formato legible
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const areaCode = cleaned.slice(1, 4);
      const exchange = cleaned.slice(4, 7);
      const num = cleaned.slice(7);
      return `+1 (${areaCode}) ${exchange}-${num}`;
    }
    return number;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
      'ringing': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Phone },
      'ongoing': { bg: 'bg-emerald-600/20', text: 'text-emerald-400', icon: Phone },
      'ended': { bg: 'bg-muted', text: 'text-gray-700', icon: CheckCircle2 },
      'failed': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    };

    const config = statusColors[status.toLowerCase()] || statusColors['ended'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const filteredCalls = calls.filter(call => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        call.fromNumber?.toLowerCase().includes(search) ||
        call.toNumber?.toLowerCase().includes(search) ||
        call.retellCallId.toLowerCase().includes(search) ||
        call.agentId?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar 
          title="Call History" 
          description="Complete history of phone and web calls."
          actions={
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={cn(actionButtonClass, "gap-2")}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button className={cn(actionButtonClass, "gap-2")}>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          }
        />

        {/* Stats Cards */}
        {stats && (
          <div className="bg-muted/30 border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-card rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600">Total Calls</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalCalls}</div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-2xl font-semibold text-emerald-400 mt-1">{stats.completedCalls}</div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600">Failed</div>
                <div className="text-2xl font-semibold text-red-600 mt-1">{stats.failedCalls}</div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600">Total Duration</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatDuration(stats.totalDuration)}
                </div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">
                  ${ (stats.totalCost / 100).toFixed(3) }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border-b border-gray-200 px-6 py-5">
          <div className="space-y-4">
            {/* Search Bar - Full Width */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by number, call ID, or agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-card text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="ringing">Ringing</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="ended">Ended</option>
                    <option value="failed">Failed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Call Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>Type</span>
                  </div>
                </label>
                <div className="relative">
                  <select
                    value={callTypeFilter}
                    onChange={(e) => setCallTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-card text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all"
                  >
                    <option value="all">All Types</option>
                    <option value="phone">Phone</option>
                    <option value="web">Web</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Direction Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-1">
                    {directionFilter === 'inbound' ? (
                      <PhoneIncoming className="w-4 h-4" />
                    ) : directionFilter === 'outbound' ? (
                      <PhoneOutgoing className="w-4 h-4" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    <span>Direction</span>
                  </div>
                </label>
                <div className="relative">
                  <select
                    value={directionFilter}
                    onChange={(e) => setDirectionFilter(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-card text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all"
                  >
                    <option value="all">All Directions</option>
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Date Range</span>
                  </div>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-card text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <span className="text-gray-500 text-sm font-medium">to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-card text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(statusFilter !== 'all' || callTypeFilter !== 'all' || directionFilter !== 'all' || dateRange.start || dateRange.end) && (
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-500">Active filters:</span>
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1.5 hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {callTypeFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Type: {callTypeFilter}
                    <button
                      onClick={() => setCallTypeFilter('all')}
                      className="ml-1.5 hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {directionFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Direction: {directionFilter}
                    <button
                      onClick={() => setDirectionFilter('all')}
                      className="ml-1.5 hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(dateRange.start || dateRange.end) && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Date: {dateRange.start || '...'} to {dateRange.end || '...'}
                    <button
                      onClick={() => setDateRange({ start: '', end: '' })}
                      className="ml-1.5 hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setCallTypeFilter('all');
                    setDirectionFilter('all');
                    setDateRange({ start: '', end: '' });
                    setSearchTerm('');
                  }}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700 ml-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calls List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" className="text-foreground/70" />
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Phone className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No calls found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="px-6 py-4">
            <div className="bg-card rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Call ID
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Direction
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      From / To
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Duration
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Cost
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Cost/Min
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Tokens
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-card">
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-mono text-foreground">
                          {call.retellCallId.substring(0, 12)}...
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          call.callType === 'phone' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          <Phone className="w-3 h-3 mr-1" />
                          {call.callType}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        {call.direction === 'inbound' ? (
                          <PhoneIncoming className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <PhoneOutgoing className="w-4 h-4 text-primary" />
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-sm text-foreground">
                          {call.direction === 'inbound' ? (
                            <>
                              <div className="font-medium">From: {formatPhoneNumber(call.fromNumber)}</div>
                              <div className="text-muted-foreground">To: {formatPhoneNumber(call.toNumber)}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">To: {formatPhoneNumber(call.toNumber)}</div>
                              {call.fromNumber && (
                                <div className="text-muted-foreground">From: {formatPhoneNumber(call.fromNumber)}</div>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(call.status)}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-sm text-foreground">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDuration(call.duration, call.totalDurationSeconds)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-sm text-foreground">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium">{formatCost(call.cost)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        {calculateCostPerMinute(call.cost, call.duration, call.totalDurationSeconds) ? (
                          <div className="text-sm text-foreground">
                            ${calculateCostPerMinute(call.cost, call.duration, call.totalDurationSeconds)}/min
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        {call.tokensUsed ? (
                          <div className="flex items-center space-x-1 text-sm text-foreground">
                            <Hash className="w-4 h-4 text-primary" />
                            <span>{formatTokens(call.tokensUsed)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {call.startTime 
                          ? new Date(call.startTime).toLocaleString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : new Date(call.createdAt).toLocaleString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

