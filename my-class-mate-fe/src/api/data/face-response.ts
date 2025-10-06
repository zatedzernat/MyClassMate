
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
  status: string;
  statusDesc: string;
  studentId: number;
  studentSurname: string;
  studentNickname: string;
  studentNo: string;
}