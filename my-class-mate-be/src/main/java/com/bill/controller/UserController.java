package com.bill.controller;

import com.bill.constant.RequireRole;
import com.bill.constant.RoleEnum;
import com.bill.model.request.CreateUserRequest;
import com.bill.model.request.LoginRequest;
import com.bill.model.response.CreateUserResponse;
import com.bill.model.response.LoginResponse;
import com.bill.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/v1/user")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserController {
    UserService userService;

    @PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public LoginResponse postLogin(@RequestBody @Valid LoginRequest request) {
        return userService.login(request);
    }

    @RequireRole({RoleEnum.ADMIN})
    @PostMapping(value = "/create", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public CreateUserResponse postCreateUser(@RequestBody @Valid CreateUserRequest request) {
        return userService.createUser(request);
    }
}
