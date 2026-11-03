
package com.example.containershield.service;

import com.example.containershield.dto.RuntimeSecurityFinding;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Volume;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RuntimeSecurityAnalyzerServiceTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private DockerClient dockerClient;

    @Mock
    private Container container;

     @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private InspectContainerResponse inspect;

    @Mock
    private HostConfig hostConfig;

    private RuntimeSecurityAnalyzerService service;

    @BeforeEach
    void setUp() {
        service = new RuntimeSecurityAnalyzerService(dockerClient);

        when(container.getId()).thenReturn("test-id");

        when(dockerClient.listContainersCmd()
                .withShowAll(true)
                .exec()).thenReturn(List.of(container));

        when(dockerClient.inspectContainerCmd("test-id")
                .exec()).thenReturn(inspect);

        when(inspect.getId()).thenReturn("test-id");
        when(inspect.getName()).thenReturn("/test-container");
        when(inspect.getHostConfig()).thenReturn(hostConfig);

        when(inspect.getMounts()).thenReturn(List.of());
    }

    private Set<String> analyzeRuleIds() {
        return service.analyzeContainers()
                .stream()
                .map(RuntimeSecurityFinding::ruleId)
                .collect(Collectors.toSet());
    }

    private void mockMount(String source, String destination) {
        InspectContainerResponse.Mount mount =
                mock(InspectContainerResponse.Mount.class);

        Volume volume = mock(Volume.class);

        when(mount.getSource()).thenReturn(source);
        when(mount.getDestination()).thenReturn(volume);
        when(volume.getPath()).thenReturn(destination);

        when(inspect.getMounts()).thenReturn(List.of(mount));
    }

    // RUNTIME-001: Privileged mode

    @Test
    void shouldDetectPrivilegedContainer() {
        when(hostConfig.getPrivileged()).thenReturn(true);

        assertTrue(analyzeRuleIds().contains("RUNTIME-001"));
    }

    @Test
    void shouldNotDetectNonPrivilegedContainer() {
        when(hostConfig.getPrivileged()).thenReturn(false);

        assertFalse(analyzeRuleIds().contains("RUNTIME-001"));
    }

    // RUNTIME-002: Root user

    @Test
    void shouldDetectRootUserConfigurations() {
        for (String user : List.of("root", "0", "0:0", "")) {
            when(inspect.getConfig().getUser()).thenReturn(user);

            assertTrue(analyzeRuleIds().contains("RUNTIME-002"),
                    "Expected root detection for user: " + user);
        }
    }

    @Test
    void shouldNotDetectNonRootUser() {
        when(inspect.getConfig().getUser()).thenReturn("1000:1000");

        assertFalse(analyzeRuleIds().contains("RUNTIME-002"));
    }

    // RUNTIME-003: Missing memory limit

    @Test
    void shouldDetectMissingMemoryLimit() {
        when(hostConfig.getMemory()).thenReturn(0L);

        assertTrue(analyzeRuleIds().contains("RUNTIME-003"));
    }

    @Test
    void shouldNotDetectConfiguredMemoryLimit() {
        when(hostConfig.getMemory()).thenReturn(536870912L);

        assertFalse(analyzeRuleIds().contains("RUNTIME-003"));
    }

    // RUNTIME-004: Writable root filesystem

    @Test
    void shouldDetectWritableRootFilesystem() {
        when(hostConfig.getReadonlyRootfs()).thenReturn(false);

        assertTrue(analyzeRuleIds().contains("RUNTIME-004"));
    }

    @Test
    void shouldNotDetectReadOnlyRootFilesystem() {
        when(hostConfig.getReadonlyRootfs()).thenReturn(true);

        assertFalse(analyzeRuleIds().contains("RUNTIME-004"));
    }

    // RUNTIME-005: Docker socket mount

    @Test
    void shouldDetectDockerSocketMount() {
        mockMount(
                "/var/run/docker.sock",
                "/var/run/docker.sock"
        );

        assertTrue(analyzeRuleIds().contains("RUNTIME-005"));
    }

    @Test
    void shouldNotDetectOrdinaryMountAsDockerSocket() {
        mockMount("/home/user/data", "/app/data");

        assertFalse(analyzeRuleIds().contains("RUNTIME-005"));
    }

    // RUNTIME-006: Host root filesystem mount

    @Test
    void shouldDetectHostRootMount() {
        mockMount("/", "/host");

        assertTrue(analyzeRuleIds().contains("RUNTIME-006"));
    }

    @Test
    void shouldNotDetectOrdinaryHostDirectoryAsRootMount() {
        mockMount("/home/user", "/host");

        assertFalse(analyzeRuleIds().contains("RUNTIME-006"));
    }

    // RUNTIME-007: Sensitive host path

    @Test
    void shouldDetectSensitiveHostPath() {
        mockMount("/etc/passwd", "/host/passwd");

        assertTrue(analyzeRuleIds().contains("RUNTIME-007"));
    }

    @Test
    void shouldNotDetectSimilarButUnrelatedPath() {
        mockMount("/etcetera", "/host/data");

        assertFalse(analyzeRuleIds().contains("RUNTIME-007"));
    }
}
