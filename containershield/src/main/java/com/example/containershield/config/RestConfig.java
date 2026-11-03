package com.example.containershield.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestConfig {
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(0); // Infinite / no connection timeout
        factory.setReadTimeout(0);    // Infinite / no read timeout for long Ollama model responses
        return new RestTemplate(factory);
    }
}
