import { logger } from '@/lib/default-logger';
import {
    CourseResponse,
    CourseListResponse,
    CourseFilter,
    DayOfWeek,
    UpdateCourseRequest,
    ImportStudentToCourseResponse,
    TodayCourseResponse
} from './data/course-response';
import { CourseInitRequest, CourseInitResponse, CourseSchedulePreview } from './data/course-init-response';
import { CreateCourseRequest, CreateCourseResponse } from './data/course-create';

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
 * Get course by ID
 */
export async function getCourseById(courseId: string): Promise<CourseResponse> {
    try {
        logger.debug('[CourseAPI]: Fetching course by ID:', courseId);

        const response = await fetch(`${BASE_URL}/${API_VERSION}/courses/${encodeURIComponent(courseId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-role': localStorage.getItem('user-role') || '',
            },
        });

        logger.debug(`[CourseAPI]: Get course by ID response status: ${response.status}`);

        if (!response.ok) {
            const resData = await response.json();
            const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
            logger.error(`[CourseAPI]: Get course by ID HTTP error ${response.status}: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        const resData = await response.json();
        logger.debug('[CourseAPI]: Get course by ID raw response data:', resData);

        // Map the response to CourseResponse format
        const course: CourseResponse = {
            courseId: resData.courseId,
            courseCode: resData.courseCode,
            courseName: resData.courseName,
            academicYear: resData.academicYear,
            semester: resData.semester,
            room: resData.room,
            startTime: resData.startTime,
            endTime: resData.endTime,
            dayOfWeek: resData.dayOfWeek as DayOfWeek,
            startDate: resData.startDate,
            endDate: resData.endDate,
            createdBy: resData.createdBy,
            createdAt: resData.createdAt,
            updatedAt: resData.updatedAt,
            lecturers: resData.lecturers || [],
            schedules: resData.schedules || [],
            enrollments: resData.enrollments || []
        };

        logger.debug(`[CourseAPI]: Successfully fetched course: ${course.courseCode}`);
        return course;

    } catch (error: any) {
        logger.error('[CourseAPI]: Error fetching course by ID:', error);

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        throw error;
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

    return { data: schedules, };
}


/**
* Create a new course with schedules and lecturers
*/
export async function createCourse(courseData: CreateCourseRequest): Promise<CreateCourseResponse> {
    logger.debug('[CourseAPI]: Creating course with data:', courseData);

    const response = await fetch(`${BASE_URL}/${API_VERSION}/courses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-role': localStorage.getItem('user-role') || '',
        },
        body: JSON.stringify(courseData)
    });

    logger.debug(`[CourseAPI]: Create course response status: ${response.status}`);

    const resData = await response.json();
    logger.debug('[CourseAPI]: Create course raw response data:', resData);

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        logger.error(`[CourseAPI]: Create course HTTP error ${response.status}: ${errorMessage}`);
        throw new Error(`เกิดข้อผิดพลาดในการสร้างรายวิชา (${response.status}): ${errorMessage}`);
    }

    // Map the response to CourseResponse format
    const createdCourse: CourseResponse = {
        courseId: resData.courseId,
        courseCode: resData.courseCode,
        courseName: resData.courseName,
        academicYear: resData.academicYear,
        semester: resData.semester,
        room: resData.room,
        startTime: resData.startTime,
        endTime: resData.endTime,
        dayOfWeek: resData.dayOfWeek as DayOfWeek,
        startDate: resData.startDate,
        endDate: resData.endDate,
        createdBy: resData.createdBy,
        createdAt: resData.createdAt,
        updatedAt: resData.updatedAt,
        lecturers: resData.lecturers || [],
        schedules: resData.schedules || [],
        enrollments: resData.enrollments || []
    };

    logger.debug(`[CourseAPI]: Successfully created course with ID: ${createdCourse.courseId}`);

    return { data: createdCourse, };
}

export async function updateCourse(courseId: string, courseRequest: UpdateCourseRequest): Promise<void> {
    if (!courseId) throw new Error("courseCode is required for update");

    const role = localStorage.getItem("user-role") || "";

    console.log('Updating course:', courseId, courseRequest);

    const response = await fetch(`/api/my-class-mate/v1/courses/${encodeURIComponent(courseId)}`, {
        method: 'PUT',
        body: JSON.stringify(courseRequest),
        headers: {
            'Content-Type': 'application/json',
            'x-role': role
        }
    });

    const resData = await response.json();

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }
}

export async function deleteCourse(courseId: string): Promise<void> {
    if (!courseId) throw new Error("courseId is required for delete");

    const role = localStorage.getItem("user-role") || "";

    const response = await fetch(`/api/my-class-mate/v1/courses/${encodeURIComponent(courseId)}`, {
        method: 'DELETE',
        headers: {
            'x-role': role
        }
    });

    if (!response.ok) {
        const resData = await response.json();
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }
}

export async function importStudentToCourse(courseId: string, file: File): Promise<ImportStudentToCourseResponse> {
    const role = localStorage.getItem("user-role") || "";

    const formData = new FormData();
    formData.append("file", file); // field name is 'file'

    const response = await fetch(`/api/my-class-mate/v1/courses/${encodeURIComponent(courseId)}/import-student-to-course`, {
        method: 'POST',
        body: formData,
        headers: {
            'x-role': role
            // Note: do NOT set Content-Type, the browser will set multipart/form-data automatically
        }
    });

    const resData = await response.json();

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }

    return { createdRow: resData.createdRow, invalidStudentNos: resData.invalidStudentNos || [] };

}

export async function exportStudentToCourse(courseId: string, courseCode: string): Promise<void> {
    const role = localStorage.getItem("user-role") || "";

    const response = await fetch(`/api/my-class-mate/v1/courses/${encodeURIComponent(courseId)}/export-student-to-course`, {
        method: "GET",
        headers: {
            "x-role": role,
        },
    });

    if (!response.ok) {
        const resData = await response.json().catch(() => ({}));
        const errorMessage = resData?.message || resData?.code || "Unknown error occurred";
        throw new Error(errorMessage);
    }

    // Get the file blob
    const blob = await response.blob();

    // Create a link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Create custom filename - ignore backend filename
    const timestamp = new Date().toISOString().split('T')[0];
    let fileName = `students_course_${courseId}_${timestamp}.xlsx`;

    if (courseId) {
        fileName = `students_${courseId}_${timestamp}.xlsx`;
        if (courseCode) {
            // Clean course name for filename (remove special characters and limit length)
            const cleanCourseName = courseCode
                .replace(/[^a-zA-Z0-9ก-๙\s]/g, '') // Remove special characters
                .replace(/\s+/g, '_') // Replace spaces with underscores
                .slice(0, 30); // Limit length
            fileName = `students_in_course_${cleanCourseName}_${timestamp}.xlsx`;
        }
    }

    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    a.remove();
    window.URL.revokeObjectURL(url);
}

export async function downloadStudentTemplate(courseId: string): Promise<void> {
    const role = localStorage.getItem("user-role") || "";

    const response = await fetch(`/api/my-class-mate/v1/courses/${encodeURIComponent(courseId)}/export-student-to-course?isTemplate=true`, {
        method: "GET",
        headers: {
            "x-role": role,
        },
    });

    if (!response.ok) {
        const resData = await response.json().catch(() => ({}));
        const errorMessage = resData?.message || resData?.code || "Unknown error occurred";
        throw new Error(errorMessage);
    }

    // Get the file blob
    const blob = await response.blob();

    // Create a link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Get filename from backend Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    let fileName = "students_template.xlsx"; // fallback filename
    if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match?.[1]) fileName = match[1];
    }

    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    a.remove();
    window.URL.revokeObjectURL(url);
}

export async function getTodayCourses(): Promise<TodayCourseResponse[]> {
    try {
        logger.debug('[CourseAPI]: Fetching today\'s course schedules');

        const role = localStorage.getItem('user-role') || '';
        
        const response = await fetch(`${BASE_URL}/${API_VERSION}/courses/today-schedules`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-role': role,
            },
        });

        logger.debug(`[CourseAPI]: Get today's courses response status: ${response.status}`);

        const resData = await response.json();

        if (!response.ok) {
            const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
            logger.error(`[CourseAPI]: Get today's courses HTTP error ${response.status}: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        logger.debug('[CourseAPI]: Get today\'s courses raw response data:', resData);

        // Handle different response formats
        let courses: TodayCourseResponse[];

        if (Array.isArray(resData)) {
            // Direct array response
            courses = resData;
        } else if (resData.data && Array.isArray(resData.data)) {
            // Wrapped response with data array
            courses = resData.data;
        } else if (resData.courses && Array.isArray(resData.courses)) {
            // Response with courses property
            courses = resData.courses;
        } else {
            logger.error('[CourseAPI]: Unexpected response format for today\'s courses:', resData);
            throw new Error('รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
        }

        // Map and validate course data
        const mappedTodayCourses: TodayCourseResponse[] = courses.map((course: any) => ({
            courseScheduleId: course.courseScheduleId,
            courseId: course.courseId,
            courseCode: course.courseCode,
            courseName: course.courseName,
            scheduleDate: course.scheduleDate,
            startTime: course.startTime,
            endTime: course.endTime,
            room: course.room,
            remark: course.remark || ''
        }));

        logger.debug(`[CourseAPI]: Successfully fetched ${mappedTodayCourses.length} today's courses`);
        return mappedTodayCourses;

    } catch (error: any) {
        logger.error('[CourseAPI]: Error fetching today\'s courses:', error);

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        throw error;
    }
}

// Export for convenience
// Export for convenience
export { DayOfWeek } from './data/course-response';
export type {
    CourseResponse,
    CourseFilter,
    CourseListResponse,
} from './data/course-response';