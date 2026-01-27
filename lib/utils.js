/**
 * Utility functions for UI components
 */

/**
 * Combine classNames with support for conditional classes
 * @param {string|object} ...classes - CSS class names
 * @returns {string} Combined class name string
 */
export function cn(...classes) {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Helper function to create consistent component styles
 */
export function createComponentStyles(baseStyles, conditionalStyles = {}) {
  return (condition) => {
    if (!condition) return baseStyles;
    return `${baseStyles} ${conditionalStyles[condition] || ''}`;
  };
}
