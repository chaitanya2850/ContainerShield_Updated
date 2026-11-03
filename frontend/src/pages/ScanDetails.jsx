import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, ShieldAlert, Bot, Download, FileSpreadsheet, FileText } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Drawer from '../components/common/Drawer';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { getScanDetails } from '../services/scanService';

export default function ScanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVuln, setSelectedVuln] = useState(null);

  const fetchScan = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getScanDetails(id);
      setScan(data);
    } catch (err) {
      setError(err.message || `Failed to retrieve scan #${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan();
  }, [id]);

  const vulns = scan?.vulnerabilities || [];

  const handleDownloadCSV = () => {
    if (!vulns || vulns.length === 0) return;

    const headers = ['Severity', 'Vulnerability ID', 'Package Name', 'Installed Version', 'Fixed Version', 'Title', 'Description'];
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = vulns.map((v) => [
      escapeCSV(v.severity),
      escapeCSV(v.vulnerabilityId),
      escapeCSV(v.packageName),
      escapeCSV(v.installedVersion || 'N/A'),
      escapeCSV(v.fixedVersion || 'None'),
      escapeCSV(v.title),
      escapeCSV(v.description || '')
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `vulnerability_scan_${(scan?.imageName || 'report').replace(/[^a-z0-9_-]/gi, '_')}_${scan?.id || 'details'}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!scan) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download/print PDF reports.');
      return;
    }

    const dateStr = scan.scanDate ? new Date(scan.scanDate).toLocaleString() : new Date().toLocaleString();
    const imageName = scan.imageName || 'Target Image';

    const vulnsRowsHtml = vulns
      .map(
        (v) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${
          v.severity === 'CRITICAL' ? '#be123c' : v.severity === 'HIGH' ? '#c2410c' : v.severity === 'MEDIUM' ? '#b45309' : '#047857'
        };">${v.severity || 'UNKNOWN'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-family: monospace;">${v.vulnerabilityId || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${v.packageName || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${v.installedVersion || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #047857; font-weight: bold;">${v.fixedVersion || 'None'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${(v.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ContainerShield Security Scan Report - ${imageName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
            .subtitle { font-size: 12px; color: #64748b; font-family: monospace; }
            .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
            .summary-card { padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; text-align: center; }
            .summary-card .label { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; }
            .summary-card .val { font-size: 20px; font-weight: bold; margin-top: 4px; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
            th { background: #f8fafc; text-align: left; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 10px; color: #475569; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">ContainerShield</div>
              <div class="subtitle">Vulnerability Scan Analysis Report</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 14px;">${imageName}</div>
              <div class="subtitle">Scan #${scan.id || id} • ${dateStr}</div>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card" style="background: #f8fafc;">
              <div class="label">Total Findings</div>
              <div class="val">${scan.totalVulnerabilities || 0}</div>
            </div>
            <div class="summary-card" style="background: #fff1f2; border-color: #fecdd3;">
              <div class="label" style="color: #be123c;">Critical</div>
              <div class="val" style="color: #be123c;">${scan.critical || 0}</div>
            </div>
            <div class="summary-card" style="background: #fff7ed; border-color: #ffedd5;">
              <div class="label" style="color: #c2410c;">High</div>
              <div class="val" style="color: #c2410c;">${scan.high || 0}</div>
            </div>
            <div class="summary-card" style="background: #fffbeb; border-color: #fef3c7;">
              <div class="label" style="color: #b45309;">Medium</div>
              <div class="val" style="color: #b45309;">${scan.medium || 0}</div>
            </div>
            <div class="summary-card" style="background: #ecfdf5; border-color: #a7f3d0;">
              <div class="label" style="color: #047857;">Low</div>
              <div class="val" style="color: #047857;">${scan.low || 0}</div>
            </div>
          </div>

          <h3 style="font-size: 14px; margin-bottom: 8px;">Detailed Vulnerabilities (${vulns.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>CVE / Vulnerability ID</th>
                <th>Package Name</th>
                <th>Installed Version</th>
                <th>Fixed Version</th>
                <th>Title</th>
              </tr>
            </thead>
            <tbody>
              ${vulnsRowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) return <LoadingState title={`Loading Scan #${id} details...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchScan} />;

  const filteredVulns = vulns.filter((v) => {
    const matchSev = filterSeverity === 'ALL' || v.severity === filterSeverity;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      v.vulnerabilityId?.toLowerCase().includes(q) ||
      v.packageName?.toLowerCase().includes(q) ||
      v.title?.toLowerCase().includes(q);
    return matchSev && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/scans/history" className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Scan History
      </Link>

      {/* Target Image Summary */}
      <Card
        title={`Scan Record #${scan?.id || id} • ${scan?.scanDate ? new Date(scan.scanDate).toLocaleString() : ''}`}
        subtitle={scan?.imageName || 'Unknown Image Target'}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" icon={FileSpreadsheet} onClick={handleDownloadCSV}>
              Download CSV
            </Button>
            <Button variant="secondary" size="sm" icon={FileText} onClick={handleDownloadPDF}>
              Download PDF
            </Button>
            <Button variant="primary" size="sm" icon={Bot} onClick={() => navigate(`/assistant?project=${encodeURIComponent(scan?.imageName || '')}`)}>
              Ask AI Assistant
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-center">
            <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-semibold">Total Findings</span>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{scan?.totalVulnerabilities}</p>
          </div>

          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-center">
            <span className="text-[10px] uppercase font-mono text-rose-700 dark:text-rose-400 font-bold">Critical</span>
            <p className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">{scan?.critical}</p>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 rounded-xl text-center">
            <span className="text-[10px] uppercase font-mono text-orange-700 dark:text-orange-400 font-bold">High</span>
            <p className="text-2xl font-bold font-mono text-orange-700 dark:text-orange-400 mt-1">{scan?.high}</p>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-center">
            <span className="text-[10px] uppercase font-mono text-amber-800 dark:text-amber-400 font-bold">Medium</span>
            <p className="text-2xl font-bold font-mono text-amber-800 dark:text-amber-400 mt-1">{scan?.medium}</p>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-center">
            <span className="text-[10px] uppercase font-mono text-emerald-800 dark:text-emerald-400 font-bold">Low</span>
            <p className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-400 mt-1">{scan?.low}</p>
          </div>
        </div>
      </Card>

      {/* Vulnerabilities Breakdown Table */}
      <Card title="Detailed Vulnerabilities List" subtitle={`Showing ${filteredVulns.length} of ${vulns.length} vulnerabilities`}>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  filterSeverity === sev
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search CVE ID or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-dark-900 border border-slate-300 dark:border-dark-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-dark-700/60 rounded-lg">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-dark-700/60 uppercase">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">CVE / Vulnerability ID</th>
                <th className="py-3 px-4">Package Name</th>
                <th className="py-3 px-4">Installed Version</th>
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
                  <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400">{v.vulnerabilityId}</td>
                  <td className="py-3 px-4 text-slate-900 dark:text-slate-200 font-semibold">{v.packageName}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{v.installedVersion || 'N/A'}</td>
                  <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold">{v.fixedVersion || 'None'}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-xs">{v.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Vulnerability Inspector Drawer */}
      <Drawer
        isOpen={Boolean(selectedVuln)}
        onClose={() => setSelectedVuln(null)}
        title={selectedVuln?.vulnerabilityId || 'Vulnerability Detail'}
        subtitle={`Package: ${selectedVuln?.packageName}`}
      >
        {selectedVuln && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex items-center gap-3">
              <Badge severity={selectedVuln.severity} />
              <span className="text-slate-800 dark:text-slate-300 font-bold">{selectedVuln.packageName}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">{selectedVuln.title}</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                {selectedVuln.description || 'No additional description provided in stored scan data.'}
              </p>
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
                icon={Bot}
                onClick={() => {
                  setSelectedVuln(null);
                  navigate(`/assistant?project=${encodeURIComponent(scan?.imageName || '')}&q=${encodeURIComponent(`Explain vulnerability ${selectedVuln.vulnerabilityId} in ${selectedVuln.packageName}`)}`);
                }}
              >
                Ask AI Assistant to Fix This Vulnerability
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
