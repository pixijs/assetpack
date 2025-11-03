import type { ResizeOptions } from 'sharp';

/**
 * Options for sharp image processing.
 */
export interface SharpProcessingOptions {
    /**
     * Resize options for when sharp is used to process images.
     * Note: width and height are not allowed here, they are defined by the pipe.
     */
    resize?: Omit<ResizeOptions, 'width' | 'height'>;
}
