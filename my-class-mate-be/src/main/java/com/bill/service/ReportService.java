package com.bill.service;

import com.bill.exceptionhandler.AppException;
import com.bill.model.CourseScheduleAttendanceProjection;
import com.bill.model.CourseScheduleParticipationProjection;
import com.bill.model.response.CourseScheduleForReportResponse;
import com.bill.model.response.ReportResponse;
import com.bill.repository.CourseScheduleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

import static com.bill.exceptionhandler.ErrorEnum.ERROR_EXPORT_EXCEL;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ReportService {
    ModelMapper modelMapper;
    CourseService courseService;
    CourseScheduleRepository courseScheduleRepository;

    public ReportResponse getReports(Long courseId, Long courseScheduleIdParam) {
        var response = new ReportResponse();
        response.setCourseId(courseId);

        var course = courseService.getCourse(courseId);
        var schedules = course.getSchedules();

        // key = courseScheduleId, value = List of attendance
        var scheduleAttendanceMap = courseScheduleRepository.findCurrentCourseScheduleAttendanceByCourseId(courseId, LocalDate.now())
                .stream()
                .collect(Collectors.groupingBy(CourseScheduleAttendanceProjection::getCourseScheduleId));

        // key = courseScheduleId, value = List of participation
        var scheduleParticipationMap = courseScheduleRepository.findCourseScheduleParticipationByCourseId(courseId)
                .stream()
                .collect(Collectors.groupingBy(CourseScheduleParticipationProjection::getCourseScheduleId));

        var schedulesResponse = new ArrayList<CourseScheduleForReportResponse>();

        for (var schedule : schedules) {
            var courseScheduleId = schedule.getCourseScheduleId();
            var scheduleResponse = modelMapper.map(schedule, CourseScheduleForReportResponse.class);

            // get all schedules, enrollments and attendances
            var attendances = scheduleAttendanceMap.get(courseScheduleId);
            if (CollectionUtils.isNotEmpty(attendances)) {
                scheduleResponse.setAttendances(attendances.stream()
                        .map(attendance ->
                                CourseScheduleForReportResponse.AttendanceForReport.builder()
                                        .studentId(attendance.getStudentId())
                                        .studentNo(attendance.getStudentNo())
                                        .studentNameTh(attendance.getStudentNameTh())
                                        .studentNameEn(attendance.getStudentNameEn())
                                        .status(attendance.getStatus())
                                        .statusDesc(attendance.getStatus() != null ? attendance.getStatus().getDesc() : null)
                                        .attendedAt(attendance.getAttendedAt())
                                        .build())
                        .toList());
            }

            // get all participations
            var participations = scheduleParticipationMap.get(courseScheduleId);
            if (CollectionUtils.isNotEmpty(participations)) {
                var participationMap = new LinkedHashMap<Integer, CourseScheduleForReportResponse.ParticipationForReport>();

                for (var participation : participations) {
                    var round = participation.getRound();

                    participationMap.computeIfAbsent(round, r ->
                            CourseScheduleForReportResponse.ParticipationForReport.builder()
                                    .round(participation.getRound())
                                    .topic(participation.getTopic())
                                    .requestParticipations(new ArrayList<>())
                                    .build()
                    );

                    var request = CourseScheduleForReportResponse.ParticipationForReport.RequestParticipationForReport.builder()
                            .studentId(participation.getStudentId())
                            .studentNo(participation.getStudentNo())
                            .studentNameTh(participation.getStudentNameTh())
                            .studentNameEn(participation.getStudentNameEn())
                            .isScored(participation.getIsScored())
                            .score(participation.getScore())
                            .build();

                    participationMap.get(round).getRequestParticipations().add(request);
                }

                scheduleResponse.setParticipations(new ArrayList<>(participationMap.values()));
            }

            schedulesResponse.add(scheduleResponse);
        }

        response.setSchedules(schedulesResponse);
        return response;
    }

    public byte[] exportReports(Long courseId, Long courseScheduleIdParam) {
        var report = getReports(courseId, courseScheduleIdParam);

        try (var workbook = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            // Font & Style Setup
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 18);
            headerFont.setColor(IndexedColors.BLACK.getIndex());

            CellStyle cyanHeaderStyle = workbook.createCellStyle();
            cyanHeaderStyle.setFont(headerFont);
            cyanHeaderStyle.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex());
            cyanHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            cyanHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            cyanHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            Font dataFont = workbook.createFont();
            dataFont.setFontHeightInPoints((short) 16);
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setFont(dataFont);
            dataStyle.setWrapText(true);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // ===================== Sheet 1: Attendance =====================
            var attendanceSheet = workbook.createSheet("การเข้าเรียน");
            String[] attendanceHeaders = {
                    "วันที่เรียน", "เวลาเริ่ม", "เวลาสิ้นสุด", "ห้องเรียน",
                    "รหัสนักศึกษา", "ชื่อ-สกุล (ภาษาไทย)", "ชื่อ-สกุล (ภาษาอังกฤษ)", "สถานะการเข้าเรียน", "เวลาเข้าเรียน"
            };

            // Header
            Row attHeaderRow = attendanceSheet.createRow(0);
            for (int i = 0; i < attendanceHeaders.length; i++) {
                Cell cell = attHeaderRow.createCell(i);
                cell.setCellValue(attendanceHeaders[i]);
                cell.setCellStyle(cyanHeaderStyle);
            }
            attendanceSheet.createFreezePane(0, 1);

            // Data
            int rowNum = 1;
            for (var schedule : report.getSchedules()) {
                if (CollectionUtils.isEmpty(schedule.getAttendances())) continue;

                for (var att : schedule.getAttendances()) {
                    Row row = attendanceSheet.createRow(rowNum++);
                    int c = 0;
                    row.createCell(c++).setCellValue(schedule.getScheduleDate() != null ? schedule.getScheduleDate().toString() : "");
                    row.createCell(c++).setCellValue(schedule.getStartTime() != null ? schedule.getStartTime().toString() : "");
                    row.createCell(c++).setCellValue(schedule.getEndTime() != null ? schedule.getEndTime().toString() : "");
                    row.createCell(c++).setCellValue(schedule.getRoom() != null ? schedule.getRoom() : "");
                    row.createCell(c++).setCellValue(att.getStudentNo());
                    row.createCell(c++).setCellValue(att.getStudentNameTh());
                    row.createCell(c++).setCellValue(att.getStudentNameEn());
                    row.createCell(c++).setCellValue(att.getStatusDesc());
                    row.createCell(c).setCellValue(att.getAttendedAt() != null ? att.getAttendedAt().toString() : "");

                    for (int i = 0; i < attendanceHeaders.length; i++) {
                        row.getCell(i).setCellStyle(dataStyle);
                    }
                }
            }

            for (int i = 0; i < attendanceHeaders.length; i++) {
                attendanceSheet.autoSizeColumn(i);
                int width = attendanceSheet.getColumnWidth(i);
                attendanceSheet.setColumnWidth(i, (int) (width * 1.3));
            }

            // ===================== Sheet 2: Participation =====================
            var participationSheet = workbook.createSheet("การมีส่วนร่วม");
            String[] partHeaders = {
                    "วันที่เรียน", "รอบ", "หัวข้อ",
                    "รหัสนักศึกษา", "ชื่อ-สกุล (ภาษาไทย)", "ชื่อ-สกุล (ภาษาอังกฤษ)", "สถานะการให้คะแนน", "คะแนน"
            };

            // Header
            Row partHeaderRow = participationSheet.createRow(0);
            for (int i = 0; i < partHeaders.length; i++) {
                Cell cell = partHeaderRow.createCell(i);
                cell.setCellValue(partHeaders[i]);
                cell.setCellStyle(cyanHeaderStyle);
            }
            participationSheet.createFreezePane(0, 1);

            // Data
            rowNum = 1;
            for (var schedule : report.getSchedules()) {
                if (CollectionUtils.isEmpty(schedule.getParticipations())) continue;

                for (var participation : schedule.getParticipations()) {
                    if (CollectionUtils.isEmpty(participation.getRequestParticipations())) continue;

                    for (var req : participation.getRequestParticipations()) {
                        Row row = participationSheet.createRow(rowNum++);
                        int c = 0;
                        row.createCell(c++).setCellValue(schedule.getScheduleDate() != null ? schedule.getScheduleDate().toString() : "");
                        row.createCell(c++).setCellValue(participation.getRound());
                        row.createCell(c++).setCellValue(participation.getTopic());
                        row.createCell(c++).setCellValue(req.getStudentNo());
                        row.createCell(c++).setCellValue(req.getStudentNameTh());
                        row.createCell(c++).setCellValue(req.getStudentNameEn());
                        row.createCell(c++).setCellValue(Boolean.TRUE.equals(req.getIsScored()) ? "ให้คะแนนแล้ว" : "ยังไม่ให้คะแนน");
                        row.createCell(c).setCellValue(req.getScore() != null ? req.getScore() : 0);

                        for (int i = 0; i < partHeaders.length; i++) {
                            row.getCell(i).setCellStyle(dataStyle);
                        }
                    }
                }
            }

            for (int i = 0; i < partHeaders.length; i++) {
                participationSheet.autoSizeColumn(i);
                int width = participationSheet.getColumnWidth(i);
                participationSheet.setColumnWidth(i, (int) (width * 1.3));
            }

            // ===================== Write to ByteArray =====================
            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Error exporting report for courseId {}: {}", courseId, e.getMessage(), e);
            throw new AppException(ERROR_EXPORT_EXCEL.getCode(), ERROR_EXPORT_EXCEL.getMessage());
        }
    }
}
