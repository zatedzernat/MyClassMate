package com.bill.constant;

public enum DayEnum {
    MONDAY("จันทร์"),
    TUESDAY("อังคาร"),
    WEDNESDAY("พุธ"),
    THURSDAY("พฤหัสบดี"),
    FRIDAY("ศุกร์"),
    SATURDAY("เสาร์"),
    SUNDAY("อาทิตย์");

    private final String desc;

    DayEnum(String desc) {
        this.desc = desc;
    }

    public String getDesc() {
        return desc;
    }
}
