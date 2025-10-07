import { logger } from '@/lib/default-logger';
import {
    ParticipationResponse,
    ParticipationListResponse,
    ParticipationStatus,
    CreateParticipationRequest,
    CreateParticipationResponse,
    ParticipationRequestRequest,
    ParticipationRequestResponse,
    CreateParticipationRequestResponse,
    ParticipationRequestListResponse,
    EvaluateParticipationRequestsRequest,
    EvaluateParticipationRequestsResponse
} from './data/participation-response';

// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
const API_VERSION = 'my-class-mate/v1';

/**
 * Get participations by course schedule ID
 */
export async function getParticipationsByCourseScheduleId(courseScheduleId: number | string): Promise<ParticipationListResponse> {
    try {
        logger.debug('[ParticipationAPI]: Fetching participations for course schedule ID:', courseScheduleId);

        const response = await fetch(`${BASE_URL}/${API_VERSION}/participations/course-schedule/${encodeURIComponent(courseScheduleId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-role': localStorage.getItem('user-role') || '',
            }
        });

        logger.debug(`[ParticipationAPI]: Response status: ${response.status}`);

        const resData = await response.json();
        logger.debug('[ParticipationAPI]: Raw response data:', resData);

        if (!response.ok) {
            const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
            throw new Error(errorMessage);
        }

        // Handle different response formats
        let participations: ParticipationResponse[];
        let total: number;

        if (Array.isArray(resData)) {
            // Direct array response
            participations = resData;
            total = resData.length;
        } else if (resData.data && Array.isArray(resData.data)) {
            // Wrapped response with data array
            participations = resData.data;
            total = resData.total ?? resData.data.length;
        } else if (resData.participations && Array.isArray(resData.participations)) {
            // Response with participations property
            participations = resData.participations;
            total = resData.total ?? resData.participations.length;
        } else {
            logger.error('[ParticipationAPI]: Unexpected response format:', resData);
            throw new Error('รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
        }

        // Map and validate participation data
        const mappedParticipations: ParticipationResponse[] = participations.map((participation: unknown) => {
            const p = participation as Record<string, unknown>;
            return {
                participationId: p.participationId as number,
                courseScheduleId: p.courseScheduleId as number,
                round: p.round as number,
                topic: p.topic as string,
                status: (p.status as string) as ParticipationStatus, // Cast to ParticipationStatus
                createdBy: p.createdBy as number,
                createdAt: p.createdAt as string,
                closedAt: p.closedAt as string | null
            };
        });

        logger.debug(`[ParticipationAPI]: Successfully fetched ${mappedParticipations.length} participations`);

        return {
            success: true,
            data: mappedParticipations,
            total: total,
            message: `พบข้อมูลการเข้าร่วม ${mappedParticipations.length} รายการ`
        };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลการเข้าร่วม';
        logger.error('[ParticipationAPI]: Error fetching participations:', error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
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
            message: errorMessage
        };
    }
}

/**
 * Create a new participation
 */
export async function createParticipation(participationData: CreateParticipationRequest): Promise<CreateParticipationResponse> {
    try {
        logger.debug('[ParticipationAPI]: Creating participation with data:', participationData);

        const response = await fetch(`${BASE_URL}/${API_VERSION}/participations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-role': localStorage.getItem('user-role') || '',
            },
            body: JSON.stringify(participationData)
        });

        logger.debug(`[ParticipationAPI]: Create participation response status: ${response.status}`);

        const resData = await response.json();
        logger.debug('[ParticipationAPI]: Create participation raw response data:', resData);

        if (!response.ok) {
            const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
            throw new Error(errorMessage);
        }

        // Map the response to ParticipationResponse format
        const createdParticipation: ParticipationResponse = {
            participationId: resData.participationId,
            courseScheduleId: resData.courseScheduleId,
            round: resData.round,
            topic: resData.topic,
            status: resData.status as ParticipationStatus,
            createdBy: resData.createdBy,
            createdAt: resData.createdAt,
            closedAt: resData.closedAt
        };

        logger.debug(`[ParticipationAPI]: Successfully created participation with ID: ${createdParticipation.participationId}`);

        return {
            success: true,
            data: createdParticipation,
            message: `สร้างการมีส่วนร่วมสำเร็จ: ${createdParticipation.topic}`
        };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างการมีส่วนร่วม';
        logger.error('[ParticipationAPI]: Error creating participation:', error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        throw new Error(errorMessage);
    }
}

