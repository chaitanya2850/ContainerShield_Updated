import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Search, RefreshCw, Play, Square, ExternalLink, Copy, Check } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { getRunningContainers, getAllContainers } from '../services/dockerService';

export default function Containers() {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState('running');
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      setError(null);
      let data = [];
      if (filterMode === 'running') {
        data = await getRunningContainers();
      } else {
        data = await getAllContainers();
      }
      setContainers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load container data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, [filterMode]);

  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = containers.filter((c) => {
    const query = searchTerm.toLowerCase();
    return (
      c.id?.toLowerCase().includes(query) ||
      c.name?.toLowerCase().includes(query) ||
      c.image?.toLowerCase().includes(query) ||
      c.status?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Toggle Mode */}
        <div className="inline-flex p-1 bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-700/60 rounded-xl shadow-xs">
          <button
            onClick={() => setFilterMode('running')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all ${
              filterMode === 'running'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Running Containers
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all ${
              filterMode === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Containers
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search container, name, image..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-dark-850 border border-slate-300 dark:border-dark-700/60 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono shadow-xs"
            />
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchContainers} isLoading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Containers Content */}
      {loading ? (
        <Skeleton type="table" rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchContainers} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Box}
          title={searchTerm ? 'No Matching Containers' : 'No Containers Found'}
          description={
            searchTerm
              ? `No containers match your search query "${searchTerm}".`
              : filterMode === 'running'
              ? 'There are no active running Docker containers on the host.'
              : 'No Docker containers found on the host system.'
          }
        />
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-700/60 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Container ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Image</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-700/40">
                {filtered.map((container) => {
                  const isUp = container.status?.toLowerCase().includes('up');
                  return (
                    <tr
                      key={container.id}
                      onClick={() => navigate(`/containers/${container.id}`, { state: { container } })}
                      className="hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors cursor-pointer group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 text-slate-900 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-600 dark:text-brand-400">
                            {container.id?.substring(0, 12)}
                          </span>
                          <button
                            onClick={(e) => handleCopy(container.id, e)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-dark-700"
                            title="Copy Container ID"
                          >
                            {copiedId === container.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-semibold">
                        {container.name || 'N/A'}
                      </td>

                      {/* Image */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded text-slate-800 dark:text-slate-300 font-semibold">
                          {container.image}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            isUp
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50'
                              : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          {isUp ? (
                            <Play className="w-3 h-3 mr-1 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
                          ) : (
                            <Square className="w-3 h-3 mr-1 fill-slate-400 text-slate-400" />
                          )}
                          {container.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={ExternalLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/containers/${container.id}`, { state: { container } });
                          }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
