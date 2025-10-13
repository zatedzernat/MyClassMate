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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import { validateFaceImage } from '@/api/face-api';
import { TodayCourseResponse } from '@/api/data/course-response';
import ErrorDialog from '@/components/error/error-dialog';
import { CheckInStatus, getCheckInStatusLabel } from '@/util/check-in-status';
import { UserCircleCheckIcon } from '@phosphor-icons/react';

interface StudentValidateFaceProps {
  todayCourse: TodayCourseResponse;
  onScanComplete?: (success: boolean) => void;
}

interface CheckedInStudent {
  id: string;
  name: string;
  studentNo: string;
  status: CheckInStatus;
  checkInTime: string;
  image?: string;
}

export function StudentValidateFace({
  todayCourse,
  onScanComplete
}: StudentValidateFaceProps): React.JSX.Element {
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = React.useState(false);
  const [checkedInStudents, setCheckedInStudents] = React.useState<CheckedInStudent[]>([]);
  const [lastCheckInResult, setLastCheckInResult] = React.useState<'success' | 'failed' | null>(null);

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

  const getStatusColor = (status: CheckInStatus): string => {
    switch (status) {
      case CheckInStatus.PRESENT:
        return 'green';
      case CheckInStatus.LATE:
        return 'orange';
      case CheckInStatus.ABSENT:
        return 'red';
      default:
        return 'gray';
    }
  };

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

  // Auto-clear last check-in result after 3 seconds
  React.useEffect(() => {
    if (lastCheckInResult) {
      const timer = setTimeout(() => {
        setLastCheckInResult(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [lastCheckInResult]);

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
            const errorMsg = 'การโหลดกล้องใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
            setCameraError(errorMsg);
            showErrorDialog(errorMsg);
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
                    const errorMsg = 'กล้องไม่ทำงานปกติ กรุณาตรวจสอบการเชื่อมต่อกล้องและลองใหม่';
                    setCameraError(errorMsg);
                    showErrorDialog(errorMsg);
                    setIsRequestingPermission(false);
                    cleanup();
                    reject(new Error('Video not working'));
                  }
                }, 1000);
              })
              .catch((playError) => {
                console.error('❌ Error playing video:', playError);
                const errorMsg = 'ไม่สามารถเล่นวิดีโอได้ กรุณาตรวจสอบการตั้งค่ากล้องและลองใหม่';
                setCameraError(errorMsg);
                showErrorDialog(errorMsg);
                setIsRequestingPermission(false);
                cleanup();
                reject(playError);
              });
          };

          video.onerror = (error) => {
            console.error('❌ Video error:', error);
            const errorMsg = 'เกิดข้อผิดพลาดในการโหลดวิดีโอ กรุณาลองใหม่อีกครั้ง';
            setCameraError(errorMsg);
            showErrorDialog(errorMsg);
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
        errorMessage = 'การเข้าถึงกล้องถูกปฏิเสธ กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์และรีเฟรชหน้า';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'ไม่พบกล้อง กรุณาตรวจสอบว่ามีกล้องเชื่อมต่ออยู่และไม่มีแอปพลิเคชันอื่นใช้งานอยู่';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'กล้องถูกใช้งานโดยแอปพลิเคชันอื่น กรุณาปิดแอปพลิเคชันอื่นและลองใหม่';
      }

      setCameraError(errorMessage);
      showErrorDialog(errorMessage);
      setIsRequestingPermission(false);
      setCameraActive(false);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) {
      const errorMsg = 'กรุณาเปิดกล้องก่อนถ่ายภาพ';
      setCameraError(errorMsg);
      showErrorDialog(errorMsg);
      return;
    }

    setIsCapturing(true);
    setLastCheckInResult(null);

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

        // Check if validation was successful and face was detected

        setLastCheckInResult('success');

        // Extract student information from validation response
        const newStudent: CheckedInStudent = {
          id: validationResponse.studentId.toString(),
          name: validationResponse.studentNameTh,
          studentNo: validationResponse.studentNo,
          status: validationResponse.status,
          checkInTime: validationResponse.createdAt 
            ? new Date(validationResponse.createdAt).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })
            : new Date().toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }),
          image: base64
        };



        // Add to checked-in students list (avoid duplicates based on studentCode or studentId)
        setCheckedInStudents(prev => {
          const existingIndex = prev.findIndex(student =>
            student.studentNo === newStudent.studentNo ||
            student.id === newStudent.id
          );

          if (existingIndex >= 0) {
            // Update existing student's check-in time
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              checkInTime: newStudent.checkInTime,
              image: base64 // Update with latest captured image
            };
            return updated;
          } else {
            // Add new student to the beginning of the list
            return [newStudent, ...prev];
          }
        });

        // Call onScanComplete with success
        if (onScanComplete) {
          onScanComplete(true);
        }

        // Clear any previous camera errors
        setCameraError(null);

      } catch (validationError: any) {
        console.error('❌ Face validation failed:', validationError);
        setLastCheckInResult('failed');
        let errorMsg = validationError.message || 'การตรวจสอบใบหน้าล้มเหลว กรุณาลองใหม่อีกครั้ง';

        setCameraError(errorMsg);
        showErrorDialog(errorMsg);

        if (onScanComplete) {
          onScanComplete(false);
        }
      }

    } catch (error) {
      console.error('❌ Error capturing image:', error);
      setLastCheckInResult('failed');
      const errorMsg = 'เกิดข้อผิดพลาดในการบันทึกภาพ กรุณาลองใหม่อีกครั้ง';
      setCameraError(errorMsg);
      showErrorDialog(errorMsg);

      if (onScanComplete) {
        onScanComplete(false);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleStopCamera = () => {
    stopCamera();
    setCameraError(null);
  };

  const handleRetryCamera = () => {
    setCameraError(null);
    startCamera();
  };

  const clearCheckedInList = () => {
    setCheckedInStudents([]);
  };

  // Format time display
  const formatTime = (time: string): string => {
    if (!time) return '';
    return time.substring(0, 5); // Display as HH:MM
  };

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Box>
              <Typography variant="h6" component="div">
                เช็คชื่อเข้าเรียน - Face Recognition
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                รายวิชา: {todayCourse.courseCode} - {todayCourse.courseName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                เวลา: {formatTime(todayCourse.startTime)} - {formatTime(todayCourse.endTime)} | ห้อง: {todayCourse.room}
              </Typography>
            </Box>
          }
        />
        <Divider />

        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {/* Flexbox Layout - No Grid */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            alignItems: 'flex-start'
          }}>
            {/* Camera Section - Left Side */}
            <Box sx={{
              flex: { xs: '1 1 100%', md: '1 1 65%' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>

              {/* Camera Container */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: { xs: 350, sm: 450, md: 550 },
                  aspectRatio: '4/3',
                  border: '3px solid',
                  borderColor: cameraError ? 'error.main' :
                    lastCheckInResult === 'success' ? 'success.main' :
                      lastCheckInResult === 'failed' ? 'error.main' :
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
                        กำลังตรวจสอบใบหน้า...
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                        กรุณารอสักครู่
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Camera Controls */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
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
                  <>
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

                    <Button
                      variant="outlined"
                      onClick={handleStopCamera}
                      size="large"
                      color="error"
                      sx={{ minWidth: 120, py: 1.5 }}
                    >
                      ❌ ปิดกล้อง
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            {/* Checked-in Students List - Right Side */}
            <Box sx={{
              flex: { xs: '1 1 100%', md: '1 1 35%' },
              minWidth: { xs: '100%', md: 300 }
            }}>
              <Paper sx={{ p: 2, height: 'fit-content' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    นักเรียนที่เช็คชื่อแล้ว
                  </Typography>
                  <Chip
                    label={`${checkedInStudents.length} คน`}
                    color="primary"
                    size="small"
                  />
                </Box>

                {/* Student List */}
                <Box sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  maxHeight: 400,
                  overflow: 'auto',
                  backgroundColor: 'background.paper'
                }}>
                  {checkedInStudents.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary" variant="body2">
                        ยังไม่มีนักเรียนเช็คชื่อ
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {checkedInStudents.map((student, index) => (
                        <React.Fragment key={student.id}>
                          <ListItem sx={{ py: 2 }}>
                            <ListItemAvatar>
                              <Avatar
                                src={student.image}
                                sx={{ width: 40, height: 40 }}
                              >
                                {student.name}
                              </Avatar>
                            </ListItemAvatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {student.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                รหัส: {student.studentNo}
                              </Typography>
                              <Typography variant="caption" display="block">
                                เช็คชื่อ: {student.checkInTime}
                              </Typography>
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mt: 0.5
                              }}>
                                <UserCircleCheckIcon
                                  size={20}
                                  color={getStatusColor(student.status)}
                                  style={{ flexShrink: 0 }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600, 
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  สถานะ: {getCheckInStatusLabel(student.status)}
                                </Typography>
                              </Box>
                            </Box>
                          </ListItem>
                          {index < checkedInStudents.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <ErrorDialog
        open={errorDialogOpen}
        message={errorDialogMessage}
        onClose={handleCloseErrorDialog}
      />
    </>
  );
}