package com.example.containershield.service;

import com.example.containershield.entity.SourceCodeFinding;
import com.example.containershield.entity.VulnerabilityFinding;
import com.example.containershield.repository.SourceCodeFindingRepository;
import com.example.containershield.repository.VulnerabilityFindingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final VulnerabilityFindingRepository vulnerabilityFindingRepository;
    private final SourceCodeFindingRepository sourceCodeFindingRepository;
    private final RestTemplate restTemplate;

    @Value("${ollama.url:http://localhost:11434/api/generate}")
    private String ollamaUrl;

    @Value("${ollama.model:qwen2.5-coder:7b}")
    private String ollamaModel;

    @Value("${ollama.num-ctx:4096}")
    private int ollamaNumCtx;

    public ChatService(
            VulnerabilityFindingRepository vulnerabilityFindingRepository,
            SourceCodeFindingRepository sourceCodeFindingRepository,
            RestTemplate restTemplate) {
        this.vulnerabilityFindingRepository = vulnerabilityFindingRepository;
        this.sourceCodeFindingRepository = sourceCodeFindingRepository;
        this.restTemplate = restTemplate;
    }

    public String answerQuestion(String projectOrImageName, String question) {

        List<VulnerabilityFinding> dependencyFindings =
                vulnerabilityFindingRepository.findByImageName(projectOrImageName);

        List<SourceCodeFinding> sourceFindings =
                sourceCodeFindingRepository.findByProjectName(projectOrImageName);

        String dependencyContext = buildDependencyContext(dependencyFindings);
        String sourceContext = buildSourceContext(sourceFindings);

        String prompt = """
                You are a security assistant helping a developer understand and fix vulnerabilities in their project.
                Use only the information provided below. Be specific — mention exact file names, line numbers, package names, and versions where available.
                Do not skip the dependency vulnerabilities section — include it in your answer alongside the source code findings.
                
                === DEPENDENCY & IMAGE VULNERABILITIES (%d total) ===
                %s
                
                === SOURCE CODE FINDINGS (%d total) ===
                %s
                
                Developer's question: %s
                """.formatted(
                dependencyFindings.size(),
                dependencyContext,
                sourceFindings.size(),
                sourceContext,
                question
        );

        return callOllama(prompt);
    }

    private String buildDependencyContext(List<VulnerabilityFinding> findings) {
        if (findings.isEmpty()) {
            return "None found.";
        }
        StringBuilder sb = new StringBuilder();
        int max = Math.min(findings.size(), 50);
        for (int i = 0; i < max; i++) {
            VulnerabilityFinding f = findings.get(i);
            sb.append("- ").append(f.getPackageName())
                    .append(" (").append(f.getSeverity()).append("): ")
                    .append("installed ").append(f.getInstalledVersion())
                    .append(" → fix: ").append(
                            f.getFixedVersion() == null || f.getFixedVersion().isBlank()
                                    ? "no fix available yet"
                                    : f.getFixedVersion())
                    .append("\n");
        }
        if (findings.size() > 50) {
            sb.append("... and ").append(findings.size() - 50).append(" more dependency findings omitted for brevity.\n");
        }
        return sb.toString();
    }

    private String buildSourceContext(List<SourceCodeFinding> findings) {
        if (findings.isEmpty()) {
            return "None found.";
        }
        StringBuilder sb = new StringBuilder();
        int max = Math.min(findings.size(), 50);
        for (int i = 0; i < max; i++) {
            SourceCodeFinding f = findings.get(i);
            sb.append("- File: ").append(f.getFilePath())
                    .append(", Line: ").append(f.getStartLine())
                    .append(", Severity: ").append(f.getSeverity())
                    .append(", Issue: ").append(f.getMessage())
                    .append("\n");
        }
        if (findings.size() > 50) {
            sb.append("... and ").append(findings.size() - 50).append(" more source findings omitted for brevity.\n");
        }
        return sb.toString();
    }

    private String callOllama(String prompt) {
        try {
            log.info("Calling Ollama at {} using model {}", ollamaUrl, ollamaModel);
            Map<String, Object> requestBody = Map.of(
                    "model", ollamaModel,
                    "prompt", prompt,
                    "stream", false,
                    "options", Map.of("num_ctx", ollamaNumCtx)
            );

            Map<String, Object> response = restTemplate.postForObject(
                    ollamaUrl, requestBody, Map.class
            );

            if (response != null && response.containsKey("response")) {
                return (String) response.get("response");
            } else {
                log.warn("Received null or empty response from Ollama");
                return "No response received from the Ollama model.";
            }
        } catch (Exception e) {
            log.error("Error communicating with Ollama: {}", e.getMessage(), e);
            return "Unable to get an AI response from Ollama: " + e.getMessage() +
                   ". Please check if Ollama is running and has sufficient RAM for model '" + ollamaModel + "'.";
        }
    }
}