/**
 * Close a participation by participation ID
 */
export async function closeParticipation(participationId: number): Promise<CreateParticipationResponse> {
    try {
        logger.debug('[ParticipationAPI]: Closing participation with ID:', participationId);

        const response = await fetch(`${BASE_URL}/${API_VERSION}/participations/${encodeURIComponent(participationId)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-role': localStorage.getItem('user-role') || '',
            }
        });

        logger.debug(`[ParticipationAPI]: Close participation response status: ${response.status}`);

        const resData = await response.json();
        logger.debug('[ParticipationAPI]: Close participation raw response data:', resData);

        if (!response.ok) {
            const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
            throw new Error(errorMessage);
        }

        // Map the response to ParticipationResponse format
        const closedParticipation: ParticipationResponse = {
            participationId: resData.participationId,
            courseScheduleId: resData.courseScheduleId,
            round: resData.round,
            topic: resData.topic,
            status: resData.status as ParticipationStatus,
            createdBy: resData.createdBy,
            createdAt: resData.createdAt,
            closedAt: resData.closedAt
        };

        logger.debug(`[ParticipationAPI]: Successfully closed participation with ID: ${closedParticipation.participationId}`);

        return {
            success: true,
            data: closedParticipation,
            message: `ปิดการมีส่วนร่วมสำเร็จ: ${closedParticipation.topic}`
        };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการปิดการมีส่วนร่วม';
        logger.error('[ParticipationAPI]: Error closing participation:', error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        throw new Error(errorMessage);
    }
}

/**
 * Request participation as a student
 */
export async function requestParticipation(requestData: ParticipationRequestRequest): Promise<CreateParticipationRequestResponse> {
    try {
        logger.debug('[ParticipationAPI]: Requesting participation with data:', requestData);

        const response = await fetch(`${BASE_URL}/${API_VERSION}/participations/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-role': localStorage.getItem('user-role') || '',
            },
            body: JSON.stringify(requestData)
        });

        logger.debug(`[ParticipationAPI]: Request participation response status: ${response.status}`);

        const resData = await response.json();
        logger.debug('[ParticipationAPI]: Request participation raw response data:', resData);

        if (!response.ok) {
            const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
            throw new Error(errorMessage);
        }

        // Map the response to ParticipationRequestResponse format
        const participationRequest: ParticipationRequestResponse = {
            participationRequestId: resData.participationRequestId,
            participationId: resData.participationId,
            studentId: resData.studentId,
            studentNo: resData.studentNo,
            studentNameTh: resData.studentNameTh,
            studentNameEn: resData.studentNameEn,
            createdAt: resData.createdAt,
            isScored: resData.isScored,
            score: resData.score
        };

        logger.debug(`[ParticipationAPI]: Successfully requested participation with ID: ${participationRequest.participationRequestId}`);

        return {
            success: true,
            data: participationRequest,
            message: `ส่งคำขอเข้าร่วมสำเร็จ: ${participationRequest.studentNameTh}`
        };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งคำขอเข้าร่วม';
        logger.error('[ParticipationAPI]: Error requesting participation:', error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        throw new Error(errorMessage);
    }
}

/**
 * Get all participation requests for a specific participation ID
 */
