export interface ParticipationResponse {
    participationId: number;
    courseScheduleId: number;
    round: number;
    topic: string;
    status: ParticipationStatus;
    createdBy: number;
    createdAt: string;
    closedAt: string | null;
}

export type ParticipationStatus = 'OPEN' | 'CLOSED' | 'CLOSE';

export interface ParticipationListResponse {
    success: boolean;
    data: ParticipationResponse[];
    total: number;
    message: string;
}

export interface CreateParticipationRequest {
    courseScheduleId: number;
    lecturerId: number;
    topic: string;
}

export interface CreateParticipationResponse {
    success: boolean;
    data: ParticipationResponse;
    message: string;
}

export interface ParticipationRequestRequest {
    participationId: number;
    studentId: number;
    courseScheduleId: number;
}

export interface ParticipationRequestResponse {
    participationRequestId: number;
    participationId: number;
    studentId: number;
    studentNo: string;
    studentNameTh: string;
    studentNameEn: string;
    createdAt: string;
    isScored: boolean;
    score: number;
}

export interface CreateParticipationRequestResponse {
    success: boolean;
    data: ParticipationRequestResponse;
    message: string;
}