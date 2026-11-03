import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Box, ArrowLeft, Search, Copy, Check, Play, Square } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { getAllContainers } from '../services/dockerService';

export default function ContainerDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [container, setContainer] = useState(location.state?.container || null);
  const [loading, setLoading] = useState(!container);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!container && id) {
      const fetchDetail = async () => {
        try {
          setLoading(true);
          const list = await getAllContainers();
          const match = list.find((c) => c.id === id || c.id?.startsWith(id));
          if (match) {
            setContainer(match);
          } else {
            setError(`Container with ID "${id}" was not found.`);
          }
        } catch (err) {
          setError(err.message || 'Failed to load container details.');
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [id, container]);

  const handleCopy = () => {
    if (container?.id) {
      navigator.clipboard.writeText(container.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <LoadingState title="Fetching container details..." />;
  if (error) return <ErrorState message={error} onRetry={() => navigate('/containers')} />;

  const isUp = container?.status?.toLowerCase().includes('up');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link to="/containers" className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Containers
      </Link>

      {/* Main Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-600/20 border border-brand-200 dark:border-brand-500/30 rounded-xl text-brand-600 dark:text-brand-400">
              <Box className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">{container?.name || 'Unnamed Container'}</h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono ${isUp
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50'
                      : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                    }`}
                >
                  {isUp ? <Play className="w-3 h-3 mr-1 fill-emerald-600 dark:fill-emerald-400" /> : <Square className="w-3 h-3 mr-1" />}
                  {container?.status}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">Image: <span className="text-brand-600 dark:text-brand-400 font-semibold">{container?.image}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              icon={Search}
              onClick={() => navigate(`/scans/new?image=${encodeURIComponent(container?.image || '')}`)}
            >
              Scan Container Image
            </Button>
          </div>
        </div>
      </Card>

      {/* Container Technical Attributes */}
      <Card title="Container Technical Details">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-3 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-lg">
            <dt className="text-slate-500 dark:text-slate-400 mb-1">Full Container ID</dt>
            <dd className="text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-between">
              <span className="truncate pr-2">{container?.id}</span>
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded hover:bg-slate-200 dark:hover:bg-dark-800"
                title="Copy ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </dd>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-lg">
            <dt className="text-slate-500 dark:text-slate-400 mb-1">Container Name</dt>
            <dd className="text-slate-800 dark:text-slate-200 font-semibold">{container?.name}</dd>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-lg">
            <dt className="text-slate-500 dark:text-slate-400 mb-1">Base Docker Image</dt>
            <dd className="text-brand-600 dark:text-brand-400 font-semibold">{container?.image}</dd>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-lg">
            <dt className="text-slate-500 dark:text-slate-400 mb-1">Runtime Status</dt>
            <dd className="text-slate-800 dark:text-slate-200 font-semibold">{container?.status}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
