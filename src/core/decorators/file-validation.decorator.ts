import { FILE_VALIDATION_KEY } from '@constant/app.enum';
import { FILE_EXTENSIONS, MIME_TYPES } from '@constant/file.constant';
import { SetMetadata } from '@nestjs/common';

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

export function ValidateAllFiles(customConfig?: Partial<FileValidationConfig>) {
  const config: FileValidationConfig = {
    maxSize: 5 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      ...getImageMimeTypes(),
      ...getDocumentMimeTypes(),
      ...getArchiveMimeTypes(),
      ...getSpreadsheetMimeTypes(),
      ...getVideoMimeTypes(),
      ...getAudioMimeTypes(),
    ],
    allowedExtensions: [
      ...getImageExtensions(),
      ...getDocumentExtensions(),
      ...getArchiveExtensions(),
      ...getSpreadsheetExtensions(),
      ...getVideoExtensions(),
      ...getAudioExtensions(),
    ],
    maxFiles: 5,
    required: true,
    ...customConfig,
  };
  return ValidateFile(config);
}
