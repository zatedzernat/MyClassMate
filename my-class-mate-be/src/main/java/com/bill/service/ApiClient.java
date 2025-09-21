package com.bill.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

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
}
