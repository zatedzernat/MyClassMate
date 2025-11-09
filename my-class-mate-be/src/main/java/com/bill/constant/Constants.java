package com.bill.constant;

public class Constants {
    public static final String PASSWORD_VALUE = "1234";

    public static final String EMAIL_SUBJECT_TEMPLATE = "[MyClassmate] สรุปการเข้าเรียนและการมีส่วนร่วม วิชา %s ประจำวันที่ %s";
    public static final String ABSENT_NOTE_TEMPLATE = " (ปัจจุบันอัตราการขาดเรียนคิดเป็นร้อยละ %.2f%% ของชั่วโมงเรียนทั้งหมด)";
    public static final String EMAIL_BODY_TEMPLATE = """
        <p>เรียน คุณ %s,</p>

        <p>ระบบขอนำส่งสรุปข้อมูลการเข้าเรียนและการมีส่วนร่วม วิชา %s ประจำวันที่ %s โดยมีรายละเอียดดังนี้</p>

        รายวิชา: <b>%s</b>
        <ul>
            <li>สถานะการเข้าเรียนวันนี้: <b><span style="color:%s;">%s</span></b></li>
            <li>การมีส่วนร่วมในชั้นเรียนวันนี้: <b>%d</b> ครั้ง คะแนนที่ได้รับ: <b>%d</b> คะแนน</li>
        </ul>

        สรุปการเข้าเรียนสะสมในรายวิชานี้ (จากจำนวนครั้งที่จะมีการเรียนการสอนทั้งหมด: <b>%d</b> ครั้ง)
        <ul>
            <li>เข้าเรียนตรงเวลา: <b><span style="color:green;">%d</span></b> ครั้ง</li>
            <li>เข้าเรียนสาย: <b><span style="color:orange;">%d</span></b> ครั้ง</li>
            <li>ขาดเรียน: <b><span style="color:red;">%d</span></b> ครั้ง%s</li>
        </ul>
        
        สรุปการมีส่วนร่วมสะสมในรายวิชานี้
        <ul>
            <li>จำนวนครั้งการมีส่วนร่วมทั้งหมด: <b>%d</b> ครั้ง</li>
            <li>คะแนนการมีส่วนร่วมสะสม: <b>%d</b> คะแนน</li>
        </ul>

        <p>โปรดตรวจสอบข้อมูลดังกล่าว หากพบความผิดพลาดสามารถติดต่ออาจารย์ผู้สอนหรือเจ้าหน้าที่ได้ทันที</p>

        <p>จึงเรียนมาเพื่อทราบ</p>
        
        <p>ระบบ MyClassMate</p>
        """;

}
