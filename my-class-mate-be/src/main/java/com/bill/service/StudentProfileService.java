package com.bill.service;

import com.bill.constant.RoleEnum;
import com.bill.exceptionhandler.AppException;
import com.bill.model.request.UpdateStudentProfileRequest;
import com.bill.model.response.StudentProfileResponse;
import com.bill.repository.StudentProfileRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static com.bill.exceptionhandler.ErrorEnum.ERROR_STUDENT_PROFILE_NOT_FOUND;
import static com.bill.exceptionhandler.ErrorEnum.ERROR_USER_NOT_STUDENT;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class StudentProfileService {
    ModelMapper modelMapper;
    UserService userService;
    StudentProfileRepository studentProfileRepository;

    public StudentProfileResponse getStudentProfile(Long studentId) {
        var user = userService.getUser(studentId, false);

        if (RoleEnum.STUDENT.equals(user.getRole())) {
            var studentProfile = studentProfileRepository.findById(user.getUserId())
                    .orElseThrow(() -> new AppException(ERROR_STUDENT_PROFILE_NOT_FOUND.getCode(), ERROR_STUDENT_PROFILE_NOT_FOUND.getMessage()));
            var response = modelMapper.map(studentProfile, StudentProfileResponse.class);
            response.setStudentId(studentId);
            return response;
        } else {
            throw new AppException(ERROR_USER_NOT_STUDENT.getCode(), ERROR_USER_NOT_STUDENT.getMessage());
        }
    }

    public StudentProfileResponse updateStudentProfile(Long studentId, UpdateStudentProfileRequest request) {
        var user = userService.getUser(studentId, false);

        if (RoleEnum.STUDENT.equals(user.getRole())) {
            var studentProfile = studentProfileRepository.findById(user.getUserId())
                    .orElseThrow(() -> new AppException(ERROR_STUDENT_PROFILE_NOT_FOUND.getCode(), ERROR_STUDENT_PROFILE_NOT_FOUND.getMessage()));
            studentProfile.setAddress(request.getAddress());
            studentProfile.setPhoneNumber(request.getPhoneNumber());
            studentProfile.setRemark(request.getRemark());
            studentProfile.setUpdatedAt(LocalDateTime.now());
            studentProfile = studentProfileRepository.save(studentProfile);

            var response = modelMapper.map(studentProfile, StudentProfileResponse.class);
            response.setStudentId(studentId);
            return response;
        } else {
            throw new AppException(ERROR_USER_NOT_STUDENT.getCode(), ERROR_USER_NOT_STUDENT.getMessage());
        }
    }

}
