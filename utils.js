/**
 * Utility function to create page URLs
 * @param {string} pageName - The name of the page
 * @param {object} params - Optional URL parameters (id, etc)
 * @returns {string} The constructed URL
 */
export function createPageUrl(pageName, params = {}) {
  const basePages = {
    Dashboard: '/',
    CreateFlipbook: '/create',
    FlipbookViewer: '/viewer',
    Studio: '/studio',
  };

  const basePath = basePages[pageName] || '/';
  
  // If params.id exists, append it to the path for routes with :id
  if (params.id) {
    return `${basePath}/${params.id}`;
  }
  
  // For other params, construct query string
  const queryString = Object.entries(params)
    .filter(([key]) => key !== 'id')
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Utility function to parse URL parameters
 * @returns {object} Parsed URL parameters
 */
export function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  params.forEach((value, key) => {
    result[key] = decodeURIComponent(value);
  });
  
  return result;
}

/**
 * Utility function to format dates
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Utility function to format timestamps
 * @param {Date} date - The date to format
 * @returns {string} Formatted timestamp
 */
export function formatTime(date) {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Utility function to debounce functions
 * @param {function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Utility function to throttle functions
 * @param {function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
