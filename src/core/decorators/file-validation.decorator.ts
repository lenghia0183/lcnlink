import { SetMetadata } from '@nestjs/common';

export const FILE_VALIDATION_KEY = 'file_validation';

export const MIME_TYPES = {
  IMAGE: {
    JPEG: 'image/jpeg',
    JPG: 'image/jpg',
    PNG: 'image/png',
    GIF: 'image/gif',
    WEBP: 'image/webp',
    SVG: 'image/svg+xml',
  },
  DOCUMENT: {
    PDF: 'application/pdf',
    DOC: 'application/msword',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    XLS: 'application/vnd.ms-excel',
    XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    PPT: 'application/vnd.ms-powerpoint',
    PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    TXT: 'text/plain',
  },
  VIDEO: {
    MP4: 'video/mp4',
    MPEG: 'video/mpeg',
    MOV: 'video/quicktime',
    AVI: 'video/x-msvideo',
    WEBM: 'video/webm',
  },
  AUDIO: {
    MP3: 'audio/mpeg',
    WAV: 'audio/wav',
    OGG: 'audio/ogg',
    M4A: 'audio/mp4',
    WEBM_AUDIO: 'audio/webm',
  },
  SPREADSHEET: {
    XLS: 'application/vnd.ms-excel',
    XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    CSV: 'text/csv',
  },
  ARCHIVE: {
    ZIP: 'application/zip',
    RAR: 'application/x-rar-compressed',
    SEVEN_ZIP: 'application/x-7z-compressed',
    GZIP: 'application/gzip',
  },
} as const;

export const FILE_EXTENSIONS = {
  IMAGE: {
    JPG: '.jpg',
    JPEG: '.jpeg',
    PNG: '.png',
    GIF: '.gif',
    WEBP: '.webp',
    SVG: '.svg',
  },
  DOCUMENT: {
    PDF: '.pdf',
    DOC: '.doc',
    DOCX: '.docx',
    XLS: '.xls',
    XLSX: '.xlsx',
    PPT: '.ppt',
    PPTX: '.pptx',
    TXT: '.txt',
  },
  VIDEO: {
    MP4: '.mp4',
    MPEG: '.mpeg',
    MOV: '.mov',
    AVI: '.avi',
    WEBM: '.webm',
  },
  AUDIO: {
    MP3: '.mp3',
    WAV: '.wav',
    OGG: '.ogg',
    M4A: '.m4a',
    WEBM: '.webm',
  },
  SPREADSHEET: {
    XLS: '.xls',
    XLSX: '.xlsx',
    CSV: '.csv',
  },
  ARCHIVE: {
    ZIP: '.zip',
    RAR: '.rar',
    SEVEN_ZIP: '.7z',
    GZIP: '.gz',
  },
} as const;

export const getImageMimeTypes = () => Object.values(MIME_TYPES.IMAGE);
export const getDocumentMimeTypes = () => Object.values(MIME_TYPES.DOCUMENT);
export const getVideoMimeTypes = () => Object.values(MIME_TYPES.VIDEO);
export const getAudioMimeTypes = () => Object.values(MIME_TYPES.AUDIO);
export const getSpreadsheetMimeTypes = () =>
  Object.values(MIME_TYPES.SPREADSHEET);
export const getArchiveMimeTypes = () => Object.values(MIME_TYPES.ARCHIVE);

export const getImageExtensions = () => Object.values(FILE_EXTENSIONS.IMAGE);
export const getDocumentExtensions = () =>
  Object.values(FILE_EXTENSIONS.DOCUMENT);
export const getVideoExtensions = () => Object.values(FILE_EXTENSIONS.VIDEO);
export const getAudioExtensions = () => Object.values(FILE_EXTENSIONS.AUDIO);
export const getSpreadsheetExtensions = () =>
  Object.values(FILE_EXTENSIONS.SPREADSHEET);
export const getArchiveExtensions = () =>
  Object.values(FILE_EXTENSIONS.ARCHIVE);

export interface FileValidationConfig {
  maxSize: number; // bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxFiles?: number;
  required?: boolean;
}

export function ValidateFile(config: FileValidationConfig) {
  return SetMetadata(FILE_VALIDATION_KEY, config);
}

export function ValidateImageFile(
  customConfig?: Partial<FileValidationConfig>,
) {
  const config: FileValidationConfig = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: getImageMimeTypes(),
    allowedExtensions: getImageExtensions(),
    required: true,
    ...customConfig,
  };
  return ValidateFile(config);
}

export function ValidateDocumentFile(
  customConfig?: Partial<FileValidationConfig>,
) {
  const config: FileValidationConfig = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: getDocumentMimeTypes(),
    allowedExtensions: getDocumentExtensions(),
    required: true,
    ...customConfig,
  };
  return ValidateFile(config);
}

export function ValidateVideoFile(
  customConfig?: Partial<FileValidationConfig>,
) {
  const config: FileValidationConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: getVideoMimeTypes(),
    allowedExtensions: getVideoExtensions(),
    required: true,
    ...customConfig,
  };
  return ValidateFile(config);
}

export function ValidateAudioFile(
  customConfig?: Partial<FileValidationConfig>,
) {
  const config: FileValidationConfig = {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: getAudioMimeTypes(),
    allowedExtensions: getAudioExtensions(),
    required: true,
    ...customConfig,
  };
  return ValidateFile(config);
}

export function ValidateAvatarFile() {
  const config: FileValidationConfig = {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: getImageMimeTypes(),
    allowedExtensions: getImageExtensions(),
    required: true,
  };
  return ValidateFile(config);
}

export function ValidateSpreadsheetFile() {
  const config: FileValidationConfig = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: getSpreadsheetMimeTypes(),
    allowedExtensions: getSpreadsheetExtensions(),
    required: true,
  };
  return ValidateFile(config);
}

export function ValidateArchiveFile() {
  const config: FileValidationConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: getArchiveMimeTypes(),
    allowedExtensions: getArchiveExtensions(),
    required: true,
  };
  return ValidateFile(config);
}

export function ValidateMultipleFiles(
  customConfig?: Partial<FileValidationConfig>,
) {
  const config: FileValidationConfig = {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [...getImageMimeTypes(), ...getDocumentMimeTypes()],
    allowedExtensions: [...getImageExtensions(), ...getDocumentExtensions()],
    maxFiles: 10,
    required: false,
    ...customConfig,
  };
  return ValidateFile(config);
}
