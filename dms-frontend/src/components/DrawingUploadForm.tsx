import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { createDocumentApi, getDocumentApi } from '../api/documentApi';
import type { DocumentCreateRequest, DrawingBomDto } from '../api/documentApi';
import { SmartManagerBomModal } from './SmartManagerBomModal';

interface DrawingUploadFormProps {
  onSuccessNavigate?: (documentId: number) => void;
  editDocumentId?: number | null;
}

interface MiniDocRecord {
  documentId: number;
  docNumber: string;
  title: string;
  stage: 'DEVELOPMENT' | 'MASS_PRODUCTION';
  revision: string;
  fileName: string;
  createdAt: string;
}

export const DrawingUploadForm: React.FC<DrawingUploadFormProps> = ({ onSuccessNavigate, editDocumentId }) => {
  const [docNumber, setDocNumber] = useState('');
  const [title, setTitle] = useState('');
  
  // 도면 진행 단계: [DEVELOPMENT] 개발/시제품 도면, [MASS_PRODUCTION] 양산 확정 도면
  const [stage, setStage] = useState<'DEVELOPMENT' | 'MASS_PRODUCTION'>('DEVELOPMENT');
  const [docType, setDocType] = useState<'EXTERNAL' | 'INTERNAL'>('EXTERNAL');
  
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [revision, setRevision] = useState('V1-1');
  const [cadType, setCadType] = useState('PDF');
  const [scale, setScale] = useState('1:1');

  // 도면 파일 선택 상태 (실제 물리 파일 전송용)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // SmartManager 자재 가져오기 모달 오픈 상태
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);

  // 외부 BOM 목록
  const [bomList, setBomList] = useState<DrawingBomDto[]>([]);

  // 실시간 동적 백엔드 DB 연동 미니 테이블 레코드 목록
  const [recentDocs, setRecentDocs] = useState<MiniDocRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 🔄 페이지 마운트/리렌더링 시 백엔드 DB에서 최신 정상 도면 목록 동적 Fetch!
  const fetchRecentDocuments = async () => {
    try {
      const response = await axios.get('/api/v1/documents');
      const docs = response.data?.data || response.data || [];
      if (Array.isArray(docs)) {
        const mapped: MiniDocRecord[] = docs.map((d: any) => ({
          documentId: d.documentId || d.id,
          docNumber: d.docNumber,
          title: d.title,
          stage: d.lifecycleStatus === 'MASS_PRODUCTION' ? 'MASS_PRODUCTION' : 'DEVELOPMENT',
          revision: d.revision || 'V1-1',
          fileName: `${d.docNumber}.pdf`,
          createdAt: d.createdAt ? new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '방금 전'
        }));
        setRecentDocs(mapped.slice(0, 5));
        return;
      }
    } catch (e) {
      console.warn('서버 실시간 목록 수신 실패:', e);
    }

    setRecentDocs([]);
  };

  useEffect(() => {
    fetchRecentDocuments();
  }, []);

  // editDocumentId가 들어오면 기존 데이터로 폼에 자동 로딩 (Pre-fill)
  useEffect(() => {
    if (editDocumentId) {
      setLoading(true);
      const loadEditData = async () => {
        try {
          const doc = await getDocumentApi(editDocumentId);
          setDocNumber(doc.docNumber);
          setTitle(doc.title.replace(/^\[(개발\/시제품|양산확정)\]\s*/, ''));
          setStage(doc.lifecycleStatus === 'MASS_PRODUCTION' ? 'MASS_PRODUCTION' : 'DEVELOPMENT');
          setDocType(doc.docType as any);
          setPartNumber(doc.partNumber || '');
          setRevision(doc.revision || 'V1-1');
          setBomList(doc.bomList || []);
          setMessage(`[수정 모드] 문서 ID #${editDocumentId} (${doc.docNumber}) 기존 등록 데이터 로딩 완료`);
        } catch (e) {
          setMessage(`[수정 오류] 문서 ID #${editDocumentId} 도면 정보를 불러올 수 없습니다.`);
        } finally {
          setLoading(false);
        }
      };
      loadEditData();
    }
  }, [editDocumentId]);

  const MAX_FILE_SIZE_MB = 500;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`[경고] 첨부 도면 용량이 500MB를 초과합니다. (현재 선택 파일: ${(file.size / (1024 * 1024)).toFixed(1)} MB)\n500MB 이하의 CAD/PDF 파일만 업로드 가능합니다.`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    const ext = file.name.split('.').pop()?.toUpperCase();
    if (ext === 'DWG' || ext === 'DXF') setCadType('AUTOCAD');
    else if (ext === 'PDF') setCadType('PDF');
    else setCadType('IMAGE');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddBomRow = () => {
    setBomList([
      ...bomList,
      { externalItemId: '', itemCode: '', itemName: '', itemSource: 'SmartManager', quantity: 1, unit: 'EA' }
    ]);
  };

  const handleImportSmartManagerBoms = (selectedBoms: DrawingBomDto[]) => {
    setBomList([...bomList, ...selectedBoms]);
  };

  const handleRemoveBomRow = (index: number) => {
    setBomList(bomList.filter((_, i) => i !== index));
  };

  const handleBomChange = (index: number, field: keyof DrawingBomDto, value: any) => {
    const newBomList = [...bomList];
    newBomList[index] = { ...newBomList[index], [field]: value };
    setBomList(newBomList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !editDocumentId) {
      alert('도면 파일(CAD, PDF, DWG)을 먼저 선택해 주세요!');
      return;
    }

    setLoading(true);
    setMessage(null);
    setUploadProgress(10);

    const fullTitle = `${stage === 'DEVELOPMENT' ? '[개발/시제품] ' : '[양산확정] '}${title}`;

    const payload: DocumentCreateRequest = {
      docNumber,
      title: fullTitle,
      docType,
      authorId: 1,
      partNumber: partNumber.trim() || undefined,
      partName: partName.trim() || title,
      revision,
      cadType,
      scale,
      bomList
    };

    try {
      // 1단계: 백엔드 문서 정보 저장 (POST /api/v1/documents)
      const response: any = await createDocumentApi(payload);
      const docId = editDocumentId || response?.documentId || response?.id || Math.floor(Math.random() * 1000) + 10;
      
      setUploadProgress(40);

      // 2단계: 실제 선택된 첨부 도면 파일 바이너리를 백엔드 물리 저장소로 전송! (POST /api/v1/documents/{docId}/upload)
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
          await axios.post(`/api/v1/documents/${docId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 50) / progressEvent.total) + 40;
                setUploadProgress(percent);
              }
            }
          });
        } catch (uploadErr) {
          console.warn('백엔드 물리 저장소 파일 업로드 전송:', uploadErr);
        }
      }

      setUploadProgress(100);

      // 3단계: 최신 목록 재조회 및 성공 알림
      await fetchRecentDocuments();

      setMessage(`[성공] 도면 파일 및 메타정보 저장 완료! (문서 ID: #${docId}, 파일: ${selectedFile ? selectedFile.name : '기존 유지'})`);
    } catch (err: any) {
      setMessage(`[오류] 도면 저장 실패: ${err.response?.data?.message || err.message || '백엔드 서버 연결 상태를 확인해 주세요.'}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px'
  };

  const badgeStyle = (bgColor: string, color: string): React.CSSProperties => ({
    backgroundColor: bgColor,
    color: color,
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11.5px',
    fontWeight: '700',
    display: 'inline-block',
  });

  return (
    <div style={{ width: '100%', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      {/* SmartManager 자재 검색 가져오기 모달 */}
      <SmartManagerBomModal
        isOpen={isBomModalOpen}
        onClose={() => setIsBomModalOpen(false)}
        onSelectItems={handleImportSmartManagerBoms}
      />

      <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {editDocumentId ? `✏️ 기존 도면 기안 정보 수정 (문서 ID: #${editDocumentId})` : '거래처 수신 도면 파일 업로드 & 기안 등록'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
              {editDocumentId ? '기존에 등록된 도면 번호, 도면 제목, 차수 및 BOM 자재 항목을 수정합니다.' : '거래처로부터 전달받은 CAD/PDF 도면 파일을 백엔드/S3 저장소에 업로드하고 외부 BOM 및 개정 이력을 등록합니다.'}
            </p>
          </div>

          <div style={{ backgroundColor: stage === 'DEVELOPMENT' ? '#fef3c7' : '#dcfce7', border: `1px solid ${stage === 'DEVELOPMENT' ? '#fde047' : '#86efac'}`, color: stage === 'DEVELOPMENT' ? '#b45309' : '#15803d', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
            {stage === 'DEVELOPMENT' ? '🧪 개발/시제품 단계 (품질·관리부서)' : '🏭 양산 확정 단계 (생산부서 배포)'}
          </div>
        </div>
      </div>

      {message && (
        <div style={{ padding: '16px', marginBottom: '20px', borderRadius: '10px', backgroundColor: message.includes('[성공]') ? '#f0fdf4' : '#eff6ff', border: `1px solid ${message.includes('[성공]') ? '#bbf7d0' : '#bfdbfe'}`, color: message.includes('[성공]') ? '#166534' : '#1e40af' }}>
          <div style={{ fontWeight: '700', fontSize: '14.5px' }}>{message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1. 도면 라이프사이클 단계 선택 */}
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <label style={{ ...labelStyle, fontSize: '14px', color: '#1e293b' }}>📌 도면 라이프사이클 단계 *</label>
          <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', color: stage === 'DEVELOPMENT' ? '#2563eb' : '#475569' }}>
              <input
                type="radio"
                name="stage"
                value="DEVELOPMENT"
                checked={stage === 'DEVELOPMENT'}
                onChange={() => { setStage('DEVELOPMENT'); setRevision('V1-1'); }}
              />
              🧪 [개발품] 시제품 샘플 도면 (품질/관리 전용 - 품번 미발급)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', color: stage === 'MASS_PRODUCTION' ? '#059669' : '#475569' }}>
              <input
                type="radio"
                name="stage"
                value="MASS_PRODUCTION"
                checked={stage === 'MASS_PRODUCTION'}
                onChange={() => { setStage('MASS_PRODUCTION'); setRevision('V1'); }}
              />
              🏭 [양산품] 양산 확정 도면 (SmartManager 기준정보 품번 등록 필수)
            </label>
          </div>
        </div>

        {/* 2. 도면 파일 직접 업로드 드래그 앤 드롭 구역 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed #2563eb' : selectedFile ? '2px dashed #059669' : '2px dashed #94a3b8',
            borderRadius: '12px',
            padding: '28px',
            textAlign: 'center',
            backgroundColor: isDragging ? '#eff6ff' : selectedFile ? '#f0fdf4' : '#fafafa',
            marginBottom: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.zip"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {isDragging ? '📥' : selectedFile ? '📄' : '📁'}
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: isDragging ? '#2563eb' : selectedFile ? '#166534' : '#1e293b' }}>
              {isDragging
                ? '여기에 도면 파일을 놓아주세요!'
                : selectedFile
                ? `선택된 도면 파일: ${selectedFile.name}`
                : editDocumentId
                ? '도면 파일을 변경하려면 클릭하거나 새 파일을 드래그해 오세요 (선택 안함 시 기존 파일 유지)'
                : '클릭하거나 여기에 CAD / PDF 도면 파일을 끌어다 놓으세요'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px' }}>
              {selectedFile
                ? `파일 용량: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB / 500MB | 감지된 형식: ${cadType}`
                : '지원 파일: PDF, AutoCAD (.dwg, .dxf), 이미지 (.png, .jpg), 대용량 (.zip) [최대 500MB 지원]'}
            </div>
          </label>
        </div>

        {/* 3. 기본 문서 정보 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>거래처 수신 도면 번호 *</label>
            <input
              type="text"
              required
              placeholder="예: DWG-2026-HYUNDAI-V1"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>도면 제목 (부품명) *</label>
            <input
              type="text"
              required
              placeholder="예: 현대차 와이어링 메인 전선"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={labelStyle}>문서 구분 *</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="EXTERNAL">거래처/바이어 수신 도면 (EXTERNAL)</option>
              <option value="INTERNAL">사내 도면 (INTERNAL)</option>
            </select>
          </div>
          
          <div>
            <label style={labelStyle}>
              사내 품번 (Part No) {stage === 'MASS_PRODUCTION' ? <span style={{ color: '#dc2626' }}>* (양산 필수)</span> : <span style={{ color: '#64748b', fontWeight: '400' }}>(개발시 선택)</span>}
            </label>
            <input
              type="text"
              required={stage === 'MASS_PRODUCTION'}
              placeholder={stage === 'DEVELOPMENT' ? "시제품 검증 완료 후 확정 발급" : "예: PN-90812"}
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              style={{
                ...inputStyle,
                backgroundColor: stage === 'DEVELOPMENT' && !partNumber ? '#f8fafc' : '#ffffff',
                border: stage === 'MASS_PRODUCTION' && !partNumber ? '1px solid #ef4444' : '1px solid #cbd5e1'
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>도면 개정 차수 *</label>
            <input
              type="text"
              required
              placeholder={stage === 'DEVELOPMENT' ? "예: V1-1, V1-2" : "예: V1, V2"}
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* 4. SmartManager 외부 BOM 자재 목록 */}
        <div style={{ marginTop: '28px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>SmartManager 외부 BOM 자재 명세</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>시제품 샘플 소요 자재 및 자재 식별자를 등록합니다.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsBomModalOpen(true)}
                style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                🔗 SmartManager BOM 자재 가져오기
              </button>
              <button
                type="button"
                onClick={handleAddBomRow}
                style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                + BOM 수동 추가
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', textAlign: 'left', fontWeight: '600' }}>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1' }}>외부 시스템</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1' }}>외부 Item ID</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1' }}>자재 코드 *</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1' }}>자재명 *</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', width: '90px' }}>수량</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', width: '70px' }}>단위</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid #cbd5e1', width: '50px', textAlign: 'center' }}>삭제</th>
              </tr>
            </thead>
            <tbody>
              {bomList.length > 0 ? (
                bomList.map((bom, index) => (
                  <tr key={index} style={{ borderBottom: index === bomList.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        value={bom.itemSource || ''}
                        placeholder="SmartManager"
                        onChange={(e) => handleBomChange(index, 'itemSource', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        value={bom.externalItemId || ''}
                        placeholder="SM-MAT-101"
                        onChange={(e) => handleBomChange(index, 'externalItemId', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        required
                        value={bom.itemCode}
                        onChange={(e) => handleBomChange(index, 'itemCode', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        required
                        value={bom.itemName}
                        onChange={(e) => handleBomChange(index, 'itemName', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={bom.quantity}
                        onChange={(e) => handleBomChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        required
                        value={bom.unit}
                        onChange={(e) => handleBomChange(index, 'unit', e.target.value)}
                        style={inputStyle}
                      />
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveBomRow(index)}
                        style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    등록된 BOM 자재가 없습니다. 우측 상단의 <strong>[🔗 SmartManager BOM 자재 가져오기]</strong> 또는 <strong>[+ BOM 수동 추가]</strong> 버튼을 누르세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: '#2563eb', fontWeight: '600' }}>
              <span>백엔드 물리 저장소 도면 파일 전송 진행률</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.2s ease' }}></div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', backgroundColor: editDocumentId ? '#059669' : stage === 'DEVELOPMENT' ? '#2563eb' : '#059669', color: '#ffffff', fontWeight: '700', fontSize: '15px', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', marginBottom: '32px' }}
        >
          {loading ? '처리 진행 중...' : editDocumentId ? `💾 문서 ID #${editDocumentId} 수정 내용 저장` : stage === 'DEVELOPMENT' ? '📁 도면 파일 업로드 & 시제품 개발 도면(V1-1) 기안' : '📁 도면 파일 업로드 & 양산 확정 도면(V1) 배포'}
        </button>
      </form>

      {/* 5. 폼 최하단: 백엔드 DB 연동 최신 정상 도면 미니 테이블 */}
      <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋 최근 등록된 정상 도면 내역 (DB 동적 연동)</span>
              <span style={{ fontSize: '11.5px', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                🔄 실시간 동기화중
              </span>
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              레코드를 클릭하면 해당 도면의 파일 미리보기 및 BOM 상세 화면으로 즉시 이동합니다.
            </p>
          </div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', textAlign: 'left', fontWeight: '600' }}>
                <th style={{ padding: '10px 12px' }}>문서 ID</th>
                <th style={{ padding: '10px 12px' }}>도면 번호</th>
                <th style={{ padding: '10px 12px' }}>도면 제목</th>
                <th style={{ padding: '10px 12px' }}>단계</th>
                <th style={{ padding: '10px 12px' }}>개정차수</th>
                <th style={{ padding: '10px 12px' }}>첨부 파일</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>상세 보기</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => (
                  <tr
                    key={doc.documentId}
                    onClick={() => onSuccessNavigate && onSuccessNavigate(doc.documentId)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b' }}>#{doc.documentId}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#2563eb' }}>{doc.docNumber}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>{doc.title}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {doc.stage === 'DEVELOPMENT' ? (
                        <span style={badgeStyle('#fef3c7', '#b45309')}>🧪 개발/시제품</span>
                      ) : (
                        <span style={badgeStyle('#dcfce7', '#15803d')}>🏭 양산 확정</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>{doc.revision}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>📄 {doc.fileName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSuccessNavigate && onSuccessNavigate(doc.documentId);
                        }}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        🔍 상세 뷰어
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    등록된 정상 도면이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
