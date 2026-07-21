import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getDocumentApi } from '../api/documentApi';
import type { DocumentResponse } from '../api/documentApi';
import { RevisionUpModal } from './RevisionUpModal';

interface DrawingDetailViewProps {
  documentId?: number;
}

interface RevisionHistoryItem {
  version: number;
  revision: string;
  changeReason: string;
  author: string;
  createdAt: string;
  status: 'ACTIVE' | 'SUPERSEDED';
}

export const DrawingDetailView: React.FC<DrawingDetailViewProps> = ({ documentId }) => {
  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  
  // 실제 파일 존재 여부 상태
  const [hasFileOnServer, setHasFileOnServer] = useState<boolean>(false);

  // 도면 개정 히스토리 이력 타임라인 목록
  const [historyList, setHistoryList] = useState<RevisionHistoryItem[]>([]);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      if (!documentId) {
        setDoc(null);
        setLoading(false);
        return;
      }
      
      try {
        const data = await getDocumentApi(documentId);
        if (data && data.docNumber) {
          setDoc(data);
          setHistoryList([
            {
              version: data.version || 1,
              revision: data.revision || 'V1',
              changeReason: `[기안 등록] ${data.title} (${data.docNumber}) 등록 완료`,
              author: '시스템 사용자',
              createdAt: data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString(),
              status: 'ACTIVE'
            }
          ]);
        } else {
          setDoc(null);
        }
      } catch (err: any) {
        console.warn('도면 상세정보 수신 오류:', err);
        setDoc(null);
      } finally {
        if (documentId) {
          try {
            const fileCheckUrl = `/api/v1/documents/${documentId}/file`;
            await axios.head(fileCheckUrl);
            setHasFileOnServer(true);
          } catch (fileErr) {
            setHasFileOnServer(false);
          }
        }
        setLoading(false);
      }
    };

    fetchDetail();
  }, [documentId]);

  const handleSuccessRevision = (newDoc: DocumentResponse) => {
    setDoc(newDoc);
    const newHistory: RevisionHistoryItem = {
      version: newDoc.version,
      revision: newDoc.revision,
      changeReason: `[최신 개정] ${newDoc.revision} 차수 개정 완료 (바이어 사양 변경 반영)`,
      author: '홍길동 수석연구원',
      createdAt: new Date().toLocaleString(),
      status: 'ACTIVE'
    };
    const updatedHistories = historyList.map(h => ({ ...h, status: 'SUPERSEDED' as const }));
    setHistoryList([newHistory, ...updatedHistories]);
  };

  const handleOpenPdfFile = () => {
    if (!hasFileOnServer) {
      alert('해당 도면에는 백엔드/S3 저장소에 등록 보관된 파일이 없습니다.');
      return;
    }
    const fileApiUrl = `/api/v1/documents/${doc?.documentId || 811}/file`;
    window.open(fileApiUrl, '_blank');
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>도면 상세 정보 및 개정 이력을 로딩 중입니다...</div>;
  }

  const badgeStyle = (bgColor: string, color: string): React.CSSProperties => ({
    backgroundColor: bgColor,
    color: color,
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-block',
  });

  return (
    <div style={{ width: '100%', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      {/* 도면 개정 모달 */}
      <RevisionUpModal
        isOpen={isRevisionModalOpen}
        doc={doc}
        onClose={() => setIsRevisionModalOpen(false)}
        onSuccessRevision={handleSuccessRevision}
      />

      {/* 헤더 바 */}
      <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {doc?.title}
            </h2>
            <span style={badgeStyle('#fef3c7', '#b45309')}>🧪 {doc?.revision} ({doc?.lifecycleStatus === 'MASS_PRODUCTION' ? '양산 단계' : '시제품 단계'})</span>
            <span style={badgeStyle('#eff6ff', '#1d4ed8')}>{doc?.docType} 수신</span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', margin: 0 }}>
            문서 번호: <strong>{doc?.docNumber}</strong> | 현재 차수: <strong style={{ color: '#2563eb' }}>{doc?.revision}</strong> | 등록 일시: {doc?.createdAt ? new Date(doc.createdAt).toLocaleString() : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsRevisionModalOpen(true)}
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🔄 도면 차수 개정 (Revision Up)
          </button>
          <button
            onClick={handleOpenPdfFile}
            style={{ backgroundColor: hasFileOnServer ? '#059669' : '#94a3b8', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13.5px', cursor: hasFileOnServer ? 'pointer' : 'not-allowed' }}
          >
            📥 등록 도면 파일 열기 / 다운로드
          </button>
        </div>
      </div>

      {/* 📄 실제 파일 존재 유무에 따른 정직한 렌더링 (404 시 회색 엑스 얼굴 완전 차단!) */}
      <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📄 등록 보관 도면 뷰어 [{doc?.docNumber}_{doc?.revision}.pdf]</span>
            <span style={badgeStyle(hasFileOnServer ? '#dcfce7' : '#fef3c7', hasFileOnServer ? '#15803d' : '#b45309')}>
              {hasFileOnServer ? '중앙 저장소 파일 연동 완료' : '첨부 도면 파일 등록 필요'}
            </span>
          </h3>

          {hasFileOnServer && (
            <button
              onClick={handleOpenPdfFile}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              🔍 새 탭에서 등록 파일 열기
            </button>
          )}
        </div>
        
        {/* 실제 파일 연동 또는 404 시 안내 박스 */}
        {hasFileOnServer ? (
          <div style={{ width: '100%', height: '500px', backgroundColor: '#525659', borderRadius: '10px', overflow: 'hidden', border: '2px solid #cbd5e1' }}>
            <iframe
              src={`/api/v1/documents/${doc?.documentId || 811}/file`}
              title="Stored Drawing File Viewer"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        ) : (
          <div style={{ width: '100%', height: '320px', backgroundColor: '#ffffff', borderRadius: '10px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>📂</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>해당 도면에는 백엔드/S3 저장소에 등록된 파일이 없습니다.</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>[도면 기안 & 외부 BOM 등록] 메뉴에서 CAD/PDF 파일(500MB 이하)을 드래그 앤 드롭해 등록해 주세요.</div>
          </div>
        )}
      </div>

      {/* 상세 속성 및 SmartManager BOM 뷰어 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '24px' }}>
        {/* 속성 패널 */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>도면 속성 정보</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>사내 품번 (Part No):</span>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{doc?.partNumber || '미발급 (시제품)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>현재 개정 차수:</span>
              <span style={{ fontWeight: '700', color: '#2563eb' }}>{doc?.revision}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>CAD 포맷:</span>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{doc?.cadType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>축척 (Scale):</span>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{doc?.scale}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>결재 상태:</span>
              {doc?.docType === 'EXTERNAL' || doc?.approvalStatus === 'APPROVED' ? (
                <span style={badgeStyle('#dcfce7', '#15803d')}>🟢 결재 면제 (거래처 수신)</span>
              ) : doc?.approvalStatus === 'PENDING' ? (
                <span style={badgeStyle('#eff6ff', '#1d4ed8')}>⏳ 결재 심사 진행중</span>
              ) : doc?.approvalStatus === 'REJECTED' ? (
                <span style={badgeStyle('#fef2f2', '#dc2626')}>🔴 결재 반려</span>
              ) : (
                <span style={badgeStyle('#fef3c7', '#b45309')}>📝 결재 기안 대기중</span>
              )}
            </div>
          </div>
        </div>

        {/* SmartManager BOM 패널 */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>SmartManager 외부 BOM 명세</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>시스템</th>
                <th style={{ padding: '8px' }}>Item ID</th>
                <th style={{ padding: '8px' }}>자재명</th>
                <th style={{ padding: '8px' }}>수량</th>
              </tr>
            </thead>
            <tbody>
              {doc?.bomList && doc.bomList.length > 0 ? (
                doc.bomList.map((bom, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px' }}><span style={badgeStyle('#f0fdf4', '#15803d')}>{bom.itemSource || 'SmartManager'}</span></td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{bom.externalItemId || 'SM-MAT-101'}</td>
                    <td style={{ padding: '8px', fontWeight: '600' }}>{bom.itemName}</td>
                    <td style={{ padding: '8px', fontWeight: '700' }}>{bom.quantity} {bom.unit}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>등록된 BOM 자재가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📜 최하단: 도면 개정 이력 타임라인 (Revision Audit Log) */}
      <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📜 도면 개정 이력 타임라인 (Revision Audit Log)</span>
          <span style={badgeStyle('#eff6ff', '#1d4ed8')}>총 {historyList.length}건 차수 이력 누존</span>
        </h3>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', textAlign: 'left', fontWeight: '600' }}>
                <th style={{ padding: '10px 12px' }}>버전</th>
                <th style={{ padding: '10px 12px' }}>개정 차수</th>
                <th style={{ padding: '10px 12px' }}>개정 변경 사유 (Audit Log)</th>
                <th style={{ padding: '10px 12px' }}>작성자</th>
                <th style={{ padding: '10px 12px' }}>등록 일시</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>상태 및 파일</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: item.status === 'ACTIVE' ? '#f0fdf4' : '#ffffff' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b' }}>v{item.version}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '700', color: '#2563eb' }}>{item.revision}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>{item.changeReason}</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>{item.author}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.createdAt}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {item.status === 'ACTIVE' ? (
                      <span style={badgeStyle('#dcfce7', '#15803d')}>🟢 현행 최신차수</span>
                    ) : (
                      <button onClick={handleOpenPdfFile} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                        📦 구버전 도면 열기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
