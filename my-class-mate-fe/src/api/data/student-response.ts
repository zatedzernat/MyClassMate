import { Role } from "@/util/role-enum";

export interface UpdateStudentRequest {
    studentId: string;
    address: string;
    phoneNumber: string;
    remark: string;
}

export interface StudentResponse {
    studentId: string;
    studentNo: string;
    studentNameTh: string;
    studentNameEn: string;
    address?: string;
    phoneNumber?: string;
    remark?: string;
}
