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
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/v1/reports")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ReportController {
    ReportService reportService;

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF, RoleEnum.STUDENT})
    @GetMapping(value = "/course/{courseId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ReportResponse getReports(@PathVariable Long courseId, @RequestParam(required = false) Long courseScheduleId) {
        return reportService.getReports(courseId, courseScheduleId);
    }

    @RequireRole({RoleEnum.ADMIN, RoleEnum.LECTURER, RoleEnum.STAFF})
    @GetMapping(value = "/course/{courseId}/export", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportReports(@PathVariable Long courseId, @RequestParam(required = false) Long courseScheduleId) {
        byte[] excelFile = reportService.exportReports(courseId, courseScheduleId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reports.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelFile);
    }

}
