package com.bill.controller;

import com.bill.model.response.AttendanceResponse;
import com.bill.model.response.FaceRegisterResponse;
import com.bill.service.FaceService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class FaceController {
    FaceService faceService;

    @PostMapping(value = "/v1/face-register/{userId}")
    public FaceRegisterResponse faceRegister(@PathVariable Long userId,
                                             @RequestParam("files") List<MultipartFile> files) {
        // TODO: return faceService.faceRegister(userId);
        return FaceRegisterResponse.builder().userId(userId).imageCount(files.size()).build();
    }

    @PostMapping(value = "/v1/attendance")
    public AttendanceResponse attendance() {
        return faceService.attendance();
    }
}
