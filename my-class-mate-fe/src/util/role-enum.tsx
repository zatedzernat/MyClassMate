// src/types/role.ts
export enum Role {
    ADMIN = "ADMIN",
    STAFF = "STAFF",
    LECTURER = "LECTURER",
    STUDENT = "STUDENT",
    NOTHING = "",
    ALL = "ALL",
  }

  export function getRoleLabel(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return "ผู้ดูแลระบบ";
      case Role.STAFF:
        return "เจ้าหน้าที่";
      case Role.LECTURER:
        return "ผู้สอน";
      case Role.STUDENT:
        return "ผู้เรียน";
        case Role.ALL:
        return "ทั้งหมด";
      default:
        return "";
    }
  }