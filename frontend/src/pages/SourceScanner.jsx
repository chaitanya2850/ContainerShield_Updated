import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Search, Play, FileCode, AlertTriangle, ShieldCheck, Bot, Loader2, FolderSearch } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Drawer from '../components/common/Drawer';
import ErrorState from '../components/common/ErrorState';
import { scanProject } from '../services/semgrepService';

const deriveProjectName = (pathStr) => {
  if (!pathStr) return '';
  const cleanPath = pathStr.trim().replace(/[/\\\\]+$/, '');
  const segments = cleanPath.split(/[/\\\\]/);
  const lastSegment = segments[segments.length - 1] || cleanPath;
  return lastSegment.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
};

export default function SourceScanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [projectPath, setProjectPath] = useState('d:/Final Year Project/ContainerShield/containershield');
  const [projectName, setProjectName] = useState(() => deriveProjectName('d:/Final Year Project/ContainerShield/containershield'));

  const [isScanning, setIsScanning] = useState(false);
  const [findings, setFindings] = useState(null);
  const [error, setError] = useState(null);

  const [selectedFinding, setSelectedFinding] = useState(null);
  const [filterClass, setFilterClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleBrowseFolderClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFolderSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const firstFile = files[0];
    let folderPath = '';
    let folderName = '';

    if (firstFile.path) {
      const fullFilePath = firstFile.path.replace(/\\/g, '/');
      const relativePath = (firstFile.webkitRelativePath || '').replace(/\\/g, '/');

      if (relativePath) {
        folderName = relativePath.split('/')[0];
        const relIdx = fullFilePath.toLowerCase().lastIndexOf(relativePath.toLowerCase());
        if (relIdx !== -1) {
          folderPath = fullFilePath.substring(0, relIdx + folderName.length);
        }
      }

      if (!folderPath) {
        folderPath = fullFilePath.substring(0, fullFilePath.lastIndexOf('/'));
      }
    } else if (firstFile.webkitRelativePath) {
      folderName = firstFile.webkitRelativePath.split('/')[0];
      folderPath = folderName;
    }

    if (folderPath) {
      setProjectPath(folderPath);
      setProjectName(deriveProjectName(folderName || folderPath));
    }
  };

  const handleProjectPathChange = (e) => {
    const val = e.target.value;
    setProjectPath(val);
    setProjectName(deriveProjectName(val));
  };

  const handleStartScan = async (e) => {
    e.preventDefault();
    if (!projectPath.trim() || !projectName.trim()) {
      setError('Please provide a valid project folder path.');
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      setFindings(null);

      const res = await scanProject(projectPath.trim(), projectName.trim());
      setFindings(res || []);
    } catch (err) {
      setError(err.message || 'Semgrep scan failed. Verify Semgrep binary is installed and path is accessible.');
    } finally {
      setIsScanning(false);
    }
  };

  const findingsList = findings || [];

  const filteredFindings = findingsList.filter((f) => {
    const matchClass = filterClass === 'ALL' || f.vulnerabilityClass === filterClass;
    const q = searchQuery.toLowerCase();
    const matchQ =
      f.checkId?.toLowerCase().includes(q) ||
      f.filePath?.toLowerCase().includes(q) ||
      f.message?.toLowerCase().includes(q) ||
      f.vulnerabilityClass?.toLowerCase().includes(q);
    return matchClass && matchQ;
  });

  const classes = Array.from(new Set(findingsList.map((f) => f.vulnerabilityClass).filter(Boolean)));

  return (
    <div className="space-y-8">
      {/* Scan Setup Form */}
      <Card title="Semgrep Source Code Security Scanner" subtitle="Scan Java source code for security vulnerabilities (e.g. SQL injection, unsafe deserialization)">
        <form onSubmit={handleStartScan} className="space-y-6">
          <div className="p-4 bg-brand-50 dark:bg-dark-900 border border-brand-200 dark:border-brand-800/60 rounded-xl flex items-start gap-3">
            <Code2 className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Server-Side Project Path Requirement</p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                Semgrep runs directly on the backend host server. Select a project folder from your local computer or type/paste the path to derive the project identifier.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Project Path */}
            <div className="space-y-1.5">
              <label className="block uppercase text-slate-700 dark:text-slate-300 font-semibold">
                Project Folder Path <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={projectPath}
                  onChange={handleProjectPathChange}
                  placeholder="Select or enter full project folder path..."
                  className="w-full bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-dark-700 rounded-lg px-3.5 py-2.5 shadow-xs focus:outline-none focus:border-brand-500 font-mono text-xs"
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  icon={FolderSearch}
                  onClick={handleBrowseFolderClick}
                  className="shrink-0"
                >
                  Browse Folder
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFolderSelect}
                  webkitdirectory=""
                  directory=""
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Project Name */}
            <div className="space-y-1.5">
              <label className="block uppercase text-slate-700 dark:text-slate-300 font-semibold">
                Project Name / ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Auto-derived from selected folder"
                className="w-full bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-dark-700 rounded-lg px-3.5 py-2.5 shadow-xs focus:outline-none font-mono text-xs"
                required
              />
            </div>
          </div>

          {error && <ErrorState message={error} />}

          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={Play}
              isLoading={isScanning}
              className="w-full sm:w-auto"
            >
              {isScanning ? 'Running Semgrep Analysis...' : 'Start Semgrep Source Scan'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Progress / Status banner during scan */}
      {isScanning && (
        <Card className="p-6 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-spin" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Scanning Project Codebase...</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Running Semgrep Java security ruleset (p/java). Checking code patterns for SQL injection, hardcoded secrets, and unsafe API usages.
          </p>
        </Card>
      )}

      {/* Findings Table */}
      {findings && !isScanning && (
        <Card
          title={`Semgrep Findings for ${projectName}`}
          subtitle={`${findingsList.length} security issues detected in source code`}
          action={
            findingsList.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={Bot}
                onClick={() => navigate(`/assistant?project=${encodeURIComponent(projectName)}`)}
              >
                Ask AI Assistant About Fixes
              </Button>
            )
          }
        >
          {findingsList.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 font-mono">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-200">No Vulnerabilities Found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Semgrep analyzed the source code path and found zero security policy violations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    onClick={() => setFilterClass('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                      filterClass === 'ALL' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All Classes
                  </button>
                  {classes.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setFilterClass(cls)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                        filterClass === cls ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Filter check rule or file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-xs"
                />
              </div>

              {/* Findings Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-dark-700/60 rounded-lg">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-dark-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-700/60 uppercase">
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Vulnerability Class</th>
                      <th className="py-3 px-4">File Path</th>
                      <th className="py-3 px-4">Line Range</th>
                      <th className="py-3 px-4">Rule / Check ID</th>
                      <th className="py-3 px-4">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-700/40">
                    {filteredFindings.map((f, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedFinding(f)}
                        className="hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <Badge severity={f.severity || 'HIGH'} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                          {f.vulnerabilityClass || 'Security Audit'}
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold truncate max-w-xs">
                          {f.filePath}
                        </td>
                        <td className="py-3 px-4 text-purple-700 dark:text-purple-400 font-bold">
                          L{f.startLine}{f.endLine && f.endLine !== f.startLine ? `-L${f.endLine}` : ''}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">{f.checkId}</td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-sm">{f.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Finding Inspector Drawer */}
      <Drawer
        isOpen={Boolean(selectedFinding)}
        onClose={() => setSelectedFinding(null)}
        title={selectedFinding?.vulnerabilityClass || 'Semgrep Code Finding'}
        subtitle={`Rule: ${selectedFinding?.checkId}`}
      >
        {selectedFinding && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex items-center gap-3">
              <Badge severity={selectedFinding.severity || 'HIGH'} />
              <span className="text-rose-600 dark:text-rose-400 font-bold">{selectedFinding.vulnerabilityClass}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl space-y-2">
              <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px]">Location</span>
              <p className="text-slate-900 dark:text-slate-100 font-bold">{selectedFinding.filePath}</p>
              <p className="text-purple-700 dark:text-purple-400 font-bold">
                Line Range: L{selectedFinding.startLine} to L{selectedFinding.endLine}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl space-y-2">
              <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px]">Security Message</span>
              <p className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed text-sm">{selectedFinding.message}</p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-dark-700">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                icon={Bot}
                onClick={() => {
                  setSelectedFinding(null);
                  navigate(`/assistant?project=${encodeURIComponent(projectName)}&q=${encodeURIComponent(`How do I fix ${selectedFinding.vulnerabilityClass} in ${selectedFinding.filePath} at line ${selectedFinding.startLine}?`)}`);
                }}
              >
                Ask AI Assistant How to Remediate This Code
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

