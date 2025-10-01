import { DayOfWeek } from "./course-response";

// Add this interface for the init request
export interface CourseInitRequest {
    dayOfWeek: DayOfWeek;
    startDate: string; // Format: "YYYY-MM-DD"
    endDate: string;   // Format: "YYYY-MM-DD"
    startTime: string; // Format: "HH:mm:ss"
    endTime: string;   // Format: "HH:mm:ss"
    room: string;
  }
  
  // Add this interface for the init response
  export interface CourseSchedulePreview {
    scheduleDate: string; // Format: "YYYY-MM-DD"
    startTime: string;    // Format: "HH:mm:ss"
    endTime: string;      // Format: "HH:mm:ss"
    room: string;
  }
  
  export interface CourseInitResponse {
    data: CourseSchedulePreview[];
  }


  