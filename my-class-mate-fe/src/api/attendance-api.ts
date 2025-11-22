import { logger } from '@/lib/default-logger';
import { ValidateStudentFaceResponse } from './data/face-response';

// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
const API_VERSION = 'my-class-mate/v1';

/**
 * Manual check-in for a student
 */
export async function manualCheckin(
    courseId: number | string,
    courseScheduleId: number | string,
    studentId: number | string,
    remark: string
): Promise<ValidateStudentFaceResponse> {
    try {
        logger.debug(`[AttendanceAPI]: Manual check-in for student ${studentId} in schedule ${courseScheduleId}`);

        const queryParams = new URLSearchParams();
        if (remark) {
            queryParams.append('remark', remark);
        }

        const response = await fetch(
            `${BASE_URL}/${API_VERSION}/attendance/${courseId}/${courseScheduleId}/${studentId}?${queryParams.toString()}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-role': localStorage.getItem('user-role') || '',
                }
            }
        );

        logger.debug(`[AttendanceAPI]: Response status: ${response.status}`);

        if (!response.ok) {
            const resData = await response.json().catch(() => null);
            const errorMessage = resData?.message || resData?.code || `HTTP Error: ${response.status}`;
            throw new Error(errorMessage);
        }

        const resData: ValidateStudentFaceResponse = await response.json();
        logger.debug('[AttendanceAPI]: Manual check-in successful:', resData);

        return resData;

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเช็คชื่อ';
        logger.error('[AttendanceAPI]: Error manual check-in:', error);
        throw new Error(errorMessage);
    }
}
