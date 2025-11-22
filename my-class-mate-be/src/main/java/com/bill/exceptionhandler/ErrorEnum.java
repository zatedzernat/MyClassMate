package com.bill.exceptionhandler;

import lombok.Getter;

@Getter
public enum ErrorEnum {
    ERROR_GENERIC_ERROR("ERR001", "general error"),
    ERROR_DUPLICATE_USER_NAME("ERR002", "ข้อมูลผู้ใช้งานซ้ำ"),
    ERROR_LOGIN("ERR003", "ข้อมูลผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง"),
    ERROR_ACCESS_DENIED("ERR004", "ไม่มีสิทธิ์เข้าถึงข้อมูลหรือดำเนินการต่อได้ (1)"),
    ERROR_MISSING_HEADER_ROLE("ERR005", "missing role header"),
    ERROR_INVALID_ROLE("ERR006", "invalid role"),
    ERROR_USER_DEACTIVATED("ERR007", "ผู้ใช้งานถูกปิดการใช้งานแล้ว"),
    ERROR_DUPLICATE_STUDENT_NO("ERR008", "found duplicate student no"),
    ERROR_INVALID_REQUEST("ERR009", "invalid fields: %s"),
    ERROR_MISSING_STUDENT_NO("ERR010", "โปรดระบุข้อมูลรหัสผู้เรียน"),
    ERROR_USER_NOT_FOUND("ERR011", "ไม่พบข้อมูลผู้ใช้งาน"),
    ERROR_STUDENT_PROFILE_NOT_FOUND("ERR012", "ไม่พบข้อมูลผู้เรียน"),
    ERROR_EXPORT_EXCEL("ERR013", "ไม่สามารถส่งออกรายงานได้ในขณะนี้"),
    ERROR_IMPORT_EXCEL("ERR014", "ไม่สามารถนำเข้ารายงานได้ในขณะนี้"),
    ERROR_IMPORT_BLANK_EXCEL("ERR015", "ไม่สามารถนำเข้ารายงานว่างได้"),
    ERROR_IMPORT_INVALID_EXCEL("ERR016", "ไม่สามารภนำเข้ารายงานที่ไม่ถูกต้องได้"),
    ERROR_INVALID_END_DATE("ERR017", "วันและ/หรือเวลาไม่ถูกต้อง"),
    ERROR_DUPLICATE_COURSE("ERR018", "รหัสวิชาหรือชื่อวิชาซ้ำ"),
    ERROR_COURSE_NOT_FOUND("ERR019", "ไม่พบข้อมูลรายวิชา"),
    ERROR_INVALID_ROLE_FOR_LECTURER_ID("ERR020", "ข้อมูลผู้สอนไม่ถูกต้อง"),
    ERROR_INTERNAL_API_CALL("ERR021", "error calling fast api"),
    ERROR_USER_NOT_STUDENT("ERR022", "ไม่มีสิทธิ์เข้าถึงข้อมูลหรือดำเนินการต่อได้ (2)"),
    ERROR_ENROLLMENT_NOT_FOUND("ERR023", "ไม่พบการลงทะเบียนเรียนในรายวิชานี้ของรหัสผู้เรียน: %s"),
    ERROR_SCHEDULE_NOT_FOUND("ERR023", "ไม่พบข้อมูลการเรียนการสอน courseScheduleId: %s"),
    ERROR_USER_NOT_LECTURER("ERR024", "ไม่มีสิทธิ์เข้าถึงข้อมูลหรือดำเนินการต่อได้ (3)"),
    ERROR_PARTICIPATION_NOT_FOUND("ERR025", "ไม่พบข้อมูลการมีส่วนร่วม"),
    ERROR_PARTICIPATION_CLOSED("ERR026", "การมีส่วนร่วมปิดแล้ว"),
    ERROR_STUDENT_ATTENDANCE_NOT_FOUND("ERR027", "ไม่สามารถส่งคำขอได้เนื่องจากไม่มีข้อมูลการเช็คชื่อเข้าเรียน (studentId: %s, courseScheduleId: %s)"),
    ERROR_PARTICIPATION_REQUEST_NOT_FOUND("ERR028", "ไม่พบข้อมูลคำขอการมีส่วนร่วม participationRequestId: %s"),
    ;

    private final String code;
    private final String message;

    ErrorEnum(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public String format(Object... args) {
        return String.format(message, args);
    }
}
