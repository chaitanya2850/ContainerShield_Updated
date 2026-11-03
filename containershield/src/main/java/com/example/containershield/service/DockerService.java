package com.example.containershield.service;

import com.example.containershield.dto.DockerImageDTO;
import com.example.containershield.entity.DockerContainerEntity;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Service
public class DockerService {
    private final ObjectMapper objectMapper;

    public List<DockerContainerEntity> getRunningContainers() {
        List<DockerContainerEntity> containers = new ArrayList<>();

        try {
            ProcessBuilder processBuilder = new ProcessBuilder(
                    "docker",
                    "ps",
                    "--format",
                    "{{json .}}"
            );

            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                JsonNode jsonNode = objectMapper.readTree(line);

                DockerContainerEntity container =
                        new DockerContainerEntity(
                                jsonNode.path("ID").asText(""),
                                jsonNode.path("Names").asText(""),
                                jsonNode.path("Image").asText(""),
                                jsonNode.path("Status").asText("")
                        );

                containers.add(container);
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("Docker command failed with exit code: " + exitCode);
            }

            return containers;

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to retrieve running Docker containers",
                    e
            );
        }
    }

    public List<DockerContainerEntity> getContainers(String flag) {
        List<DockerContainerEntity> containers = new ArrayList<>();

        try {
            ProcessBuilder processBuilder = new ProcessBuilder(
                    "docker",
                    "ps",
                    flag,
                    "--format",
                    "{{json .}}"
            );

            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                JsonNode jsonNode = objectMapper.readTree(line);

                DockerContainerEntity container =
                        new DockerContainerEntity(
                                jsonNode.path("ID").asText(""),
                                jsonNode.path("Names").asText(""),
                                jsonNode.path("Image").asText(""),
                                jsonNode.path("Status").asText("")
                        );

                containers.add(container);
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("Docker command failed with exit code: " + exitCode);
            }

            return containers;

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to retrieve running Docker containers",
                    e
            );
        }
    }

    public List<DockerImageDTO> getDockerImages() throws Exception {
        ProcessBuilder processBuilder = new ProcessBuilder(
                "docker",
                "images",
                "--format",
                "{{json .}}"
        );

        Process process = processBuilder.start();

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        );

        List<DockerImageDTO> images = new ArrayList<>();

        String line;
        while ((line = reader.readLine()) != null) {
            if (line.isBlank()) {
                continue;
            }

            JsonNode node = objectMapper.readTree(line);

            String id = node.path("ID").asText("");
            String repository = node.path("Repository").asText("");
            String tag = node.path("Tag").asText("");
            String size = node.path("Size").asText("");
            String created = node.path("CreatedSince").asText("");

            DockerImageDTO image = new DockerImageDTO(
                    id,
                    repository,
                    tag,
                    size,
                    created
            );

            images.add(image);
        }

        process.waitFor();

        return images;
    }
}
