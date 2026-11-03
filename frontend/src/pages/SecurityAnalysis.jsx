import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ShieldAlert,
  Activity,
  Network,
  RefreshCw,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  ArrowLeft,
  FileText
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import Card from '../components/common/Card';
import Button from '../components/common/Button';

import {
  getAttackSurfaceFindings,
  getSecurityCorrelations,
  getContainerRiskAssessments,
  getEnvironmentSecurityPosture,
  getSecurityPriorities
} from '../services/attackSurfaceService';

/* -------------------------------------------------------
   CONSTANTS
------------------------------------------------------- */

const severityColor = {
  CRITICAL:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HIGH:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  MEDIUM:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  INFO:
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
};

const priorityColor = {
  IMMEDIATE:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HIGH:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PLANNED:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  MONITOR:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
};

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function matchesSearch(query, ...values) {
  if (!query) return true;

  return values.some(value => {
    if (value == null) return false;

    if (Array.isArray(value)) {
      return value.some(item =>
        String(item).toLowerCase().includes(query)
      );
    }

    return String(value).toLowerCase().includes(query);
  });
}

/* -------------------------------------------------------
   BADGES
------------------------------------------------------- */

function SeverityBadge({ severity }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
        severityColor[severity] || severityColor.INFO
      }`}
    >
      {severity || 'UNKNOWN'}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
        priorityColor[priority] || severityColor.INFO
      }`}
    >
      {priority || 'UNKNOWN'}
    </span>
  );
}

/* -------------------------------------------------------
   SUMMARY CARD
------------------------------------------------------- */

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <Card>
      <div className="flex min-h-[112px] h-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 min-h-10">
            {title}
          </p>

          <p className="text-3xl font-bold tabular-nums mt-1 text-gray-900 dark:text-white">
            {value ?? 0}
          </p>

          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400 mt-2">
            {description}
          </p>
        </div>

        <div className="shrink-0 p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------
   CONTAINER IDENTITY
------------------------------------------------------- */

