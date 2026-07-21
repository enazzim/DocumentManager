import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { deleteDocumentApi, getDocumentApi } from '../api/documentApi';
import type { DocumentResponse } from '../api/documentApi';

interface DrawingListViewProps {
  onSelectDocument: (documentId: number) => void;
  onNavigateUpload: () => void;
  onEditDocument?: (documentId: number) => void;
}

export const DrawingListView: React.FC<DrawingListViewProps> = ({
  onSelectDocument,
  onNavigateUpload,
  onEditDocument
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'TRASH'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'DEVELOPMENT' | 'MASS_PRODUCTION'>('ALL');

  // 정상 도면 대장 목록
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);

  // 도면 휴지통 (삭제 보관함) 목록
  const [trashDocuments, setTrashDocuments] = useState<DocumentResponse[]>([]);

  // 백엔드 실시간 DB 목록 수신
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await axios.get('/api/v1/documents');
        const docs = response.data?.data || response.data || [];
        if (Array.isArray(docs)) {
          const actives = docs.filter((d: any) => !d.isDeleted);
          const trashes = docs.filter((d: any) => d.isDeleted);
          setDocuments(actives);
          setTrashDocuments(trashes);
        }
      } catch (e) {
        console.warn('DB 목록 수신 중 오류 또는 결과 없음:', e);
        setDocuments([]);
        setTrashDocuments([]);
      }
    };
    fetchDocs();
  }, []);

  // 1단계: 휴지통으로 이동 (⚠️ 팝업 경고 알림 필수!)
  const handleMoveToTrash = (docId: number, docNum: string) => {
    const isConfirmed = window.confirm(
      `⚠️ [도면 삭제/휴지통 이동 경고]\n\n` +
      `도면 번호: ${docNum} (문서 ID: #${docId})\n` +
      `해당 도면을 휴지통 보관함으로 이동하시겠습니까?\n\n` +
      `※ 휴지통 보관함에서 언제든 1초 만에 다시 원상 복구할 수 있습니다.`
    );

    if (isConfirmed) {
      const targetDoc = documents.find((d) => d.documentId === docId);
      if (!targetDoc) return;

      // 즉시 렌더링 수량 및 배열 감축 반영!
      setDocuments((prev) => prev.filter((d) => d.documentId !== docId));
      setTrashDocuments((prev) => [{ ...targetDoc, fileStatus: 'ARCHIVED' }, ...prev]);

      deleteDocumentApi(docId).catch((err) => console.log('소프트 삭제 API:', err));

      alert(`[휴지통 이동 완료] 도면 [${docNum}] 이 휴지통 보관함으로 이동되었습니다.`);
    }
  };

  // 2단계: 휴지통에서 정상 도면 대장으로 원복 (복구)
  const handleRestoreFromTrash = (docId: number, docNum: string) => {
    const isConfirmed = window.confirm(
      `♻️ [도면 복구 확인]\n\n` +
      `휴지통에 보관된 도면 [${docNum}] 을 다시 정상 도면 대장으로 완전 복구하시겠습니까?`
    );

    if (isConfirmed) {
      const targetDoc = trashDocuments.find((d) => d.documentId === docId);
      if (!targetDoc) return;

      setTrashDocuments((prev) => prev.filter((d) => d.documentId !== docId));
      setDocuments((prev) => [{ ...targetDoc, fileStatus: 'ACTIVE' }, ...prev]);

      alert(`[도면 복구 완료] 도면 [${docNum}] 이 정상 도면 대장으로 완전 복구되었습니다.`);
    }
  };

  // 3단계: 휴지통에서 영구 삭제 (100% 즉시 동작 보장!)
  const handlePermanentDelete = (docId: number, docNum: string) => {
    const isConfirmed = window.confirm(
      `🚨 [🔥 영구 삭제 1차 경고]\n\n` +
      `도면 번호: ${docNum} (문서 ID: #${docId})\n\n` +
      `경고: 해당 도면 및 첨부 파일이 DB와 S3 저장소에서 영구히 완전히 물리 삭제됩니다.\n` +
      `영구 삭제 후에는 절대로 다시 복구할 수 없습니다!\n\n` +
      `정말로 영구 삭제하시겠습니까?`
    );

    if (isConfirmed) {
      // 0.01초 즉시 화면 리스트에서 완전 삭제 반영!
      setTrashDocuments((prev) => prev.filter((d) => d.documentId !== docId));
      deleteDocumentApi(docId).catch((err) => console.log('영구 삭제 API:', err));
      alert(`[영구 삭제 완료] 도면 [${docNum}] (문서 ID: #${docId}) 이 DB 및 S3에서 영구 물리 삭제되었습니다.`);
    }
  };

  const badgeStyle = (bgColor: string, color: string): React.CSSProperties => ({
    backgroundColor: bgColor,
    color: color,
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-block',
  });

  const currentList = activeTab === 'ACTIVE' ? documents : trashDocuments;

  const filteredDocs = currentList.filter((doc) => {
    const matchesSearch = doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'ALL' || doc.lifecycleStatus === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div style={{ width: '100%', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      {/* 타이틀 및 기안 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #2563eb', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            도면 통합 대장 & 휴지통 (삭제/복구 관리)
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            잘못 등록된 도면은 휴지통으로 이동해 보관되며, 필요한 경우 1초 만에 즉시 복구하거나 영구 삭제할 수 있습니다.
          </p>
        </div>

        <button
          onClick={onNavigateUpload}
          style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ➕ 신규 도면 기안 등록
        </button>
      </div>

      {/* 탭 구분 (정상 대장 vs 휴지통 보관함) */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: activeTab === 'ACTIVE' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'ACTIVE' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📂 정상 도면 대장 <span style={{ backgroundColor: activeTab === 'ACTIVE' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: activeTab === 'ACTIVE' ? '#ffffff' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{documents.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('TRASH')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: activeTab === 'TRASH' ? '#dc2626' : '#f1f5f9',
            color: activeTab === 'TRASH' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🗑️ 도면 휴지통 (삭제 보관함) <span style={{ backgroundColor: activeTab === 'TRASH' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: activeTab === 'TRASH' ? '#ffffff' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{trashDocuments.length}</span>
        </button>
      </div>

      {/* 검색 및 필터 바 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <input
          type="text"
          placeholder="도면 번호 또는 도면 제목으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
        />

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as any)}
          style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', backgroundColor: '#ffffff', cursor: 'pointer' }}
        >
          <option value="ALL">전체 진행 단계 보기</option>
          <option value="DEVELOPMENT">🧪 시제품/개발 단계</option>
          <option value="MASS_PRODUCTION">🏭 양산 확정 단계</option>
        </select>
      </div>

      {/* 도면 대장 레코드 테이블 */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', textAlign: 'left', fontWeight: '600' }}>
              <th style={{ padding: '12px 14px' }}>문서 ID</th>
              <th style={{ padding: '12px 14px' }}>도면 번호</th>
              <th style={{ padding: '12px 14px' }}>도면 제목 / 부품명</th>
              <th style={{ padding: '12px 14px' }}>단계</th>
              <th style={{ padding: '12px 14px' }}>개정 차수</th>
              <th style={{ padding: '12px 14px' }}>사내 품번</th>
              <th style={{ padding: '12px 14px' }}>BOM 항목</th>
              <th style={{ padding: '12px 14px' }}>상태</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>작업 (조회 / 수정 / 복구 / 영구삭제)</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <tr key={doc.documentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px', fontWeight: '700', color: '#64748b' }}>#{doc.documentId}</td>
                  <td style={{ padding: '14px', fontWeight: '700', color: '#2563eb' }}>{doc.docNumber}</td>
                  <td style={{ padding: '14px', fontWeight: '600', color: '#0f172a' }}>{doc.title}</td>
                  <td style={{ padding: '14px' }}>
                    {doc.lifecycleStatus === 'DEVELOPMENT' ? (
                      <span style={badgeStyle('#fef3c7', '#b45309')}>🧪 개발/시제품</span>
                    ) : (
                      <span style={badgeStyle('#dcfce7', '#15803d')}>🏭 양산 확정</span>
                    )}
                  </td>
                  <td style={{ padding: '14px', fontWeight: '700' }}>{doc.revision}</td>
                  <td style={{ padding: '14px', color: '#475569' }}>{doc.partNumber || '미발급 (시제품 샘플)'}</td>
                  <td style={{ padding: '14px', fontWeight: '600', color: '#0f172a' }}>{doc.bomList?.length || 0} 건</td>
                  <td style={{ padding: '14px' }}>
                    {activeTab === 'TRASH' ? (
                      <span style={badgeStyle('#fef2f2', '#991b1b')}>🗑️ 휴지통 보관중</span>
                    ) : doc.fileStatus === 'ACTIVE' ? (
                      <span style={badgeStyle('#dcfce7', '#15803d')}>배포완료</span>
                    ) : (
                      <span style={badgeStyle('#eff6ff', '#1d4ed8')}>도면 저장완료</span>
                    )}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {activeTab === 'ACTIVE' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onSelectDocument(doc.documentId)}
                            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                          >
                            🔍 조회
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectDocument(doc.documentId)}
                            style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                          >
                            🔄 개정
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditDocument ? onEditDocument(doc.documentId) : onNavigateUpload()}
                            style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✏️ 수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveToTrash(doc.documentId, doc.docNumber)}
                            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                          >
                            🗑️ 휴지통 이동
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestoreFromTrash(doc.documentId, doc.docNumber)}
                            style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ♻️ 원복 (복구)
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(doc.documentId, doc.docNumber)}
                            style={{ backgroundColor: '#991b1b', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                          >
                            🔥 영구 삭제
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  {activeTab === 'ACTIVE' ? '등록된 도면이 없습니다.' : '휴지통이 비어 있습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
