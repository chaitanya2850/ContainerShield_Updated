
package com.example.containershield.service;

import com.example.containershield.dto.AttackSurfaceFinding;
import com.example.containershield.dto.CorrelatedSecurityRisk;
import com.example.containershield.dto.ContainerRiskAssessment;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ContainerRiskAssessmentService {

    private static final Map<String, Integer> SEVERITY_RANK = Map.of(
            "INFO", 1,
            "LOW", 2,
            "MEDIUM", 3,
            "HIGH", 4,
            "CRITICAL", 5
    );

    public List<ContainerRiskAssessment> assess(
            List<AttackSurfaceFinding> findings,
            List<CorrelatedSecurityRisk> correlatedRisks) {

        Map<String, List<AttackSurfaceFinding>> findingsByContainer =
                new LinkedHashMap<>();

        Map<String, List<CorrelatedSecurityRisk>> risksByContainer =
                new LinkedHashMap<>();

        // Group individual findings by container ID.
        for (AttackSurfaceFinding finding : findings) {
            findingsByContainer
                    .computeIfAbsent(finding.containerId(),
                            key -> new ArrayList<>())
                    .add(finding);
        }

        // Group correlated risks by container ID.
        for (CorrelatedSecurityRisk risk : correlatedRisks) {
            risksByContainer
                    .computeIfAbsent(risk.containerId(),
                            key -> new ArrayList<>())
                    .add(risk);
        }

        // Include containers that have either type of result.
        Set<String> containerIds = new LinkedHashSet<>();
        containerIds.addAll(findingsByContainer.keySet());
        containerIds.addAll(risksByContainer.keySet());

        List<ContainerRiskAssessment> assessments = new ArrayList<>();

        for (String containerId : containerIds) {

            List<AttackSurfaceFinding> containerFindings =
                    findingsByContainer.getOrDefault(
                            containerId, Collections.emptyList());

            List<CorrelatedSecurityRisk> containerRisks =
                    risksByContainer.getOrDefault(
                            containerId, Collections.emptyList());

            String containerName = getContainerName(
                    containerFindings, containerRisks);

            String highestFindingSeverity =
                    getHighestFindingSeverity(containerFindings);

            String highestCorrelationSeverity =
                    getHighestCorrelationSeverity(containerRisks);

            String overallRisk = getHigherSeverity(
                    highestFindingSeverity,
                    highestCorrelationSeverity
            );

            Set<String> riskFactors = new LinkedHashSet<>();

            // Collect individual rule IDs.
            for (AttackSurfaceFinding finding : containerFindings) {
                if (finding.ruleId() != null) {
                    riskFactors.add(finding.ruleId());
                }
            }

            // Collect rules contributing to correlated risks.
            for (CorrelatedSecurityRisk risk : containerRisks) {
                if (risk.contributingRuleIds() != null) {
                    riskFactors.addAll(risk.contributingRuleIds());
                }
            }

            assessments.add(new ContainerRiskAssessment(
                    containerId,
                    containerName,
                    containerFindings.size(),
                    containerRisks.size(),
                    highestFindingSeverity,
                    highestCorrelationSeverity,
                    overallRisk,
                    new ArrayList<>(riskFactors)
            ));
        }

        return assessments;
    }

    private String getContainerName(
            List<AttackSurfaceFinding> findings,
            List<CorrelatedSecurityRisk> risks) {

        if (!findings.isEmpty()) {
            return findings.get(0).containerName();
        }

        if (!risks.isEmpty()) {
            return risks.get(0).containerName();
        }

        return "Unknown";
    }

    private String getHighestFindingSeverity(
            List<AttackSurfaceFinding> findings) {

        String highest = "NONE";

        for (AttackSurfaceFinding finding : findings) {
            highest = getHigherSeverity(highest, finding.severity());
        }

        return highest;
    }

    private String getHighestCorrelationSeverity(
            List<CorrelatedSecurityRisk> risks) {

        String highest = "NONE";

        for (CorrelatedSecurityRisk risk : risks) {
            highest = getHigherSeverity(highest, risk.severity());
        }

        return highest;
    }

    private String getHigherSeverity(String first, String second) {

        int firstRank = SEVERITY_RANK.getOrDefault(
                first == null ? "" : first.toUpperCase(), 0);

        int secondRank = SEVERITY_RANK.getOrDefault(
                second == null ? "" : second.toUpperCase(), 0);

        if (secondRank > firstRank) {
            return second;
        }

        return first;
    }
}
