package com.bill.constant;

public enum RoleEnum {
    ADMIN("ผู้ดูแลระบบ"),
    STAFF("เจ้าหน้าที่"),
    LECTURER("ผู้สอน"),
    STUDENT("ผู้เรียน");

    public final String desc;

    RoleEnum(String desc) {
        this.desc = desc;
    }

    public String getDesc() {
        return desc;
    }
}
