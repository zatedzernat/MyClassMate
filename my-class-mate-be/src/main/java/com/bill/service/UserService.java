package com.bill.service;

import com.bill.exceptionhandler.AppException;
import com.bill.model.request.CreateUserRequest;
import com.bill.model.request.LoginRequest;
import com.bill.model.response.CreateUserResponse;
import com.bill.model.response.LoginResponse;
import com.bill.repository.UserRepository;
import com.bill.repository.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static com.bill.exceptionhandler.ErrorEnum.ERROR_DUPLICATE_USER_NAME;
import static com.bill.exceptionhandler.ErrorEnum.ERROR_LOGIN;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;

    public CreateUserResponse createUser(CreateUserRequest request) {
        var findUser = userRepository.findByUsername(request.getUsername());
        if (findUser.isEmpty()) {
            var user = modelMapper.map(request, User.class);
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setIsDeleted(false);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user = userRepository.save(user);
            return CreateUserResponse.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .role(user.getRole())
                    .createdAt(user.getCreatedAt())
                    .build();
        } else {
            throw new AppException(ERROR_DUPLICATE_USER_NAME.getCode(), ERROR_DUPLICATE_USER_NAME.getMessage());
        }
    }

    @SneakyThrows
    public LoginResponse login(LoginRequest request) {
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ERROR_LOGIN.getCode(), ERROR_LOGIN.getMessage()));

        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {

            var userResponse = modelMapper.map(user, LoginResponse.class);
            userResponse.setUserId(user.getId());
            return userResponse;
        } else {
            throw new AppException(ERROR_LOGIN.getCode(), ERROR_LOGIN.getMessage());
        }
    }
}
