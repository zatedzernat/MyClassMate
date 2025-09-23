package com.bill.controller;

import com.bill.constant.RequireRole;
import com.bill.constant.RoleEnum;
import com.bill.model.request.CreateCourseRequest;
import com.bill.model.request.InitCourseRequest;
import com.bill.model.response.CourseResponse;
import com.bill.model.response.InitCourseResponse;
import com.bill.service.CourseService;
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
@RequestMapping("/v1/courses")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class CourseController {
    CourseService courseService;

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @PostMapping(value = "/init", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<InitCourseResponse> initCourse(@RequestBody @Valid InitCourseRequest request) {
        return courseService.initCourse(request);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public CourseResponse createCourse(@RequestBody @Valid CreateCourseRequest request) {
        return courseService.createCourse(request);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<CourseResponse> getCourses(@RequestParam(required = false) Integer academicYear,
                                           @RequestParam(required = false) Integer semester) {
        return courseService.getCourses(academicYear, semester);
    }
}
