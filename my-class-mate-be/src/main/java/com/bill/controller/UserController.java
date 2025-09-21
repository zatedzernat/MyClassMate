package com.bill.controller;

import com.bill.constant.RequireRole;
import com.bill.constant.RoleEnum;
import com.bill.model.request.CreateUserRequest;
import com.bill.model.request.LoginRequest;
import com.bill.model.request.UpdateUserRequest;
import com.bill.model.response.UserResponse;
import com.bill.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class UserController {
    UserService userService;

    @PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public UserResponse postLogin(@RequestBody @Valid LoginRequest request) {
        return userService.login(request);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<UserResponse> getUsers(@RequestParam(required = false) RoleEnum role) {
        return userService.getUsers(role);
    }

    @RequireRole({RoleEnum.ADMIN})
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public UserResponse createUser(@RequestBody @Valid CreateUserRequest request) {
        return userService.createUser(request);
    }

    @RequireRole({RoleEnum.ADMIN})
    @PutMapping(value = "/{userId}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public UserResponse updateUser(@PathVariable Long userId,
                                   @RequestBody UpdateUserRequest request) {
        return userService.updateUser(userId, request);
    }

    @RequireRole({RoleEnum.ADMIN})
    @DeleteMapping(value = "/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public UserResponse deleteUser(@PathVariable Long userId) {
        return userService.deleteUser(userId);
    }
}
