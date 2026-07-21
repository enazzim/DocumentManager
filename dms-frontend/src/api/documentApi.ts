import axios from 'axios';

export interface DrawingBomDto {
  externalItemId?: string;
  itemCode: string;
  itemName: string;
  itemSource?: string;
  quantity: number;
  unit: string;
}

export interface DocumentCreateRequest {
  docNumber: string;
  title: string;
  docType: 'INTERNAL' | 'EXTERNAL';
  authorId?: number;
  partNumber?: string;
  partName: string;
  revision: string;
  cadType: string;
  scale: string;
  bomList: DrawingBomDto[];
}

export interface DocumentResponse {
  documentId: number;
  docNumber: string;
  title: string;
  docType: 'INTERNAL' | 'EXTERNAL';
  approvalStatus: string;
  lifecycleStatus: string;
  fileStatus: string;
  version: number;
  partNumber?: string;
  partName: string;
  revision: string;
  cadType: string;
  scale: string;
  presignedUploadUrl?: string;
  bomList: DrawingBomDto[];
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = '/api/v1/documents';

export const createDocumentApi = async (request: DocumentCreateRequest): Promise<DocumentResponse> => {
  const response = await axios.post(API_BASE_URL, request);
  // 백엔드 ApiResponse wrapper 구조(response.data.data) 및 직접 응답 모두 지원 안전하게 파싱
  return response.data?.data || response.data;
};

export const getDocumentApi = async (documentId: number): Promise<DocumentResponse> => {
  const response = await axios.get(`${API_BASE_URL}/${documentId}`);
  return response.data?.data || response.data;
};
