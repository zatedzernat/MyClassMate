import { FaceValidationResponse, UploadFaceImagesResponse } from "./data/face-response";

// Validate single face image
export async function validateFaceImage(
  userId: string, 
  imageFile: File | Blob
): Promise<FaceValidationResponse> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('image', imageFile, `face-validation-${Date.now()}.jpg`);

  try {
    const response = await fetch('/api/face/validate', {
      method: 'POST',
      body: formData,
      headers: {
        'x-role': localStorage.getItem("user-role") || ""
        // Don't set Content-Type for FormData, let browser handle it
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FaceValidationResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('Face validation error:', error);
    throw new Error(
      error.message || 
      'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า'
    );
  }
}

// Upload multiple face images (4 images required)
export async function uploadFaceImages(
  userId: string, 
  imageFiles: (File | Blob)[]
): Promise<UploadFaceImagesResponse> {
  if (imageFiles.length !== 4) {
    throw new Error('ต้องอัปโหลดภาพใบหน้า 4 รูปเท่านั้น');
  }

  const formData = new FormData();
  formData.append('userId', userId);
  
  // Add all 4 images to FormData
  imageFiles.forEach((imageFile, index) => {
    formData.append('images', imageFile, `face-upload-${index + 1}-${Date.now()}.jpg`);
  });

  try {
    const response = await fetch('/api/face/upload-multiple', {
      method: 'POST',
      body: formData,
      headers: {
        'x-role': localStorage.getItem("user-role") || ""
        // Don't set Content-Type for FormData, let browser handle it
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: UploadFaceImagesResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('Face upload error:', error);
    throw new Error(
      error.message || 
      'เกิดข้อผิดพลาดในการอัปโหลดภาพใบหน้า'
    );
  }
}

// Upload single face image (for individual uploads)
export async function uploadSingleFaceImage(
  userId: string, 
  imageFile: File | Blob,
  imageIndex: number = 0
): Promise<{ success: boolean; message: string; imageId: string; currentCount: number }> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('image', imageFile, `face-upload-${imageIndex + 1}-${Date.now()}.jpg`);
  formData.append('imageIndex', imageIndex.toString());

  try {
    const response = await fetch('/api/face/upload-single', {
      method: 'POST',
      body: formData,
      headers: {
        'x-role': localStorage.getItem("user-role") || ""
        // Don't set Content-Type for FormData, let browser handle it
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: { success: boolean; message: string; imageId: string; currentCount: number } = await response.json();
    return data;
  } catch (error: any) {
    console.error('Face upload error:', error);
    throw new Error(
      error.message || 
      'เกิดข้อผิดพลาดในการอัปโหลดภาพใบหน้า'
    );
  }
}

// Keep the original function name for backward compatibility but rename it
export const uploadFaceImage = uploadFaceImages;