function ContainerIdentity({ name, id }) {
  return (
    <div className="min-w-0 space-y-2">
      <div>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
          Container Name
        </p>

        <p className="font-semibold text-gray-900 dark:text-white break-words">
          {name || 'Unknown container'}
        </p>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
          Container ID
        </p>

        <p
          title={id || 'Container ID unavailable'}
          className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all"
        >
          {id || 'Unavailable'}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   EMPTY STATE
------------------------------------------------------- */

function EmptyState({ message }) {
  return (
    <Card>
      <p className="text-center py-6 text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </Card>
  );
}

/* -------------------------------------------------------
   PDF REPORT GENERATOR
------------------------------------------------------- */

function downloadContainerPdf({
  priority,
  assessment,
  findings,
  correlations,
  actions
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  const containerName =
    priority.containerName || 'Unknown container';

  const containerId =
    priority.containerId || 'Unavailable';

  const overallRisk =
    priority.overallRisk || assessment?.overallRisk || 'N/A';

  const contributingRules =
    priority.contributingRuleIds || [];

  /* Report heading */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);

  doc.text(
    'ContainerShield - Container Security Report',
    14,
    18
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(`Container Name: ${containerName}`, 14, 27);
  doc.text(`Container ID: ${containerId}`, 14, 33);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 39);

  /* Security overview */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  doc.text('Security Overview', 14, 50);

  autoTable(doc, {
    startY: 54,

    head: [['Metric', 'Value']],

    body: [
      ['Overall Risk', overallRisk],
      ['Remediation Priority', priority.priority || 'N/A'],
      ['Individual Findings', String(findings.length)],
      ['Correlated Risks', String(correlations.length)],
      [
        'Contributing Rules',
        contributingRules.join(', ') || 'None'
      ]
    ],

    theme: 'grid',

    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle'
    },

    headStyles: {
      fillColor: [37, 99, 235]
    },

    margin: {
      left: 14,
      right: 14
    }
  });

  /* Individual findings */

  let y = doc.lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  doc.text('Individual Attack Surface Findings', 14, y);

  autoTable(doc, {
    startY: y + 4,

    head: [[
      'Rule ID',
      'Finding',
      'Severity',
      'Description',
      'Evidence',
      'Recommendation'
    ]],

    body: findings.length
      ? findings.map(item => [
          item.ruleId || '-',
          item.title || '-',
          item.severity || '-',
          item.description || '-',
          item.evidence || '-',
          item.recommendation || '-'
        ])
      : [[
          '-',
          'No individual findings',
          '-',
          '-',
          '-',
          '-'
        ]],

    theme: 'grid',

    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
      valign: 'top'
    },

    headStyles: {
      fillColor: [37, 99, 235]
    },

    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 35 },
      2: { cellWidth: 22 },
      3: { cellWidth: 48 },
      4: { cellWidth: 48 },
      5: { cellWidth: 'auto' }
    },

    margin: {
      left: 14,
      right: 14
    }
  });

  /* Correlated risks */

  y = doc.lastAutoTable.finalY + 10;

  if (y > 175) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  doc.text('Correlated Security Risks', 14, y);

  autoTable(doc, {
    startY: y + 4,

    head: [[
      'Correlation ID',
      'Risk',
      'Severity',
      'Contributing Rules',
      'Description',
      'Evidence',
      'Recommendation'
    ]],

    body: correlations.length
      ? correlations.map(item => [
          item.correlationId || '-',
          item.title || '-',
          item.severity || '-',
          (item.contributingRuleIds || []).join(', '),
          item.description || '-',
          item.evidence || '-',
          item.recommendation || '-'
        ])
      : [[
          '-',
          'No correlated risks',
          '-',
          '-',
          '-',
          '-',
          '-'
        ]],

    theme: 'grid',

    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      overflow: 'linebreak',
      valign: 'top'
    },

    headStyles: {
      fillColor: [37, 99, 235]
    },

    columnStyles: {
      0: { cellWidth: 27 },
      1: { cellWidth: 35 },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 48 },
      5: { cellWidth: 48 },
      6: { cellWidth: 'auto' }
    },

    margin: {
      left: 14,
      right: 14
    }
  });

  /* Consolidated remediation */

  y = doc.lastAutoTable.finalY + 10;

  if (y > 175) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  doc.text('Consolidated Remediation Recommendations', 14, y);

  autoTable(doc, {
    startY: y + 4,

    head: [['#', 'Recommended Action']],

    body: actions.length
      ? actions.map((action, index) => [
          String(index + 1),
          action
        ])
      : [['-', 'No recommendations available']],

    theme: 'grid',

    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'top'
    },

    headStyles: {
      fillColor: [37, 99, 235]
    },

    columnStyles: {
      0: { cellWidth: 12 }
    },

    margin: {
      left: 14,
      right: 14
    }
  });

  /* Page numbers */

  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    doc.text(
      `ContainerShield | Page ${page} of ${pageCount}`,
      pageWidth / 2,
      200,
      { align: 'center' }
    );
  }

  const safeName = containerName.replace(
    /[^a-z0-9-_]/gi,
    '_'
  );

  doc.save(
    `ContainerShield_${safeName}_Security_Report.pdf`
  );
}

/* -------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------- */

