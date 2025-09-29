import { logger } from '@/lib/default-logger';
import { StudentResponse, UpdateStudentRequest } from './data/student-response';

/**
 * Get student profile by user ID
 */
export async function getStudentProfile(userId: string): Promise<StudentResponse> {
    logger.debug(`[StudentAPI]: Fetching student profile for userId: ${userId}`);

    const url = `/api/my-class-mate/v1/student-profile/${userId}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-role': localStorage.getItem('user-role') || '',
        },
    });

    const resData = await response.json();
    logger.debug(`[StudentAPI]: Response status: ${response.status}`);

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }

    // Map the API response to UserResponse object
    const mappedUser: StudentResponse = {
        studentId: resData.studentId,
        studentNo: resData.studentNo,
        studentNameTh: resData.studentNameTh,
        studentNameEn: resData.studentNameEn,
        address: resData.address,
        phoneNumber: resData.phoneNumber,
        remark: resData.remark,
    };

    console.log('Fetched user:', mappedUser); // Debug log

    return mappedUser;
}

/**
 * Update student profile
 */
export async function updateStudentProfile(
    userId: string,
    updateData: Partial<UpdateStudentRequest>
): Promise<void> {
    logger.debug(`[StudentAPI]: Updating student profile for userId: ${userId}`);

    const url = `/api/my-class-mate/v1/student-profile/${userId}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-role': localStorage.getItem('user-role') || '',
        },
        body: JSON.stringify(updateData)
    });

    const resData = await response.json();
    logger.debug(`[StudentAPI]: Update response status: ${response.status}`);

    if (!response.ok) {
        const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
        throw new Error(errorMessage);
    }

}