import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, ShieldAlert, HardDrive } from 'lucide-react';
import DockerIcon from '../components/common/DockerIcon';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { getDockerImages } from '../services/dockerService';

export default function Images() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDockerImages();
      setImages(data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve Docker images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const filtered = images.filter((img) => {
    const q = searchTerm.toLowerCase();
    const fullTag = `${img.name}:${img.tag}`.toLowerCase();
    return (
      fullTag.includes(q) ||
      img.name?.toLowerCase().includes(q) ||
      img.tag?.toLowerCase().includes(q) ||
      img.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Search and Refresh Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search image name, repository, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-dark-850 border border-slate-300 dark:border-dark-700/60 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono shadow-xs"
          />
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchImages} isLoading={loading}>
          Refresh Images
        </Button>
      </div>

      {/* Main Image List / Table */}
      {loading ? (
        <Skeleton type="table" rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchImages} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={DockerIcon}
          title={searchTerm ? 'No Matching Images' : 'No Docker Images Found'}
          description={
            searchTerm
              ? `No images match your search term "${searchTerm}".`
              : 'There are currently no Docker images on the host daemon.'
          }
        />
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-700/60 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Repository / Image Name</th>
                  <th className="py-3.5 px-4">Tag</th>
                  <th className="py-3.5 px-4">Image ID</th>
                  <th className="py-3.5 px-4">Virtual Size</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-700/40">
                {filtered.map((img, idx) => {
                  const fullImageName = img.tag ? `${img.name}:${img.tag}` : img.name;
                  return (
                    <tr
                      key={img.id || idx}
                      onClick={() => navigate(`/images/${encodeURIComponent(fullImageName)}`, { state: { image: img } })}
                      className="hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-semibold flex items-center gap-2">
                        <DockerIcon className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span>{img.name}</span>
                      </td>

                      {/* Tag */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800/50 rounded font-semibold">
                          {img.tag || 'latest'}
                        </span>
                      </td>

                      {/* Image ID */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {img.id?.substring(0, 12) || 'N/A'}
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-400" />
                          {img.size || 'N/A'}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {img.created || 'N/A'}
                      </td>

                      {/* Action CTA */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={ShieldAlert}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/scans/new?image=${encodeURIComponent(fullImageName)}`);
                          }}
                        >
                          Scan Image
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
