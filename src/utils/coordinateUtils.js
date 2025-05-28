/**
 * Utility functions for coordinate conversions in sequences
 */

/**
 * Converts sequence coordinate format to degrees for SkyChart
 * @param {Object} coordinates - Coordinate object from sequence item
 * @returns {Object|null} - {RA: degrees, Dec: degrees} or null if invalid
 */
export function convertSequenceCoordinatesToDegrees(coordinates) {
  if (!coordinates || !coordinates.Coordinates) {
    return null;
  }

  const coords = coordinates.Coordinates;
  let raDegrees = null;
  let decDegrees = null;

  // Try to parse RA from different formats
  if (coords.RAString) {
    // Parse RA string format (e.g., "12h 30m 45s")
    raDegrees = parseRAString(coords.RAString);
  } else if (coords.RAHours !== undefined) {
    // Convert hours/minutes/seconds to degrees
    const hours = coords.RAHours || 0;
    const minutes = coords.RAMinutes || 0;
    const seconds = coords.RASeconds || 0;
    raDegrees = (hours + minutes / 60 + seconds / 3600) * 15; // Convert hours to degrees
  }

  // Try to parse Dec from different formats
  if (coords.DecString) {
    // Parse Dec string format (e.g., "+30° 15' 20\"")
    decDegrees = parseDecString(coords.DecString);
  } else if (coords.DecDegrees !== undefined) {
    // Convert degrees/minutes/seconds to decimal degrees
    const degrees = Math.abs(coords.DecDegrees || 0);
    const minutes = coords.DecMinutes || 0;
    const seconds = coords.DecSeconds || 0;
    decDegrees = degrees + minutes / 60 + seconds / 3600;

    // Apply sign
    if (coords.NegativeDec || coords.DecDegrees < 0) {
      decDegrees = -decDegrees;
    }
  }

  // Return null if we couldn't parse both coordinates
  if (raDegrees === null || decDegrees === null) {
    return null;
  }
  return {
    RA: raDegrees,
    Dec: decDegrees,
  };
}

/**
 * Parse RA string format (e.g., "12h 30m 45s" or "12:30:45")
 * @param {string} raString - RA string
 * @returns {number|null} - RA in degrees or null if invalid
 */
function parseRAString(raString) {
  if (!raString) return null;

  // Try different patterns
  const patterns = [
    /^(\d+)h\s*(\d+)m\s*(\d+(?:\.\d+)?)s?$/i, // "12h 30m 45s"
    /^(\d+):(\d+):(\d+(?:\.\d+)?)$/, // "12:30:45"
    /^(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)$/, // "12 30 45"
  ];

  for (const pattern of patterns) {
    const match = raString.match(pattern);
    if (match) {
      const hours = parseFloat(match[1]);
      const minutes = parseFloat(match[2]);
      const seconds = parseFloat(match[3]);
      if (
        hours >= 0 &&
        hours < 24 &&
        minutes >= 0 &&
        minutes < 60 &&
        seconds >= 0 &&
        seconds < 60
      ) {
        return (hours + minutes / 60 + seconds / 3600) * 15; // Convert to degrees
      }
    }
  }

  return null;
}

/**
 * Parse Dec string format (e.g., "+30° 15' 20\"" or "+30:15:20")
 * @param {string} decString - Dec string
 * @returns {number|null} - Dec in degrees or null if invalid
 */
function parseDecString(decString) {
  if (!decString) return null;

  // Try different patterns
  const patterns = [
    /^([+-]?)(\d+)[°d]\s*(\d+)[''m]\s*(\d+(?:\.\d+)?)[\"s]?\s*([NS]?)$/i, // "+30° 15' 20\"" or variations
    /^([+-]?)(\d+):(\d+):(\d+(?:\.\d+)?)\s*([NS]?)$/i, // "+30:15:20"
    /^([+-]?)(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)\s*([NS]?)$/i, // "+30 15 20"
  ];

  for (const pattern of patterns) {
    const match = decString.match(pattern);
    if (match) {
      const sign = match[1];
      const degrees = parseFloat(match[2]);
      const minutes = parseFloat(match[3]);
      const seconds = parseFloat(match[4]);
      const hemisphere = match[5];
      if (
        degrees >= 0 &&
        degrees <= 90 &&
        minutes >= 0 &&
        minutes < 60 &&
        seconds >= 0 &&
        seconds < 60
      ) {
        let decDegrees = degrees + minutes / 60 + seconds / 3600;

        // Apply sign based on sign character or hemisphere
        if (sign === '-' || hemisphere?.toUpperCase() === 'S') {
          decDegrees = -decDegrees;
        }
        return decDegrees;
      }
    }
  }

  return null;
}

/**
 * Check if a sequence item has valid coordinates
 * @param {Object} item - Sequence item
 * @returns {boolean} - True if item has valid coordinates
 */
export function hasValidCoordinates(item) {
  return convertSequenceCoordinatesToDegrees(item) !== null;
}
