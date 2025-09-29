package com.bill.exceptionhandler;

import lombok.Getter;

@Getter
public enum ErrorEnum {
    ERROR_GENERIC_ERROR("ERR001", "general error"),
    ERROR_DUPLICATE_USER_NAME("ERR002", "found duplicate username"),
    ERROR_LOGIN("ERR003", "username or password is incorrect"),
    ERROR_ACCESS_DENIED("ERR004", "your role does not have permission to perform this action"),
    ERROR_MISSING_HEADER_ROLE("ERR005", "missing role header"),
    ERROR_INVALID_ROLE("ERR006", "invalid role"),
    ERROR_USER_DEACTIVATED("ERR007", "user is deactivated"),
    ERROR_DUPLICATE_STUDENT_NO("ERR008", "found duplicate student no"),
    ERROR_INVALID_REQUEST("ERR009", "invalid fields: %s"),
    ERROR_MISSING_STUDENT_NO("ERR010", "missing studentNo for student role"),
    ERROR_USER_NOT_FOUND("ERR011", "user not found"),
    ERROR_STUDENT_PROFILE_NOT_FOUND("ERR012", "student profile not found"),
    ERROR_EXPORT_EXCEL("ERR013", "cannot export excel"),
    ERROR_IMPORT_EXCEL("ERR014", "cannot import excel"),
    ERROR_IMPORT_BLANK_EXCEL("ERR015", "cannot import blank excel"),
    ERROR_IMPORT_INVALID_EXCEL("ERR016", "cannot import invalid excel"),
    ERROR_INVALID_END_DATE("ERR017", "invalid date or time"),
    ERROR_DUPLICATE_COURSE("ERR018", "found duplicate course code or course name"),
    ERROR_COURSE_NOT_FOUND("ERR019", "course not found"),
    ERROR_INVALID_ROLE_FOR_LECTURER_ID("ERR020", "invalid role for lecturer id"),
    ERROR_INTERNAL_API_CALL("ERR021", "error calling fast api"),
    ERROR_USER_NOT_STUDENT("ERR022", "can not get student profile from other role"),
    ERROR_ENROLLMENT_NOT_FOUND("ERR023", "enrollment not found for this studentId: %s"),
    ERROR_SCHEDULE_NOT_FOUND("ERR023", "course schedule not found courseScheduleId: %s"),
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
