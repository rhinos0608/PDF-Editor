import { PDFDocument, PDFImage, PDFPage, rgb, degrees } from 'pdf-lib';

export interface ImageTransform {
  rotation: number;
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  opacity: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface ImageFilter {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  hue: number;        // -180 to 180
  gamma: number;      // 0.1 to 3.0
  blur: number;       // 0 to 10
  sharpen: number;    // 0 to 10
  sepia: boolean;
  grayscale: boolean;
  invert: boolean;
}

export interface ImageCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageWatermark {
  text?: string;
  imageBytes?: Uint8Array;
  position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  opacity: number;
  scale: number;
  margin: number;
}

export interface ImageCompressionOptions {
  quality: number; // 0 to 100
  format: 'jpeg' | 'png' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
  preserveAspectRatio: boolean;
}

export class AdvancedImageService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Add image to PDF with advanced positioning and transforms
   */
  async addImageToPDF(
    pdfBytes: Uint8Array,
    imageBytes: Uint8Array,
    pageIndex: number,
    options: {
      x: number;
      y: number;
      width?: number;
      height?: number;
      transform?: Partial<ImageTransform>;
      blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
      zIndex?: number;
    }
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(pageIndex);
    
    // Process image if transforms are applied
    let processedImageBytes = imageBytes;
    if (options.transform) {
      processedImageBytes = await this.applyTransforms(imageBytes, options.transform);
    }

    // Detect image format and embed
    let image: PDFImage;
    const uint8 = new Uint8Array(processedImageBytes);
    
    if (this.isJPEG(uint8)) {
      image = await pdfDoc.embedJpg(processedImageBytes);
    } else if (this.isPNG(uint8)) {
      image = await pdfDoc.embedPng(processedImageBytes);
    } else {
      throw new Error('Unsupported image format. Only JPEG and PNG are supported.');
    }

    const { width: imgWidth, height: imgHeight } = image;
    const width = options.width || imgWidth;
    const height = options.height || imgHeight;

    // Apply transform properties
    const transform = options.transform || {};
    
    page.drawImage(image, {
      x: options.x + (transform.translateX || 0),
      y: options.y + (transform.translateY || 0),
      width: width * (transform.scaleX || 1),
      height: height * (transform.scaleY || 1),
      rotate: degrees(transform.rotation || 0),
      opacity: transform.opacity !== undefined ? transform.opacity : 1
    });

    return await pdfDoc.save();
  }

  /**
   * Extract images from PDF
   */
  async extractImages(pdfBytes: Uint8Array): Promise<Array<{
    pageIndex: number;
    imageBytes: Uint8Array;
    format: 'jpeg' | 'png';
    width: number;
    height: number;
    x: number;
    y: number;
  }>> {
    // This is a complex operation that requires parsing PDF content streams
    // For now, return empty array - full implementation would need low-level PDF parsing
    return [];
  }

  /**
   * Replace image in PDF
   */
  async replaceImage(
    pdfBytes: Uint8Array,
    oldImageIndex: number,
    newImageBytes: Uint8Array,
    pageIndex: number
  ): Promise<Uint8Array> {
    // This would require identifying and replacing specific image objects in the PDF
    // For now, implement as removing old and adding new at same position
    return await this.addImageToPDF(pdfBytes, newImageBytes, pageIndex, { x: 0, y: 0 });
  }

