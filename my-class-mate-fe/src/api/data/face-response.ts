// Simple types for face validation
export interface FaceValidationResponse {
    success: boolean;
    message: string;
    faceDetected: boolean;
    confidence: number;
  }
  
  export interface UploadFaceImagesResponse {
    userId: string;
    imageCount: number;
  }