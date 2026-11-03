
package com.example.containershield.service;

import com.example.containershield.dto.AttackSurfaceFinding;
import com.example.containershield.dto.CorrelatedSecurityRisk;
import com.example.containershield.dto.ContainerRiskAssessment;
import com.example.containershield.dto.EnvironmentSecurityPosture;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Container;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class EnvironmentSecurityPostureService {

    private final DockerClient dockerClient;
    private final AttackSurfaceAnalyzerService analyzerService;
    private final AttackSurfaceCorrelationService correlationService;
    private final ContainerRiskAssessmentService assessmentService;

    public EnvironmentSecurityPostureService(
            DockerClient dockerClient,
            AttackSurfaceAnalyzerService analyzerService,
            AttackSurfaceCorrelationService correlationService,
            ContainerRiskAssessmentService assessmentService) {

        this.dockerClient = dockerClient;
        this.analyzerService = analyzerService;
        this.correlationService = correlationService;
        this.assessmentService = assessmentService;
    }

    public EnvironmentSecurityPosture analyzeEnvironment() {

        // 1. Retrieve all containers, including stopped containers.
        List<Container> containers = dockerClient
                .listContainersCmd()
                .withShowAll(true)
                .exec();

        Set<String> containerIds = new HashSet<>();

        for (Container container : containers) {
            containerIds.add(container.getId());
        }

        int totalContainers = containerIds.size();

        // 2. Run individual attack-surface analysis.
        List<AttackSurfaceFinding> findings =
                analyzerService.analyzeContainers();

        // 3. Identify dangerous combinations.
        List<CorrelatedSecurityRisk> correlatedRisks =
                correlationService.analyze(findings);

        // 4. Generate one assessment per container with findings.
        List<ContainerRiskAssessment> assessments =
                assessmentService.assess(findings, correlatedRisks);

        int critical = 0;
        int high = 0;
        int medium = 0;
        int low = 0;

        Set<String> containersWithFindings = new HashSet<>();

        // Count how many containers are affected by each rule.
        Map<String, Set<String>> ruleContainerMap = new HashMap<>();

        for (ContainerRiskAssessment assessment : assessments) {

            String containerId = assessment.containerId();

            if (assessment.individualFindingCount() > 0
                    || assessment.correlatedRiskCount() > 0) {
                containersWithFindings.add(containerId);
            }

            switch (assessment.overallRisk().toUpperCase()) {
                case "CRITICAL" -> critical++;
                case "HIGH" -> high++;
                case "MEDIUM" -> medium++;
                case "LOW" -> low++;
                default -> {
                    // NONE or an unrecognized severity.
                }
            }

            // Count each rule once per container.
            for (String ruleId : assessment.riskFactors()) {
                ruleContainerMap
                        .computeIfAbsent(ruleId, key -> new HashSet<>())
                        .add(containerId);
            }
        }

        int affectedContainers = containersWithFindings.size();

        int containersWithoutFindings =
                Math.max(0, totalContainers - affectedContainers);

        double coveragePercentage = totalContainers == 0
                ? 0.0
                : Math.round(
                        (affectedContainers * 10000.0) / totalContainers
                ) / 100.0;

        // 5. Rank the most common risk factors.
        List<EnvironmentSecurityPosture.RuleFrequency> commonRiskFactors =
                new ArrayList<>();

        for (Map.Entry<String, Set<String>> entry
                : ruleContainerMap.entrySet()) {

            commonRiskFactors.add(
                    new EnvironmentSecurityPosture.RuleFrequency(
                            entry.getKey(),
                            entry.getValue().size()
                    )
            );
        }

        commonRiskFactors.sort(
                Comparator.comparingInt(
                        EnvironmentSecurityPosture.RuleFrequency::affectedContainers
                ).reversed()
        );

        return new EnvironmentSecurityPosture(
                totalContainers,
                affectedContainers,
                containersWithoutFindings,
                coveragePercentage,
                critical,
                high,
                medium,
                low,
                containersWithoutFindings,
                commonRiskFactors
        );
    }
}
