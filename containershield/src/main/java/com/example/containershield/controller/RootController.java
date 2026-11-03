package com.example.containershield.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> home() {
        return Map.of(
                "application", "ContainerShield",
                "version", "1.0.0",
                "status", "UP",
                "message", "Docker Security & Vulnerability Intelligence Platform",
                "components", Map.of(
                        "vulnerabilityScanning", "Trivy",
                        "sourceCodeAnalysis", "Semgrep",
                        "AIAnalysis", "Ollama"
                )
        );
    }
}