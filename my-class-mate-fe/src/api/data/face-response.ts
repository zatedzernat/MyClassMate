import { CheckInStatus } from "@/util/check-in-status";

export interface UploadFaceImagesResponse {
  userId: string;
  imageCount: number;
}

export interface ValidateStudentFaceResponse {
  attandanceId: number;
  courseId: number;
  courseCode: string;
  courseScheduleId: number;
  createdAt: string;
  status: CheckInStatus;
  statusDesc: string;
  studentId: number;
  studentNameEn: string;
  studentNameTh: string;
  studentNo: string;
}