export async function getParticipationRequests(participationId: number): Promise<ParticipationRequestListResponse> {
    try {
        logger.debug('[ParticipationAPI]: Fetching participation requests for participation ID:', participationId);

        const response = await fetch(`${BASE_URL}/${API_VERSION}/participations/requests/${encodeURIComponent(participationId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-role': localStorage.getItem('user-role') || '',
            }
        });

        logger.debug(`[ParticipationAPI]: Get participation requests response status: ${response.status}`);

        const resData = await response.json();
        logger.debug('[ParticipationAPI]: Get participation requests raw response data:', resData);

        if (!response.ok) {
            const errorMessage = resData?.message || resData?.code || 'Unknown error occurred';
            throw new Error(errorMessage);
        }

        // Handle response - API returns array directly or empty array
        let participationRequests: ParticipationRequestResponse[];
        
        if (Array.isArray(resData)) {
            // Direct array response
            participationRequests = resData.map((request: unknown) => {
                const r = request as Record<string, unknown>;
                return {
                    participationRequestId: r.participationRequestId as number,
                    participationId: r.participationId as number,
                    studentId: r.studentId as number,
                    studentNo: r.studentNo as string,
                    studentNameTh: r.studentNameTh as string,
                    studentNameEn: r.studentNameEn as string,
                    createdAt: r.createdAt as string,
                    isScored: r.isScored as boolean,
                    score: r.score as number
                };
            });
        } else if (resData.data && Array.isArray(resData.data)) {
            // Wrapped response with data array
            participationRequests = resData.data;
        } else {
            logger.error('[ParticipationAPI]: Unexpected response format:', resData);
            throw new Error('รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
        }

        logger.debug(`[ParticipationAPI]: Successfully fetched ${participationRequests.length} participation requests`);

        return {
            success: true,
            data: participationRequests,
            total: participationRequests.length,
            message: `พบข้อมูลคำขอเข้าร่วม ${participationRequests.length} รายการ`
        };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอเข้าร่วม';
        logger.error('[ParticipationAPI]: Error fetching participation requests:', error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
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
            message: errorMessage
        };
    }
}

/**
 * Evaluate participation requests by assigning scores
 */
export async function evaluateParticipationRequests(requestData: EvaluateParticipationRequestsRequest): Promise<EvaluateParticipationRequestsResponse> {
    try {
        logger.debug('[ParticipationAPI]: Evaluating participation requests with data:', requestData);

        const response = await fetch(`${BASE_URL}/${API_VERSION}/participations/requests/evaluate`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-role': localStorage.getItem('user-role') || '',
            },
            body: JSON.stringify(requestData)
        });

        logger.debug(`[ParticipationAPI]: Evaluate participation requests response status: ${response.status}`);

        if (!response.ok) {
            // For non-200 status, try to get error message from response
            const resData = await response.json().catch(() => null);
            const errorMessage = resData?.message || resData?.code || `HTTP Error: ${response.status}`;
            throw new Error(errorMessage);
        }

        // For successful responses, the API returns 200 status
        // We may or may not have a response body, so handle both cases
        let resData = null;
        try {
            resData = await response.json();
            logger.debug('[ParticipationAPI]: Evaluate participation requests raw response data:', resData);
        } catch {
            // If no JSON response body, that's fine for a 200 status
            logger.debug('[ParticipationAPI]: No JSON response body for evaluation request');
        }

        logger.debug(`[ParticipationAPI]: Successfully evaluated ${requestData.evaluates.length} participation requests`);

        return {
            success: true,
            message: `ประเมินการมีส่วนร่วมสำเร็จ ${requestData.evaluates.length} รายการ`
        };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการประเมินการมีส่วนร่วม';
        logger.error('[ParticipationAPI]: Error evaluating participation requests:', error);

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        }

        throw new Error(errorMessage);
    }
}

// Export types for convenience
export type { 
    ParticipationResponse, 
    ParticipationStatus, 
    CreateParticipationRequest, 
    CreateParticipationResponse,
    ParticipationRequestRequest,
    ParticipationRequestResponse,
    CreateParticipationRequestResponse,
    ParticipationRequestListResponse,
    EvaluateParticipationRequestsRequest,
    EvaluateParticipationRequestsResponse
} from './data/participation-response';
