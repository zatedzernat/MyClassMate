import { CourseResponse, DayOfWeek } from "./course-response";

// Add these interfaces for create course request and response
interface CreateCourseSchedule {
    scheduleDate: string; // Format: "YYYY-MM-DD"
    startTime: string;    // Format: "HH:mm:ss"
    endTime: string;      // Format: "HH:mm:ss"
    room: string;
    remark?: string;      // Optional remark
  }
  
  export interface CreateCourseRequest {
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
    lecturerIds: number[];
    schedules: CreateCourseSchedule[];
  }
  
  export interface CreateCourseResponse {
    data: CourseResponse;
  }