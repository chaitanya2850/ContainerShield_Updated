package com.example.containershield.controller;

import com.example.containershield.dto.RuntimeSecurityFinding;
import com.example.containershield.service.RuntimeSecurityAnalyzerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/runtime-security")
public class RuntimeSecurityController {

    private final RuntimeSecurityAnalyzerService analyzerService;

    public RuntimeSecurityController(
            RuntimeSecurityAnalyzerService analyzerService) {
        this.analyzerService = analyzerService;
    }

    @GetMapping("/analyze")
    public List<RuntimeSecurityFinding> analyzeContainers() {
        return analyzerService.analyzeContainers();
    }
}
