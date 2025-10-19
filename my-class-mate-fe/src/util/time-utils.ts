// Time utility functions for course scheduling

/**
 * Check if a button should be shown/enabled based on course time conditions
 * @param startTime - Course start time in HH:MM:SS format
 * @param endTime - Course end time in HH:MM:SS format
 * @returns Object with show and disabled flags
 */
export const getButtonState = (startTime: string, endTime: string) => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
  
  // Parse start and end times (assuming format HH:MM:SS)
  const startParts = startTime.split(':');
  const endParts = endTime.split(':');
  const startMinutes = Number.parseInt(startParts[0], 10) * 60 + Number.parseInt(startParts[1], 10);
  const endMinutes = Number.parseInt(endParts[0], 10) * 60 + Number.parseInt(endParts[1], 10);
  
  // One hour before start time in minutes
  const oneHourBeforeStart = startMinutes - 60;
  
  if (currentTime < oneHourBeforeStart) {
    // Before 1 hour of start time - hide button
    return { show: false, disabled: false };
  } else if (currentTime >= oneHourBeforeStart && currentTime <= endMinutes) {
    // Between 1 hour before start and end time - show enabled button
    return { show: true, disabled: false };
  } else {
    // After end time - hide button
    return { show: false, disabled: false };
  }
};

/**
 * Format time string to HH:MM display format
 * @param time - Time string in HH:MM:SS format
 * @returns Time string in HH:MM format
 */
export const formatTime = (time: string): string => {
  if (!time) return '';
  return time.slice(0, 5); // Display as HH:MM
};

/**
 * Get current date formatted for Thai locale
 * @returns Formatted date string
 */
export const getCurrentDate = (): string => {
  const today = new Date();
  return today.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};