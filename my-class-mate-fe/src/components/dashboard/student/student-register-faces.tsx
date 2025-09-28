'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { uploadFaceImages } from '@/api/face-api';
import { UserResponse } from '@/api/data/user-response';

interface StudentRegisterFacesProps {
  onUploadComplete?: (success: boolean) => void;
  userResponse?: UserResponse | null;
}

export function StudentRegisterFaces({ onUploadComplete, userResponse }: StudentRegisterFacesProps): React.JSX.Element {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = React.useState(false);
  const [capturedImages, setCapturedImages] = React.useState<Blob[]>([]);
  const [capturedImageUrls, setCapturedImageUrls] = React.useState<string[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [message, setMessage] = React.useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [cameraLoading, setCameraLoading] = React.useState(false);

  // Dialog states
  const [errorDialog, setErrorDialog] = React.useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: ''
  });
  const [imagePreviewDialog, setImagePreviewDialog] = React.useState<{ open: boolean; imageUrl: string; index: number }>({
    open: false,
    imageUrl: '',
    index: -1
  });

  const REQUIRED_IMAGES = 4;

  // Check if images are already uploaded
  const isAlreadyUploaded = userResponse?.isUploadedImage === true;
  const uploadedCount = userResponse?.imageCount || 0;

  // Show error dialog
  const showError = (title: string, message: string) => {
    setErrorDialog({ open: true, title, message });
  };

  // Initialize camera with ultra-high quality settings
  const startCamera = async () => {
    setCameraLoading(true);
    setMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('เบราว์เซอร์ไม่รองรับการเข้าถึงกล้อง');
      }

      // Try multiple resolution configurations for best quality
      const qualityConfigs = [
        // Ultra High Quality (4K)
        {
          video: {
            width: { ideal: 3840, min: 1920 },
            height: { ideal: 2160, min: 1080 },
            facingMode: 'user',
            frameRate: { ideal: 30, min: 15 },
            aspectRatio: { ideal: 16/9 },
            focusMode: 'continuous',
            exposureMode: 'continuous',
            whiteBalanceMode: 'continuous',
            brightness: { ideal: 0.5 },
            contrast: { ideal: 1.0 },
            saturation: { ideal: 1.0 },
            sharpness: { ideal: 1.0 }
          }
        },
        // Full HD Fallback
        {
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30, min: 15 },
            aspectRatio: { ideal: 16/9 }
          }
        },
        // HD Fallback
        {
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user'
          }
        }
      ];

      let stream = null;
      let usedConfig = null;

      // Try each configuration until one works
      for (const config of qualityConfigs) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(config);
          usedConfig = config;
          console.log('Using video configuration:', config.video);
          break;
        } catch (configError) {
          console.log('Configuration failed, trying next:', (configError as Error).name);
        }
      }

      if (!stream) {
        throw new Error('ไม่สามารถเปิดกล้องได้');
      }
      
      // Wait for component to render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video to be ready and get actual resolution
        await new Promise((resolve) => {
          if (videoRef.current) {
            const timeout = setTimeout(() => resolve(true), 8000);
            videoRef.current.onloadedmetadata = () => {
              console.log(`Video loaded: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
              clearTimeout(timeout);
              resolve(true);
            };
            videoRef.current.play().catch(() => {
              // Ignore play errors
            });
          }
        });

        setCameraActive(true);
        const resolution = usedConfig === qualityConfigs[0] ? '4K Ultra HD' : 
                          usedConfig === qualityConfigs[1] ? 'Full HD' : 'HD';
        setMessage({ type: 'success', text: `กล้องเปิดแล้ว (${resolution}) กรุณาจัดท่าใบหน้าให้ชัดเจน` });
      } else {
        throw new Error('ไม่สามารถเข้าถึงองค์ประกอบวิดีโอได้');
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      let errorTitle = 'เกิดข้อผิดพลาดในการเปิดกล้อง';
      let errorMessage = 'กรุณาลองใหม่อีกครั้ง';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorTitle = 'ไม่ได้รับอนุญาตเข้าถึงกล้อง';
        errorMessage = 'กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์ แล้วรีเฟรชหน้าเว็บ';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorTitle = 'ไม่พบกล้อง';
        errorMessage = 'ไม่พบกล้องในอุปกรณ์นี้ กรุณาตรวจสอบการเชื่อมต่อกล้อง';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorTitle = 'กล้องไม่สามารถใช้งานได้';
        errorMessage = 'กล้องกำลังถูกใช้งานโดยแอปพลิเคชันอื่น กรุณาปิดแอปพลิเคชันอื่นแล้วลองใหม่';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorTitle = 'การตั้งค่ากล้องไม่รองรับ';
        errorMessage = 'กล้องของคุณไม่รองรับการตั้งค่าที่ต้องการ กรุณาลองใช้อุปกรณ์อื่น';
      } else if (error.name === 'NotSupportedError' || error.name === 'TypeError') {
        errorTitle = 'เบราว์เซอร์ไม่รองรับ';
        errorMessage = 'เบราว์เซอร์ไม่รองรับการเข้าถึงกล้อง กรุณาใช้ Chrome, Firefox, Safari หรือ Edge';
      }

      showError(errorTitle, errorMessage);
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setMessage({ type: 'info', text: 'ปิดกล้องแล้ว' });
  };

  // Enhanced capture image with maximum quality
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) {
      showError('กล้องไม่พร้อม', 'กรุณาเปิดกล้องก่อนถ่ายภาพ');
      return;
    }

    if (videoRef.current.readyState !== 4) {
      showError('กล้องยังโหลดไม่เสร็จ', 'รอสักครู่ให้กล้องโหลดเสร็จ แล้วลองใหม่');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Get the highest quality 2D rendering context
      const context = canvas.getContext('2d', { 
        alpha: false, // No transparency for better compression
        desynchronized: false, // Synchronize for better quality
        willReadFrequently: false, // Optimize for single capture
        colorSpace: 'srgb' // Standard RGB color space
      });

      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        // Use video's native resolution for maximum quality
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        
        // Set canvas to native video resolution
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        
        console.log(`Capturing at native resolution: ${sourceWidth}x${sourceHeight}`);
        
        // Configure context for maximum quality
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Use high-quality pixel interpolation
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1.0;
        
        // Clear canvas with optimal background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Save context state for transformation
        context.save();
        
        // Apply horizontal flip for mirror effect
        context.scale(-1, 1);
        context.translate(-canvas.width, 0);
        
        // Draw video frame at native resolution with pixel-perfect accuracy
        context.drawImage(
          video, 
          0, 0, sourceWidth, sourceHeight, // Source dimensions (full video)
          0, 0, canvas.width, canvas.height // Destination dimensions (full canvas)
        );
        
        // Restore context state
        context.restore();

        // Apply optional sharpening filter
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const sharpened = applySharpeningFilter(imageData);
        context.putImageData(sharpened, 0, 0);

        // Convert to blob with maximum quality and optimal format
        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            
            setCapturedImages(prev => [...prev, blob]);
            setCapturedImageUrls(prev => [...prev, imageUrl]);
            
            const remaining = REQUIRED_IMAGES - capturedImages.length - 1;
            
            // Log comprehensive quality information
            console.log(`📸 Ultra High-Quality Capture:`);
            console.log(`   Resolution: ${canvas.width}x${canvas.height} pixels`);
            console.log(`   File Size: ${(blob.size / 1024).toFixed(1)}KB`);
            console.log(`   Quality: Maximum (100%)`);
            console.log(`   Format: JPEG with no compression loss`);
            console.log(`   Color Space: sRGB`);
            
            setMessage({ 
              type: 'success', 
              text: `📸 ถ่ายภาพคุณภาพสูงสุด ${capturedImages.length + 1} สำเร็จ ${remaining > 0 ? `(เหลืออีก ${remaining} ภาพ)` : '🎉 (ครบแล้ว!)'}` 
            });
          } else {
            showError('ไม่สามารถสร้างภาพได้', 'กรุณาลองถ่ายใหม่');
          }
        }, 'image/jpeg', 1.0); // Maximum JPEG quality (no compression loss)
        
      } else {
        showError('ไม่สามารถถ่ายภาพได้', 'วิดีโอยังไม่พร้อม กรุณาลองใหม่');
      }
    } catch (error) {
      console.error('Capture error:', error);
      showError('เกิดข้อผิดพลาดในการถ่ายภาพ', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Optional: Sharpening filter for even better quality
  const applySharpeningFilter = (imageData: ImageData): ImageData => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new ImageData(width, height);
    
    // Simple sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[(ky + 1) * 3 + (kx + 1)];
            
            r += data[pixel] * weight;
            g += data[pixel + 1] * weight;
            b += data[pixel + 2] * weight;
          }
        }
        
        const outputPixel = (y * width + x) * 4;
        output.data[outputPixel] = Math.min(255, Math.max(0, r));
        output.data[outputPixel + 1] = Math.min(255, Math.max(0, g));
        output.data[outputPixel + 2] = Math.min(255, Math.max(0, b));
        output.data[outputPixel + 3] = data[outputPixel + 3]; // Alpha
      }
    }
    
    return output;
  };

  // Show image preview
  const showImagePreview = (index: number) => {
    setImagePreviewDialog({
      open: true,
      imageUrl: capturedImageUrls[index],
      index: index
    });
  };

  // Delete captured image
  const deleteImage = (index: number) => {
    // Revoke the object URL to free memory
    if (capturedImageUrls[index]) {
      URL.revokeObjectURL(capturedImageUrls[index]);
    }
    
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
    setCapturedImageUrls(prev => prev.filter((_, i) => i !== index));
    setMessage({ type: 'info', text: 'ลบภาพแล้ว' });
    
    // Close preview dialog if it's showing the deleted image
    if (imagePreviewDialog.open && imagePreviewDialog.index === index) {
      setImagePreviewDialog({ open: false, imageUrl: '', index: -1 });
    }
  };

  // Clear all images
  const clearAllImages = () => {
    // Revoke all object URLs
    capturedImageUrls.forEach(url => URL.revokeObjectURL(url));
    
    setCapturedImages([]);
    setCapturedImageUrls([]);
    setMessage({ type: 'info', text: 'ลบภาพทั้งหมดแล้ว' });
    
    // Close preview dialog
    setImagePreviewDialog({ open: false, imageUrl: '', index: -1 });
  };

  // Upload images
  const handleUpload = async () => {
    if (capturedImages.length !== REQUIRED_IMAGES) {
      showError('ภาพไม่ครบ', `กรุณาถ่ายภาพครบ ${REQUIRED_IMAGES} ภาพ`);
      return;
    }

    const userId = localStorage.getItem('user-id');
    if (!userId) {
      showError('ไม่พบข้อมูลผู้ใช้', 'กรุณาลงชื่อเข้าใช้ใหม่');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage({ type: 'info', text: 'กำลังอัปโหลดภาพ...' });

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await uploadFaceImages(userId, capturedImages);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setMessage({ type: 'success', text: 'อัปโหลดภาพสำเร็จ!' });
        stopCamera();
        onUploadComplete?.(true);
      } else {
        throw new Error(response.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showError('เกิดข้อผิดพลาดในการอัปโหลด', error.message || 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่');
      onUploadComplete?.(false);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle re-registration
  const handleReRegister = () => {
    setMessage({ type: 'info', text: 'เริ่มลงทะเบียนใหม่' });
    // Reset all states for re-registration
    setCapturedImages([]);
    setCapturedImageUrls([]);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
      capturedImageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Render uploaded state UI
  if (!isAlreadyUploaded) {
    return (
      <Card>
        <CardHeader
          title="ลงทะเบียนภาพใบหน้า"
          subheader="คุณได้ลงทะเบียนภาพใบหน้าเรียบร้อยแล้ว"
        />
        <Divider />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h5" color="success.main" gutterBottom fontWeight={600}>
              ✅ ลงทะเบียนสำเร็จแล้ว
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              คุณได้อัปโหลดภาพใบหน้า {uploadedCount} ภาพเรียบร้อยแล้ว
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Render normal registration UI if not uploaded yet
  return (
    <>
      <Card>
        <CardHeader
          title="ลงทะเบียนภาพใบหน้า"
          subheader={`กรุณาถ่ายภาพใบหน้า ${REQUIRED_IMAGES} ภาพสำหรับการลงทะเบียน`}
        />
        <Divider />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Camera Section - Full Screen */}
            <Box sx={{ flex: 1, width: '100%' }}>
              <Box sx={{ position: 'relative' }}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 1,
                    backgroundColor: '#000',
                    borderRadius: 2,
                    minHeight: { xs: 400, md: 600 },
                    height: '80vh',
                    maxHeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    width: '100%'
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: cameraActive ? '100%' : '1px',
                      height: cameraActive ? '100%' : '1px',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      borderRadius: '8px',
                      transform: 'scaleX(-1)',
                      backgroundColor: '#000',
                      display: cameraActive ? 'block' : 'none',
                      objectFit: 'cover'
                    }}
                  />

                  {cameraLoading && (
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                      </Box>
                      <Typography variant="h6" color="white" gutterBottom>
                        🔄 กำลังเปิดกล้อง...
                      </Typography>
                      <Typography variant="body2" color="white">
                        กรุณารอสักครู่
                      </Typography>
                    </Box>
                  )}

                  {!cameraActive && !cameraLoading && (
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <Typography variant="h4" color="white" gutterBottom>
                        📷 กล้องยังไม่เปิด
                      </Typography>
                      <Typography variant="h6" color="white" sx={{ mb: 3 }}>
                        กดปุ่ม "เปิดกล้อง" เพื่อเริ่มถ่ายภาพ
                      </Typography>
                      <Typography variant="body1" color="rgba(255,255,255,0.7)">
                        หมายเหตุ: เบราว์เซอร์อาจขออนุญาตการเข้าถึงกล้อง
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Camera Controls */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {!cameraActive && !cameraLoading && (
                    <Button
                      variant="contained"
                      onClick={startCamera}
                      disabled={isUploading}
                      size="large"
                      sx={{
                        fontSize: '1.2rem',
                        px: 4,
                        py: 1.5,
                        minWidth: 200
                      }}
                    >
                      📷 เปิดกล้อง
                    </Button>
                  )}

                  {cameraActive && (
                    <>
                      <Button
                        variant="contained"
                        onClick={captureImage}
                        disabled={capturedImages.length >= REQUIRED_IMAGES || isUploading}
                        color="success"
                        size="large"
                        sx={{
                          fontSize: '1.2rem',
                          px: 4,
                          py: 1.5,
                          minWidth: 250
                        }}
                      >
                        📸 ถ่ายภาพ ({capturedImages.length}/{REQUIRED_IMAGES})
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={stopCamera}
                        disabled={isUploading}
                        color="error"
                        size="large"
                        sx={{
                          fontSize: '1.1rem',
                          px: 3,
                          py: 1.5
                        }}
                      >
                        ❌ ปิดกล้อง
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Captured Images Section */}
            <Box sx={{
              flex: 0,
              minWidth: { xs: '100%', md: 280 },
              maxWidth: { xs: '100%', md: 280 },
              order: { xs: 2, md: 1 }
            }}>
              <Typography variant="h6" gutterBottom>
                ภาพที่ถ่าย ({capturedImages.length}/{REQUIRED_IMAGES})
              </Typography>

              <Stack spacing={2} direction={{ xs: 'row', md: 'column' }} sx={{ overflowX: { xs: 'auto', md: 'visible' } }}>
                {capturedImages.map((blob, index) => (
                  <Paper key={index} elevation={2} sx={{ p: 1, minWidth: { xs: 200, md: 'auto' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Actual captured image thumbnail */}
                      <Box
                        component="img"
                        src={capturedImageUrls[index]}
                        alt={`Captured ${index + 1}`}
                        onClick={() => showImagePreview(index)}
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          objectFit: 'cover',
                          backgroundColor: 'grey.200',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                            transform: 'scale(1.05)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          ภาพที่ {index + 1}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(blob.size / 1024).toFixed(1)} KB
                        </Typography>
                        <Typography variant="caption" color="primary.main" sx={{ display: 'block', cursor: 'pointer' }}
                          onClick={() => showImagePreview(index)}
                        >
                          คลิกเพื่อดูภาพใหญ่
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => deleteImage(index)}
                        disabled={isUploading}
                        color="error"
                      >
                        🗑️
                      </IconButton>
                    </Box>
                  </Paper>
                ))}

                {capturedImages.length === 0 && (
                  <Box sx={{
                    p: 2,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    minWidth: { xs: 200, md: 'auto' }
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      ยังไม่มีภาพที่ถ่าย
                    </Typography>
                  </Box>
                )}

                {capturedImages.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={clearAllImages}
                    disabled={isUploading}
                    sx={{ mt: 1 }}
                  >
                    ลบทั้งหมด
                  </Button>
                )}
              </Stack>

              {/* Upload Progress */}
              {isUploading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    กำลังอัปโหลด... {uploadProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}
            </Box>
          </Box>

          {/* Status Messages */}
          {message && (
            <Box sx={{ mt: 3 }}>
              <Alert 
                severity={message.type} 
                onClose={() => setMessage(null)}
                sx={{ '& .MuiAlert-message': { width: '100%' } }}
              >
                {message.text}
              </Alert>
            </Box>
          )}
        </CardContent>

        <Divider />
        
        <CardActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          <Box>
            <Chip 
              label={`${capturedImages.length}/${REQUIRED_IMAGES} ภาพ`}
              color={capturedImages.length === REQUIRED_IMAGES ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <Button 
            variant="contained" 
            onClick={handleUpload}
            disabled={capturedImages.length !== REQUIRED_IMAGES || isUploading}
            color="primary"
            size="large"
          >
            {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพ'}
          </Button>
        </CardActions>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Card>

      {/* Error Dialog */}
      <Dialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, title: '', message: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>
          ⚠️ {errorDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {errorDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setErrorDialog({ open: false, title: '', message: '' })}
            variant="contained"
            color="error"
          >
            ตกลง
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreviewDialog.open}
        onClose={() => setImagePreviewDialog({ open: false, imageUrl: '', index: -1 })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          ภาพที่ {imagePreviewDialog.index + 1}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 2 }}>
          {imagePreviewDialog.imageUrl && (
            <Box
              component="img"
              src={imagePreviewDialog.imageUrl}
              alt={`Preview ${imagePreviewDialog.index + 1}`}
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: 2,
                boxShadow: 3
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => deleteImage(imagePreviewDialog.index)}
            color="error"
            disabled={isUploading}
          >
            🗑️ ลบภาพนี้
          </Button>
          <Button 
            onClick={() => setImagePreviewDialog({ open: false, imageUrl: '', index: -1 })}
            variant="contained"
          >
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}