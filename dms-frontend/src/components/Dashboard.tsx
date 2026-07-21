import React, { useEffect, useState } from 'react';
import axios from 'axios';

type RoleType = 'EXECUTIVE' | 'PROCUREMENT' | 'PRODUCTION' | 'QUALITY' | 'ENGINEERING';

interface DocumentRecord {
  documentId: number;
  docNumber: string;
  title: string;
  docType: string;
  approvalStatus: string;
  lifecycleStatus: string;
  version: number;
  partNumber?: string;
  partName?: string;
  revision?: string;
  bomList?: any[];
  createdAt?: string;
}

export const Dashboard: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleType>('EXECUTIVE');
  const [dbDocs, setDbDocs] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await axios.get('/api/v1/documents');
        const data = response.data?.data || response.data || [];
        if (Array.isArray(data)) {
          setDbDocs(data);
        }
      } catch (e) {
        console.warn('대시보드 실시간 DB 수신 실패:', e);
        setDbDocs([]);
      }
    };
    fetchDocs();
  }, []);

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  };

  const badgeStyle = (bgColor: string, color: string): React.CSSProperties => ({
    backgroundColor: bgColor,
    color: color,
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  });

  const activeDocs = dbDocs.filter((d) => d.lifecycleStatus === 'ACTIVE' || d.approvalStatus === 'APPROVED');
  const pendingDocs = dbDocs.filter((d) => d.approvalStatus === 'DRAFT' || d.approvalStatus === 'UNDER_REVIEW');
  const rejectedDocs = dbDocs.filter((d) => d.approvalStatus === 'REJECTED');
  const devDocs = dbDocs.filter((d) => d.lifecycleStatus === 'DEVELOPMENT' || d.lifecycleStatus === 'DRAFT');
  const bomsCount = dbDocs.reduce((acc, curr) => acc + (curr.bomList ? curr.bomList.length : 0), 0);

  return (
    <div style={{ width: '100%' }}>
      {/* 상단 테스트용 권한 콤보박스 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            부서/권한별 맞춤 대시보드
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            실시간 백엔드 DB 연동 데이터로 부서별 핵심 지표 및 현황표를 조회합니다. (총 {dbDocs.length}건 등록)
          </p>
        </div>

        {/* 권한 스위칭 콤보박스 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>접속 권한 선택:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as RoleType)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid #2563eb',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 2px 4px rgba(37,99,235,0.1)'
            }}
          >
            <option value="EXECUTIVE">👑 대표이사 / 전무 (Executive)</option>
            <option value="PROCUREMENT">🛒 구매 / 자재부서 (Procurement)</option>
            <option value="PRODUCTION">🏭 생산 / 현장부서 (Production)</option>
            <option value="QUALITY">🔬 품질보증 / QA부서 (Quality)</option>
            <option value="ENGINEERING">📐 설계 / 관리부서 (Engineering)</option>
          </select>
        </div>
      </div>

      {/* ========================================================
          1. 👑 대표이사 / 전무 (Executive View)
      ======================================================== */}
      {selectedRole === 'EXECUTIVE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>전사 결재 대기건</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', margin: '8px 0' }}>{pendingDocs.length} 건</div>
              <span style={badgeStyle('#fef2f2', '#991b1b')}>DB 실시간 반영</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>수신/등록 도면 (ACTIVE)</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '8px 0' }}>{activeDocs.length} 건</div>
              <span style={badgeStyle('#eff6ff', '#1d4ed8')}>즉시 배포 완료</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>개발/시제품 도면</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', margin: '8px 0' }}>{devDocs.length} 건</div>
              <span style={badgeStyle('#f0fdf4', '#15803d')}>샘플 검증 단계</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>등록된 BOM 자재 총수</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed', margin: '8px 0' }}>{bomsCount} 개</div>
              <span style={badgeStyle('#f5f3ff', '#6d28d9')}>BOM 데이터 바인딩</span>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>👑 임원 전용: 전사 등록 도면 현황</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>문서 ID</th>
                  <th style={{ padding: '8px' }}>도면 번호</th>
                  <th style={{ padding: '8px' }}>도면 제목</th>
                  <th style={{ padding: '8px' }}>승인 상태</th>
                  <th style={{ padding: '8px' }}>라이프사이클</th>
                </tr>
              </thead>
              <tbody>
                {dbDocs.length > 0 ? (
                  dbDocs.map((doc) => (
                    <tr key={doc.documentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#64748b' }}>#{doc.documentId}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '600', color: '#2563eb' }}>{doc.docNumber}</td>
                      <td style={{ padding: '10px 8px' }}>{doc.title}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={badgeStyle('#eff6ff', '#1d4ed8')}>{doc.approvalStatus}</span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={badgeStyle('#f0fdf4', '#15803d')}>{doc.lifecycleStatus}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      등록된 실시간 DB 도면 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          2. 🛒 구매 / 자재부서 (Procurement View)
      ======================================================== */}
      {selectedRole === 'PROCUREMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>SmartManager 등록 BOM</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '8px 0' }}>{bomsCount} 개</div>
              <span style={badgeStyle('#eff6ff', '#1d4ed8')}>실제 DB 등록 수량</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>등록 도면 수량</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', margin: '8px 0' }}>{dbDocs.length} 건</div>
              <span style={badgeStyle('#f0fdf4', '#15803d')}>DB 연동 완료</span>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>🛒 구매팀 전용: 도면별 BOM 자재 내역</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>도면번호</th>
                  <th style={{ padding: '8px' }}>자재 코드</th>
                  <th style={{ padding: '8px' }}>자재명</th>
                  <th style={{ padding: '8px' }}>수량</th>
                  <th style={{ padding: '8px' }}>출처</th>
                </tr>
              </thead>
              <tbody>
                {dbDocs.some((d) => d.bomList && d.bomList.length > 0) ? (
                  dbDocs.flatMap((doc) =>
                    (doc.bomList || []).map((bom, idx) => (
                      <tr key={`${doc.documentId}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 8px', fontWeight: '600' }}>{doc.docNumber}</td>
                        <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>{bom.itemCode}</td>
                        <td style={{ padding: '10px 8px' }}>{bom.itemName}</td>
                        <td style={{ padding: '10px 8px', fontWeight: '700' }}>{bom.quantity} {bom.unit}</td>
                        <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#dcfce7', '#15803d')}>{bom.itemSource || 'SmartManager'}</span></td>
                      </tr>
                    ))
                  )
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      등록된 BOM 자재 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          3. 🏭 생산 / 현장부서 (Production View)
      ======================================================== */}
      {selectedRole === 'PRODUCTION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ cardStyle }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>🏭 생산팀 전용: 최신 도면 배포 대장</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>도면번호</th>
                  <th style={{ padding: '8px' }}>도면명</th>
                  <th style={{ padding: '8px' }}>개정 차수</th>
                  <th style={{ padding: '8px' }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {dbDocs.length > 0 ? (
                  dbDocs.map((doc) => (
                    <tr key={doc.documentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600' }}>{doc.docNumber}</td>
                      <td style={{ padding: '10px 8px' }}>{doc.title}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '700', color: '#2563eb' }}>{doc.revision || 'V1-1'}</td>
                      <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#dcfce7', '#15803d')}>{doc.lifecycleStatus}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      등록된 도면이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          4. 🔬 품질보증 / QA부서 (Quality View) & 5. 📐 설계 / 관리부서
      ======================================================== */}
      {(selectedRole === 'QUALITY' || selectedRole === 'ENGINEERING') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>도면 기안 및 검사 대장</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>도면번호</th>
                  <th style={{ padding: '8px' }}>도면명</th>
                  <th style={{ padding: '8px' }}>결재 상태</th>
                </tr>
              </thead>
              <tbody>
                {dbDocs.length > 0 ? (
                  dbDocs.map((doc) => (
                    <tr key={doc.documentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: '600' }}>{doc.docNumber}</td>
                      <td style={{ padding: '10px 8px' }}>{doc.title}</td>
                      <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#eff6ff', '#1d4ed8')}>{doc.approvalStatus}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      등록된 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
