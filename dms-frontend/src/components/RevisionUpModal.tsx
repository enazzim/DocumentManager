import React, { useState } from 'react';
import { revisionUpDocumentApi } from '../api/documentApi';
import type { DocumentResponse } from '../api/documentApi';

interface RevisionUpModalProps {
  isOpen: boolean;
  doc: DocumentResponse | null;
  onClose: () => void;
  onSuccessRevision: (newRevisionDoc: DocumentResponse) => void;
}

export const RevisionUpModal: React.FC<RevisionUpModalProps> = ({ isOpen, doc, onClose, onSuccessRevision }) => {
  const [newRevision, setNewRevision] = useState('V1-2');
  const [changeReason, setChangeReason] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !doc) return null;

  const MAX_FILE_SIZE_MB = 500;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`[경고] 첨부 개정 도면 용량이 500MB를 초과합니다. (선택 파일: ${(file.size / (1024 * 1024)).toFixed(1)} MB)\n500MB 이하의 CAD/PDF 파일만 업로드 가능합니다.`);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!changeReason.trim()) {
      alert('개정 사유(예: 거래처 사양 변경으로 전선 길이 5cm 연장)를 작성해 주세요!');
      return;
    }

    if (!selectedFile) {
      alert('신규 개정 도면 파일(.pdf, .dwg)을 먼저 드래그앤드롭하여 선택해 주세요!');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedDoc = await revisionUpDocumentApi(
        doc.documentId,
        newRevision,
        changeReason,
        selectedFile
      );
      alert(`[도면 개정 DB 저장 완료] 도면 [${doc.docNumber}] 이 ${doc.revision} ➔ ${newRevision} 차수로 성공적으로 백엔드 DB 및 물리 저장소에 개정 저장되었습니다!\n(첨부 파일: ${selectedFile.name})\n구버전(${doc.revision})은 이력 보관함으로 자동 보존됩니다.`);
      onSuccessRevision(updatedDoc);
      onClose();
    } catch (err: any) {
      alert(`[오류] 차수 개정 백엔드 저장 실패: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#ffffff', width: '640px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        {/* 모달 헤더 */}
        <div style={{ padding: '20px 24px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔄 도면 차수 개정 등록 (Revision Up)</span>
            </h3>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              동일 도면 번호[{doc.docNumber}]의 최신 개정 도면을 등록하고 구버전을 이력 보존합니다.
            </p>
          </div>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* 이전 차수 vs 신규 차수 정보 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block' }}>기존 도면 차수</label>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#64748b', marginTop: '4px' }}>{doc.revision} (구버전 이력보관)</div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', display: 'block' }}>신규 개정 차수 *</label>
              <input
                type="text"
                required
                value={newRevision}
                onChange={(e) => setNewRevision(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '2px solid #2563eb', borderRadius: '6px', fontSize: '15px', fontWeight: '700', color: '#2563eb', outline: 'none', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* 개정 사유 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
              📌 개정 변경 사유 (History Audit Log) *
            </label>
            <textarea
              required
              rows={3}
              placeholder="예: 바이어 사양 변경 요청으로 인해 커넥터 핀 12P ➔ 16P 변경 및 하네스 전선 길이를 5cm 연장함."
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* 신규 개정 도면 파일 드래그 앤 드롭 구역 (시스템 일괄 업로드 규격) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: isDragging ? '2px dashed #2563eb' : selectedFile ? '2px dashed #059669' : '2px dashed #94a3b8',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: isDragging ? '#eff6ff' : selectedFile ? '#f0fdf4' : '#fafafa',
              marginBottom: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              type="file"
              id="revision-file-upload"
              accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.zip"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="revision-file-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>
                {isDragging ? '📥' : selectedFile ? '📄' : '📁'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: isDragging ? '#2563eb' : selectedFile ? '#166534' : '#1e293b' }}>
                {isDragging
                  ? '여기에 신규 개정 도면 파일을 놓아주세요!'
                  : selectedFile
                  ? `선택된 개정 도면: ${selectedFile.name}`
                  : `클릭하거나 여기에 신규 ${newRevision} 차수 CAD / PDF 도면을 끌어다 놓으세요`}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {selectedFile
                  ? `용량: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB | 500MB 대용량 S3 업로드 지원`
                  : '지원 파일: PDF, AutoCAD (.dwg, .dxf), 이미지 (.png, .jpg), 대용량 (.zip) [최대 500MB]'}
              </div>
            </label>
          </div>

          {/* 모달 푸터 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: isSubmitting ? '#94a3b8' : '#2563eb', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13.5px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? '⏳ DB 및 도면 개정 저장 중...' : `🔄 ${newRevision} 차수 개정 완료 & 이력 저장`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
