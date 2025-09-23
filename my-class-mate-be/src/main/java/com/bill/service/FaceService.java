package com.bill.service;

import com.bill.model.response.AttendanceResponse;
import com.bill.model.response.FaceRegisterResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class FaceService {
    private final UserService userService;

    public FaceRegisterResponse faceRegister(Long userId) {
        var user = userService.getUser(userId);
        return null;
    }

    public AttendanceResponse attendance() {
        return null;
    }

}
