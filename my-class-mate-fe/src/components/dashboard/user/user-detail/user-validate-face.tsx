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
import { getRoleLabel } from '@/util/role-enum';

// Face detection types
interface FaceDetection {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

interface UserValidateFaceProps {
  user: UserResponse | null;
  onScanComplete?: (success: boolean) => void;
}

export function UserValidateFace({
  user,
  onScanComplete
}: UserValidateFaceProps): React.JSX.Element {

  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResult, setScanResult] = React.useState<'success' | 'failed' | null>(null);
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);
  const [faceDetected, setFaceDetected] = React.useState(false);
  const [faceDetections, setFaceDetections] = React.useState<FaceDetection[]>([]);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationFrameRef = React.useRef<number | undefined>(undefined);

  if (!user) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading user information...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!user.isUploadedImage) {
    return (
      <Card>
        <CardHeader
          subheader="จำเป็นต้องอัปโหลดภาพถ่ายใบหน้าก่อนใช้งาน"
          title="การสแกนใบหน้า"
        />
        <Divider />
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h5" sx={{ mb: 2, color: 'warning.main' }}>
            ⚠️ ยังไม่ได้อัปโหลดภาพถ่ายใบหน้า
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
            {getRoleLabel(user.role)}: {user.nameTh} {user.surnameTh}
          </Typography>

          <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
            อัปโหลดไปแล้ว {user.imageCount || 0} รูป จาก 4 รูป
          </Typography>

          <Typography variant="body2" color="text.secondary">
            กรุณาอัปโหลดภาพถ่ายใบหน้าให้ครบ 4 รูป ก่อนใช้งานระบบสแกน
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Detect faces in video frame
  const detectFaces = React.useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) {
      if (cameraActive) {
        animationFrameRef.current = requestAnimationFrame(detectFaces);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) {
      animationFrameRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      // Mock face detection for demonstration
      const mockFaceDetection: FaceDetection = {
        box: {
          x: canvas.width * 0.25,
          y: canvas.height * 0.25,
          width: canvas.width * 0.5,
          height: canvas.height * 0.5,
        },
        confidence: 0.85
      };

      // Check if face is detected (mock logic)
      const faceDetectedNow = Math.random() > 0.3; // 70% chance of detecting face
      setFaceDetected(faceDetectedNow);

      if (faceDetectedNow) {
        setFaceDetections([mockFaceDetection]);

        // Draw face detection box
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          mockFaceDetection.box.x,
          mockFaceDetection.box.y,
          mockFaceDetection.box.width,
          mockFaceDetection.box.height
        );

        // Draw confidence text
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Arial';
        ctx.fillText(
          `Face: ${(mockFaceDetection.confidence * 100).toFixed(1)}%`,
          mockFaceDetection.box.x,
          mockFaceDetection.box.y - 10
        );
      } else {
        setFaceDetections([]);
      }

    } catch (error) {
      console.error('Face detection error:', error);
    }

    // Continue detection loop
    if (cameraActive) {
      animationFrameRef.current = requestAnimationFrame(detectFaces);
    }
  }, [cameraActive]);

  const startCamera = async () => {
    console.log('Starting camera...');
    setIsRequestingPermission(true);
    setCameraError(null);
    setCameraActive(false); // Explicitly set to false first

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current && stream.active && stream.getVideoTracks().length > 0) {
        const video = videoRef.current;
        video.srcObject = stream;

        // Force load
        video.load();

        // Wait for video to be ready
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
            video.onplaying = null;
            video.onerror = null;
          };

          video.onloadedmetadata = () => {
            console.log('Video metadata loaded:', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              duration: video.duration,
              readyState: video.readyState
            });
          };

          video.oncanplay = () => {
            console.log('Video can play, ready state:', video.readyState);

            video.play()
              .then(() => {
                console.log('Video playing successfully');

                // Double check video is actually working
                setTimeout(() => {
                  console.log('Final video check:', {
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight,
                    paused: video.paused,
                    ended: video.ended,
                    readyState: video.readyState,
                    currentTime: video.currentTime
                  });

                  if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
                    console.log('✅ Camera is working! Setting cameraActive to true');
                    setCameraActive(true);
                    setCameraError(null);
                    setIsRequestingPermission(false);

                    // Start face detection
                    setTimeout(() => {
                      console.log('Starting face detection...');
                      detectFaces();
                    }, 1000);

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
      } else {
        console.log('No video element or inactive stream');
        setCameraError('ไม่สามารถเริ่มกล้องได้');
        setIsRequestingPermission(false);
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);

      let errorMessage = 'ไม่สามารถเข้าถึงกล้องได้';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'การเข้าถึงกล้องถูกปฏิเสธ กรุณาอนุญาตการใช้กล้องและรีเฟรชหน้า';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'ไม่พบกล้อง กรุณาตรวจสอบว่ามีกล้องเชื่อมต่ออยู่';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'กล้องถูกใช้งานโดยแอปพลิเคชันอื่น กรุณาปิดแอปอื่นแล้วลองใหม่';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'ไม่สามารถใช้การตั้งค่ากล้องได้ กรุณาลองใหม่';
      }

      console.log('Setting camera error:', errorMessage);
      setCameraError(errorMessage);
      setIsRequestingPermission(false);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined as number | undefined;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setFaceDetected(false);
    setFaceDetections([]);
  };

  const handleStartScan = async () => {
    if (!cameraActive) {
      setCameraError('กรุณาเปิดกล้องก่อนเริ่มสแกน');
      return;
    }

    if (!faceDetected) {
      setCameraError('ไม่พบใบหน้าในกล้อง กรุณาวางใบหน้าให้อยู่ในกรอบ');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    // Simulate face recognition process with actual detection
    setTimeout(() => {
      const success = faceDetected && Math.random() > 0.2; // 80% success rate if face detected
      setScanResult(success ? 'success' : 'failed');
      setIsScanning(false);

      if (onScanComplete) {
        onScanComplete(success);
      }
    }, 3000);
  };

  const handleStopScan = () => {
    setIsScanning(false);
    setScanResult(null);
  };

  const handleReset = () => {
    setScanResult(null);
    setIsScanning(false);
    setCameraError(null);
  };

  const handleStopCamera = () => {
    stopCamera();
    setScanResult(null);
    setIsScanning(false);
    setCameraError(null);
  };

  const handleRetryCamera = () => {
    setCameraError(null);
    startCamera();
  };

  React.useEffect(() => {
    return () => {
      stopCamera(); // Cleanup on unmount
    };
  }, []);

  return (
    <Card>
      <CardHeader
        subheader="สแกนใบหน้าเพื่อยืนยันตัวตน"
        title={`การสแกนใบหน้า - ${user.nameTh} ${user.surnameTh}`}
      />
      <Divider />
      <CardContent>
        {/* Camera Error Alert */}
        {cameraError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>เกิดข้อผิดพลาด:</strong> {cameraError}
            </Typography>
          </Alert>
        )}

        {/* Face Detection Status */}
        {cameraActive && (
          <Alert severity={faceDetected ? "success" : "warning"} sx={{ mb: 3 }}>
            <Typography variant="body2">
              {faceDetected ? (
                <>
                  <strong>✓ ตรวจพบใบหน้า:</strong> พร้อมสำหรับการสแกน ({faceDetections.length} ใบหน้า)
                </>
              ) : (
                <>
                  <strong>⚠️ ไม่พบใบหน้า:</strong> กรุณาวางใบหน้าให้อยู่ในกรอบสีเขียว
                </>
              )}
            </Typography>
          </Alert>
        )}
<Box
  sx={{
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    aspectRatio: '4/3',
    margin: '0 auto',
    border: '3px solid',
    borderColor: cameraError ? 'error.main' :
      faceDetected ? 'success.main' :
        scanResult === 'success' ? 'success.main' :
          scanResult === 'failed' ? 'error.main' :
            isScanning ? 'primary.main' : '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  {/* Always render video element, but hide it when not active */}
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
    }}
  />
  <canvas
    ref={canvasRef}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      pointerEvents: 'none',
      display: cameraActive ? 'block' : 'none',
    }}
  />

  {/* Show overlay content when camera is not active */}
  {!cameraActive && (
    <Box
      sx={{
        textAlign: 'center',
        color: 'white',
        p: 3,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
      }}
    >
      {isRequestingPermission ? (
        <Box>
          <CircularProgress color="primary" size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            กำลังเปิดกล้อง...
          </Typography>
        </Box>
      ) : cameraError ? (
        <Typography variant="body2" color="error.main">
          ❌ ไม่สามารถเข้าถึงกล้องได้
        </Typography>
      ) : (
        <Typography variant="body1" color="text.secondary">
          กดปุ่ม "เริ่มกล้อง" เพื่อเปิดกล้อง
        </Typography>
      )}
    </Box>
  )}

  {/* Rest of your overlays remain the same */}
  {/* Scanning Overlay */}
  {isScanning && cameraActive && !cameraError && (
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
      }}
    >
      <Box sx={{ textAlign: 'center', color: 'white' }}>
        <CircularProgress color="primary" size={60} sx={{ mb: 2 }} />
        <Typography variant="body1">
          กำลังสแกนใบหน้า...
        </Typography>
      </Box>
    </Box>
  )}

  {/* Result Overlay */}
  {scanResult && !isScanning && cameraActive && (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        textAlign: 'center',
        backgroundColor: scanResult === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)',
        color: 'white',
        p: 1,
        borderRadius: 1,
        zIndex: 10,
      }}
    >
      <Typography variant="body1">
        {scanResult === 'success' ? '✓ สแกนสำเร็จ' : '✗ สแกนไม่สำเร็จ'}
      </Typography>
    </Box>
  )}
