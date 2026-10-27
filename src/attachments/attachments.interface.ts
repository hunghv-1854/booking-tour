import { AttachableType } from './attachable-type.enum';

export interface AttachmentData {
  id: string;
  attachableType: AttachableType;
  attachableId: number;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface AvatarReplacement {
  url: string;
  replacedUrls: string[];
}

export interface UploadedFileCandidate {
  id: string;
  url: string;
}
