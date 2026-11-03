package com.example.containershield.controller;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.command.InspectContainerResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/docker-test")
public class DockerClientTestController {

    private final DockerClient dockerClient;

    public DockerClientTestController(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
    }

    @GetMapping("/containers")
    public List<Container> getContainers() {
        return dockerClient.listContainersCmd()
                .withShowAll(true)
                .exec();
    }

    @GetMapping("/inspect")
    public InspectContainerResponse inspectContainer() {

        List<Container> containers = dockerClient.listContainersCmd()
                .withShowAll(true)
                .exec();

        if (containers.isEmpty()) {
            throw new IllegalStateException("No Docker containers found");
        }

        String containerId = containers.get(0).getId();

        return dockerClient.inspectContainerCmd(containerId)
                .exec();
    }
}