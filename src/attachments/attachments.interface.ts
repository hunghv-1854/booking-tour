import { AttachableType } from './attachable-type.enum';

export interface AttachmentData {
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
