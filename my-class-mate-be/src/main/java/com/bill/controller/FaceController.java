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
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class FaceController {
    FaceService faceService;

    @PostMapping(value = "/v1/face-register/{userId}")
    public FaceRegisterResponse faceRegister(@PathVariable Long userId) {
        return faceService.faceRegister(userId);
    }

    @PostMapping(value = "/v1/attendance")
    public AttendanceResponse attendance() {
        return faceService.attendance();
    }
}
