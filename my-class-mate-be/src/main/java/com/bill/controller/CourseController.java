package com.bill.controller;

import com.bill.constant.RequireRole;
import com.bill.constant.RoleEnum;
import com.bill.model.request.AddStudentToCourseRequest;
import com.bill.model.request.CreateCourseRequest;
import com.bill.model.request.InitCourseRequest;
import com.bill.model.request.UpdateCourseRequest;
import com.bill.model.response.*;
import com.bill.service.CourseService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @GetMapping(value = "/{courseId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public CourseResponse getCourse(@PathVariable Long courseId) {
        return courseService.getCourse(courseId);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @DeleteMapping(value = "/{courseId}")
    public void deleteCourse(@PathVariable Long courseId) {
        courseService.deleteCourse(courseId);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @PutMapping(value = "/{courseId}")
    public CourseResponse deleteCourse(@PathVariable Long courseId,
                             @RequestBody @Valid UpdateCourseRequest request) {
        return courseService.updateCourse(courseId, request);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @PostMapping(value = "/{courseId}/add-student-to-course", produces = MediaType.APPLICATION_JSON_VALUE)
    public CourseResponse addStudentToCourse(@PathVariable Long courseId, @RequestBody @Valid AddStudentToCourseRequest request) {
        return courseService.addStudentToCourse(courseId, request);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @GetMapping(value = "/{courseId}/export-student-to-course", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportStudentToCourse(@PathVariable Long courseId) {
        byte[] excelFile = courseService.exportStudentToCourse(courseId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelFile);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @PostMapping(value = "/{courseId}/import-student-to-course", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportStudentToCourseExcelResponse importStudentToCourse(@PathVariable Long courseId, @RequestParam("file") MultipartFile file) {
        return courseService.importStudentToCourse(courseId, file);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @GetMapping(value = "/today-schedules", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<TodayCourseResponse> getTodayCourses() {
        return courseService.getTodayCourses();
    }
}
