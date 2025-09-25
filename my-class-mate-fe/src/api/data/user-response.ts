import { Role } from "@/util/role-enum";

export interface UserRequest {
    userId?: string;
    username: string;
    password?: string;
    nameTh: string;
    surnameTh: string;
    nameEn: string;
    surnameEn: string;
    email: string;
    role: Role;
    isDeleted?: boolean;
    studentNo?: string;
}

export interface UserResponse {
    userId: string;
    username: string;
    password?: string;
    nameTh: string;
    surnameTh: string;
    nameEn: string;
    surnameEn: string;
    email: string;
    role: Role;
    isDeleted?: boolean;
    studentProfile?: StudentProfile;
    isUploadedImage?: boolean;
    imageCount: number;
}


export interface StudentProfile {
    studentNo?: string;
    address?: string | null;
    phoneNumber?: string | null;
    remark?: string | null;
}

export interface ImportResponse {
    updatedRow: number;
    createdRow: number;
}