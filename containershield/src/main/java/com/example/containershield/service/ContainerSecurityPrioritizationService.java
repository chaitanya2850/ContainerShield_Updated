
package com.example.containershield.service;

import com.example.containershield.dto.AttackSurfaceFinding;
import com.example.containershield.dto.CorrelatedSecurityRisk;
import com.example.containershield.dto.ContainerRiskAssessment;
import com.example.containershield.dto.ContainerSecurityPriority;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ContainerSecurityPrioritizationService {

    public List<ContainerSecurityPriority> prioritize(
            List<ContainerRiskAssessment> assessments,
            List<AttackSurfaceFinding> findings,
            List<CorrelatedSecurityRisk> correlatedRisks) {

        Map<String, List<AttackSurfaceFinding>> findingsByContainer =
                new HashMap<>();

        Map<String, List<CorrelatedSecurityRisk>> risksByContainer =
                new HashMap<>();

        // Group individual findings by container.
        for (AttackSurfaceFinding finding : findings) {
            findingsByContainer
                    .computeIfAbsent(finding.containerId(),
                            key -> new ArrayList<>())
                    .add(finding);
        }

        // Group correlated risks by container.
        for (CorrelatedSecurityRisk risk : correlatedRisks) {
            risksByContainer
                    .computeIfAbsent(risk.containerId(),
                            key -> new ArrayList<>())
                    .add(risk);
        }

        List<ContainerSecurityPriority> priorities = new ArrayList<>();

        for (ContainerRiskAssessment assessment : assessments) {

            String containerId = assessment.containerId();

            List<AttackSurfaceFinding> containerFindings =
                    findingsByContainer.getOrDefault(
                            containerId, Collections.emptyList());

            List<CorrelatedSecurityRisk> containerRisks =
                    risksByContainer.getOrDefault(
                            containerId, Collections.emptyList());

            String priority = determinePriority(
                    assessment.overallRisk(),
                    containerRisks.size()
            );

            String reason = determinePriorityReason(
                    assessment.overallRisk(),
                    containerRisks.size()
            );

            // Collect recommendations from existing analysis results.
            Set<String> actions = new LinkedHashSet<>();

            for (AttackSurfaceFinding finding : containerFindings) {
                addRecommendation(actions, finding.recommendation());
            }

            for (CorrelatedSecurityRisk risk : containerRisks) {
                addRecommendation(actions, risk.recommendation());
            }

            priorities.add(new ContainerSecurityPriority(
                    assessment.containerId(),
                    assessment.containerName(),
                    priority,
                    assessment.overallRisk(),
                    assessment.individualFindingCount(),
                    assessment.correlatedRiskCount(),
                    assessment.riskFactors(),
                    reason,
                    new ArrayList<>(actions)
            ));
        }

        // Highest response priority first.
        priorities.sort(
                Comparator.comparingInt(
                        result -> getPriorityRank(result.priority())
                )
        );

        return priorities;
    }

    private String determinePriority(
            String overallRisk,
            int correlatedRiskCount) {

        String risk = overallRisk == null
                ? "NONE"
                : overallRisk.toUpperCase();

        if ("CRITICAL".equals(risk) && correlatedRiskCount > 0) {
            return "IMMEDIATE";
        }

        if ("CRITICAL".equals(risk) || "HIGH".equals(risk)) {
            return "HIGH";
        }

        if ("MEDIUM".equals(risk)) {
            return "PLANNED";
        }

        if ("LOW".equals(risk)) {
            return "MONITOR";
        }

        return "MONITOR";
    }

    private String determinePriorityReason(
            String overallRisk,
            int correlatedRiskCount) {

        String risk = overallRisk == null
                ? "NONE"
                : overallRisk.toUpperCase();

        if ("CRITICAL".equals(risk) && correlatedRiskCount > 0) {
            return "Critical security exposure with "
                    + correlatedRiskCount
                    + " detected risk correlations. Immediate investigation "
                    + "and remediation are recommended.";
        }

        if ("CRITICAL".equals(risk)) {
            return "Critical security exposure detected. "
                    + "Prioritize remediation.";
        }

        if ("HIGH".equals(risk)) {
            return "High-severity security exposure detected. "
                    + "Schedule prompt remediation.";
        }

        if ("MEDIUM".equals(risk)) {
            return "Medium-severity security configuration issues detected. "
                    + "Review and address them during planned maintenance.";
        }

        if ("LOW".equals(risk)) {
            return "Low-severity findings detected. "
                    + "Monitor and review when appropriate.";
        }

        return "No recognized risk severity was assigned. "
                + "Review the assessment.";
    }

    private void addRecommendation(
            Set<String> actions,
            String recommendation) {

        if (recommendation != null && !recommendation.isBlank()) {
            actions.add(recommendation.trim());
        }
    }

    private int getPriorityRank(String priority) {

        return switch (priority.toUpperCase()) {
            case "IMMEDIATE" -> 1;
            case "HIGH" -> 2;
            case "PLANNED" -> 3;
            case "MONITOR" -> 4;
            default -> 5;
        };
    }
}
