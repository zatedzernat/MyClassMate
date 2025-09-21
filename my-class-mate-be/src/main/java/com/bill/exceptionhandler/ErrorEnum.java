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
