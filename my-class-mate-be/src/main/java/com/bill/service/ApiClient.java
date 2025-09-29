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

import static com.bill.exceptionhandler.ErrorEnum.ERROR_INTERNAL_API_CALL;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiClient {
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${external.fastapi.url}")
    private String FASTAPI_URL;

    public <T> T postMultipartSafe(String endpoint, Long userId, List<MultipartFile> files, Class<T> responseType, String fileBody) {
        String url = FASTAPI_URL + endpoint;
        log.info("Calling FastAPI POST (Multipart): {}", url);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        if (userId != null) {
            body.add("user_id", userId.toString());
        }

        try {
            for (MultipartFile file : files) {
                body.add(fileBody, getByteArrayResource(file));
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
            throw mapFastApiError(e);
        }
    }

    private ByteArrayResource getByteArrayResource(MultipartFile file) throws IOException {
        HttpHeaders fileHeader = new HttpHeaders();
        fileHeader.setContentType(MediaType.parseMediaType(file.getContentType()));
        return new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
    }

    private AppException mapFastApiError(HttpClientErrorException e) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> errorMap = mapper.readValue(e.getResponseBodyAsString(), Map.class);

            Object detail = errorMap.get("detail");
            if (detail instanceof Map) {
                Map<String, Object> detailMap = (Map<String, Object>) detail;
                String code = (String) detailMap.getOrDefault("code", "ERR_UNKNOWN");
                String message = (String) detailMap.getOrDefault("message", "Unknown FastAPI error");
                return new AppException(code, message);
            } else if (detail instanceof String) {
                try {
                    Map<String, Object> detailMap = mapper.readValue((String) detail, Map.class);
                    String code = (String) detailMap.getOrDefault("code", "ERR_UNKNOWN");
                    String message = (String) detailMap.getOrDefault("message", "Unknown FastAPI error");
                    return new AppException(code, message);
                } catch (Exception ex2) {
                    return new AppException(ERROR_INTERNAL_API_CALL.getCode(), detail.toString());
                }
            } else {
                return new AppException(
                        ERROR_INTERNAL_API_CALL.getCode(),
                        detail != null ? detail.toString() : "Unknown FastAPI error"
                );
            }
        } catch (Exception ex) {
            log.error("mapFastApiError Exception", ex);
            return new AppException(
                    ERROR_INTERNAL_API_CALL.getCode(),
                    "Cannot parse FastAPI error: " + e.getResponseBodyAsString()
            );
        }
    }
}
