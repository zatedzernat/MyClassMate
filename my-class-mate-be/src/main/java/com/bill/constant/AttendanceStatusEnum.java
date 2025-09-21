package com.bill.constant;

import lombok.Getter;

@Getter
public enum AttendanceStatusEnum {
    PRESENT("เข้าเรียนตรงเวลา"),
    LATE("เข้าเรียนสาย"),
    ABSENT("ขาดเรียน");

    private final String desc;

    AttendanceStatusEnum(String desc) {
        this.desc = desc;
    }

    public String getDesc() {
        return desc;
    }
}
