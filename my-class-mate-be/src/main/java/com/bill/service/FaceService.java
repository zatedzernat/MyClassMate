package com.bill.service;

import com.bill.model.response.AttendanceResponse;
import com.bill.model.response.FaceRegisterResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class FaceService {
    UserService userService;

    public FaceRegisterResponse faceRegister(Long userId) {
        var user = userService.getUser(userId, false);
        return null;
    }

    public AttendanceResponse attendance() {
        return null;
    }

}
