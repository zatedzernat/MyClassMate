package com.bill.constant;

public enum AttendanceStatusEnum {
    PRESENT("เข้าเรียนตรงเวลา"),
    LATE("เข้าเรียนสาย"),
    ABSENT("ขาดเรียน");

    public final String desc;

    AttendanceStatusEnum(String desc) {
        this.desc = desc;
    }

    public String getDesc() {
        return desc;
    }
}
