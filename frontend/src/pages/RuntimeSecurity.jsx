import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Container,
  Database,
  FileSearch,
  Filter,
  HardDrive,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
} from 'lucide-react';

import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { getRuntimeSecurityFindings } from '../services/runtimeSecurityService';

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const severityWeight = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function getContainerLabel(name = '') {
  return name.replace(/^\//, '') || 'Unknown container';
}

function getRuleCategory(ruleId = '') {
  if (ruleId === 'RUNTIME-001') return 'Container privileges';
  if (ruleId === 'RUNTIME-002') return 'User configuration';
  if (ruleId === 'RUNTIME-003') return 'Resource limits';
  if (ruleId === 'RUNTIME-004') return 'Filesystem protection';
  if (ruleId === 'RUNTIME-005') return 'Docker socket exposure';
  if (ruleId === 'RUNTIME-006') return 'Host filesystem exposure';
  if (ruleId === 'RUNTIME-007') return 'Sensitive mount exposure';
  return 'Runtime configuration';
}

function SummaryCard({ title, value, description, icon: Icon, tone }) {
  const tones = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    red: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  };

  return (
    <Card bodyClassName="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone] || tones.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ title, description, icon: Icon = ShieldCheck }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <div className="mb-3 rounded-full bg-emerald-100 p-4 dark:bg-emerald-950/50">
        <Icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function RuntimeSecurity() {
  const [findings, setFindings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [containerFilter, setContainerFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDescending, setSortDescending] = useState(true);
  const [expandedFinding, setExpandedFinding] = useState(null);

  const fetchFindings = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getRuntimeSecurityFindings();

      if (!Array.isArray(data)) {
        throw new Error('The runtime security API returned an unexpected response.');
      }

      setFindings(data);
      setLastUpdated(new Date());
      setExpandedFinding(null);
    } catch (err) {
      setError(err.message || 'Unable to load runtime security findings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  const containers = useMemo(() => {
    const map = new Map();

    findings.forEach((finding) => {
      const name = getContainerLabel(finding.containerName);
      const id = finding.containerId || name;

      if (!map.has(id)) {
        map.set(id, {
          id,
          name,
          findings: [],
        });
      }

      map.get(id).findings.push(finding);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [findings]);

  const severityCounts = useMemo(() => {
    const counts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    findings.forEach((finding) => {
      const severity = (finding.severity || '').toUpperCase();
      if (Object.hasOwn(counts, severity)) counts[severity] += 1;
    });

    return counts;
  }, [findings]);

  const filteredFindings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return findings
      .filter((finding) => {
        const matchesSeverity =
          severityFilter === 'ALL' ||
          finding.severity?.toUpperCase() === severityFilter;

        const matchesContainer =
          containerFilter === 'ALL' ||
          (finding.containerId || getContainerLabel(finding.containerName)) ===
            containerFilter;

        const searchableText = [
          finding.containerName,
          finding.ruleId,
          finding.title,
          finding.description,
          finding.evidence,
          finding.recommendation,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return (
          matchesSeverity &&
          matchesContainer &&
          searchableText.includes(query)
        );
      })
      .sort((a, b) => {
        const difference =
          (severityWeight[(a.severity || '').toUpperCase()] || 0) -
          (severityWeight[(b.severity || '').toUpperCase()] || 0);

        return sortDescending ? -difference : difference;
      });
  }, [
    findings,
    severityFilter,
    containerFilter,
    searchQuery,
    sortDescending,
  ]);

  const criticalAndHigh = severityCounts.CRITICAL + severityCounts.HIGH;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-2 text-brand-600 dark:text-brand-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
              Runtime Protection
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Runtime Security Analysis
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Analyze Docker container configuration for privilege risks,
            resource-limit gaps, filesystem weaknesses, and dangerous host
            mounts.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={RefreshCw}
          isLoading={isLoading}
          onClick={fetchFindings}
          className="shrink-0 self-start"
        >
          Refresh Analysis
        </Button>
      </section>

      {/* Live analysis status */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-dark-700/60 dark:bg-dark-850 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-brand-500" />
          <span className="font-medium text-slate-800 dark:text-slate-200">
            Docker configuration analysis
          </span>
          <span
            className={`h-2 w-2 rounded-full ${
              isLoading
                ? 'animate-pulse bg-amber-500'
                : error
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
            }`}
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isLoading ? 'Analyzing…' : error ? 'Unavailable' : 'API connected'}
          </span>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {lastUpdated
            ? `Last updated ${lastUpdated.toLocaleTimeString()}`
            : 'Waiting for first analysis'}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/30"
        >
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-rose-800 dark:text-rose-300">
              Runtime analysis failed
            </p>
            <p className="mt-1 break-words text-sm text-rose-700 dark:text-rose-400">
              {error}
            </p>
            <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">
              Check that the Spring Boot backend is running and that Docker is
              accessible to it.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchFindings}>
            Retry
          </Button>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Containers With Findings"
          value={containers.length}
          description="Containers with reported findings"
          icon={Container}
          tone="blue"
        />
        <SummaryCard
          title="Total Findings"
          value={findings.length}
          description="Rule matches returned by the API"
          icon={FileSearch}
          tone="orange"
        />
        <SummaryCard
          title="Critical Findings"
          value={severityCounts.CRITICAL}
          description="Highest-severity rule matches"
          icon={AlertOctagon}
          tone="red"
        />
        <SummaryCard
          title="High Findings"
          value={severityCounts.HIGH}
          description={`${criticalAndHigh} critical/high combined`}
          icon={AlertTriangle}
          tone="orange"
        />
      </section>

      {/* Severity overview */}
      <Card
        title="Severity Distribution"
        subtitle="Breakdown of currently reported runtime findings"
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SEVERITIES.map((severity) => {
            const selected = severityFilter === severity;
            const colors = {
              CRITICAL:
                'border-rose-300 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/20',
              HIGH:
                'border-orange-300 bg-orange-50 dark:border-orange-900/60 dark:bg-orange-950/20',
              MEDIUM:
                'border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20',
              LOW:
                'border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20',
            };

            return (
              <button
                key={severity}
                type="button"
                onClick={() =>
                  setSeverityFilter(selected ? 'ALL' : severity)
                }
                className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                  colors[severity]
                } ${
                  selected
                    ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-dark-850'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-300">
                    {severity}
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {severityCounts[severity]}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-dark-700">
                  <div
                    className="h-full rounded-full bg-current opacity-70"
                    style={{
                      width: `${
                        findings.length
                          ? (severityCounts[severity] / findings.length) * 100
                          : 0
                      }%`,
                      color:
                        severity === 'CRITICAL'
                          ? '#e11d48'
                          : severity === 'HIGH'
                            ? '#ea580c'
                            : severity === 'MEDIUM'
                              ? '#d97706'
                              : '#059669',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Container overview */}
      <Card
        title="Container Overview"
        subtitle="Containers represented in the current findings"
        action={
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-dark-800 dark:text-slate-300">
            {containers.length} containers
          </span>
        }
      >
        {isLoading && findings.length === 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-800"
              />
            ))}
          </div>
        ) : containers.length === 0 ? (
          <EmptyState
            title="No containers with findings"
            description="The API returned no runtime findings. This does not necessarily mean no containers are running."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {containers.map((container) => {
              const critical = container.findings.filter(
                (f) => f.severity?.toUpperCase() === 'CRITICAL'
              ).length;
              const high = container.findings.filter(
                (f) => f.severity?.toUpperCase() === 'HIGH'
              ).length;
              const selected = containerFilter === container.id;

              return (
                <button
                  key={container.id}
                  type="button"
                  onClick={() =>
                    setContainerFilter(selected ? 'ALL' : container.id)
                  }
                  className={`rounded-xl border p-4 text-left transition-all hover:border-brand-400 dark:hover:border-brand-500 ${
                    selected
                      ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/20'
                      : 'border-slate-200 bg-slate-50 dark:border-dark-700/60 dark:bg-dark-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-lg bg-slate-200 p-2 text-slate-700 dark:bg-dark-800 dark:text-slate-300">
                        <Terminal className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {container.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {container.findings.length} finding
                          {container.findings.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        selected ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {critical > 0 && (
                      <Badge severity="CRITICAL" text={`${critical} Critical`} size="sm" />
                    )}
                    {high > 0 && (
                      <Badge severity="HIGH" text={`${high} High`} size="sm" />
                    )}
                    {critical === 0 && high === 0 && (
                      <Badge
                        variant="generic"
                        text="No Critical / High findings"
                        showIcon={false}
                        size="sm"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Findings */}
      <Card
        title="Runtime Findings"
        subtitle="Evidence and remediation guidance generated by ContainerShield's runtime rules"
        action={
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {filteredFindings.length} / {findings.length}
          </span>
        }
      >
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search rules, containers, evidence..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-dark-700 dark:bg-dark-900 dark:text-slate-100"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={containerFilter}
              onChange={(event) => setContainerFilter(event.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-dark-700 dark:bg-dark-900 dark:text-slate-100"
            >
              <option value="ALL">All containers</option>
              {containers.map((container) => (
                <option key={container.id} value={container.id}>
                  {container.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <Button
            variant="secondary"
            icon={ArrowDownUp}
            onClick={() => setSortDescending((value) => !value)}
          >
            {sortDescending ? 'Highest first' : 'Lowest first'}
          </Button>
        </div>

        {isLoading && findings.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-800"
              />
            ))}
          </div>
        ) : error && findings.length === 0 ? (
          <EmptyState
            title="Findings could not be loaded"
            description="Resolve the API error above and retry the runtime analysis."
            icon={XCircle}
          />
        ) : filteredFindings.length === 0 ? (
          <EmptyState
            title={findings.length ? 'No matching findings' : 'No runtime findings returned'}
            description={
              findings.length
                ? 'Try changing the filters or search terms.'
                : 'The analyzer returned zero findings. Verify that the expected containers were inspected before interpreting this as a clean result.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredFindings.map((finding, index) => {
              const key = `${finding.containerId}-${finding.ruleId}-${index}`;
              const expanded = expandedFinding === key;

              return (
                <div
                  key={key}
                  className={`overflow-hidden rounded-xl border transition-colors ${
                    expanded
                      ? 'border-brand-300 dark:border-brand-700'
                      : 'border-slate-200 dark:border-dark-700/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFinding(expanded ? null : key)
                    }
                    aria-expanded={expanded}
                    className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-dark-800/60 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3 sm:w-28 sm:shrink-0">
                      <Badge
                        severity={finding.severity}
                        text={finding.severity || 'UNKNOWN'}
                        size="sm"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-brand-700 dark:text-brand-400">
                          {finding.ruleId}
                        </span>
                        <span className="text-xs text-slate-400">/</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {getRuleCategory(finding.ruleId)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {finding.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {getContainerLabel(finding.containerName)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-500 dark:border-dark-700 dark:bg-dark-900 dark:text-slate-400">
                        {finding.ruleId}
                      </span>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="space-y-4 border-t border-slate-200 bg-slate-50 p-4 dark:border-dark-700/60 dark:bg-dark-950/40">
                      <div>
                        <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Why this was flagged
                        </h4>
                        <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                          {finding.description || 'No description provided.'}
                        </p>
                      </div>

                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          <HardDrive className="h-3.5 w-3.5" />
                          Evidence
                        </h4>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-700 dark:border-dark-700 dark:bg-dark-900 dark:text-slate-300">
                          {finding.evidence || 'No evidence provided.'}
                        </pre>
                      </div>

                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                        <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Recommended remediation
                        </h4>
                        <p className="text-sm leading-6 text-emerald-900 dark:text-emerald-200">
                          {finding.recommendation || 'Review the container configuration manually.'}
                        </p>
                      </div>

                      {finding.containerId && (
                        <div>
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Container ID
                          </p>
                          <p className="break-all font-mono text-xs text-slate-500 dark:text-slate-400">
                            {finding.containerId}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Methodology note */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
        <Database className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            About this analysis
          </p>
          <p className="mt-1 text-xs leading-5 text-blue-800 dark:text-blue-400">
            Findings are generated from Docker container configuration rules.
            They are not proof of exploitation. An unspecified container user,
            for example, should be treated as a condition requiring verification
            rather than conclusive proof of root execution.
          </p>
        </div>
      </div>
    </div>
  );
}