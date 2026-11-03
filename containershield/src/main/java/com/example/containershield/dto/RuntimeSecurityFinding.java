package com.example.containershield.dto;

public record RuntimeSecurityFinding(
        String containerId,
        String containerName,
        String ruleId,
        String severity,
        String title,
        String description,
        String evidence,
        String recommendation
) {}