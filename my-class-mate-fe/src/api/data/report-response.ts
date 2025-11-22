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

// Course Report Types
export interface AttendanceReportResponse {
    studentId: number;
    studentNo: string;
    studentNameTh: string;
    studentNameEn: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    statusDesc: string;
    attendedAt: string | null;
    remark: string | null;
}

export interface ParticipationRequestReportResponse {
    studentId: number;
    studentNo: string;
    studentNameTh: string;
    studentNameEn: string;
    isScored: boolean;
    score: number;
}

export interface ParticipationReportResponse {
    round: number;
    topic: string;
    requestParticipations: ParticipationRequestReportResponse[];
}

export interface CourseScheduleReportResponse {
    courseScheduleId: number;
    courseId: number;
    scheduleDate: string;
    startTime: string;
    endTime: string;
    room: string;
    remark: string | null;
    attendances: AttendanceReportResponse[] | null;
    participations: ParticipationReportResponse[] | null;
}

export interface CourseReportResponse {
    courseId: number;
    schedules: CourseScheduleReportResponse[];
}
