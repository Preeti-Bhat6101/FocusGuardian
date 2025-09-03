// src/utils/formatters.js

export const PREDEFINED_COLORS = [
  '#5E72E4', // Primary Blue
  '#2DCE89', // Success Green
  '#11CDEF', // Info Teal
  '#FB6340', // Accent Orange
  '#F5365C', // Danger Red
  '#8898AA', // Muted Gray
  '#32325D', // Dark Blue/Gray
  '#FFD600'  // Vibrant Yellow
];

/**
 * Returns a color from the predefined palette based on the index.
 * This ensures the same items get the same color across chart renders.
 * @param {number} index The index of the data point.
 * @returns {string} A hex color code.
 */
export const getPaletteColor = (index) => {
    return PREDEFINED_COLORS[index % PREDEFINED_COLORS.length];
};


/**
 * Formats a duration between two date objects or strings.
 * @param {string|Date} start The start time.
 * @param {string|Date} end The end time.
 * @param {'min'|'sec'} units The desired output unit ('min' or 'sec').
 * @returns {string} The formatted duration string (e.g., "45 min").
 */
export const formatDuration = (start, end, units = 'min') => {
    if (!start || !end) return "N/A";
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "Invalid Date";

        const durationMs = endDate.getTime() - startDate.getTime();
        if (isNaN(durationMs) || durationMs < 0) return "N/A";

        if (units === 'min') {
            const minutes = Math.round(durationMs / 60000);
            return `${minutes} min`;
        } else {
            const seconds = Math.round(durationMs / 1000);
            return `${seconds} sec`;
        }
    } catch(e) {
        console.error("Error formatting duration:", start, end, e);
        return "Error";
    }
};

/**
 * Calculates and formats the focus percentage from focus and distraction time.
 * @param {number} focusTime Time in seconds.
 * @param {number} distractionTime Time in seconds.
 * @returns {string} The formatted percentage string (e.g., "75%").
 */
export const formatFocusPercent = (focusTime = 0, distractionTime = 0) => {
    const numFocusTime = Number(focusTime) || 0;
    const numDistractionTime = Number(distractionTime) || 0;
    const totalValidTime = numFocusTime + numDistractionTime;
    if (totalValidTime <= 0) return "0%";
    const percent = Math.round((numFocusTime / totalValidTime) * 100);
    return `${percent}%`;
};

/**
 * Formats a total number of seconds into a detailed string with hours and minutes.
 * @param {number} seconds The total seconds.
 * @returns {string} Formatted time string (e.g., "1h 30m").
 */
export const formatTimeDetailed = (seconds = 0) => {
    const validSeconds = Number(seconds) || 0;
    if (isNaN(validSeconds) || validSeconds < 0) return "0m";
    const totalMinutes = Math.round(validSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let result = "";
    if (hours > 0) {
        result += `${hours}h `;
    }
    result += `${minutes}m`;
    return result;
};

/**
 * Formats a total number of seconds into a string with only minutes.
 * @param {number} seconds The total seconds.
 * @returns {string} Formatted time string (e.g., "90m").
 */
export const formatMinutesOnly = (seconds = 0) => {
    const validSeconds = Number(seconds) || 0;
    if (isNaN(validSeconds) || validSeconds < 0) return "0m";
     const minutes = Math.round(validSeconds / 60);
     return `${minutes}m`;
};

/**
 * Formats a date string into a short, readable format.
 * @param {string} dateString The date string to format.
 * @returns {string} Formatted date string (e.g., "Wed, Aug 28").
 */
export const formatDateShort = (dateString) => {
    if (!dateString) return '';
    try {
        // Handle both 'YYYY-MM-DD' and full ISO strings by ensuring a timezone context
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00Z');
        if (isNaN(date.getTime())) return "Invalid Date";
        return date.toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Error";
    }
};