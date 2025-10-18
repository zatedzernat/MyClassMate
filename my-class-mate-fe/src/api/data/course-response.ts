export interface CourseRequest {
  courseCode: string;
  courseName: string;
  academicYear: number;
  semester: number;
  room: string;
  startTime: string; // Format: "HH:mm:ss"
  endTime: string;   // Format: "HH:mm:ss"
  dayOfWeek: DayOfWeek;
  startDate: string; // Format: "YYYY-MM-DD"
  endDate: string;   // Format: "YYYY-MM-DD"
}

export interface UpdateCourseRequest {
  courseCode: string;
  courseName: string;
  academicYear: number;
  semester: number;
  room: string;
  lecturerIds: number[];
  schedules: CourseSchedule[];
}

export interface LecturerInfo {
  lecturerId: number;
  lecturerNameTh: string;
  lecturerNameEn: string;
}

export interface CourseSchedule {
  courseScheduleId: number;
  courseId: number;
  scheduleDate: string; // Format: "YYYY-MM-DD"
  startTime: string;    // Format: "HH:mm:ss"
  endTime: string;      // Format: "HH:mm:ss"
  room: string;
  remark?: string | null;
}

export interface CourseEnrollment {
  studentId: number;
  studentNo: string;
  studentNameTh: string;
  studentNameEn?: string;
}

export interface CourseResponse {
  courseId: string;
  courseCode: string;
  courseName: string;
  academicYear: number;
  semester: number;
  room: string;
  startTime: string;    // Format: "HH:mm:ss"
  endTime: string;      // Format: "HH:mm:ss"
  dayOfWeek: DayOfWeek;
  startDate: string;    // Format: "YYYY-MM-DD"
  endDate: string;      // Format: "YYYY-MM-DD"
  createdBy: number;
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
  lecturers: LecturerInfo[];
  schedules: CourseSchedule[];
  enrollments: CourseEnrollment[];
}

export interface CourseListResponse {
  success: boolean;
  message?: string;
  data: CourseResponse[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface CourseDetailResponse {
  success: boolean;
  message?: string;
  data: CourseResponse;
}

export interface CourseCreateResponse {
  success: boolean;
  message: string;
  data?: {
    courseId: number;
    courseCode: string;
    courseName: string;
    schedulesCreated: number;
  };
}

export interface CourseUpdateResponse {
  success: boolean;
  message: string;
  data?: CourseResponse;
}

export interface CourseDeleteResponse {
  success: boolean;
  message: string;
}

// Enums for better type safety
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export enum CourseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DROPPED = 'DROPPED',
  COMPLETED = 'COMPLETED'
}

// Helper types for forms and filters
export interface CourseFilter {
  academicYear?: number;
  semester?: number;
}

export interface CoursePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Statistics and summary interfaces
export interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  averageEnrollmentPerCourse: number;
  coursesByDay: { [key in DayOfWeek]: number };
  coursesBySemester: { [key: string]: number };
}

export interface EnrollmentSummary {
  courseId: number;
  courseCode: string;
  courseName: string;
  totalEnrollments: number;
  activeEnrollments: number;
  scheduleCount: number;
  nextScheduleDate?: string;
}

// Time-related helper interfaces
export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number; // in minutes
}

export interface WeeklySchedule {
  dayOfWeek: DayOfWeek;
  courses: Array<{
    courseId: number;
    courseCode: string;
    courseName: string;
    timeSlot: TimeSlot;
    room: string;
  }>;
}

// Validation interfaces
export interface CourseValidation {
  isValidTimeRange: boolean;
  isValidDateRange: boolean;
  hasConflictingSchedules: boolean;
  conflictingCourses?: string[];
  warnings: string[];
  errors: string[];
}

export interface ImportStudentToCourseResponse {
  createdRow: number;
  invalidStudentNos: string[];
}

export interface TodayCourseResponse {
  courseScheduleId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  room: string;
  remark: string;
}
