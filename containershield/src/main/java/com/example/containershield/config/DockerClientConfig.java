package com.example.containershield.config;

import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.api.DockerClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DockerClientConfig {

    @Bean
    public DockerClient dockerClient() {

        var dockerConfig = DefaultDockerClientConfig
                .createDefaultConfigBuilder()
                .build();

        var httpClient = new ApacheDockerHttpClient.Builder()
                .dockerHost(dockerConfig.getDockerHost())
                .sslConfig(dockerConfig.getSSLConfig())
                .build();

        return DockerClientImpl.getInstance(dockerConfig, httpClient);
    }
}