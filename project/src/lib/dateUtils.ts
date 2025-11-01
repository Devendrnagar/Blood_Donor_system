/**
 * Date utility functions for handling date formatting across the application
 */

/**
 * Converts an ISO date string to yyyy-MM-dd format for HTML date inputs
 * @param dateString - ISO date string, null, or undefined
 * @returns Formatted date string or empty string if invalid
 */
export const formatDateForInput = (dateString: string | null | undefined): string => {
  // Always return a string, never undefined or null
  if (!dateString || typeof dateString !== 'string') return '';
  
  // Handle both ISO strings and already formatted dates
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString; // Already in correct format
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Converts a date input value (yyyy-MM-dd) to ISO string
 * @param dateInputValue - Date input value in yyyy-MM-dd format
 * @returns ISO date string or null if invalid
 */
export const formatInputDateToISO = (dateInputValue: string): string | null => {
  if (!dateInputValue) return null;
  try {
    const date = new Date(dateInputValue + 'T00:00:00.000Z');
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
};

/**
 * Formats a date for display purposes
 * @param dateString - ISO date string or date input value
 * @returns Formatted date string for display
 */
export const formatDateForDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  } catch {
    return '';
  }
};

/**
 * Gets today's date in yyyy-MM-dd format for date inputs
 * @returns Today's date in yyyy-MM-dd format
 */
export const getTodayForInput = (): string => {
  return new Date().toISOString().split('T')[0];
};
