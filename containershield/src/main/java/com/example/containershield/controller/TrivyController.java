package com.example.containershield.controller;

import com.example.containershield.dto.FixSuggestion;
import com.example.containershield.dto.TrivyVulnerability;
import com.example.containershield.service.ManifestMatcherService;
import com.example.containershield.service.TrivyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/trivy")
public class TrivyController {

    private final TrivyService trivyService;
    private final ManifestMatcherService manifestMatcherService;

    public TrivyController(TrivyService trivyService, ManifestMatcherService manifestMatcherService) {
        this.trivyService = trivyService;
        this.manifestMatcherService = manifestMatcherService;
    }

    @GetMapping("/scan")
    public ResponseEntity<List<TrivyVulnerability>> scanImage(@RequestParam("image") String imageName) {
        List<TrivyVulnerability> results = trivyService.scanImage(imageName);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/scan-with-manifest")
    public ResponseEntity<List<FixSuggestion>> scanWithManifest(
            @RequestParam("image") String imageName,
            @RequestParam("manifest") MultipartFile manifestFile) {
        try {
            List<TrivyVulnerability> findings = trivyService.scanImage(imageName);
            String pomXmlContent = new String(manifestFile.getBytes(), StandardCharsets.UTF_8);
            List<FixSuggestion> suggestions = manifestMatcherService.matchAgainstPomXml(pomXmlContent, findings);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            throw new RuntimeException("Failed to process pom.xml manifest scan: " + e.getMessage(), e);
        }
    }
}