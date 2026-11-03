package com.example.containershield.service;

import com.example.containershield.dto.TrivyVulnerability;
import com.example.containershield.entity.VulnerabilityFinding;
import com.example.containershield.repository.VulnerabilityFindingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class TrivyService implements ContainerScanner {

    private final ObjectMapper objectMapper;
    private final VulnerabilityFindingRepository findingRepository;

    @Value("${trivy.server.url:http://containershield-trivy:4954}")
    private String trivyServerUrl;

    public TrivyService(ObjectMapper objectMapper, VulnerabilityFindingRepository findingRepository) {
        this.objectMapper = objectMapper;
        this.findingRepository = findingRepository;
    }

    @Override
    public List<TrivyVulnerability> scanImage(String imageName) {

        List<TrivyVulnerability> vulnerabilities = new ArrayList<>();

        try {
            ProcessBuilder processBuilder;
            boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");

            if (isWindows) {
                processBuilder = new ProcessBuilder(
                        "trivy",
                        "image",
                        "--format",
                        "json",
                        imageName
                );
            } else {
                processBuilder = new ProcessBuilder(
                        "docker",
                        "run",
                        "--rm",
                        "--network",
                        "containershield-network",
                        "-v",
                        "/var/run/docker.sock:/var/run/docker.sock",
                        "aquasec/trivy:0.74.0",
                        "image",
                        "--docker-host",
                        "unix:///var/run/docker.sock",
                        "--server",
                        trivyServerUrl,
                        "--format",
                        "json",
                        imageName
                );
            }

            Process process = processBuilder.start();

            BufferedReader outputReader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            BufferedReader errorReader = new BufferedReader(
                    new InputStreamReader(process.getErrorStream())
            );

            StringBuilder output = new StringBuilder();
            StringBuilder errorOutput = new StringBuilder();

            String line;

            while ((line = outputReader.readLine()) != null) {
                output.append(line).append("\n");
            }

            while ((line = errorReader.readLine()) != null) {
                errorOutput.append(line).append("\n");
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                if (isWindows) {
                    processBuilder = new ProcessBuilder(
                            "docker", "run", "--rm",
                            "aquasec/trivy:0.74.0", "image",
                            "--format", "json", imageName
                    );
                    process = processBuilder.start();
                    outputReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                    errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
                    output = new StringBuilder();
                    errorOutput = new StringBuilder();
                    while ((line = outputReader.readLine()) != null) { output.append(line).append("\n"); }
                    while ((line = errorReader.readLine()) != null) { errorOutput.append(line).append("\n"); }
                    exitCode = process.waitFor();
                }
                if (exitCode != 0) {
                    throw new RuntimeException("Trivy scan failed: " + errorOutput);
                }
            }

            JsonNode root = objectMapper.readTree(output.toString());
            JsonNode results = root.get("Results");

            if (results == null || !results.isArray()) {
                return vulnerabilities;
            }

            LocalDateTime scanTime = LocalDateTime.now();

            for (JsonNode result : results) {
                JsonNode vulnerabilityList = result.get("Vulnerabilities");

                if (vulnerabilityList == null || !vulnerabilityList.isArray()) {
                    continue;
                }

                for (JsonNode vulnerability : vulnerabilityList) {
                    String fullDescription = vulnerability.path("Description").asText("");

                    TrivyVulnerability dto = new TrivyVulnerability(
                            vulnerability.path("VulnerabilityID").asText(""),
                            vulnerability.path("PkgName").asText(""),
                            vulnerability.path("InstalledVersion").asText(""),
                            vulnerability.path("FixedVersion").asText(""),
                            vulnerability.path("Severity").asText(""),
                            vulnerability.path("Title").asText(""),
                            fullDescription
                    );

                    vulnerabilities.add(dto);

                    String storedDescription = fullDescription != null && fullDescription.length() > 500
                            ? fullDescription.substring(0, 500) + "..."
                            : fullDescription;

                    findingRepository.save(new VulnerabilityFinding(
                            null,
                            imageName,
                            scanTime,
                            dto.getVulnerabilityID(),
                            dto.getPackageName(),
                            dto.getInstalledVersion(),
                            dto.getFixedVersion(),
                            dto.getSeverity(),
                            dto.getTitle(),
                            storedDescription
                    ));
                }
            }

            return vulnerabilities;

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to scan Docker image: " + imageName + " (" + e.getMessage() + ")",
                    e
            );
        }
    }
}