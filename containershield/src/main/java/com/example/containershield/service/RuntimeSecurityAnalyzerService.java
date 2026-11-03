package com.example.containershield.service;

import com.example.containershield.dto.RuntimeSecurityFinding;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.command.InspectContainerResponse.Mount;
import com.github.dockerjava.api.model.HostConfig;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class RuntimeSecurityAnalyzerService {

    private final DockerClient dockerClient;

    private static final Set<String> SENSITIVE_HOST_PATHS = Set.of(
            "/etc",
            "/proc",
            "/sys",
            "/dev"
    );

    public RuntimeSecurityAnalyzerService(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
    }

    public List<RuntimeSecurityFinding> analyzeContainers() {

        List<RuntimeSecurityFinding> findings = new ArrayList<>();

        List<Container> containers = dockerClient
                .listContainersCmd()
                .withShowAll(true)
                .exec();

        for (Container container : containers) {

            InspectContainerResponse inspect = dockerClient
                    .inspectContainerCmd(container.getId())
                    .exec();

            HostConfig hostConfig = inspect.getHostConfig();

            if (hostConfig == null) {
                continue;
            }

            String containerId = inspect.getId();
            String containerName = inspect.getName();

            // Rules 5–7: Analyze container mounts.
            findings.addAll(analyzeMounts(
                    containerId,
                    containerName,
                    inspect
            ));

            // Rule 1: Privileged container.
            if (Boolean.TRUE.equals(hostConfig.getPrivileged())) {
                findings.add(new RuntimeSecurityFinding(
                        containerId,
                        containerName,
                        "RUNTIME-001",
                        "HIGH",
                        "Privileged container",
                        "The container has privileged mode enabled, granting it extensive access to the host.",
                        "HostConfig.Privileged = true",
                        "Disable privileged mode unless essential. Grant only the permissions required."
                ));
            }

            // Rule 2: Root-user configuration heuristic.
            String user = inspect.getConfig() != null
                    ? inspect.getConfig().getUser()
                    : null;

            if (isRootUser(user)) {
                findings.add(new RuntimeSecurityFinding(
                        containerId,
                        containerName,
                        "RUNTIME-002",
                        "HIGH",
                        "Container configured to run as root",
                        "The container user is unspecified or configured as root. The effective identity of individual processes has not been verified.",
                        "Config.User = "
                                + (user == null || user.isBlank()
                                ? "(default)"
                                : user),
                        "Where possible, configure a dedicated non-root user and verify the effective runtime identity."
                ));
            }

            // Rule 3: Missing memory limit.
            Long memoryLimit = hostConfig.getMemory();

            if (memoryLimit == null || memoryLimit <= 0) {
                findings.add(new RuntimeSecurityFinding(
                        containerId,
                        containerName,
                        "RUNTIME-003",
                        "MEDIUM",
                        "Missing memory limit",
                        "The container has no explicit memory limit configured. Excessive memory use could affect other workloads.",
                        "HostConfig.Memory = " + memoryLimit,
                        "Configure a suitable memory limit based on the application's requirements."
                ));
            }

            // Rule 4: Writable root filesystem.
            if (!Boolean.TRUE.equals(hostConfig.getReadonlyRootfs())) {
                findings.add(new RuntimeSecurityFinding(
                        containerId,
                        containerName,
                        "RUNTIME-004",
                        "MEDIUM",
                        "Writable root filesystem",
                        "The container's root filesystem is not configured as read-only.",
                        "HostConfig.ReadonlyRootfs = false",
                        "Consider enabling a read-only root filesystem and providing required writable paths explicitly."
                ));
            }
        }

        return findings;
    }

    private boolean isRootUser(String user) {

        // Docker normally defaults to root when no user is specified.
        if (user == null || user.isBlank()) {
            return true;
        }

        // A user specification can include UID:GID.
        String uid = user.split(":", 2)[0].trim();

        return uid.equals("0") || uid.equalsIgnoreCase("root");
    }

    private List<RuntimeSecurityFinding> analyzeMounts(
            String containerId,
            String containerName,
            InspectContainerResponse inspect) {

        List<RuntimeSecurityFinding> findings = new ArrayList<>();

        if (inspect.getMounts() == null) {
            return findings;
        }

        for (Mount mount : inspect.getMounts()) {
            String source = mount.getSource();
            String destination = mount.getDestination() != null ? mount.getDestination().getPath() : null;

            if (source == null || destination == null) {
                continue;
            }

            String normalizedSource = normalizePath(source);
            String normalizedDestination = normalizePath(destination);

            // Rule 5: Docker socket mount.
            if (normalizedSource.equals("/var/run/docker.sock")
                    || normalizedDestination.equals("/var/run/docker.sock")) {

                findings.add(new RuntimeSecurityFinding(
                        containerId,
                        containerName,
                        "RUNTIME-005",
                        "CRITICAL",
                        "Docker socket mounted into container",
                        "The container has a mount associated with the Docker socket, potentially allowing access to the Docker daemon.",
                        "Source = " + source + ", Destination = " + destination,
                        "Avoid mounting the Docker socket into application containers. If daemon access is essential, use a narrowly scoped alternative."
                ));

                continue;
            }

            // Rule 6: Host root filesystem mounted.
            // The source must be the host root; a destination named /host
            // alone is not evidence of host filesystem exposure.
            if (normalizedSource.equals("/")) {

                findings.add(new RuntimeSecurityFinding(
                        containerId,
                        containerName,
                        "RUNTIME-006",
                        "CRITICAL",
                        "Host root filesystem mounted",
                        "The host root filesystem appears to be mounted into the container.",
                        "Source = " + source + ", Destination = " + destination,
                        "Remove broad host filesystem mounts unless strictly necessary. Restrict the source path and access permissions."
                ));

                continue;
            }

            // Rule 7: Sensitive host directory mounted.
            boolean sensitiveHostPath = SENSITIVE_HOST_PATHS.stream()
                    .anyMatch(path ->
                            normalizedSource.equals(path)
                                    || normalizedSource.startsWith(path + "/")
                    );

            if (sensitiveHostPath) {
                findings.add(new RuntimeSecurityFinding(
                        containerId,
                        containerName,
                        "RUNTIME-007",
                        "HIGH",
                        "Potentially sensitive host path mounted",
                        "The mount source is a sensitive system path. The actual risk depends on the path, mount type, access mode, and workload.",
                        "Source = " + source + ", Destination = " + destination,
                        "Review whether the host path must be exposed. Restrict the mounted path and permissions to the minimum necessary."
                ));
            }
        }

        return findings;
    }

    private String normalizePath(String path) {

        String normalized = path.trim();

        // Remove trailing slashes while preserving the root path "/".
        while (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        return normalized;
    }
}
