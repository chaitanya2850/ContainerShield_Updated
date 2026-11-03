import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search, RefreshCw, Calendar, ChevronRight, Filter } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { getAllScans } from '../services/scanService';

export default function ScanHistory() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllScans();
      setScans(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const filtered = scans.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.imageName?.toLowerCase().includes(q) ||
      s.id?.toString().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.scanTime) - new Date(a.scanTime);
    if (sortBy === 'oldest') return new Date(a.scanTime) - new Date(b.scanTime);
    if (sortBy === 'critical') return (b.critical || 0) - (a.critical || 0);
    if (sortBy === 'total') return (b.totalVulnerabilities || 0) - (a.totalVulnerabilities || 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scan history by image or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-dark-850 border border-slate-300 dark:border-dark-700/60 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-dark-850 border border-slate-300 dark:border-dark-700/60 rounded-lg px-2 py-1 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="newest" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100">Sort: Newest</option>
              <option value="oldest" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100">Sort: Oldest</option>
              <option value="critical" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100">Sort: Most Critical</option>
              <option value="total" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100">Sort: Most Vulnerabilities</option>
            </select>
          </div>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchScans} isLoading={loading}>
          Refresh History
        </Button>
      </div>

      {/* Main Scans Table */}
      {loading ? (
        <Skeleton type="table" rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchScans} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={History}
          title={searchTerm ? 'No Matching Scans' : 'No Scan History Recorded'}
          description={
            searchTerm
              ? `No recorded scan matches "${searchTerm}".`
              : 'Execute a Trivy scan from the Scan Image page to store scan history in PostgreSQL.'
          }
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/scans/new')}>
              Create New Scan
            </Button>
          }
        />
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-700/60 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Scan ID</th>
                  <th className="py-3.5 px-4">Image Name</th>
                  <th className="py-3.5 px-4">Severity Breakdown</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Scan Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-700/40">
                {sorted.map((scan) => (
                  <tr
                    key={scan.id}
                    onClick={() => navigate(`/scans/${scan.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                      #{scan.id}
                    </td>

                    <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-bold">
                      {scan.imageName}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {scan.critical > 0 && <Badge severity="CRITICAL" text={`${scan.critical}`} size="sm" />}
                        {scan.high > 0 && <Badge severity="HIGH" text={`${scan.high}`} size="sm" />}
                        {scan.medium > 0 && <Badge severity="MEDIUM" text={`${scan.medium}`} size="sm" />}
                        {scan.low > 0 && <Badge severity="LOW" text={`${scan.low}`} size="sm" />}
                        {scan.unknown > 0 && <Badge severity="UNKNOWN" text={`${scan.unknown}`} size="sm" />}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {scan.totalVulnerabilities}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {scan.scanTime ? new Date(scan.scanTime).toLocaleString() : 'N/A'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button variant="ghost" size="sm" icon={ChevronRight}>
                        Analysis Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
