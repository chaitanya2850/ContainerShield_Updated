package com.example.containershield.dto;

import java.util.List;

public record CorrelatedSecurityRisk(
        String containerId,
        String containerName,
        String correlationId,
        String severity,
        String title,
        String description,
        List<String> contributingRuleIds,
        String evidence,
        String recommendation
) {}