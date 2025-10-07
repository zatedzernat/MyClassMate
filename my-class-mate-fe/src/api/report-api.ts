import { logger } from '@/lib/default-logger';
import { CourseReportResponse } from './data/report-response';

// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
const API_VERSION = 'my-class-mate/v1';

/**
 * Get course report data including schedules, attendances, and participations
 */
export async function getCourseReport(courseId: number | string): Promise<CourseReportResponse> {
    try {
        logger.debug('[ReportAPI]: Fetching course report for course ID:', courseId);

        const response = await fetch(`${BASE_URL}/${API_VERSION}/reports/course/${encodeURIComponent(courseId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-role': localStorage.getItem('user-role') || '',
            }
        });

        logger.debug(`[ReportAPI]: Response status: ${response.status}`);

        if (!response.ok) {
            // Try to get error message from response
            const resData = await response.json().catch(() => null);
            const errorMessage = resData?.message || resData?.code || `HTTP Error: ${response.status}`;
            throw new Error(errorMessage);
        }

        const resData: CourseReportResponse = await response.json();
        logger.debug('[ReportAPI]: Raw response data:', resData);

        // Validate response structure
        if (!resData.courseId || !Array.isArray(resData.schedules)) {
            logger.error('[ReportAPI]: Invalid response format:', resData);
            throw new Error('รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
        }

        logger.debug(`[ReportAPI]: Successfully fetched course report with ${resData.schedules.length} schedules`);

        return resData;

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานรายวิชา';
        logger.error('[ReportAPI]: Error fetching course report:', error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        throw new Error(errorMessage);
    }
}

/**
 * Export course report as Excel file
 */
export async function exportCourseReport(courseId: number | string): Promise<void> {
    try {
        logger.debug('[ReportAPI]: Exporting course report for course ID:', courseId);

        const response = await fetch(`${BASE_URL}/${API_VERSION}/reports/course/${encodeURIComponent(courseId)}/export`, {
            method: 'GET',
            headers: {
                'x-role': localStorage.getItem('user-role') || '',
            }
        });

        logger.debug(`[ReportAPI]: Export response status: ${response.status}`);

        if (!response.ok) {
            // Try to get error message from response
            const resData = await response.json().catch(() => null);
            const errorMessage = resData?.message || resData?.code || `HTTP Error: ${response.status}`;
            throw new Error(errorMessage);
        }

        // Get the file blob
        const blob = await response.blob();

        // Create a link and trigger download
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // File name: try backend Content-Disposition, fallback to default
        const contentDisposition = response.headers.get('Content-Disposition');
        let fileName = `course_report_${courseId}.xlsx`;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match?.[1]) fileName = match[1];
        }

        a.download = fileName;
        document.body.append(a);
        a.click();

        // Cleanup
        a.remove();
        globalThis.URL.revokeObjectURL(url);

        logger.debug(`[ReportAPI]: Successfully exported course report as ${fileName}`);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกรายงานรายวิชา';
        logger.error('[ReportAPI]: Error exporting course report:', error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        throw new Error(errorMessage);
    }
}

// Export types for convenience
export type {
    CourseReportResponse,
    CourseScheduleReportResponse,
    AttendanceReportResponse,
    ParticipationReportResponse,
    ParticipationRequestReportResponse
} from './data/report-response';