import React, { useState } from 'react';

type RoleType = 'EXECUTIVE' | 'PROCUREMENT' | 'PRODUCTION' | 'QUALITY' | 'ENGINEERING';

export const Dashboard: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleType>('EXECUTIVE');

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

  return (
    <div style={{ width: '100%' }}>
      {/* 상단 테스트용 권한 콤보박스 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#ffffff', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            부서/권한별 맞춤 대시보드
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            선택한 권한에 따라 최적화된 4대 핵심 카드 지표와 세부 현황표가 즉시 전환됩니다.
          </p>
        </div>

        {/* 권한 스위칭 콤보박스 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>[테스트] 접속 권한 선택:</label>
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
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', margin: '8px 0' }}>3 건</div>
              <span style={badgeStyle('#fef2f2', '#991b1b')}>⚠️ 3일 이상 지연 1건</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>수신 바이어 도면</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '8px 0' }}>24 건</div>
              <span style={badgeStyle('#eff6ff', '#1d4ed8')}>즉시 배포 완료 (ACTIVE)</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>평균 결재 리드타임</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', margin: '8px 0' }}>1.2 일</div>
              <span style={badgeStyle('#f0fdf4', '#15803d')}>전월 대비 0.5일 단축</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>SmartManager 연동율</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed', margin: '8px 0' }}>99.4 %</div>
              <span style={badgeStyle('#f5f3ff', '#6d28d9')}>BOM 마스터 바인딩 정상</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>👑 임원 전용: 전사 결재 진행 현황</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>도면 번호</th>
                    <th style={{ padding: '8px' }}>도면명 / 바이어</th>
                    <th style={{ padding: '8px' }}>기안자</th>
                    <th style={{ padding: '8px' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontWeight: '600' }}>DWG-2026-X001</td>
                    <td style={{ padding: '10px 8px' }}>기아차 메인 배선 도면</td>
                    <td style={{ padding: '10px 8px' }}>홍길동 수석</td>
                    <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#fef3c7', '#b45309')}>2차 결재 심사중</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontWeight: '600' }}>DWG-2026-EXT-99</td>
                    <td style={{ padding: '10px 8px' }}>현대차 와이어링 도면</td>
                    <td style={{ padding: '10px 8px' }}>바이어 수신</td>
                    <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#dcfce7', '#15803d')}>배포완료 (ACTIVE)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>부서별 결재 처리 지연 현황</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>품질보증팀 (QA)</span>
                    <span style={{ fontWeight: '700', color: '#dc2626' }}>2.1일 소요</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                    <div style={{ width: '80%', height: '100%', backgroundColor: '#ef4444', borderRadius: '4px' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>설계기술팀</span>
                    <span style={{ fontWeight: '700', color: '#059669' }}>0.8일 소요</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                    <div style={{ width: '30%', height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            </div>
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
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>SmartManager 미발주 BOM</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', margin: '8px 0' }}>8 개</div>
              <span style={badgeStyle('#fef2f2', '#991b1b')}>발주 요청 수신 대기</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>BOM 자재 수량 증가건</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', margin: '8px 0' }}>12 건</div>
              <span style={badgeStyle('#fef3c7', '#b45309')}>Rev.B 개정 적용</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>최신 도면 자재 변동</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '8px 0' }}>5 건</div>
              <span style={badgeStyle('#eff6ff', '#1d4ed8')}>SmartManager 자재 교체</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>단종/대체 자재 위험</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', margin: '8px 0' }}>0 건</div>
              <span style={badgeStyle('#f0fdf4', '#15803d')}>정상 수급 가능</span>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>🛒 구매팀 전용: SmartManager 자재 발주 및 변동 대장</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>도면번호</th>
                  <th style={{ padding: '8px' }}>SmartManager Item ID</th>
                  <th style={{ padding: '8px' }}>자재명</th>
                  <th style={{ padding: '8px' }}>소요 수량</th>
                  <th style={{ padding: '8px' }}>발주 상태</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>DWG-2026-X001</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>SM-MAT-101</td>
                  <td style={{ padding: '10px 8px' }}>자동차용 전선 0.5SQ Red</td>
                  <td style={{ padding: '10px 8px', fontWeight: '700' }}>12.5 M</td>
                  <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#fee2e2', '#991b1b')}>발주 미완료</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>DWG-2026-EXT-99</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>SM-C-990</td>
                  <td style={{ padding: '10px 8px' }}>12핀 헤더 커넥터</td>
                  <td style={{ padding: '10px 8px', fontWeight: '700' }}>2 EA</td>
                  <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#dcfce7', '#15803d')}>발주 완료</span></td>
                </tr>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>오늘 현장 배포 도면 (ACTIVE)</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '8px 0' }}>42 건</div>
              <span style={badgeStyle('#eff6ff', '#1d4ed8')}>최신 개정 버전 즉시 적용</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Rev.B 개정 도면 적용률</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', margin: '8px 0' }}>100 %</div>
              <span style={badgeStyle('#f0fdf4', '#15803d')}>신규 차수 도면 전수 적용</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>구버전 도면 오작업 방지</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed', margin: '8px 0' }}>안전</div>
              <span style={badgeStyle('#f5f3ff', '#6d28d9')}>구형 도면 실시간 차단</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>현장 열람 다빈도 도면</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', margin: '8px 0' }}>15 건</div>
              <span style={badgeStyle('#fef3c7', '#b45309')}>생산 1라인 / 2라인</span>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>🏭 생산팀 전용: 생산 라인별 최신 작업 도면 대장</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>생산 라인</th>
                  <th style={{ padding: '8px' }}>도면번호</th>
                  <th style={{ padding: '8px' }}>부품/도면명</th>
                  <th style={{ padding: '8px' }}>적용 차수</th>
                  <th style={{ padding: '8px' }}>배포 상태</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>A라인 (메인하네스)</td>
                  <td style={{ padding: '10px 8px' }}>DWG-2026-EXT-99</td>
                  <td style={{ padding: '10px 8px' }}>현대차 와이어링 도면</td>
                  <td style={{ padding: '10px 8px', fontWeight: '700', color: '#2563eb' }}>Rev.B</td>
                  <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#dcfce7', '#15803d')}>작업중 (ACTIVE)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          4. 🔬 품질보증 / QA부서 (Quality View)
      ======================================================== */}
      {selectedRole === 'QUALITY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>품질 사유 도면 반려건</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', margin: '8px 0' }}>2 건</div>
              <span style={badgeStyle('#fef2f2', '#991b1b')}>재기안 요구 완료</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Revision 변경점 QA 검증</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', margin: '8px 0' }}>5 건</div>
              <span style={badgeStyle('#fef3c7', '#b45309')}>치수/스펙 심사 대기</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>바이어 규격 검사 적합률</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', margin: '8px 0' }}>98.9 %</div>
              <span style={badgeStyle('#f0fdf4', '#15803d')}>품질 표준 적합</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>도면 위변조 체크섬 검증</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '8px 0' }}>정상</div>
              <span style={badgeStyle('#eff6ff', '#1d4ed8')}>S3 체크섬 검증 무결</span>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>🔬 품질팀 전용: 도면 반려 사유 및 검사 대장</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>도면번호</th>
                  <th style={{ padding: '8px' }}>도면명</th>
                  <th style={{ padding: '8px' }}>품질 심사 상태</th>
                  <th style={{ padding: '8px' }}>반려/검토 사유</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>DWG-2026-QA-01</td>
                  <td style={{ padding: '10px 8px' }}>엔진룸 와이어링 도면</td>
                  <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#fee2e2', '#991b1b')}>반려 (REJECTED)</span></td>
                  <td style={{ padding: '10px 8px', color: '#dc2626' }}>단자 커넥터 핀 배열 규격 불일치로 반려</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          5. 📐 설계 / 관리부서 (Engineering View)
      ======================================================== */}
      {selectedRole === 'ENGINEERING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>결재 진행 중 도면 (맨 좌측)</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', margin: '8px 0' }}>3 건</div>
              <span style={badgeStyle('#fef3c7', '#b45309')}>2차 승인자 심사 진행중</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>수신 바이어 도면</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', margin: '8px 0' }}>24 건</div>
              <span style={badgeStyle('#eff6ff', '#1d4ed8')}>즉시 배포 완료 (ACTIVE)</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>SmartManager BOM 연동율</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', margin: '8px 0' }}>99.4 %</div>
              <span style={badgeStyle('#f0fdf4', '#15803d')}>BOM 자재 바인딩 정상</span>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>최신 도면 개정 갱신</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed', margin: '8px 0' }}>5 건</div>
              <span style={badgeStyle('#f5f3ff', '#6d28d9')}>Rev.B 변경 반영 완료</span>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>📐 설계팀 전용: 내 기안 도면 결재선 진행 현황</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>도면번호</th>
                  <th style={{ padding: '8px' }}>도면명</th>
                  <th style={{ padding: '8px' }}>개정차수</th>
                  <th style={{ padding: '8px' }}>결재선 진행 상태</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>DWG-2026-X001</td>
                  <td style={{ padding: '10px 8px' }}>기아차 메인 배선 도면</td>
                  <td style={{ padding: '10px 8px' }}>Rev.A</td>
                  <td style={{ padding: '10px 8px' }}><span style={badgeStyle('#fef3c7', '#b45309')}>2차 결재자 심사 중</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