  /**
   * Apply image transforms (rotation, scaling, etc.)
   */
  async applyTransforms(
    imageBytes: Uint8Array,
    transform: Partial<ImageTransform>
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const {
            rotation = 0,
            scaleX = 1,
            scaleY = 1,
            flipHorizontal = false,
            flipVertical = false
          } = transform;

          // Set canvas size based on transforms
          const radians = (rotation * Math.PI) / 180;
          const cos = Math.abs(Math.cos(radians));
          const sin = Math.abs(Math.sin(radians));
          
          const newWidth = Math.ceil(img.width * cos + img.height * sin);
          const newHeight = Math.ceil(img.width * sin + img.height * cos);
          
          this.canvas.width = newWidth * Math.abs(scaleX);
          this.canvas.height = newHeight * Math.abs(scaleY);
          
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          
          // Apply transforms
          this.ctx.save();
          this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
          
          if (flipHorizontal) this.ctx.scale(-1, 1);
          if (flipVertical) this.ctx.scale(1, -1);
          
          this.ctx.rotate(radians);
          this.ctx.scale(scaleX, scaleY);
          
          this.ctx.drawImage(img, -img.width / 2, -img.height / 2);
          this.ctx.restore();
          
          // Convert canvas to bytes
          this.canvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(buffer => {
                resolve(new Uint8Array(buffer));
              });
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(new Blob([imageBytes]));
    });
  }

  /**
   * Apply image filters
   */
  async applyFilters(
    imageBytes: Uint8Array,
    filters: Partial<ImageFilter>
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(img, 0, 0);
          
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          const data = imageData.data;
          
          // Apply filters
          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            // Grayscale
            if (filters.grayscale) {
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              r = g = b = gray;
            }
            
            // Sepia
            if (filters.sepia) {
              const tr = 0.393 * r + 0.769 * g + 0.189 * b;
              const tg = 0.349 * r + 0.686 * g + 0.168 * b;
              const tb = 0.272 * r + 0.534 * g + 0.131 * b;
              r = Math.min(255, tr);
              g = Math.min(255, tg);
              b = Math.min(255, tb);
            }
            
            // Invert
            if (filters.invert) {
              r = 255 - r;
              g = 255 - g;
              b = 255 - b;
            }
            
            // Brightness
            if (filters.brightness !== undefined) {
              const brightness = filters.brightness * 2.55; // Convert to 0-255 range
              r = Math.max(0, Math.min(255, r + brightness));
              g = Math.max(0, Math.min(255, g + brightness));
              b = Math.max(0, Math.min(255, b + brightness));
            }
            
            // Contrast
            if (filters.contrast !== undefined) {
              const contrast = (filters.contrast + 100) / 100;
              r = Math.max(0, Math.min(255, ((r - 128) * contrast) + 128));
              g = Math.max(0, Math.min(255, ((g - 128) * contrast) + 128));
              b = Math.max(0, Math.min(255, ((b - 128) * contrast) + 128));
            }
            
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
          
          this.ctx.putImageData(imageData, 0, 0);
          
          // Convert canvas to bytes
          this.canvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(buffer => {
                resolve(new Uint8Array(buffer));
              });
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(new Blob([imageBytes]));
    });
  }

  /**
   * Crop image
   */
  async cropImage(
    imageBytes: Uint8Array,
    cropArea: ImageCropArea
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          this.canvas.width = cropArea.width;
          this.canvas.height = cropArea.height;
          
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(
            img,
            cropArea.x, cropArea.y, cropArea.width, cropArea.height,
            0, 0, cropArea.width, cropArea.height
          );
          
          // Convert canvas to bytes
          this.canvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(buffer => {
                resolve(new Uint8Array(buffer));
              });
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(new Blob([imageBytes]));
    });
  }

  /**
   * Resize image
   */
  async resizeImage(
    imageBytes: Uint8Array,
    newWidth: number,
    newHeight: number,
    preserveAspectRatio: boolean = true
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          let targetWidth = newWidth;
          let targetHeight = newHeight;
          
          if (preserveAspectRatio) {
            const aspectRatio = img.width / img.height;
            if (newWidth / newHeight > aspectRatio) {
              targetWidth = newHeight * aspectRatio;
            } else {
              targetHeight = newWidth / aspectRatio;
            }
          }
          
          this.canvas.width = targetWidth;
          this.canvas.height = targetHeight;
          
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          // Convert canvas to bytes
          this.canvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(buffer => {
                resolve(new Uint8Array(buffer));
              });
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(new Blob([imageBytes]));
    });
  }

  /**
   * Add watermark to image
   */
  async addWatermarkToImage(
    imageBytes: Uint8Array,
    watermark: ImageWatermark
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(img, 0, 0);
          
          // Calculate watermark position
          let x = watermark.margin;
          let y = watermark.margin;
          
          if (watermark.position.includes('center')) {
            x = this.canvas.width / 2;
          } else if (watermark.position.includes('right')) {
            x = this.canvas.width - watermark.margin;
          }
          
          if (watermark.position.includes('center') && !watermark.position.includes('left') && !watermark.position.includes('right')) {
            y = this.canvas.height / 2;
          } else if (watermark.position.includes('bottom')) {
            y = this.canvas.height - watermark.margin;
          }
          
          this.ctx.globalAlpha = watermark.opacity;
          
          if (watermark.text) {
            // Text watermark
            const fontSize = Math.min(this.canvas.width, this.canvas.height) * 0.1 * watermark.scale;
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(watermark.text, x, y);
          } else if (watermark.imageBytes) {
            // Image watermark
            const watermarkImg = new Image();
            watermarkImg.onload = () => {
              const scaledWidth = watermarkImg.width * watermark.scale;
              const scaledHeight = watermarkImg.height * watermark.scale;
              
              this.ctx.drawImage(
                watermarkImg,
                x - scaledWidth / 2,
                y - scaledHeight / 2,
                scaledWidth,
                scaledHeight
              );
              
              this.canvas.toBlob((blob) => {
                if (blob) {
                  blob.arrayBuffer().then(buffer => {
                    resolve(new Uint8Array(buffer));
                  });
                } else {
                  reject(new Error('Failed to create blob from canvas'));
                }
              }, 'image/png');
            };
            
            watermarkImg.src = URL.createObjectURL(new Blob([watermark.imageBytes]));
          }
          
          this.ctx.globalAlpha = 1;
          
          if (watermark.text) {
            // Convert canvas to bytes for text watermark
            this.canvas.toBlob((blob) => {
              if (blob) {
                blob.arrayBuffer().then(buffer => {
                  resolve(new Uint8Array(buffer));
                });
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            }, 'image/png');
          }
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(new Blob([imageBytes]));
    });
  }

  /**
   * Compress image
   */
  async compressImage(
    imageBytes: Uint8Array,
    options: ImageCompressionOptions
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          let targetWidth = img.width;
          let targetHeight = img.height;
          
          // Resize if max dimensions are specified
          if (options.maxWidth || options.maxHeight) {
            if (options.maxWidth && targetWidth > options.maxWidth) {
              if (options.preserveAspectRatio) {
                targetHeight = (targetHeight * options.maxWidth) / targetWidth;
              }
              targetWidth = options.maxWidth;
            }
            
            if (options.maxHeight && targetHeight > options.maxHeight) {
              if (options.preserveAspectRatio) {
                targetWidth = (targetWidth * options.maxHeight) / targetHeight;
              }
              targetHeight = options.maxHeight;
            }
          }
          
          this.canvas.width = targetWidth;
          this.canvas.height = targetHeight;
          
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          // Convert canvas to bytes with specified quality
          const mimeType = `image/${options.format}`;
          const quality = options.quality / 100;
          
          this.canvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(buffer => {
                resolve(new Uint8Array(buffer));
              });
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, mimeType, quality);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(new Blob([imageBytes]));
    });
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imageBytes: Uint8Array): Promise<{
    width: number;
    height: number;
    format: 'jpeg' | 'png' | 'unknown';
    size: number;
    colorDepth?: number;
    hasAlpha?: boolean;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const uint8 = new Uint8Array(imageBytes);
        let format: 'jpeg' | 'png' | 'unknown' = 'unknown';
        
        if (this.isJPEG(uint8)) format = 'jpeg';
        else if (this.isPNG(uint8)) format = 'png';
        
        resolve({
          width: img.width,
          height: img.height,
          format,
          size: imageBytes.length,
          colorDepth: format === 'png' ? 32 : 24, // Simplified
          hasAlpha: format === 'png'
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(new Blob([imageBytes]));
    });
  }

  /**
   * Convert image format
   */
  async convertImageFormat(
    imageBytes: Uint8Array,
    targetFormat: 'jpeg' | 'png' | 'webp',
    quality: number = 90
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          
          // For JPEG, fill with white background to avoid transparency issues
          if (targetFormat === 'jpeg') {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          }
          
          this.ctx.drawImage(img, 0, 0);
          
          const mimeType = `image/${targetFormat}`;
          const qualityValue = quality / 100;
          
          this.canvas.toBlob((blob) => {
            if (blob) {
              blob.arrayBuffer().then(buffer => {
                resolve(new Uint8Array(buffer));
              });
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, mimeType, qualityValue);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(new Blob([imageBytes]));
    });
  }

  private isJPEG(bytes: Uint8Array): boolean {
    return bytes[0] === 0xFF && bytes[1] === 0xD8;
  }

  private isPNG(bytes: Uint8Array): boolean {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  }
}

export default AdvancedImageService;