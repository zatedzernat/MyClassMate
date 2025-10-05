package com.bill.controller;

import com.bill.constant.RequireRole;
import com.bill.constant.RoleEnum;
import com.bill.model.response.ReportResponse;
import com.bill.service.ReportService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/v1/reports")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ReportController {
    ReportService reportService;

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF, RoleEnum.STUDENT})
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ReportResponse getReports(@RequestParam(required = false) Long courseId,
                                     @RequestParam(required = false) Long studentId) {
        return reportService.getReports(courseId, studentId);
    }

//    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
//    @GetMapping(value = "/export", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
//    public ResponseEntity<byte[]> exportReports(@RequestParam(required = false) Long courseId,
//                                                @RequestParam(required = false) Long studentId) {
//        byte[] excelFile = reportService.exportReports(courseId, studentId);
//        return ResponseEntity.ok()
//                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reports.xlsx")
//                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
//                .body(excelFile);
//    }

}
