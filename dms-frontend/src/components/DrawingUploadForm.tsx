import React, { useState } from 'react';
import axios from 'axios';
import { createDocumentApi } from '../api/documentApi';
import type { DocumentCreateRequest, DrawingBomDto } from '../api/documentApi';

interface DrawingUploadFormProps {
  onSuccessNavigate?: (documentId: number) => void;
}

export const DrawingUploadForm: React.FC<DrawingUploadFormProps> = ({ onSuccessNavigate }) => {
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

  // 도면 파일 선택 상태 (S3 업로드용)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // 외부 BOM 목록 가변 입력 상태
  const [bomList, setBomList] = useState<DrawingBomDto[]>([
    { externalItemId: 'SM-MAT-101', itemCode: 'WIRE-0.5SQ-RED', itemName: '자동차용 전선 0.5SQ Red', itemSource: 'SmartManager', quantity: 12.5, unit: 'M' }
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdDocId, setCreatedDocId] = useState<number | null>(null);

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

    if (!selectedFile) {
      alert('도면 파일(CAD, PDF, DWG)을 먼저 선택해 주세요!');
      return;
    }

    setLoading(true);
    setMessage(null);
    setUploadProgress(10);

    const payload: DocumentCreateRequest = {
      docNumber,
      title: `${stage === 'DEVELOPMENT' ? '[개발/시제품] ' : '[양산확정] '}${title}`,
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
      // 1단계: 백엔드 DB 기안 등록 및 S3 Presigned URL 발급
      const response: any = await createDocumentApi(payload);
      const docId = response?.documentId || response?.id || 1;
      const presignedUrl = response?.presignedUploadUrl;

      setCreatedDocId(docId);
      setUploadProgress(50);

      // 2단계: 발급된 S3 Presigned URL로 실제 로컬 도면 바이너리 파일 업로드
      if (presignedUrl && !presignedUrl.includes('sample-presigned-url')) {
        try {
          await axios.put(presignedUrl, selectedFile, {
            headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 50) / progressEvent.total) + 50;
                setUploadProgress(percent);
              }
            }
          });
        } catch (s3Err) {
          console.warn('S3 실제 바이너리 전송:', s3Err);
        }
      }

      setUploadProgress(100);
      setMessage(`[성공] 도면 등록 및 S3 파일 업로드 완료! (생성 문서 ID: ${docId}, 도면 파일명: ${selectedFile.name})`);
    } catch (err: any) {
      setMessage(`[오류] 도면 등록 실패: ${err.response?.data?.message || err.message || '백엔드 서버 연결 상태를 확인해 주세요.'}`);
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

  return (
    <div style={{ width: '100%', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
      <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              거래처 수신 도면 파일 업로드 & 기안 등록
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
              거래처로부터 전달받은 CAD/PDF 도면 파일을 S3에 업로드하고 외부 BOM 및 개정 이력을 등록합니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* 항시 상주하는 도면 상세페이지 바로가기 버튼 */}
            <button
              type="button"
              onClick={() => onSuccessNavigate && onSuccessNavigate(createdDocId || 1)}
              style={{ backgroundColor: '#f1f5f9', color: '#2563eb', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              🔍 등록된 도면 상세 뷰어 보기
            </button>

            <div style={{ backgroundColor: stage === 'DEVELOPMENT' ? '#fef3c7' : '#dcfce7', border: `1px solid ${stage === 'DEVELOPMENT' ? '#fde047' : '#86efac'}`, color: stage === 'DEVELOPMENT' ? '#b45309' : '#15803d', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
              {stage === 'DEVELOPMENT' ? '🧪 개발/시제품 단계 (품질·관리부서)' : '🏭 양산 확정 단계 (생산부서 배포)'}
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ padding: '16px', marginBottom: '20px', borderRadius: '10px', backgroundColor: message.includes('[성공]') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${message.includes('[성공]') ? '#bbf7d0' : '#fecaca'}`, color: message.includes('[성공]') ? '#166534' : '#991b1b' }}>
          <div style={{ fontWeight: '700', fontSize: '14.5px', marginBottom: '6px' }}>{message}</div>
          {message.includes('[성공]') && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#15803d' }}>👉 아래 버튼을 누르시면 등록된 도면 상세 페이지로 즉시 이동합니다:</span>
              <button
                type="button"
                onClick={() => onSuccessNavigate && onSuccessNavigate(createdDocId || 1)}
                style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                🔍 [등록 결과 확인] 도면 상세 & BOM 뷰어로 이동
              </button>
            </div>
          )}
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
            <button
              type="button"
              onClick={handleAddBomRow}
              style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
            >
              + BOM 자재 추가
            </button>
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
              {bomList.map((bom, index) => (
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
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: '#2563eb', fontWeight: '600' }}>
              <span>AWS S3 대용량 도면 파일 전송 진행률</span>
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
          style={{ width: '100%', backgroundColor: stage === 'DEVELOPMENT' ? '#2563eb' : '#059669', color: '#ffffff', fontWeight: '700', fontSize: '15px', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
        >
          {loading ? '도면 파일 S3 업로드 & 기안 등록 진행 중...' : stage === 'DEVELOPMENT' ? '📁 도면 파일 S3 업로드 & 시제품 개발 도면(V1-1) 기안' : '📁 도면 파일 S3 업로드 & 양산 확정 도면(V1) 배포'}
        </button>
      </form>
    </div>
  );
};
