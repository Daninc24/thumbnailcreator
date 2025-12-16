/**
 * Utility functions for generating unique IDs
 */

let counter = 0;

/**
 * Generates a unique ID using timestamp and counter to prevent duplicates
 * @param prefix Optional prefix for the ID
 * @returns Unique string ID
 */
export const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${++counter}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generates a unique ID for React components
 * @param prefix Optional prefix for the ID
 * @returns Unique string ID suitable for React keys
 */
export const generateReactKey = (prefix: string = 'key'): string => {
  return generateUniqueId(prefix);
};

/**
 * Generates a unique ID for layers
 * @returns Unique layer ID
 */
export const generateLayerId = (): string => {
  return generateUniqueId('layer');
};

/**
 * Generates a unique ID for projects
 * @returns Unique project ID
 */
export const generateProjectId = (): string => {
  return generateUniqueId('project');
};

/**
 * Generates a unique ID for templates
 * @returns Unique template ID
 */
export const generateTemplateId = (): string => {
  return generateUniqueId('template');
};

/**
 * Generates a unique ID for videos
 * @returns Unique video ID
 */
export const generateVideoId = (): string => {
  return generateUniqueId('video');
};