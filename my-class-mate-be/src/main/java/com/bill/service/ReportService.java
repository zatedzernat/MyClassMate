package com.bill.service;

import com.bill.constant.AttendanceStatusEnum;
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
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
                                        .attendedAt(AttendanceStatusEnum.ABSENT != attendance.getStatus() ? attendance.getAttendedAt() : null)
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

            // ======================== Prepare Data =========================
            var schedules = report.getSchedules().stream()
                    .sorted(Comparator.comparing(CourseScheduleForReportResponse::getScheduleDate))
                    .toList();

            var students = schedules.stream()
                    .flatMap(s -> s.getAttendances() != null ? s.getAttendances().stream() : Stream.empty())
                    .collect(Collectors.toMap(
                            CourseScheduleForReportResponse.AttendanceForReport::getStudentId,
                            a -> a,
                            (a, b) -> a
                    ))
                    .values()
                    .stream()
                    .sorted(Comparator.comparing(CourseScheduleForReportResponse.AttendanceForReport::getStudentNo))
                    .toList();

            var scheduleHeaders = schedules.stream()
                    .map(s -> formatThaiDateHeader(s.getScheduleDate()))
                    .toList();

            // ===================== Sheet 1: Attendance =====================
            var attendanceSheet = workbook.createSheet("การเข้าเรียน");
            List<String> attHeaders = new ArrayList<>();
            attHeaders.addAll(List.of("รหัสผู้เรียน", "ชื่อ-สกุล (ไทย)", "ชื่อ-สกุล (อังกฤษ)"));
            attHeaders.addAll(scheduleHeaders);
            attHeaders.add("อัตราการขาดเรียน (%)");

            // Header
            Row attHeaderRow = attendanceSheet.createRow(0);
            for (int i = 0; i < attHeaders.size(); i++) {
                var cell = attHeaderRow.createCell(i);
                cell.setCellValue(attHeaders.get(i));
                cell.setCellStyle(cyanHeaderStyle);
            }
            attendanceSheet.createFreezePane(0, 1);
            attendanceSheet.setAutoFilter(new CellRangeAddress(0, 0, 0, attHeaders.size() - 1));

            // Data
            int rowNum = 1;
            for (var student : students) {
                Row row = attendanceSheet.createRow(rowNum++);
                int c = 0;
                row.createCell(c++).setCellValue(student.getStudentNo());
                row.createCell(c++).setCellValue(student.getStudentNameTh());
                row.createCell(c++).setCellValue(student.getStudentNameEn());

                int totalAbsent = 0;

                for (var schedule : schedules) {
                    var att = CollectionUtils.isEmpty(schedule.getAttendances()) ? null :
                            schedule.getAttendances().stream()
                                    .filter(a -> a.getStudentId().equals(student.getStudentId()))
                                    .findFirst().orElse(null);

                    String statusText = att != null && att.getStatus() != null
                            ? att.getStatus().name()
                            : "-";

                    if ("ABSENT".equalsIgnoreCase(statusText)) totalAbsent++;
                    row.createCell(c++).setCellValue(statusText);
                }

                int totalSessions = schedules.size();
                double absentRate = totalSessions == 0 ? 0 : ((double) totalAbsent / totalSessions) * 100;
                String absentText = String.format("%d/%d = %.1f%%", totalAbsent, totalSessions, absentRate);
                row.createCell(c).setCellValue(absentText);

                setCell(attHeaders, row, workbook, dataStyle);
            }
            autoResize(attendanceSheet, attHeaders.size());

            // ===================== Sheet 2: Participation =====================
            var participationSheet = workbook.createSheet("การมีส่วนร่วม");
            List<String> partHeaders = new ArrayList<>();
            partHeaders.addAll(List.of("รหัสผู้เรียน", "ชื่อ-สกุล (ไทย)", "ชื่อ-สกุล (อังกฤษ)"));
            partHeaders.addAll(scheduleHeaders);
            partHeaders.addAll(List.of("จำนวนครั้งการมีส่วนร่วมทั้งหมด (ครั้ง)", "คะแนนการมีส่วนร่วมสะสม (คะแนน)"));

            // Header
            Row partHeaderRow = participationSheet.createRow(0);
            for (int i = 0; i < partHeaders.size(); i++) {
                Cell cell = partHeaderRow.createCell(i);
                cell.setCellValue(partHeaders.get(i));
                cell.setCellStyle(cyanHeaderStyle);
            }
            participationSheet.createFreezePane(0, 1);
            participationSheet.setAutoFilter(new CellRangeAddress(0, 0, 0, partHeaders.size() - 1));

            // Data
            rowNum = 1;
            for (var student : students) {
                Row row = participationSheet.createRow(rowNum++);
                int c = 0;
                row.createCell(c++).setCellValue(student.getStudentNo());
                row.createCell(c++).setCellValue(student.getStudentNameTh());
                row.createCell(c++).setCellValue(student.getStudentNameEn());

                int totalParticipation = 0;
                int totalScore = 0;

                for (var schedule : schedules) {
                    var participations = schedule.getParticipations();
                    Integer score = null;
                    int countInThisSchedule = 0;

                    if (!CollectionUtils.isEmpty(participations)) {
                        var requests = participations.stream()
                                .filter(p -> p.getRequestParticipations() != null)
                                .flatMap(p -> p.getRequestParticipations().stream())
                                .filter(r -> r.getStudentId().equals(student.getStudentId()))
                                .toList();

                        countInThisSchedule = requests.size();
                        totalParticipation += countInThisSchedule;

                        score = requests.stream()
                                .map(r -> r.getScore() != null ? r.getScore() : 0)
                                .reduce(Integer::sum)
                                .orElse(null);
                    }

                    String displayValue = "-";
                    if (score != null) {
                        displayValue = String.valueOf(score);
                        totalScore += score;
                    }

                    row.createCell(c++).setCellValue(displayValue);
                }

                row.createCell(c++).setCellValue(totalParticipation);
                row.createCell(c).setCellValue(totalScore);

                setCell(partHeaders, row, workbook, dataStyle);
            }
            autoResize(participationSheet, partHeaders.size());

            // ===================== Write to ByteArray =====================
            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Error exporting report for courseId {}: {}", courseId, e.getMessage(), e);
            throw new AppException(ERROR_EXPORT_EXCEL.getCode(), ERROR_EXPORT_EXCEL.getMessage());
        }
    }

    private void setCell(List<String> attHeaders, Row row, XSSFWorkbook workbook, CellStyle dataStyle) {
        for (int i = 0; i < attHeaders.size(); i++) {
            var cell = row.getCell(i);
            if (cell == null) continue;

            if (i >= 3) { // หลังจากคอลัมน์ 0–2 (รหัส, ชื่อไทย, ชื่ออังกฤษ)
                CellStyle centerStyle = workbook.createCellStyle();
                centerStyle.cloneStyleFrom(dataStyle);
                centerStyle.setAlignment(HorizontalAlignment.CENTER);
                centerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
                cell.setCellStyle(centerStyle);
            } else {
                cell.setCellStyle(dataStyle);
            }
        }
    }

    private void autoResize(Sheet sheet, int columns) {
        for (int i = 0; i < columns; i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, (int) (sheet.getColumnWidth(i) * 1.1));
        }
    }

    private String formatThaiDateHeader(LocalDate date) {
        var dayOfWeek = switch (date.getDayOfWeek()) {
            case MONDAY -> "วันจันทร์";
            case TUESDAY -> "วันอังคาร";
            case WEDNESDAY -> "วันพุธ";
            case THURSDAY -> "วันพฤหัสบดี";
            case FRIDAY -> "วันศุกร์";
            case SATURDAY -> "วันเสาร์";
            case SUNDAY -> "วันอาทิตย์";
        };
        var monthName = date.getMonth().getDisplayName(TextStyle.SHORT, new Locale("th", "TH"));
        return String.format("%sที่ %d %s %d", dayOfWeek, date.getDayOfMonth(), monthName, date.getYear() + 543);
    }
}
