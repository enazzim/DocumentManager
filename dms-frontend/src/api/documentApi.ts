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
  isDeleted?: boolean;
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

/**
 * 1. 휴지통 이동 (소프트 삭제)
 */
export const deleteDocumentApi = async (documentId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/${documentId}`);
};

/**
 * 2. 도면 복구 (정상 대장으로 이동)
 */
export const restoreDocumentApi = async (documentId: number): Promise<void> => {
  await axios.post(`${API_BASE_URL}/${documentId}/restore`);
};

/**
 * 3. 영구 물리 삭제
 */
export const permanentDeleteDocumentApi = async (documentId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/${documentId}/permanent`);
};

/**
 * 4. 도면 차수 개정 (Revision Up) 및 파일 교체 API
 */
export const revisionUpDocumentApi = async (
  documentId: number,
  newRevision: string,
  changeReason: string,
  file?: File | null
): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append('newRevision', newRevision);
  formData.append('changeReason', changeReason);
  if (file) {
    formData.append('file', file);
  }

  const response = await axios.post(`${API_BASE_URL}/${documentId}/revision`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data?.data || response.data;
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
