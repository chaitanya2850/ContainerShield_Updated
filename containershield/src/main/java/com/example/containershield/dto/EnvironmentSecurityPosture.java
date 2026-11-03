
package com.example.containershield.dto;

import java.util.List;

public record EnvironmentSecurityPosture(
        int totalContainers,
        int containersWithFindings,
        int containersWithoutFindings,
        double findingCoveragePercentage,

        int criticalContainers,
        int highRiskContainers,
        int mediumRiskContainers,
        int lowRiskContainers,
        int unflaggedContainers,

        List<RuleFrequency> commonRiskFactors
) {

    public record RuleFrequency(
            String ruleId,
            int affectedContainers
    ) {}
}
