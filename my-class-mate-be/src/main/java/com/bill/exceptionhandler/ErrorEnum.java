package com.bill.exceptionhandler;

import lombok.Getter;

@Getter
public enum ErrorEnum {
    ERROR_GENERIC_ERROR("ERR001", "general error"),
    ERROR_DUPLICATE_USER_NAME("ERR002", "found duplicate username"),
    ERROR_LOGIN("ERR003", "username or password is incorrect"),
    ERROR_ACCESS_DENIED("ERR004", "your role does not have permission to perform this action"),
    ERROR_MISSING_HEADER_ROLE("ERR005", "missing role header"),
    ERROR_INVALID_ROLE("ERR005", "invalid role"),
    ERROR_USER_DEACTIVATED("ERR006", "user is deactivated"),
    ERROR_DUPLICATE_STUDENT_NO("ERR007", "found duplicate student no"),
    ERROR_INVALID_REQUEST("ERR008", "invalid fields: %s"),
    ERROR_MISSING_STUDENT_NO("ERR009", "missing studentNo for student role"),
    ERROR_USER_NOT_FOUND("ERR010", "user not found"),
    ERROR_STUDENT_PROFILE_NOT_FOUND("ERR011", "student profile not found"),
    ERROR_EXPORT_EXCEL("ERR012", "cannot export excel"),
    ERROR_IMPORT_EXCEL("ERR013", "cannot import excel"),
    ERROR_IMPORT_BLANK_EXCEL("ERR014", "cannot import blank excel"),
    ERROR_IMPORT_INVALID_EXCEL("ERR014", "cannot import invalid excel"),
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
}
