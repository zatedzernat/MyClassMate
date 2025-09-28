package com.bill.service;

import com.bill.exceptionhandler.AppException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiClient {
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${external.fastapi.url}")
    private String FASTAPI_URL;

    public <T> T post(String endpoint, Object request, Class<T> responseType) {
        String url = FASTAPI_URL + endpoint;
        log.info("Calling FastAPI POST: {}", url);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");

        HttpEntity<Object> entity = new HttpEntity<>(request, headers);

        ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.POST, entity, responseType);
        return response.getBody();
    }

    public <T> T get(String endpoint, Class<T> responseType) {
        String url = FASTAPI_URL + endpoint;
        log.info("Calling FastAPI GET: {}", url);

        ResponseEntity<T> response = restTemplate.getForEntity(url, responseType);
        return response.getBody();
    }

    public <T> T postMultipartSafe(String endpoint, Long userId, List<MultipartFile> files, Class<T> responseType) {
        String url = FASTAPI_URL + endpoint;
        log.info("Calling FastAPI POST (Multipart): {}", url);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("user_id", userId.toString());

        try {
            for (MultipartFile file : files) {
                HttpHeaders fileHeader = new HttpHeaders();
                fileHeader.setContentType(MediaType.parseMediaType(file.getContentType()));
                var resource = new ByteArrayResource(file.getBytes()) {
                    @Override
                    public String getFilename() {
                        return file.getOriginalFilename();
                    }
                };
                body.add("files", resource);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error reading files", e);
        }

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<T> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, responseType);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("FastAPI returned error: {}", e.getResponseBodyAsString());

            try {
                var mapper = new ObjectMapper();
                var errorMap = mapper.readValue(e.getResponseBodyAsString(), Map.class);
                Object detail = errorMap.get("detail");

                log.error("postMultipartSafe HttpClientErrorException", e);
                if (detail instanceof Map) {
                    Map<String, Object> detailMap = (Map<String, Object>) detail;
                    throw new AppException(
                            (String) detailMap.getOrDefault("code", "ERR_UNKNOWN"),
                            (String) detailMap.getOrDefault("message", "Unknown error from FastAPI")
                    );
                } else {
                    throw new AppException("ERR_UNKNOWN", detail != null ? detail.toString() : "Unknown error");
                }
            } catch (Exception parseEx) {
                log.error("postMultipartSafe Exception", parseEx);
                throw new AppException("ERR_PARSE", "Cannot parse FastAPI error: " + e.getResponseBodyAsString());
            }
        }
    }
}
