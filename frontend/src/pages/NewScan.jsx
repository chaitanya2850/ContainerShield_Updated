import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, FileCode, Upload, ShieldAlert, CheckCircle2, FileText, ArrowRight, Loader2 } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ErrorState from '../components/common/ErrorState';
import Drawer from '../components/common/Drawer';
import { scanImage, scanWithManifest } from '../services/trivyService';
import { getDockerImages } from '../services/dockerService';

export default function NewScan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialImage = searchParams.get('image') || '';

  const [imageName, setImageName] = useState(initialImage);
  const [scanType, setScanType] = useState('standard');
  const [manifestFile, setManifestFile] = useState(null);

  const [availableImages, setAvailableImages] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  const [standardResults, setStandardResults] = useState(null);
  const [manifestResults, setManifestResults] = useState(null);
  const [selectedVuln, setSelectedVuln] = useState(null);

  const [resultFilter, setResultFilter] = useState('ALL');
  const [resultSearch, setResultSearch] = useState('');

  useEffect(() => {
    const loadHostImages = async () => {
      try {
        const imgs = await getDockerImages();
        setAvailableImages(imgs || []);
      } catch (err) {
        console.error('Failed to prefetch host images', err);
      }
    };
    loadHostImages();
  }, []);

  const handleStartScan = async (e) => {
    e.preventDefault();
    if (!imageName.trim()) {
      setError('Please provide or select a Docker image name.');
      return;
    }

    if (scanType === 'manifest' && !manifestFile) {
      setError('Please select a pom.xml manifest file to upload.');
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      setStandardResults(null);
      setManifestResults(null);

      if (scanType === 'standard') {
        const res = await scanImage(imageName.trim());
        setStandardResults(res || []);
      } else {
        const res = await scanWithManifest(imageName.trim(), manifestFile);
        setManifestResults(res || []);
      }
    } catch (err) {
      setError(err.message || 'Scan failed. Check backend logs or image availability.');
    } finally {
      setIsScanning(false);
    }
  };

  const vulnList = standardResults || [];
  const criticalCount = vulnList.filter((v) => v.severity === 'CRITICAL').length;
  const highCount = vulnList.filter((v) => v.severity === 'HIGH').length;
  const mediumCount = vulnList.filter((v) => v.severity === 'MEDIUM').length;
  const lowCount = vulnList.filter((v) => v.severity === 'LOW').length;

  const filteredVulns = vulnList.filter((v) => {
    const matchesSev = resultFilter === 'ALL' || v.severity === resultFilter;
    const q = resultSearch.toLowerCase();
    const matchesQuery =
      v.vulnerabilityID?.toLowerCase().includes(q) ||
      v.packageName?.toLowerCase().includes(q) ||
      v.title?.toLowerCase().includes(q);
    return matchesSev && matchesQuery;
  });

  return (
    <div className="space-y-8">
      {/* Scan Setup Card */}
      <Card title="Configure Image Scan" subtitle="Execute Trivy vulnerability analysis or match against pom.xml">
        <form onSubmit={handleStartScan} className="space-y-6">
          {/* Scan Mode Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setScanType('standard')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${scanType === 'standard'
                ? 'bg-blue-50 dark:bg-brand-950/40 border-brand-500 shadow-sm'
                : 'bg-slate-50 dark:bg-dark-900/60 border-slate-200 dark:border-dark-700/60 hover:border-slate-300 dark:hover:border-dark-600'
                }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Search className={`w-5 h-5 ${scanType === 'standard' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Standard Trivy Image Scan</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Scans OS packages & dependencies for CVEs. Results are automatically saved to PostgreSQL.
              </p>
            </div>

            <div
              onClick={() => setScanType('manifest')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${scanType === 'manifest'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm'
                : 'bg-slate-50 dark:bg-dark-900/60 border-slate-200 dark:border-dark-700/60 hover:border-slate-300 dark:hover:border-dark-600'
                }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileCode className={`w-5 h-5 ${scanType === 'manifest' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Manifest Scan (pom.xml Match)</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Matches image vulnerabilities against your direct Maven <code className="text-purple-700 dark:text-purple-300">pom.xml</code> dependencies.
              </p>
            </div>
          </div>

          {/* Image Name Selector & Input */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold uppercase text-slate-700 dark:text-slate-300">
              Docker Image Name <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="e.g. redis:latest or nginx:1.25"
                className="flex-1 bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
                required
              />

              {availableImages.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) setImageName(e.target.value);
                  }}
                  className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono focus:outline-none focus:border-brand-500"
                  defaultValue=""
                >
                  <option value="" disabled>Select from Host Images ({availableImages.length})</option>
                  {availableImages.map((img, i) => {
                    const full = img.tag ? `${img.name}:${img.tag}` : img.name;
                    return (
                      <option key={i} value={full}>
                        ⚡ {full} (Local)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

          </div>

          {/* pom.xml Manifest File Upload input */}
          {scanType === 'manifest' && (
            <div className="space-y-2">
              <label className="block text-xs font-mono font-semibold uppercase text-slate-700 dark:text-slate-300">
                Upload pom.xml File <span className="text-rose-500">*</span>
              </label>
              <div className="p-6 bg-slate-50 dark:bg-dark-900/80 border-2 border-dashed border-slate-300 dark:border-dark-700 hover:border-purple-500/50 rounded-xl text-center transition-colors">
                <input
                  type="file"
                  accept=".xml"
                  id="manifest-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setManifestFile(e.target.files[0]);
                  }}
                />
                <label htmlFor="manifest-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                  {manifestFile ? (
                    <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 font-mono font-semibold">
                      <FileText className="w-4 h-4" />
                      <span>{manifestFile.name}</span>
                      <span className="text-xs text-slate-500 font-normal">({(manifestFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">Click to select pom.xml manifest</span>
                      <span className="text-xs text-slate-500 mt-1">Direct dependency matching analysis</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={ShieldAlert}
              isLoading={isScanning}
              className="w-full sm:w-auto"
            >
              {isScanning ? 'Scanning Image with Trivy...' : 'Execute Security Scan'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Error Alert */}
      {error && <ErrorState message={error} />}

      {/* Honest Loading Screen */}
      {isScanning && (
        <Card bodyClassName="py-12 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            <div className="p-4 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/50 rounded-full text-brand-600 dark:text-brand-400">
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-brand-600 dark:text-brand-400 absolute -bottom-1 -right-1 bg-white dark:bg-dark-900 rounded-full p-1 border border-brand-500/50" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">Scanning image "{imageName}"...</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Running optimized Trivy vulnerability engine on host. Evaluating OS packages, CVEs, and library dependencies.
          </p>
        </Card>
      )}

      {/* Standard Scan Results */}
      {standardResults && !isScanning && (
        <div className="space-y-6">
          <Card title={`Scan Results for ${imageName}`} subtitle={`${vulnList.length} total vulnerabilities discovered`}>
            {/* Severity Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="p-3 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-lg text-center">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Total</span>
                <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{vulnList.length}</p>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg text-center">
                <span className="text-[10px] uppercase font-mono text-rose-700 dark:text-rose-400 font-bold">Critical</span>
                <p className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400">{criticalCount}</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 rounded-lg text-center">
                <span className="text-[10px] uppercase font-mono text-orange-700 dark:text-orange-400 font-bold">High</span>
                <p className="text-xl font-bold font-mono text-orange-700 dark:text-orange-400">{highCount}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-lg text-center">
                <span className="text-[10px] uppercase font-mono text-amber-800 dark:text-amber-400 font-bold">Medium</span>
                <p className="text-xl font-bold font-mono text-amber-800 dark:text-amber-400">{mediumCount}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-center">
                <span className="text-[10px] uppercase font-mono text-emerald-800 dark:text-emerald-400 font-bold">Low</span>
                <p className="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-400">{lowCount}</p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setResultFilter(sev)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${resultFilter === sev
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Filter CVE or package..."
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
                className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Vulnerability Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-dark-700/60 rounded-lg">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-700/60 uppercase">
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">CVE / Vulnerability ID</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Installed</th>
                    <th className="py-3 px-4">Fixed Version</th>
                    <th className="py-3 px-4">Title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-dark-700/40">
                  {filteredVulns.map((v, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedVuln(v)}
                      className="hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <Badge severity={v.severity} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400">{v.vulnerabilityID}</td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{v.packageName}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{v.installedVersion || 'N/A'}</td>
                      <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-semibold">{v.fixedVersion || 'None'}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-xs">{v.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Manifest-Aware Scan Results */}
      {manifestResults && !isScanning && (
        <Card
          title={`pom.xml Fix Suggestions for ${imageName}`}
          subtitle="Trivy vulnerabilities matched against pom.xml direct dependencies"
        >
          <div className="overflow-x-auto border border-slate-200 dark:border-dark-700/60 rounded-lg">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-700/60 uppercase">
                  <th className="py-3 px-4">Dependency Status</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Package Name</th>
                  <th className="py-3 px-4">Version in pom.xml</th>
                  <th className="py-3 px-4">Vulnerable Version Detected</th>
                  <th className="py-3 px-4">Recommended Bump</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-700/40">
                {manifestResults.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-800/50">
                    <td className="py-3 px-4">
                      {item.foundInManifest ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Direct Match
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-300 dark:bg-dark-900 dark:text-slate-400 dark:border-slate-700">
                          Transitive Dependency
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge severity={item.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-200">{item.packageName}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{item.currentVersionInManifest || 'N/A'}</td>
                    <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-semibold">{item.vulnerableVersionDetected || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700 dark:text-emerald-400">{item.fixedVersion || 'Upgrade package'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Vulnerability Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedVuln)}
        onClose={() => setSelectedVuln(null)}
        title={selectedVuln?.vulnerabilityID || 'Vulnerability Detail'}
        subtitle={`Package: ${selectedVuln?.packageName}`}
      >
        {selectedVuln && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex items-center gap-3">
              <Badge severity={selectedVuln.severity} />
              <span className="text-slate-600 dark:text-slate-400 font-semibold">{selectedVuln.packageName}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">{selectedVuln.title}</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">{selectedVuln.description || 'No detailed description provided by Trivy.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Installed Version</span>
                <p className="text-slate-900 dark:text-slate-200 font-bold mt-1">{selectedVuln.installedVersion || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg">
                <span className="text-slate-500 dark:text-slate-400">Fixed In Version</span>
                <p className="text-emerald-700 dark:text-emerald-400 font-bold mt-1">{selectedVuln.fixedVersion || 'None'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-dark-700">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setSelectedVuln(null);
                  navigate(`/assistant?project=${encodeURIComponent(imageName)}&q=${encodeURIComponent(`Explain vulnerability ${selectedVuln.vulnerabilityID} in ${selectedVuln.packageName}`)}`);
                }}
              >
                Ask Security Assistant About This Finding
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

