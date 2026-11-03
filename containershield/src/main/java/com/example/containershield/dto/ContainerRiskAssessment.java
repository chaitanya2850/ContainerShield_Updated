package com.example.containershield.dto;

import java.util.List;

public record ContainerRiskAssessment(
        String containerId,
        String containerName,
        int individualFindingCount,
        int correlatedRiskCount,
        String highestFindingSeverity,
        String highestCorrelationSeverity,
        String overallRisk,
        List<String> riskFactors
) {}