package com.example.containershield.service;

import com.example.containershield.dto.AttackSurfaceFinding;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.command.InspectContainerResponse.Mount;
import com.github.dockerjava.api.model.Capability;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Device;
import com.github.dockerjava.api.model.ExposedPort;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Ports;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AttackSurfaceAnalyzerService {

    private final DockerClient dockerClient;

    public AttackSurfaceAnalyzerService(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
    }

    public List<AttackSurfaceFinding> analyzeContainers() {

        List<AttackSurfaceFinding> findings = new ArrayList<>();

        List<Container> containers = dockerClient
                .listContainersCmd()
                .withShowAll(true)
                .exec();
        
        for (Container container : containers) {

            InspectContainerResponse inspect = dockerClient
                    .inspectContainerCmd(container.getId())
                    .exec();

            String containerId = inspect.getId();
            String containerName = normalizeName(inspect.getName());

            // AS-001: Writable host bind mounts
            analyzeWritableBindMounts(
                    inspect, containerId, containerName, findings
            );

            // AS-002: Ports published on all host interfaces
            analyzePublishedPorts(
                    inspect, containerId, containerName, findings
            );

            // AS-003: Dangerous Linux capabilities
            analyzeDangerousCapabilities(
                    inspect, containerId, containerName, findings
            );

            // AS-004: Host network mode
            analyzeHostNetworkMode(
                    inspect, containerId, containerName, findings
            );

            // AS-005: Host device access
            analyzeHostDeviceAccess(
                    inspect, containerId, containerName, findings
            );
            // AS-006: Docker socket exposure
            analyzeDockerSocketExposure(
                    inspect, containerId, containerName, findings
            );
        }

        return findings;
    }

    /*
     * AS-001
     * Detect writable host bind mounts.
     */
    private void analyzeWritableBindMounts(
            InspectContainerResponse inspect,
            String containerId,
            String containerName,
            List<AttackSurfaceFinding> findings
    ) {

        List<Mount> mounts = inspect.getMounts();

        if (mounts == null || mounts.isEmpty()) {
            return;
        }

        for (Mount mount : mounts) {

            String source = mount.getSource();

            if (!Boolean.TRUE.equals(mount.getRW())) {
                continue;
            }

            // Skip Docker named volumes.
            if (mount.getName() != null && !mount.getName().isBlank()) {
                continue;
            }

            // Require an absolute host path.
            if (source == null || !source.startsWith("/")) {
                continue;
            }

            String destination = mount.getDestination() == null
                    ? "unknown"
                    : mount.getDestination().getPath();

            if (isDockerSocketPath(source) || isDockerSocketPath(destination)) {
                continue;
            }

            findings.add(new AttackSurfaceFinding(
                    containerId,
                    containerName,
                    "AS-001",
                    "MEDIUM",
                    "Writable host bind mount",
                    "The container has write access to a host directory. "
                            + "Processes inside the container may modify "
                            + "files in that host directory.",
                    "Host path: " + source
                            + " | Container path: " + destination
                            + " | Read-write: true",
                    "Use a read-only mount where possible. "
                            + "If write access is required, restrict the "
                            + "mounted host directory to only the files "
                            + "the container needs."
            ));
        }
    }

    /*
     * AS-002
     * Detect ports published on all host interfaces.
     */
    private void analyzePublishedPorts(
            InspectContainerResponse inspect,
            String containerId,
            String containerName,
            List<AttackSurfaceFinding> findings
    ) {

        HostConfig hostConfig = inspect.getHostConfig();

        if (hostConfig == null || hostConfig.getPortBindings() == null) {
            return;
        }

        Ports portBindings = hostConfig.getPortBindings();

        Map<ExposedPort, Ports.Binding[]> bindings =
                portBindings.getBindings();

        if (bindings == null || bindings.isEmpty()) {
            return;
        }

        for (Map.Entry<ExposedPort, Ports.Binding[]> entry
                : bindings.entrySet()) {

            ExposedPort containerPort = entry.getKey();
            Ports.Binding[] hostBindings = entry.getValue();

            if (hostBindings == null) {
                continue;
            }

            for (Ports.Binding binding : hostBindings) {

                if (binding == null) {
                    continue;
                }

                String hostIp = binding.getHostIp();

                boolean exposedOnAllInterfaces =
                        hostIp == null
                        || hostIp.isBlank()
                        || hostIp.equals("0.0.0.0")
                        || hostIp.equals("::");

                if (!exposedOnAllInterfaces) {
                    continue;
                }

                findings.add(new AttackSurfaceFinding(
                        containerId,
                        containerName,
                        "AS-002",
                        "MEDIUM",
                        "Port published on all host interfaces",
                        "The container port is published on all host "
                                + "network interfaces. External systems "
                                + "may be able to reach this service, "
                                + "depending on firewall and network rules.",
                        "Container port: " + containerPort.getPort()
                                + " | Protocol: "
                                + containerPort.getProtocol()
                                + " | Host IP: " + hostIp
                                + " | Host port: "
                                + binding.getHostPortSpec(),
                        "Bind the service to 127.0.0.1 if it only needs "
                                + "local access. Otherwise, restrict access "
                                + "using firewall rules and network policies."
                ));
            }
        }
    }

    /*
     * AS-003
     * Detect explicitly added dangerous Linux capabilities.
     */
    private void analyzeDangerousCapabilities(
            InspectContainerResponse inspect,
            String containerId,
            String containerName,
            List<AttackSurfaceFinding> findings
    ) {

        HostConfig hostConfig = inspect.getHostConfig();

        if (hostConfig == null) {
            return;
        }

        Capability[] addedCapabilities = hostConfig.getCapAdd();

        if (addedCapabilities == null || addedCapabilities.length == 0) {
            return;
        }

        for (Capability capability : addedCapabilities) {

            if (capability == null) {
                continue;
            }

            String capabilityName = capability.toString()
                    .toUpperCase(Locale.ROOT)
                    .replace("CAP_", "");

            String severity = getCapabilitySeverity(capabilityName);

            if (severity == null) {
                continue;
            }

            findings.add(new AttackSurfaceFinding(
                    containerId,
                    containerName,
                    "AS-003",
                    severity,
                    "Dangerous Linux capability added",
                    "The container has been granted the "
                            + capabilityName
                            + " Linux capability. This expands the "
                            + "privileges available to processes inside "
                            + "the container.",
                    "Added capability: " + capabilityName,
                    getCapabilityRecommendation(capabilityName)
            ));
        }
    }

    /*
     * Assign severity based on capability risk.
     */
    private String getCapabilitySeverity(String capability) {

        return switch (capability) {

            case "SYS_ADMIN",
                 "SYS_MODULE",
                 "SYS_RAWIO" -> "CRITICAL";

            case "NET_ADMIN",
                 "SYS_PTRACE",
                 "DAC_OVERRIDE",
                 "DAC_READ_SEARCH",
                 "SYS_BOOT",
                 "SYS_TIME" -> "HIGH";

            case "NET_RAW",
                 "MKNOD" -> "MEDIUM";

            default -> null;
        };
    }

    /*
     * Provide capability-specific remediation.
     */
    private String getCapabilityRecommendation(String capability) {

        return switch (capability) {

            case "SYS_ADMIN" ->
                    "Remove SYS_ADMIN unless absolutely required. "
                    + "Avoid granting broad administrative privileges "
                    + "to application containers.";

            case "SYS_MODULE" ->
                    "Remove SYS_MODULE. Containers should generally "
                    + "not need to load or unload host kernel modules.";

            case "SYS_RAWIO" ->
                    "Remove SYS_RAWIO unless the application has a "
                    + "specific and justified raw I/O requirement.";

            case "NET_ADMIN" ->
                    "Remove NET_ADMIN if the application does not "
                    + "need to modify network interfaces, routing "
                    + "or firewall configuration.";

            case "SYS_PTRACE" ->
                    "Remove SYS_PTRACE unless process debugging or "
                    + "tracing is explicitly required.";

            case "DAC_OVERRIDE" ->
                    "Remove DAC_OVERRIDE and configure appropriate "
                    + "file ownership and permissions instead.";

            case "DAC_READ_SEARCH" ->
                    "Remove DAC_READ_SEARCH unless bypassing normal "
                    + "file read and directory search permissions "
                    + "is necessary.";

            case "SYS_BOOT" ->
                    "Remove SYS_BOOT. Application containers should "
                    + "not need host reboot privileges.";

            case "SYS_TIME" ->
                    "Remove SYS_TIME unless changing the system clock "
                    + "is a justified requirement.";

            case "NET_RAW" ->
                    "Remove NET_RAW if the application does not need "
                    + "raw or packet sockets.";

            case "MKNOD" ->
                    "Remove MKNOD unless creating device nodes is "
                    + "an explicit application requirement.";

            default ->
                    "Review whether this capability is necessary. "
                    + "Remove unnecessary additional privileges.";
        };
    }

    /*
     * AS-004
     * Detect containers using host network mode.
     */
    private void analyzeHostNetworkMode(
            InspectContainerResponse inspect,
            String containerId,
            String containerName,
            List<AttackSurfaceFinding> findings
    ) {

        HostConfig hostConfig = inspect.getHostConfig();

        if (hostConfig == null) {
            return;
        }

        String networkMode = hostConfig.getNetworkMode();

        if (networkMode == null
                || !networkMode.equalsIgnoreCase("host")) {
            return;
        }

        findings.add(new AttackSurfaceFinding(
                containerId,
                containerName,
                "AS-004",
                "HIGH",
                "Host network mode enabled",
                "The container shares the host's network namespace. "
                        + "This reduces network isolation between the "
                        + "container and the host.",
                "Network mode: " + networkMode,
                "Use bridge networking or a dedicated Docker network "
                        + "unless direct access to the host network "
                        + "is explicitly required."
        ));
    }

    /*
     * AS-005
     * Detect host devices mapped into containers.
     */
    private void analyzeHostDeviceAccess(
            InspectContainerResponse inspect,
            String containerId,
            String containerName,
            List<AttackSurfaceFinding> findings
    ) {

        HostConfig hostConfig = inspect.getHostConfig();

        if (hostConfig == null) {
            return;
        }

        Device[] devices = hostConfig.getDevices();

        if (devices == null || devices.length == 0) {
            return;
        }

        for (Device device : devices) {

            if (device == null) {
                continue;
            }

            String hostPath = device.getPathOnHost();
            String containerPath = device.getPathInContainer();
            String permissions = device.getcGroupPermissions();

            if (hostPath == null || hostPath.isBlank()) {
                continue;
            }

            String severity = getDeviceSeverity(hostPath);

            findings.add(new AttackSurfaceFinding(
                    containerId,
                    containerName,
                    "AS-005",
                    severity,
                    "Host device mapped into container",
                    "The container has been granted direct access to a "
                            + "host device. Depending on the device and "
                            + "permissions, this may expose hardware or "
                            + "sensitive host resources.",
                    "Host device: " + hostPath
                            + " | Container device: " + containerPath
                            + " | Permissions: " + permissions,
                    "Remove unnecessary device mappings. Grant access "
                            + "only to devices required by the application "
                            + "and restrict permissions to the minimum "
                            + "required."
            ));
        }
    }
    /*
    * AS-006
    * Detect Docker socket exposure inside containers.
    */
    private void analyzeDockerSocketExposure(
            InspectContainerResponse inspect,
            String containerId,
            String containerName,
            List<AttackSurfaceFinding> findings
    ) {

        List<Mount> mounts = inspect.getMounts();

        if (mounts == null || mounts.isEmpty()) {
            return;
        }

        for (Mount mount : mounts) {

            String source = mount.getSource();
            String destination = mount.getDestination() == null
                    ? null
                    : mount.getDestination().getPath();

            boolean dockerSocketMounted =
                    isDockerSocketPath(source)
                    || isDockerSocketPath(destination);

            if (!dockerSocketMounted) {
                continue;
            }

            boolean writable = Boolean.TRUE.equals(mount.getRW());

            String severity = writable ? "CRITICAL" : "HIGH";

            findings.add(new AttackSurfaceFinding(
                    containerId,
                    containerName,
                    "AS-006",
                    severity,
                    "Docker socket exposed to container",
                    "The container has access to a Docker daemon socket. "
                            + "This may allow processes inside the container "
                            + "to interact with the Docker daemon and "
                            + "potentially create or control other containers.",
                    "Host path: " + source
                            + " | Container path: " + destination
                            + " | Read-write: " + writable,
                    "Avoid mounting the Docker socket into application "
                            + "containers. If Docker API access is required, "
                            + "use a restricted Docker API proxy or another "
                            + "least-privilege mechanism."
            ));
        }
    }

    /*
    * Identify common Docker socket paths.
    */
    private boolean isDockerSocketPath(String path) {

        if (path == null || path.isBlank()) {
            return false;
        }

        String normalizedPath = path.trim().toLowerCase(Locale.ROOT);

        return normalizedPath.equals("/var/run/docker.sock")
                || normalizedPath.equals("/run/docker.sock")
                || normalizedPath.endsWith("/docker.sock");
    }
    /*
     * Assign severity based on the mapped host device.
     */
    private String getDeviceSeverity(String hostPath) {

        String path = hostPath.toLowerCase(Locale.ROOT);

        // Direct access to physical storage devices.
        if (path.startsWith("/dev/sd")
                || path.startsWith("/dev/nvme")
                || path.startsWith("/dev/vd")
                || path.startsWith("/dev/xvd")) {
            return "HIGH";
        }

        // Raw memory and hardware port access.
        if (path.equals("/dev/mem")
                || path.equals("/dev/kmem")
                || path.equals("/dev/port")) {
            return "CRITICAL";
        }

        return "MEDIUM";
    }

    /*
     * Normalize Docker container names.
     */
    private String normalizeName(String name) {

        if (name == null || name.isBlank()) {
            return "unknown";
        }

        return name.startsWith("/")
                ? name.substring(1)
                : name;
    }
}