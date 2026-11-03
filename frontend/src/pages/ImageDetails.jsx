import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, History, Clock, ShieldAlert } from 'lucide-react';
import DockerIcon from '../components/common/DockerIcon';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';
import { getAllScans } from '../services/scanService';

export default function ImageDetails() {
  const { name } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const imageName = decodeURIComponent(name || '');
  const imageInfo = location.state?.image;

  const [matchingScans, setMatchingScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        const scans = await getAllScans();
        const filtered = (scans || []).filter(
          (s) => s.imageName === imageName || s.imageName?.includes(imageName)
        );
        setMatchingScans(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, [imageName]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/images" className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Images
      </Link>

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-600/20 border border-brand-200 dark:border-brand-500/30 rounded-xl text-brand-600 dark:text-brand-400">
              <DockerIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">{imageName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">Docker Repository Image</p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Search}
            onClick={() => navigate(`/scans/new?image=${encodeURIComponent(imageName)}`)}
          >
            Start Trivy Scan
          </Button>
        </div>
      </Card>

      {/* Metadata Panel */}
      {imageInfo && (
        <Card title="Image Attributes">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-3 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-lg">
              <dt className="text-slate-500 dark:text-slate-400 mb-1">Image ID</dt>
              <dd className="text-slate-800 dark:text-slate-200 font-semibold">{imageInfo.id}</dd>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-lg">
              <dt className="text-slate-500 dark:text-slate-400 mb-1">Size</dt>
              <dd className="text-slate-800 dark:text-slate-200 font-semibold">{imageInfo.size || 'N/A'}</dd>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-lg">
              <dt className="text-slate-500 dark:text-slate-400 mb-1">Created</dt>
              <dd className="text-slate-800 dark:text-slate-200 font-semibold">{imageInfo.created || 'N/A'}</dd>
            </div>
          </dl>
        </Card>
      )}

      {/* Matching Stored Scans */}
      <Card title="Previous Scan History for Image" subtitle="Recorded Trivy security scans in PostgreSQL">
        {loading ? (
          <LoadingState title="Checking scan records..." />
        ) : matchingScans.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No previous scan records found for this image.</p>
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                icon={ShieldAlert}
                onClick={() => navigate(`/scans/new?image=${encodeURIComponent(imageName)}`)}
              >
                Scan Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-dark-700/60">
            {matchingScans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => navigate(`/scans/${scan.id}`)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-800/50 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-mono text-sm text-slate-900 dark:text-slate-100 font-semibold">
                    Scan #{scan.id}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {scan.scanTime ? new Date(scan.scanTime).toLocaleString() : 'N/A'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {scan.critical > 0 && <Badge severity="CRITICAL" text={`${scan.critical}`} size="sm" />}
                  {scan.high > 0 && <Badge severity="HIGH" text={`${scan.high}`} size="sm" />}
                  {scan.medium > 0 && <Badge severity="MEDIUM" text={`${scan.medium}`} size="sm" />}
                  {scan.low > 0 && <Badge severity="LOW" text={`${scan.low}`} size="sm" />}
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400 ml-2">
                    {scan.totalVulnerabilities} total
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
