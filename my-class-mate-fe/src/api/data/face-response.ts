// Simple types for face validation
export interface FaceValidationResponse {
    success: boolean;
    message: string;
    faceDetected: boolean;
    confidence: number;
  }
  
  export interface UploadFaceImagesResponse {
    success: boolean;
    message: string;
    uploadedCount: number;
    totalRequired: number;
    imageIds: string[];
  }