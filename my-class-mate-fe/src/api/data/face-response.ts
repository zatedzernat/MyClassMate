// Simple types for face validation
export interface FaceValidationResponse {
  attendanceId: string;
  studentId: string;
  studentNo: string;
  studentNameTh: string;
  studentNameEn: string;
  courseScheduleId: string;
  courseId: string;
  courseCode: string;
  createdAt: string;
  status: string;
  statusDesc: string;
}

export interface UploadFaceImagesResponse {
  userId: string;
  imageCount: number;
}