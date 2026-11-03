import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  ShieldAlert,
  History,
  Search,
  Code2,
  Bot,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import DockerIcon from '../components/common/DockerIcon';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import { getRunningContainers, getAllContainers, getDockerImages } from '../services/dockerService';
import { getAllScans } from '../services/scanService';

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningContainers, setRunningContainers] = useState([]);
  const [allContainers, setAllContainers] = useState([]);
  const [images, setImages] = useState([]);
  const [scans, setScans] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [runningRes, allRes, imagesRes, scansRes] = await Promise.allSettled([
        getRunningContainers(),
        getAllContainers(),
        getDockerImages(),
        getAllScans(),
      ]);

      if (runningRes.status === 'fulfilled') setRunningContainers(runningRes.value || []);
      if (allRes.status === 'fulfilled') setAllContainers(allRes.value || []);
      if (imagesRes.status === 'fulfilled') setImages(imagesRes.value || []);
      if (scansRes.status === 'fulfilled') setScans(scansRes.value || []);

      if (
        runningRes.status === 'rejected' &&
        allRes.status === 'rejected' &&
        imagesRes.status === 'rejected' &&
        scansRes.status === 'rejected'
      ) {
        setError('Failed to fetch Docker environment stats. Ensure Spring Boot backend and Docker daemon are running.');
      }
    } catch (err) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalVulnerabilities = scans.reduce((acc, s) => acc + (s.totalVulnerabilities || 0), 0);
  const criticalCount = scans.reduce((acc, s) => acc + (s.critical || 0), 0);
  const highCount = scans.reduce((acc, s) => acc + (s.high || 0), 0);
  const mediumCount = scans.reduce((acc, s) => acc + (s.medium || 0), 0);
  const lowCount = scans.reduce((acc, s) => acc + (s.low || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton type="cards" rows={4} />
        <Skeleton type="table" rows={4} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-8">
      {/* Top Security Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Running Containers */}
        <Card className="hover:border-slate-300 dark:hover:border-dark-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Running Containers
            </span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 rounded-lg text-emerald-700 dark:text-emerald-400">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{runningContainers.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">of {allContainers.length} total</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Docker Daemon Active
          </div>
        </Card>

        {/* Docker Images */}
        <Card className="hover:border-slate-300 dark:hover:border-dark-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Docker Images
            </span>
            <div className="p-2 bg-blue-100 dark:bg-brand-950/60 border border-blue-300 dark:border-brand-800/50 rounded-lg text-brand-700 dark:text-brand-400">
              <DockerIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{images.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Host images</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
            Available for scanning
          </div>
        </Card>

        {/* Total Scans Recorded */}
        <Card className="hover:border-slate-300 dark:hover:border-dark-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Total Scans
            </span>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/50 rounded-lg text-purple-700 dark:text-purple-400">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{scans.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Stored scans</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-700 dark:text-purple-400 flex items-center gap-1 font-mono font-medium">
            PostgreSQL Scan History
          </div>
        </Card>

        {/* Total Vulnerabilities */}
        <Card className="hover:border-slate-300 dark:hover:border-dark-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Vulnerabilities
            </span>
            <div className="p-2 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/50 rounded-lg text-rose-700 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-rose-600 dark:text-rose-400">{totalVulnerabilities}</span>
            <span className="text-xs text-rose-700 dark:text-rose-400 font-mono font-bold">{criticalCount} Critical</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {highCount} High • {mediumCount} Medium
          </div>
        </Card>
      </div>

      {/* Quick Action Navigation Panels */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono mb-4">
          Quick Security Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/scans/new')}
            className="p-5 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-700/60 hover:border-brand-500 dark:hover:border-brand-500 rounded-xl text-left transition-all group shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="p-2.5 bg-brand-50 dark:bg-brand-600/20 border border-brand-200 dark:border-brand-500/30 rounded-lg w-fit text-brand-600 dark:text-brand-400 mb-3 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Scan Docker Image</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Run Trivy vulnerability scanner on local or remote Docker images.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-semibold group-hover:translate-x-1 transition-transform">
              Launch Scanner <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => navigate('/source-scan')}
            className="p-5 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-700/60 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl text-left transition-all group shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="p-2.5 bg-purple-50 dark:bg-purple-600/20 border border-purple-200 dark:border-purple-500/30 rounded-lg w-fit text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                <Code2 className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Source Code Scanner</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Run Semgrep static analysis on Java code for security bugs.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-semibold group-hover:translate-x-1 transition-transform">
              Open Semgrep <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => navigate('/containers')}
            className="p-5 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-700/60 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl text-left transition-all group shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/30 rounded-lg w-fit text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                <Box className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">View Docker Containers</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Inspect running & stopped Docker containers on host.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
              View Containers <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Main Grid: Recent Scans & Environment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Scan History */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Scan History"
            subtitle="Vulnerability scans stored in PostgreSQL"
            action={
              <Link to="/scans/history">
                <Button variant="ghost" size="sm">
                  View All Scans <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            }
          >
            {scans.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No previous scans found</p>
                <p className="text-xs text-slate-500 mt-1">Trigger a Trivy scan to store vulnerability findings.</p>
                <div className="mt-4">
                  <Button variant="primary" size="sm" onClick={() => navigate('/scans/new')}>
                    Run First Scan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-dark-700/60">
                {scans.slice(0, 5).map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => navigate(`/scans/${scan.id}`)}
                    className="py-3 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-dark-800/50 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-mono font-medium text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {scan.imageName}
                        <span className="text-xs font-normal text-slate-500">#{scan.id}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {scan.scanTime ? new Date(scan.scanTime).toLocaleString() : 'N/A'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {scan.critical > 0 && <Badge severity="CRITICAL" text={`${scan.critical}`} size="sm" />}
                      {scan.high > 0 && <Badge severity="HIGH" text={`${scan.high}`} size="sm" />}
                      {scan.medium > 0 && <Badge severity="MEDIUM" text={`${scan.medium}`} size="sm" />}
                      {scan.low > 0 && <Badge severity="LOW" text={`${scan.low}`} size="sm" />}
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold ml-2">
                        {scan.totalVulnerabilities} total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Severity Summary Panel */}
        <div className="space-y-6">
          <Card title="Vulnerability Severity Distribution" subtitle="Aggregated across all history scans">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> CRITICAL
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-bold">{criticalCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${totalVulnerabilities > 0 ? (criticalCount / totalVulnerabilities) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" /> HIGH
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-bold">{highCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${totalVulnerabilities > 0 ? (highCount / totalVulnerabilities) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> MEDIUM
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-bold">{mediumCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${totalVulnerabilities > 0 ? (mediumCount / totalVulnerabilities) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> LOW
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-bold">{lowCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-dark-800 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${totalVulnerabilities > 0 ? (lowCount / totalVulnerabilities) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
