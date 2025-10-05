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
import { validateFaceImage } from '@/api/face-api';
import { TodayCourseResponse } from '@/api/data/course-response';
import ErrorDialog from '@/components/error/error-dialog';
import { set } from 'react-hook-form';

interface StudentValidateFaceProps {
  todayCourse: TodayCourseResponse;
  onScanComplete?: (success: boolean) => void;
}

export function StudentValidateFace({
  todayCourse,
  onScanComplete
}: StudentValidateFaceProps): React.JSX.Element {
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [captureResult, setCaptureResult] = React.useState<'success' | 'failed' | null>(null);
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);
  const [savedImages, setSavedImages] = React.useState<string[]>([]);
  // Error Dialog state
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = React.useState<string>('');

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Show error dialog function
  const showErrorDialog = (message: string) => {
    setErrorDialogMessage(message);
    setErrorDialogOpen(true);
  };

  // Close error dialog function
  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
    setErrorDialogMessage('');
  };

  // Comprehensive camera cleanup function
  const stopCamera = React.useCallback(() => {
    console.log('🛑 Stopping camera and cleaning up...');

    try {
      // Stop all tracks from the current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}, state: ${track.readyState}`);
          track.stop();
        });
        streamRef.current = null;
      }

      // Clean up video element
      if (videoRef.current) {
        const video = videoRef.current;
        video.pause();
        video.srcObject = null;
        video.load(); // Reset the video element
      }

      // Reset states
      setCameraActive(false);
      setIsRequestingPermission(false);

      console.log('✅ Camera cleanup completed');
    } catch (error) {
      console.error('❌ Error during camera cleanup:', error);
    }
  }, []);

  // Handle page visibility change (when user switches tabs or minimizes browser)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && cameraActive) {
        console.log('📱 Page hidden - stopping camera to save resources');
        stopCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cameraActive, stopCamera]);

  // Handle beforeunload event (when user closes tab or navigates away)
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (cameraActive || streamRef.current) {
        console.log('🚪 Page unloading - stopping camera');
        stopCamera();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cameraActive, stopCamera]);

  // Main cleanup effect
  React.useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting - final cleanup');
      stopCamera();
    };
  }, [stopCamera]);


  if (!todayCourse) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            <Typography>ไม่พบข้อมูลรายวิชาสำหรับวันนี้</Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const startCamera = async () => {
    console.log('📹 Starting camera...');
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

      // Store stream reference for cleanup
      streamRef.current = stream;

      if (videoRef.current && stream.active && stream.getVideoTracks().length > 0) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.load();

        const loadPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.log('⏰ Video load timeout');
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
            console.log('▶️ Video can play');
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
                console.error('❌ Error playing video:', playError);
                setCameraError('ไม่สามารถเล่นวิดีโอได้');
                setIsRequestingPermission(false);
                cleanup();
                reject(playError);
              });
          };

          video.onerror = (error) => {
            console.error('❌ Video error:', error);
            setCameraError('เกิดข้อผิดพลาดในการโหลดวิดีโอ');
            setIsRequestingPermission(false);
            cleanup();
            reject(error);
          };
        });

        await loadPromise;
      }
    } catch (error: any) {
      console.error('❌ Error accessing camera:', error);
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

      console.log('📸 Captured image:', {
        size: blob.size,
        type: blob.type,
        base64Length: base64.length,
        courseId: todayCourse.courseId,
      });

      // Call validateFaceImage API with today's course context
      try {
        console.log('🔍 Validating face image for course:', todayCourse.courseCode);

        // Call the API with courseId, courseScheduleId, and blob
        const validationResponse = await validateFaceImage(
          todayCourse.courseId.toString(),
          todayCourse.courseScheduleId.toString(),
          blob
        );

        console.log('✅ Face validation result:', validationResponse);

        // Add to saved images array only after successful validation
        setSavedImages(prev => [...prev, base64]);
        setCaptureResult('success');

        // Call onScanComplete with success
        if (onScanComplete) {
          onScanComplete(true);
        }

      } catch (validationError: any) {
        console.error('❌ Face validation failed:', validationError);
        setCaptureResult('failed');
        setCameraError(validationError.message || 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า');
        setErrorDialogMessage(validationError.message || 'เกิดข้อผิดพลาดในการตรวจสอบใบหน้า');
        setErrorDialogOpen(true);

        if (onScanComplete) {
          onScanComplete(false);
        }
        return;
      }

    } catch (error) {
      console.error('❌ Error capturing image:', error);
      setCaptureResult('failed');
      setCameraError('เกิดข้อผิดพลาดในการบันทึกภาพ');

      if (onScanComplete) {
        onScanComplete(false);
      }
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

  // Format time display
  const formatTime = (time: string): string => {
    if (!time) return '';
    return time.substring(0, 5); // Display as HH:MM
  };

  return (
    <>
      <Card>
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
              maxWidth: { xs: 350, sm: 400, md: 600, lg: 700 }, // Expanded sizes
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
                    กดปุ่ม "เปิดกล้อง" เพื่อเปิดกล้อง
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
                    กำลังตรวจสอบใบหน้า...
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    กรุณารอสักครู่
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Preview saved images */}
          {savedImages.length > 0 && (
            <Box sx={{ mt: 4, width: '100%', maxWidth: 600 }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                ภาพที่ยืนยันแล้ว ({savedImages.length} รูป)
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
                      alt={`Validated ${index + 1}`}
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
              {isRequestingPermission ? 'กำลังเปิด...' : '🎥 เปิดกล้อง'}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={captureImage}
                size="large"
                disabled={isCapturing}
                sx={{
                  minWidth: 150,
                  py: 1.5,
                  fontSize: '1.1rem',
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }}
              >
                {isCapturing ? 'กำลังตรวจสอบ...' : '🔍 ตรวจสอบใบหน้า'}
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

      <ErrorDialog
        open={errorDialogOpen}
        message={errorDialogMessage}
        onClose={handleCloseErrorDialog}
      />
    </>
  );
}