'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { UserResponse } from '@/api/data/user-response';
import { validateFaceImage } from '@/api/face-api'; // Add your API import

interface UserValidateFaceProps {
  user: UserResponse | null;
  onScanComplete?: (success: boolean) => void;
}

export function UserValidateFace({
  user,
  onScanComplete
}: UserValidateFaceProps): React.JSX.Element {

  const [isCapturing, setIsCapturing] = React.useState(false);
  const [captureResult, setCaptureResult] = React.useState<'success' | 'failed' | null>(null);
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);
  const [savedImages, setSavedImages] = React.useState<string[]>([]);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  if (!user) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading user information...</Typography>
        </CardContent>
      </Card>
    );
  }

  const startCamera = async () => {
    console.log('Starting camera...');
    setIsRequestingPermission(true);
    setCameraError(null);
    setCameraActive(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        }
      });

      if (videoRef.current && stream.active && stream.getVideoTracks().length > 0) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.load();

        const loadPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log('Video load timeout');
            setCameraError('การโหลดกล้องใช้เวลานานเกินไป');
            setIsRequestingPermission(false);
            reject(new Error('Load timeout'));
          }, 10000);

          const cleanup = () => {
            clearTimeout(timeout);
            video.onloadedmetadata = null;
            video.oncanplay = null;
            video.onerror = null;
          };

          video.oncanplay = () => {
            console.log('Video can play');
            video.play()
              .then(() => {
                setTimeout(() => {
                  if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
                    console.log('✅ Camera is working!');
                    setCameraActive(true);
                    setCameraError(null);
                    setIsRequestingPermission(false);
                    cleanup();
                    resolve();
                  } else {
                    console.log('❌ Video not working properly');
                    setCameraError('กล้องไม่ทำงานปกติ กรุณาลองใหม่');
                    setIsRequestingPermission(false);
                    cleanup();
                    reject(new Error('Video not working'));
                  }
                }, 1000);
              })
              .catch((playError) => {
                console.error('Error playing video:', playError);
                setCameraError('ไม่สามารถเล่นวิดีโอได้');
                setIsRequestingPermission(false);
                cleanup();
                reject(playError);
              });
          };

          video.onerror = (error) => {
            console.error('Video error:', error);
            setCameraError('เกิดข้อผิดพลาดในการโหลดวิดีโอ');
            setIsRequestingPermission(false);
            cleanup();
            reject(error);
          };
        });

        await loadPromise;
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'ไม่สามารถเข้าถึงกล้องได้';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'การเข้าถึงกล้องถูกปฏิเสธ กรุณาอนุญาตการใช้กล้องและรีเฟรชหน้า';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'ไม่พบกล้อง กรุณาตรวจสอบว่ามีกล้องเชื่อมต่ออยู่';
      }

      setCameraError(errorMessage);
      setIsRequestingPermission(false);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) {
      setCameraError('กรุณาเปิดกล้องก่อนถ่ายภาพ');
      return;
    }
  
    setIsCapturing(true);
    setCaptureResult(null);
  
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
  
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }
  
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
  
      // Draw the current video frame to canvas (mirrored)
      ctx.save();
      ctx.scale(-1, 1); // Mirror horizontally
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
  
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.9);
      });
  
      // Convert blob to base64 for preview
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
  
      console.log('Captured image:', {
        size: blob.size,
        type: blob.type,
        base64Length: base64.length
      });
  
      // **Call validateFaceImage API correctly**
      try {
        console.log('Validating face image...');
        
        // Call the API with userId string and blob directly
        const validationResponse = await validateFaceImage(user.userId.toString(), blob);
        
        console.log('✅ Face validation result:', validationResponse);
        
        // Check if validation was successful and face was detected
        if (validationResponse.success && validationResponse.faceDetected) {
          // Add to saved images array only after successful validation
          setSavedImages(prev => [...prev, base64]);
          setCaptureResult('success');
          
          if (onScanComplete) {
            onScanComplete(true);
          }
        } else {
          // Face not detected or validation failed
          setCaptureResult('failed');
          setCameraError(validationResponse.message || 'ไม่พบใบหน้าในภาพ กรุณาลองใหม่');
          return;
        }
        
      } catch (validationError: any) {
        console.error('❌ Face validation failed:', validationError);
        setCaptureResult('failed');
        setCameraError(validationError.message || 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า');
        return;
      }
  
    } catch (error) {
      console.error('Error capturing image:', error);
      setCaptureResult('failed');
      setCameraError('เกิดข้อผิดพลาดในการบันทึกภาพ');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleStopCamera = () => {
    stopCamera();
    setCaptureResult(null);
    setCameraError(null);
  };

  const handleRetryCamera = () => {
    setCameraError(null);
    startCamera();
  };

  const clearSavedImages = () => {
    setSavedImages([]);
    setCaptureResult(null);
  };

  React.useEffect(() => {
    return () => {
      stopCamera(); // Cleanup on unmount
    };
  }, []);

  return (
    <Card>
      <CardHeader
        title={`ภายถ่ายใบหน้า - ${user.nameTh} ${user.surnameTh}`}
      />
      <Divider />

      <CardContent sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: { xs: 2, sm: 3, md: 4 }
      }}>
        {/* Camera Container */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: { xs: 250, sm: 350, md: 500 },
            aspectRatio: '4/3',
            border: '3px solid',
            borderColor: cameraError ? 'error.main' :
              captureResult === 'success' ? 'success.main' :
                captureResult === 'failed' ? 'error.main' :
                  isCapturing ? 'primary.main' : '#e0e0e0',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
          }}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: cameraActive ? 'block' : 'none',
              transform: 'scaleX(-1)', // Mirror the video
            }}
          />

          {/* Hidden canvas for capturing */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

          {/* Camera not active overlay */}
          {!cameraActive && (
            <Box
              sx={{
                textAlign: 'center',
                color: 'white',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isRequestingPermission ? (
                <>
                  <CircularProgress color="primary" size={50} sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    กำลังเปิดกล้อง...
                  </Typography>
                </>
              ) : cameraError ? (
                <Typography variant="body1" color="error.main" textAlign="center">
                  ❌ ไม่สามารถเข้าถึงกล้องได้
                </Typography>
              ) : (
                <Typography variant="h6" color="text.secondary" textAlign="center">
                  กดปุ่ม "เริ่มกล้อง" เพื่อเปิดกล้อง
                </Typography>
              )}
            </Box>
          )}

          {/* Capturing overlay */}
          {isCapturing && cameraActive && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                zIndex: 10,
              }}
            >
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <CircularProgress color="primary" size={60} sx={{ mb: 2 }} />
                <Typography variant="h6">
                  กำลังบันทึกภาพ...
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  กรุณารอสักครู่
                </Typography>
              </Box>
            </Box>
          )}

          {/* Result overlay */}
          {captureResult && !isCapturing && cameraActive && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                textAlign: 'center',
                backgroundColor: captureResult === 'success' ? 'rgba(76, 175, 80, 0.95)' : 'rgba(244, 67, 54, 0.95)',
                color: 'white',
                p: 2,
                borderRadius: 2,
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <Typography variant="h6">
                {captureResult === 'success' ? '✓ บันทึกสำเร็จ!' : '✗ บันทึกไม่สำเร็จ!'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                {captureResult === 'success' ? 'บันทึกภาพได้เรียบร้อย' : 'กรุณาลองใหม่อีกครั้ง'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Status Messages */}
        <Box sx={{ mt: 4, width: '100%', maxWidth: 600, textAlign: 'center' }}>
          {captureResult === 'success' && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body1">
                <strong>บันทึกภาพสำเร็จ!</strong> ระบบได้บันทึกภาพของคุณเรียบร้อยแล้ว
              </Typography>
            </Alert>
          )}

          {captureResult === 'failed' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body1">
                <strong>บันทึกภาพไม่สำเร็จ!</strong> กรุณาลองใหม่อีกครั้ง
              </Typography>
            </Alert>
          )}

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              textAlign: 'center',
              px: 2,
              lineHeight: 1.6
            }}
          >
            {cameraError
              ? 'กรุณาแก้ไขปัญหาการเข้าถึงกล้องก่อนใช้งาน'
              : isRequestingPermission
                ? 'กำลังเปิดกล้อง กรุณารอสักครู่...'
                : isCapturing
                  ? 'กำลังบันทึกภาพ กรุณาอย่าขยับ...'
                  : cameraActive
                    ? '📸 กดปุ่ม "ถ่ายภาพ" เพื่อบันทึกภาพใบหน้า'
                    : '📹 เปิดกล้องเพื่อเริ่มการถ่ายภาพ'
            }
          </Typography>
        </Box>

        {/* Preview saved images */}
        {savedImages.length > 0 && (
          <Box sx={{ mt: 4, width: '100%', maxWidth: 600 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              ภาพที่บันทึกแล้ว ({savedImages.length} รูป)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              {savedImages.map((image, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: 'success.main',
                  }}
                >
                  <img
                    src={image}
                    alt={`Captured ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>

      <Divider />
      <CardActions sx={{
        justifyContent: 'center',
        p: 3,
        backgroundColor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        {cameraError ? (
          <Button
            variant="contained"
            onClick={handleRetryCamera}
            size="large"
            color="error"
            sx={{ minWidth: 120, py: 1.5 }}
          >
            ลองใหม่
          </Button>
        ) : !cameraActive ? (
          <Button
            variant="contained"
            onClick={startCamera}
            size="large"
            disabled={isRequestingPermission}
            sx={{
              minWidth: 150,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            {isRequestingPermission ? 'กำลังเปิด...' : '🎥 เริ่มกล้อง'}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={captureImage}
              size="large"
              disabled={isCapturing}
              sx={{
                minWidth: 120,
                py: 1.5,
                fontSize: '1.1rem',
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
            >
              {isCapturing ? 'กำลังถ่าย...' : '📸 ถ่ายภาพ'}
            </Button>
            
            {savedImages.length > 0 && (
              <Button
                variant="outlined"
                onClick={clearSavedImages}
                size="large"
                color="warning"
                sx={{ minWidth: 120, py: 1.5 }}
              >
                🗑️ ลบภาพทั้งหมด
              </Button>
            )}
            
            <Button
              variant="outlined"
              onClick={handleStopCamera}
              size="large"
              color="error"
              sx={{ minWidth: 120, py: 1.5 }}
            >
              ❌ ปิดกล้อง
            </Button>
          </Box>
        )}
      </CardActions>
    </Card>
  );
}