export default function SecurityAnalysis() {
  const [data, setData] = useState({
    findings: [],
    correlations: [],
    assessments: [],
    posture: null,
    priorities: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [expanded, setExpanded] = useState({});
  const [selectedContainer, setSelectedContainer] = useState(null);

  /* -------------------------------------------------------
     FETCH ANALYSIS
  ------------------------------------------------------- */

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [
        findings,
        correlations,
        assessments,
        posture,
        priorities
      ] = await Promise.all([
        getAttackSurfaceFindings(),
        getSecurityCorrelations(),
        getContainerRiskAssessments(),
        getEnvironmentSecurityPosture(),
        getSecurityPriorities()
      ]);

      setData({
        findings: findings || [],
        correlations: correlations || [],
        assessments: assessments || [],
        posture,
        priorities: priorities || []
      });

      // Clear selected container if it no longer exists.
      setSelectedContainer(previous => {
        if (!previous) return null;

        const stillExists = (priorities || []).some(
          item => item.containerId === previous
        );

        return stillExists ? previous : null;
      });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load security analysis.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  /* -------------------------------------------------------
     FILTERING
  ------------------------------------------------------- */

  const query = search.toLowerCase().trim();

  const filteredPriorities = useMemo(() => {
    return data.priorities.filter(item => {
      const searchMatch = matchesSearch(
        query,
        item.containerName,
        item.containerId,
        item.priority,
        item.overallRisk,
        item.priorityReason,
        item.contributingRuleIds,
        item.recommendedActions
      );

      const severityMatch =
        severityFilter === 'ALL' ||
        item.overallRisk === severityFilter;

      const priorityMatch =
        priorityFilter === 'ALL' ||
        item.priority === priorityFilter;

      return searchMatch && severityMatch && priorityMatch;
    });
  }, [
    data.priorities,
    query,
    severityFilter,
    priorityFilter
  ]);

  const filteredCorrelations = useMemo(() => {
    return data.correlations.filter(risk => {
      const searchMatch = matchesSearch(
        query,
        risk.containerName,
        risk.containerId,
        risk.correlationId,
        risk.title,
        risk.description,
        risk.contributingRuleIds,
        risk.evidence,
        risk.recommendation
      );

      const severityMatch =
        severityFilter === 'ALL' ||
        risk.severity === severityFilter;

      return searchMatch && severityMatch;
    });
  }, [
    data.correlations,
    query,
    severityFilter
  ]);

  const filteredFindings = useMemo(() => {
    return data.findings.filter(finding => {
      const searchMatch = matchesSearch(
        query,
        finding.containerName,
        finding.containerId,
        finding.ruleId,
        finding.title,
        finding.description,
        finding.evidence,
        finding.recommendation
      );

      const severityMatch =
        severityFilter === 'ALL' ||
        finding.severity === severityFilter;

      return searchMatch && severityMatch;
    });
  }, [
    data.findings,
    query,
    severityFilter
  ]);

  /* -------------------------------------------------------
     GENERAL HELPERS
  ------------------------------------------------------- */

  const toggleExpanded = key => {
    setExpanded(previous => ({
      ...previous,
      [key]: !previous[key]
    }));
  };

  const clearFilters = () => {
    setSearch('');
    setSeverityFilter('ALL');
    setPriorityFilter('ALL');
  };

  /* -------------------------------------------------------
     LOADING STATE
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(item => (
            <div
              key={item}
              className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>

        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  /* -------------------------------------------------------
     ERROR STATE
  ------------------------------------------------------- */

  if (error) {
    return (
      <div className="p-6">
        <Card title="Security Analysis">
          <div className="flex flex-col items-center text-center py-8">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />

            <p className="text-red-600 dark:text-red-400">
              {error}
            </p>

            <Button onClick={fetchAnalysis} className="mt-4">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const posture = data.posture || {};

  /* -------------------------------------------------------
     SELECTED CONTAINER DATA
  ------------------------------------------------------- */

  const selectedPriority = selectedContainer
    ? data.priorities.find(
        item => item.containerId === selectedContainer
      )
    : null;

  const selectedAssessment = selectedContainer
    ? data.assessments.find(
        item => item.containerId === selectedContainer
      )
    : null;

  const selectedFindings = selectedContainer
    ? data.findings.filter(
        item => item.containerId === selectedContainer
      )
    : [];

  const selectedCorrelations = selectedContainer
    ? data.correlations.filter(
        item => item.containerId === selectedContainer
      )
    : [];

  const selectedActions = selectedPriority
    ? [
        ...new Set([
          ...(selectedPriority.recommendedActions || []),

          ...selectedFindings
            .map(item => item.recommendation)
            .filter(Boolean),

          ...selectedCorrelations
            .map(item => item.recommendation)
            .filter(Boolean)
        ])
      ]
    : [];

  /* -------------------------------------------------------
     PDF DOWNLOAD HANDLER
  ------------------------------------------------------- */

  const handleDownloadPdf = () => {
    if (!selectedPriority) return;

    downloadContainerPdf({
      priority: selectedPriority,
      assessment: selectedAssessment,
      findings: selectedFindings,
      correlations: selectedCorrelations,
      actions: selectedActions
    });
  };

  /* -------------------------------------------------------
     CONTAINER DETAIL VIEW
  ------------------------------------------------------- */

  if (selectedContainer) {
    if (!selectedPriority) {
      return (
        <div className="p-6 space-y-4">
          <Button onClick={() => setSelectedContainer(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Security Analysis
          </Button>

          <EmptyState message="Container security details are no longer available. Refresh the analysis and try again." />
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">

        {/* Detail page header */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setSelectedContainer(null)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Back to security analysis"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Container Security Details
              </h1>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Combined findings, correlated risks and remediation guidance.
              </p>
            </div>
          </div>

          <Button onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Container overview */}

        <Card title="Container Overview">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0 flex-1">
              <ContainerIdentity
                name={selectedPriority.containerName}
                id={selectedPriority.containerId}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity={selectedPriority.overallRisk} />
              <PriorityBadge priority={selectedPriority.priority} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Individual Findings
              </p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {selectedFindings.length}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Correlated Risks
              </p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {selectedCorrelations.length}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Contributing Rules
              </p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(selectedPriority.contributingRuleIds || []).length}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Why this container has this priority
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {selectedPriority.priorityReason ||
                'No priority explanation available.'}
            </p>
          </div>
        </Card>

        {/* Individual findings */}

        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Individual Attack Surface Findings
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Risky configurations detected in this container.
            </p>
          </div>

          {selectedFindings.length === 0 ? (
            <EmptyState message="No individual attack-surface findings for this container." />
          ) : (
            <div className="space-y-3">
              {selectedFindings.map((finding, index) => (
                <Card key={`${finding.ruleId}-${index}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {finding.title}
                      </p>

                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">
                        {finding.ruleId}
                      </p>
                    </div>

                    <SeverityBadge severity={finding.severity} />
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                    {finding.description || 'No description available.'}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Evidence
                      </p>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                        {finding.evidence || 'No evidence recorded.'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Recommendation
                      </p>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {finding.recommendation ||
                          'No recommendation recorded.'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Correlated risks */}

        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Correlated Security Risks
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Combinations of configurations that increase potential attack impact.
            </p>
          </div>

          {selectedCorrelations.length === 0 ? (
            <EmptyState message="No correlated risks detected for this container." />
          ) : (
            <div className="space-y-3">
              {selectedCorrelations.map((risk, index) => (
                <Card key={`${risk.correlationId}-${index}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {risk.title}
                      </h3>

                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">
                        {risk.correlationId}
                      </p>
                    </div>

                    <SeverityBadge severity={risk.severity} />
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                    {risk.description}
                  </p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Contributing Rules
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {(risk.contributingRuleIds || []).map(rule => (
                        <span
                          key={rule}
                          className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono"
                        >
                          {rule}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Evidence
                      </p>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                        {risk.evidence || 'No evidence recorded.'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Recommendation
                      </p>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {risk.recommendation ||
                          'No recommendation recorded.'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Consolidated remediation */}

        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Consolidated Remediation Plan
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Recommended actions collected from this container's findings and correlations.
            </p>
          </div>

          <Card>
            {selectedActions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No remediation recommendations are available.
              </p>
            ) : (
              <ol className="list-decimal list-inside space-y-3">
                {selectedActions.map((action, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 leading-6"
                  >
                    {action}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </section>

        {/* Bottom export button */}

        <div className="flex justify-end">
          <Button onClick={handleDownloadPdf}>
            <FileText className="w-4 h-4 mr-2" />
            Export Container Report
          </Button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     MAIN SECURITY ANALYSIS VIEW
  ------------------------------------------------------- */

  return (
    <div className="p-6 space-y-6">

      {/* Page heading */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security Analysis
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Understand container exposure, combined security risks, and remediation priorities.
          </p>
        </div>

        <Button onClick={fetchAnalysis}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Environment security posture */}

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Environment Security Posture
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Containers"
            value={posture.totalContainers}
            description="Containers in Docker inventory"
            icon={Activity}
          />

          <SummaryCard
            title="Containers With Findings"
            value={posture.containersWithFindings}
            description="Containers flagged by analysis"
            icon={ShieldAlert}
          />

          <SummaryCard
            title="Critical Containers"
            value={posture.criticalContainers}
            description="Containers with critical overall risk"
            icon={AlertTriangle}
          />

          <SummaryCard
            title="Correlated Risks"
            value={data.correlations.length}
            description="Combined configuration risks"
            icon={Network}
          />
        </div>

        {/* Finding coverage */}

        <Card className="mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Finding Coverage
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Percentage of inventoried containers with detected findings.
              </p>
            </div>

            <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
              {posture.findingCoveragePercentage ?? 0}%
            </p>
          </div>

          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    posture.findingCoveragePercentage || 0
                  )
                )}%`
              }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            {[
              ['High risk', posture.highRiskContainers],
              ['Medium risk', posture.mediumRiskContainers],
              ['Low risk', posture.lowRiskContainers],
              ['Unflagged', posture.unflaggedContainers]
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {label}
                </p>

                <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white mt-2">
                  {value ?? 0}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Global filters */}

      <section>
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Find Security Issues
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Search across container names, IDs, rule IDs, findings, and correlations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Container name, ID, AS-003..."
                  aria-label="Search security analysis"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                aria-label="Filter by severity"
                className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                aria-label="Filter by remediation priority"
                className="px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="IMMEDIATE">Immediate</option>
                <option value="HIGH">High</option>
                <option value="PLANNED">Planned</option>
                <option value="MONITOR">Monitor</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredPriorities.length} priority entries,{' '}
                {filteredCorrelations.length} correlated risks, and{' '}
                {filteredFindings.length} individual findings.
              </p>

              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline text-left"
              >
                Clear filters
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* Container remediation priorities */}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Container Remediation Priorities
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a container to view its complete security analysis and remediation plan.
          </p>
        </div>

        <div className="space-y-3">
          {filteredPriorities.length === 0 ? (
            <EmptyState message="No matching container priorities. Try changing your search or filters." />
          ) : (
            filteredPriorities.map((item, index) => {
              const key = item.containerId || index;
              const isExpanded = expanded[key];

              return (
                <Card key={key}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                    <button
                      type="button"
                      onClick={() => setSelectedContainer(item.containerId)}
                      className="text-left min-w-0 flex-1 hover:opacity-75 transition-opacity"
                      title="View complete container security details"
                    >
                      <ContainerIdentity
                        name={item.containerName}
                        id={item.containerId}
                      />

                      <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                        View container details
                        <ChevronDown className="w-4 h-4 -rotate-90" />
                      </span>
                    </button>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <SeverityBadge severity={item.overallRisk} />

                      <PriorityBadge priority={item.priority} />

                      <button
                        onClick={() => toggleExpanded(key)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Toggle container details"
                      >
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Individual Findings
                      </p>

                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {item.individualFindingCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Correlated Risks
                      </p>

                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {item.correlatedRiskCount}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-4">

                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                          Why this priority?
                        </h4>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {item.priorityReason}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                          Contributing Rules
                        </h4>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {(item.contributingRuleIds || []).map(rule => (
                            <span
                              key={rule}
                              className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono"
                            >
                              {rule}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                          Recommended Actions
                        </h4>

                        <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {(item.recommendedActions || []).map((action, i) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedContainer(item.containerId)}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open complete container analysis →
                      </button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* Correlated risks */}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Correlated Security Risks
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Risk combinations detected within individual containers.
          </p>
        </div>

        {filteredCorrelations.length === 0 ? (
          <EmptyState message="No correlated risks match the current search and filters." />
        ) : (
          <div className="space-y-3">
            {filteredCorrelations.map((risk, index) => (
              <Card key={`${risk.containerId}-${risk.correlationId}-${index}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {risk.title}
                    </p>

                    <div className="mt-3">
                      <ContainerIdentity
                        name={risk.containerName}
                        id={risk.containerId}
                      />
                    </div>

                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-3">
                      Correlation ID: {risk.correlationId}
                    </p>

                    <button
                      type="button"
                      onClick={() => setSelectedContainer(risk.containerId)}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mt-3"
                    >
                      View container details →
                    </button>
                  </div>

                  <SeverityBadge severity={risk.severity} />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                  {risk.description}
                </p>

                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Combined Rules
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(risk.contributingRuleIds || []).map(rule => (
                      <span
                        key={rule}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono"
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  <p className="text-gray-500 dark:text-gray-400">
                    Evidence
                  </p>

                  <p className="text-gray-700 dark:text-gray-300 mt-1 break-words">
                    {risk.evidence}
                  </p>
                </div>

                <div className="mt-3 text-sm">
                  <p className="text-gray-500 dark:text-gray-400">
                    Recommendation
                  </p>

                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    {risk.recommendation}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Individual findings */}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Individual Attack Surface Findings
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Individual risky configurations detected in Docker containers.
          </p>
        </div>

        {filteredFindings.length === 0 ? (
          <EmptyState message="No individual findings match the current search and filters." />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="py-3 pr-4">Container Identity</th>
                    <th className="py-3 pr-4">Rule ID</th>
                    <th className="py-3 pr-4">Finding</th>
                    <th className="py-3">Severity</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFindings.map((finding, index) => (
                    <tr
                      key={`${finding.containerId}-${finding.ruleId}-${index}`}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-3 pr-4 min-w-48">
                        <button
                          type="button"
                          onClick={() => setSelectedContainer(finding.containerId)}
                          className="text-left hover:opacity-75"
                        >
                          <div className="font-medium text-blue-600 dark:text-blue-400">
                            {finding.containerName || 'Unknown container'}
                          </div>

                          <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">
                            Container ID
                          </div>

                          <div className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all mt-1">
                            {finding.containerId || 'Unavailable'}
                          </div>
                        </button>
                      </td>

                      <td className="py-3 pr-4 font-mono text-xs">
                        {finding.ruleId}
                      </td>

                      <td className="py-3 pr-4 text-gray-700 dark:text-gray-300 min-w-48">
                        <p className="font-medium">
                          {finding.title}
                        </p>

                        {finding.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {finding.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3">
                        <SeverityBadge severity={finding.severity} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* Methodology */}

      <Card title="How to interpret this analysis">
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong>Individual findings:</strong> Identify risky container configurations.
          </p>

          <p>
            <strong>Correlated risks:</strong> Identify combinations of configurations
            that can increase the potential impact of an attack.
          </p>

          <p>
            <strong>Container risk:</strong> Summarizes the highest severity detected
            for each container.
          </p>

          <p>
            <strong>Remediation priority:</strong> Uses ContainerShield's prioritization
            policy to help decide which containers should be addressed first.
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
            Correlation severities and remediation priorities are ContainerShield
            policy decisions, not universal industry scoring standards.
          </p>
        </div>
      </Card>

    </div>
  );
}
