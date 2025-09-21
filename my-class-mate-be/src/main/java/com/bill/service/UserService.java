package com.bill.service;

import com.bill.constant.RoleEnum;
import com.bill.exceptionhandler.AppException;
import com.bill.model.request.CreateUserRequest;
import com.bill.model.request.LoginRequest;
import com.bill.model.request.UpdateUserRequest;
import com.bill.model.response.UserResponse;
import com.bill.repository.StudentProfileRepository;
import com.bill.repository.UserRepository;
import com.bill.repository.entity.StudentProfile;
import com.bill.repository.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import static com.bill.exceptionhandler.ErrorEnum.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;

    @SneakyThrows
    public UserResponse login(LoginRequest request) {
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ERROR_LOGIN.getCode(), ERROR_LOGIN.getMessage()));

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new AppException(ERROR_USER_DEACTIVATED.getCode(), ERROR_USER_DEACTIVATED.getMessage());
        }

        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return mapToUserResponse(user);
        } else {
            throw new AppException(ERROR_LOGIN.getCode(), ERROR_LOGIN.getMessage());
        }
    }

    public UserResponse getUser(Long userId) {
        var user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ERROR_USER_NOT_FOUND.getCode(), ERROR_USER_NOT_FOUND.getMessage()));

        return mapToUserResponse(user);
    }

    public List<UserResponse> getUsers(RoleEnum role) {
        var users = userRepository.findByIsDeletedFalse();
        List<User> filteredUsers = new ArrayList<>();

        if (role != null) {
            filteredUsers = users.stream()
                    .filter(user -> role.equals(user.getRole()))
                    .toList();
        }

        var usersResponse = filteredUsers.stream()
                .filter(Objects::nonNull)
                .filter(user -> !RoleEnum.ADMIN.equals(user.getRole()))
                .sorted(Comparator.comparing(User::getRole).thenComparing(User::getId))
                .toList();

        return mapToUserResponse(usersResponse);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        var now = LocalDateTime.now();
        var findUser = userRepository.findByUsername(request.getUsername());
        if (findUser.isEmpty()) {
            var user = modelMapper.map(request, User.class);
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setIsDeleted(false);
            user.setCreatedAt(now);
            user.setUpdatedAt(now);
            user = userRepository.save(user);
            var userId = user.getId();

            if (RoleEnum.STUDENT.equals(request.getRole())) {
                if (StringUtils.isBlank(request.getStudentNo())) {
                    throw new AppException(ERROR_MISSING_STUDENT_NO.getCode(), ERROR_MISSING_STUDENT_NO.getMessage());
                }

                var findStudent = studentProfileRepository.findByStudentNo(request.getStudentNo());
                if (findStudent.isPresent()) {
                    throw new AppException(ERROR_DUPLICATE_STUDENT_NO.getCode(), ERROR_DUPLICATE_STUDENT_NO.getMessage());
                }

                var studentProfile = StudentProfile.builder()
                        .studentId(userId)
                        .studentNo(request.getStudentNo())
                        .createdAt(now)
                        .updatedAt(now)
                        .build();
                studentProfileRepository.save(studentProfile);
            }

            return mapToUserResponse(user);
        } else {
            throw new AppException(ERROR_DUPLICATE_USER_NAME.getCode(), ERROR_DUPLICATE_USER_NAME.getMessage());
        }
    }

    @Transactional
    public UserResponse updateUser(Long userId, UpdateUserRequest request) {
        var user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ERROR_USER_NOT_FOUND.getCode(), ERROR_USER_NOT_FOUND.getMessage()));

        user.setNameTh(request.getNameTh());
        user.setSurnameTh(request.getSurnameTh());
        user.setNameEn(request.getNameEn());
        user.setSurnameEn(request.getSurnameEn());
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse deleteUser(Long userId) {
        var user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new AppException(ERROR_USER_NOT_FOUND.getCode(), ERROR_USER_NOT_FOUND.getMessage()));

        user.setIsDeleted(true);
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        var userResponse = modelMapper.map(user, UserResponse.class);
        userResponse.setUserId(user.getId());
        return userResponse;
    }

    private List<UserResponse> mapToUserResponse(List<User> users) {
        var response = new ArrayList<UserResponse>();
        for (var user : users) {
            var userResponse = modelMapper.map(user, UserResponse.class);
            userResponse.setUserId(user.getId());
            response.add(userResponse);
        }
        return response;
    }
}
