
package com.example.containershield.controller;

import com.example.containershield.dto.AttackSurfaceFinding;
import com.example.containershield.dto.CorrelatedSecurityRisk;
import com.example.containershield.dto.ContainerRiskAssessment;
import com.example.containershield.dto.ContainerSecurityPriority;
import com.example.containershield.dto.EnvironmentSecurityPosture;

import com.example.containershield.service.AttackSurfaceAnalyzerService;
import com.example.containershield.service.AttackSurfaceCorrelationService;
import com.example.containershield.service.ContainerRiskAssessmentService;
import com.example.containershield.service.EnvironmentSecurityPostureService;
import com.example.containershield.service.ContainerSecurityPrioritizationService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/attack-surface")
public class AttackSurfaceController {

    private final AttackSurfaceAnalyzerService analyzerService;
    private final AttackSurfaceCorrelationService correlationService;
    private final ContainerRiskAssessmentService riskAssessmentService;
    private final EnvironmentSecurityPostureService postureService;
    private final ContainerSecurityPrioritizationService prioritizationService;

    public AttackSurfaceController(
            AttackSurfaceAnalyzerService analyzerService,
            AttackSurfaceCorrelationService correlationService,
            ContainerRiskAssessmentService riskAssessmentService,
            EnvironmentSecurityPostureService postureService,
            ContainerSecurityPrioritizationService prioritizationService) {

        this.analyzerService = analyzerService;
        this.correlationService = correlationService;
        this.riskAssessmentService = riskAssessmentService;
        this.postureService = postureService;
        this.prioritizationService = prioritizationService;
    }

    @GetMapping("/analyze")
    public List<AttackSurfaceFinding> analyzeContainers() {
        return analyzerService.analyzeContainers();
    }

    @GetMapping("/correlations")
    public List<CorrelatedSecurityRisk> analyzeCorrelations() {

        List<AttackSurfaceFinding> findings =
                analyzerService.analyzeContainers();

        return correlationService.analyze(findings);
    }

    @GetMapping("/risk-assessment")
    public List<ContainerRiskAssessment> assessContainers() {

        List<AttackSurfaceFinding> findings =
                analyzerService.analyzeContainers();

        List<CorrelatedSecurityRisk> correlatedRisks =
                correlationService.analyze(findings);

        return riskAssessmentService.assess(
                findings,
                correlatedRisks
        );
    }

    @GetMapping("/environment-posture")
    public EnvironmentSecurityPosture analyzeEnvironment() {
        return postureService.analyzeEnvironment();
    }

    @GetMapping("/priorities")
    public List<ContainerSecurityPriority> getPriorities() {

        List<AttackSurfaceFinding> findings =
                analyzerService.analyzeContainers();

        List<CorrelatedSecurityRisk> correlatedRisks =
                correlationService.analyze(findings);

        List<ContainerRiskAssessment> assessments =
                riskAssessmentService.assess(
                        findings,
                        correlatedRisks
                );

        return prioritizationService.prioritize(
                assessments,
                findings,
                correlatedRisks
        );
    }
}
