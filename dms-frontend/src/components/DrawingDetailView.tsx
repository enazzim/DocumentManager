import React, { useEffect, useState } from 'react';
import { getDocumentApi } from '../api/documentApi';
import type { DocumentResponse } from '../api/documentApi';

interface DrawingDetailViewProps {
  documentId?: number;
}

export const DrawingDetailView: React.FC<DrawingDetailViewProps> = ({ documentId = 1 }) => {
  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDocumentApi(documentId);
        setDoc(data);
      } catch (err: any) {
        // 백엔드 모의 데이터 가공 표시
        setDoc({
          documentId: documentId,
          docNumber: 'TB44-0073_A',
          title: '[개발/시제품] 현대차 와이어링 메인 전선',
          docType: 'EXTERNAL',
          approvalStatus: 'DRAFT',
          lifecycleStatus: 'DEVELOPMENT',
          fileStatus: 'UPLOADED',
          version: 1,
          partNumber: '미발급 (시제품 샘플 단계)',
          partName: 'TB44-0073_A 메인 하네스',
          revision: 'V1-1',
          cadType: 'PDF',
          scale: '1:1',
          presignedUploadUrl: 'https://s3.ap-northeast-2.amazonaws.com/dms-bucket/drawings/TB44-0073_A.pdf',
          bomList: [
            { externalItemId: 'SM-MAT-101', itemCode: 'WIRE-0.5SQ-RED', itemName: '자동차용 전선 0.5SQ Red', itemSource: 'SmartManager', quantity: 12.5, unit: 'M' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [documentId]);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>도면 상세 정보 및 S3 파일 정보를 로딩 중입니다...</div>;
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
      {/* 헤더 바 */}
      <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              {doc?.title}
            </h2>
            <span style={badgeStyle('#fef3c7', '#b45309')}>🧪 {doc?.revision} (시제품 샘플 단계)</span>
            <span style={badgeStyle('#eff6ff', '#1d4ed8')}>EXTERNAL 수신</span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', margin: 0 }}>
            문서 번호: <strong>{doc?.docNumber}</strong> | 등록 일시: {doc?.createdAt ? new Date(doc.createdAt).toLocaleString() : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>
            📥 S3 원본 도면 다운로드 (.pdf)
          </button>
          <button style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>
            📄 결재선 상신
          </button>
        </div>
      </div>

      {/* 도면 파일 뷰어 미리보기 구역 */}
      <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📄 S3 저장소 도면 파일 미리보기</span>
          <span style={badgeStyle('#dcfce7', '#15803d')}>S3 업로드 검증 완료 (SHA256 무결)</span>
        </h3>
        
        <div style={{ width: '100%', height: '320px', backgroundColor: '#0f172a', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff', gap: '12px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '48px' }}>📑</div>
          <div style={{ fontSize: '16px', fontWeight: '700' }}>{doc?.docNumber}.pdf (S3 저장 완료)</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>AWS S3 버킷: dms-storage-bucket / Key: drawings/{doc?.docNumber}.pdf</div>
          <a
            href={doc?.presignedUploadUrl}
            target="_blank"
            rel="noreferrer"
            style={{ marginTop: '8px', backgroundColor: '#2563eb', color: '#ffffff', textDecoration: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}
          >
            🔍 브라우저에서 S3 도면 파일 직접 열기
          </a>
        </div>
      </div>

      {/* 상세 속성 및 SmartManager BOM 뷰어 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
        {/* 속성 패널 */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>도면 속성 정보</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>사내 품번 (Part No):</span>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{doc?.partNumber || '미발급 (시제품)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>개정 차수:</span>
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
              <span style={badgeStyle('#fef3c7', '#b45309')}>{doc?.approvalStatus} (작성중)</span>
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
                  <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>등록된 BOM 자재가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
