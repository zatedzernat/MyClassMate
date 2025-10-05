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