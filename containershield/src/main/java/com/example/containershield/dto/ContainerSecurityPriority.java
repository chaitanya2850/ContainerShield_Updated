
package com.example.containershield.dto;

import java.util.List;

public record ContainerSecurityPriority(
        String containerId,
        String containerName,
        String priority,
        String overallRisk,
        int individualFindingCount,
        int correlatedRiskCount,
        List<String> contributingRuleIds,
        String priorityReason,
        List<String> recommendedActions
) {}
