package com.bill.service;

import com.bill.model.response.AttendanceResponse;
import com.bill.model.response.FaceRegisterResponse;
import com.bill.model.response.FastAPIFaceRegisterResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class FaceService {
    ApiClient apiClient;
    UserService userService;

    public FaceRegisterResponse faceRegister(Long userId, List<MultipartFile> files) {
        var imageCount = 0;
        var user = userService.getUser(userId, false);

        var faceRegisterEndpoint = "/v1/face-register";
        FastAPIFaceRegisterResponse response = apiClient.postMultipartSafe(faceRegisterEndpoint, userId, files, FastAPIFaceRegisterResponse.class, "files");


        if ("Success".equals(response.getStatus())) {
            imageCount = response.getNumFacesRegistered();
        }

        return FaceRegisterResponse.builder()
                .userId(user.getUserId())
                .imageCount(imageCount)
                .build();
    }

    public AttendanceResponse attendance() {
        return null;
    }

}
