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
  return response.data?.data || response.data;
};

export const getDocumentApi = async (documentId: number): Promise<DocumentResponse> => {
  const response = await axios.get(`${API_BASE_URL}/${documentId}`);
  return response.data?.data || response.data;
};

export const deleteDocumentApi = async (documentId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/${documentId}`);
};

/**
 * SSO 토큰 기반 SmartManager REST API 연동 자재 마스터 검색
 */
export const searchSmartManagerBomsApi = async (keyword: string): Promise<DrawingBomDto[]> => {
  const ssoToken = 'MOCK_SSO_BEARER_TOKEN_2026';
  const response = await axios.get('/api/v1/external/smartmanager/boms', {
    params: { keyword },
    headers: { Authorization: `Bearer ${ssoToken}` }
  });
  return response.data?.data || response.data;
};
