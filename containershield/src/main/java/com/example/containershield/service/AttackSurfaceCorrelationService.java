package com.example.containershield.service;

import com.example.containershield.dto.AttackSurfaceFinding;
import com.example.containershield.dto.CorrelatedSecurityRisk;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AttackSurfaceCorrelationService {

    public List<CorrelatedSecurityRisk> analyze(
            List<AttackSurfaceFinding> findings
    ) {

        List<CorrelatedSecurityRisk> risks = new ArrayList<>();

        if (findings == null || findings.isEmpty()) {
            return risks;
        }

        // Analyze each container independently.
        Set<String> containerIds = new HashSet<>();

        for (AttackSurfaceFinding finding : findings) {
            if (finding.containerId() != null) {
                containerIds.add(finding.containerId());
            }
        }

        for (String containerId : containerIds) {

            List<AttackSurfaceFinding> containerFindings =
                    findings.stream()
                            .filter(f -> containerId.equals(f.containerId()))
                            .toList();

            Set<String> ruleIds = new HashSet<>();

            for (AttackSurfaceFinding finding : containerFindings) {
                ruleIds.add(finding.ruleId());
            }

            String containerName =
                    containerFindings.get(0).containerName();

            // COR-001: Docker socket + dangerous capability
            if (ruleIds.contains("AS-006")
                    && ruleIds.contains("AS-003")) {

                addRisk(
                        risks,
                        containerId,
                        containerName,
                        "COR-001",
                        "CRITICAL",
                        "Docker socket combined with dangerous capabilities",
                        "The container has access to the Docker daemon socket "
                                + "and has additional dangerous Linux capabilities. "
                                + "These configurations together increase the "
                                + "potential impact of a container compromise.",
                        List.of("AS-006", "AS-003"),
                        containerFindings,
                        "Remove Docker socket access and unnecessary "
                                + "Linux capabilities. Apply least-privilege "
                                + "container configuration."
                );
            }

            // COR-002: Docker socket + host network
            if (ruleIds.contains("AS-006")
                    && ruleIds.contains("AS-004")) {

                addRisk(
                        risks,
                        containerId,
                        containerName,
                        "COR-002",
                        "CRITICAL",
                        "Docker socket exposure combined with host networking",
                        "The container has access to the Docker daemon socket "
                                + "and shares the host network namespace. "
                                + "This reduces isolation across both Docker "
                                + "management and networking boundaries.",
                        List.of("AS-006", "AS-004"),
                        containerFindings,
                        "Avoid mounting the Docker socket and use an isolated "
                                + "Docker network instead of host networking."
                );
            }

            // COR-003: Docker socket + published port
            if (ruleIds.contains("AS-006")
                    && ruleIds.contains("AS-002")) {

                addRisk(
                        risks,
                        containerId,
                        containerName,
                        "COR-003",
                        "CRITICAL",
                        "Docker socket exposed through a network-published container",
                        "The container has Docker daemon socket access and "
                                + "a port published on all host interfaces. "
                                + "If an attacker can reach and compromise "
                                + "the exposed service, Docker socket access "
                                + "could significantly increase the impact.",
                        List.of("AS-006", "AS-002"),
                        containerFindings,
                        "Remove Docker socket access. Restrict published "
                                + "ports to trusted interfaces and protect "
                                + "the application with appropriate access controls."
                );
            }

            // COR-004: Dangerous capabilities + host networking
            if (ruleIds.contains("AS-003")
                    && ruleIds.contains("AS-004")) {

                addRisk(
                        risks,
                        containerId,
                        containerName,
                        "COR-004",
                        "HIGH",
                        "Dangerous capabilities combined with host networking",
                        "The container has additional dangerous Linux "
                                + "capabilities and shares the host network "
                                + "namespace. This combination reduces "
                                + "privilege and network isolation.",
                        List.of("AS-003", "AS-004"),
                        containerFindings,
                        "Remove unnecessary capabilities and use an "
                                + "isolated Docker network."
                );
            }

            // COR-005: Writable host mount + dangerous capability
            if (ruleIds.contains("AS-001")
                    && ruleIds.contains("AS-003")) {

                addRisk(
                        risks,
                        containerId,
                        containerName,
                        "COR-005",
                        "HIGH",
                        "Writable host mount combined with elevated capabilities",
                        "The container can modify a host-mounted directory "
                                + "and has additional dangerous Linux capabilities. "
                                + "A compromise could therefore have a greater "
                                + "impact on host resources.",
                        List.of("AS-001", "AS-003"),
                        containerFindings,
                        "Restrict host mounts, prefer read-only mounts "
                                + "and remove unnecessary Linux capabilities."
                );
            }
        }

        return risks;
    }

    private void addRisk(
            List<CorrelatedSecurityRisk> risks,
            String containerId,
            String containerName,
            String correlationId,
            String severity,
            String title,
            String description,
            List<String> contributingRules,
            List<AttackSurfaceFinding> findings,
            String recommendation
    ) {

        List<String> evidence = findings.stream()
                .filter(f -> contributingRules.contains(f.ruleId()))
                .map(f -> f.ruleId() + ": " + f.evidence())
                .toList();

        risks.add(new CorrelatedSecurityRisk(
                containerId,
                containerName,
                correlationId,
                severity,
                title,
                description,
                contributingRules,
                String.join(" || ", evidence),
                recommendation
        ));
    }
}