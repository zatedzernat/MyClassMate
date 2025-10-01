import { logger } from '@/lib/default-logger';
import { 
  CourseResponse, 
  CourseListResponse, 
  CourseFilter,
  DayOfWeek 
} from './data/course-response';
import { CourseInitRequest, CourseInitResponse, CourseSchedulePreview } from './data/course-init-response';

// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
const API_VERSION = 'my-class-mate/v1';

/**
 * Get courses with optional filters
 */
export async function getCourses(filter?: CourseFilter): Promise<CourseListResponse> {
  try {
    logger.debug('[CourseAPI]: Fetching courses with filter:', filter);

    const url = new URL(`${BASE_URL}/${API_VERSION}/courses`);
    
    // Add query parameters based on filter
    if (filter?.academicYear) {
      url.searchParams.append('academicYear', filter.academicYear.toString());
    }
    
    if (filter?.semester) {
      url.searchParams.append('semester', filter.semester.toString());
    }

    logger.debug('[CourseAPI]: Request URL:', url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-role': localStorage.getItem('user-role') || '',
      }
    });

    logger.debug(`[CourseAPI]: Response status: ${response.status}`);

    const resData = await response.json();
    logger.debug('[CourseAPI]: Raw response data:', resData);

    if (!response.ok) {        
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
      }

    // Handle different response formats
    let courses: CourseResponse[];
    let total: number;

    if (Array.isArray(resData)) {
      // Direct array response
      courses = resData;
      total = resData.length;
    } else if (resData.data && Array.isArray(resData.data)) {
      // Wrapped response with data array
      courses = resData.data;
      total = resData.total || resData.data.length;
    } else if (resData.courses && Array.isArray(resData.courses)) {
      // Response with courses property
      courses = resData.courses;
      total = resData.total || resData.courses.length;
    } else {
      logger.error('[CourseAPI]: Unexpected response format:', resData);
      throw new Error('รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
    }

    // Map and validate course data
    const mappedCourses: CourseResponse[] = courses.map((course: any) => ({
      courseId: course.courseId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      academicYear: course.academicYear,
      semester: course.semester,
      room: course.room,
      startTime: course.startTime,
      endTime: course.endTime,
      dayOfWeek: course.dayOfWeek as DayOfWeek,
      startDate: course.startDate,
      endDate: course.endDate,
      createdBy: course.createdBy,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      lecturers: course.lecturers || [],
      schedules: course.schedules || [],
      enrollments: course.enrollments || []
    }));

    logger.debug(`[CourseAPI]: Successfully fetched ${mappedCourses.length} courses`);

    return {
      success: true,
      data: mappedCourses,
      total: total,
      message: `พบรายวิชา ${mappedCourses.length} รายการ`
    };

  } catch (error: any) {
    logger.error('[CourseAPI]: Error fetching courses:', error);
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        data: [],
        total: 0,
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      };
    }
    
    return {
      success: false,
      data: [],
      total: 0,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลรายวิชา'
    };
  }
}


/**
 * Initialize course schedules - Preview course schedule dates
 */
export async function courseInit(initRequest: CourseInitRequest): Promise<CourseInitResponse> {
      logger.debug('[CourseAPI]: Initializing course schedules with data:', initRequest);
  
      const response = await fetch(`${BASE_URL}/${API_VERSION}/courses/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-role': localStorage.getItem('user-role') || '',
        },
        body: JSON.stringify(initRequest)
      });
  
      logger.debug(`[CourseAPI]: Course init response status: ${response.status}`);

      const resData = await response.json();
      logger.debug('[CourseAPI]: Course init raw response data:', resData);

      if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
      }
  
      // Handle response - should be an array of schedule previews
      if (!Array.isArray(resData)) {
        logger.error('[CourseAPI]: Expected array response for course init:', resData);
        throw new Error('รูปแบบข้อมูลตารางเรียนไม่ถูกต้อง');
      }
  
      // Map the schedule previews
      const schedules: CourseSchedulePreview[] = resData.map((schedule: any) => ({
        scheduleDate: schedule.scheduleDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room
      }));
  
      logger.debug(`[CourseAPI]: Successfully generated ${schedules.length} course schedules`);
  
      return {data: schedules,};
  }

// Export for convenience
export { DayOfWeek } from './data/course-response';
export type { CourseResponse, CourseFilter, CourseListResponse } from './data/course-response';