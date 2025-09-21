package com.bill.constant;

public enum ParticipationStatusEnum {
    OPEN("เปิด"),
    CLOSE("ปิด");

    public final String desc;

    ParticipationStatusEnum(String desc) {
        this.desc = desc;
    }

    public String getDesc() {
        return desc;
    }
}