</Box>

        {/* Status Messages */}
        <Box sx={{ mt: 3 }}>
          {scanResult === 'success' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>สแกนใบหน้าสำเร็จ!</strong> ระบบจดจำใบหน้าของคุณได้เรียบร้อย
            </Alert>
          )}

          {scanResult === 'failed' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>สแกนใบหน้าไม่สำเร็จ!</strong> กรุณาลองใหม่อีกครั้ง
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {cameraError
              ? 'กรุณาแก้ไขปัญหาการเข้าถึงกล้องก่อนใช้งาน'
              : isRequestingPermission
                ? 'กำลังเปิดกล้อง...'
                : isScanning
                  ? 'กรุณามองที่กล้องและรอสักครู่...'
                  : cameraActive
                    ? faceDetected
                      ? 'พบใบหน้าแล้ว - กดปุ่ม "เริ่มสแกน" เพื่อสแกนใบหน้า'
                      : 'วางใบหน้าให้อยู่ในกรอบเพื่อให้ระบบตรวจจับได้'
                    : 'เปิดกล้องเพื่อเริ่มการตรวจจับใบหน้า'
            }
          </Typography>
        </Box>
      </CardContent>

      <Divider />
      <CardActions sx={{ justifyContent: 'center', p: 2 }}>
        {cameraError ? (
          <Button
            variant="contained"
            onClick={handleRetryCamera}
            size="large"
            color="error"
          >
            ลองใหม่
          </Button>
        ) : !cameraActive ? (
          <Button
            variant="contained"
            onClick={startCamera}
            size="large"
            disabled={isRequestingPermission}
          >
            {isRequestingPermission ? 'กำลังเปิด...' : 'เริ่มกล้อง'}
          </Button>
        ) : !isScanning ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleStartScan}
              size="large"
              disabled={!faceDetected}
            >
              เริ่มสแกน
            </Button>
            {scanResult && (
              <Button
                variant="outlined"
                onClick={handleReset}
                size="large"
              >
                สแกนใหม่
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handleStopCamera}
              size="large"
              color="error"
            >
              ปิดกล้อง
            </Button>
          </Box>
        ) : (
          <Button
            variant="outlined"
            onClick={handleStopScan}
            size="large"
            color="error"
          >
            หยุดสแกน
          </Button>
        )}
      </CardActions>
    </Card>
  );
}