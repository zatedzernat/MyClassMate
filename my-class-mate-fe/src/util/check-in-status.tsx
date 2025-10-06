// src/types/role.ts
export enum CheckInStatus {
  PRESENT = "PRESENT",
  LATE = "LATE",
  ABSENT = "ABSENT"
  }

  export function getCheckInStatusLabel(status: CheckInStatus): string {
    switch (status) {
      case CheckInStatus.PRESENT:
        return "เข้าเรียนตรงเวลา";
      case CheckInStatus.LATE:
        return "เข้าเรียนสาย";
      case CheckInStatus.ABSENT:
        return "ขาดเรียน";
      default:
        return "";
    }
  }