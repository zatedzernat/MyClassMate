package com.bill.controller;

import com.bill.constant.RequireRole;
import com.bill.constant.RoleEnum;
import com.bill.model.request.UpdateStudentProfileRequest;
import com.bill.model.response.StudentProfileResponse;
import com.bill.service.StudentProfileService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/v1/student-profile")
public class StudentProfileController {
    StudentProfileService studentProfileService;

    @RequireRole({RoleEnum.STUDENT})
    @GetMapping(value = "/{studentId}")
    public StudentProfileResponse getStudentProfile(@PathVariable Long studentId) {
        return studentProfileService.getStudentProfile(studentId);
    }

    @RequireRole({RoleEnum.STUDENT})
    @PutMapping(value = "/{studentId}")
    public StudentProfileResponse updateStudentProfile(@PathVariable Long studentId, @RequestBody UpdateStudentProfileRequest request) {
        return studentProfileService.updateStudentProfile(studentId, request);
    }
}
