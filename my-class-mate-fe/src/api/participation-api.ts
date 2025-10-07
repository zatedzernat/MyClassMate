import { logger } from '@/lib/default-logger';
import {
    ParticipationResponse,
    ParticipationListResponse,
    ParticipationStatus,
    CreateParticipationRequest,
    CreateParticipationResponse
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

// Export types for convenience
export type { 
    ParticipationResponse, 
    ParticipationStatus, 
    CreateParticipationRequest, 
    CreateParticipationResponse 
} from './data/participation-response';
