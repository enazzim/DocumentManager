import React from 'react';

interface LayoutProps {
  activeMenu: string;
  onSelectMenu: (menuId: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeMenu, onSelectMenu, children }) => {
  const menuItems = [
    {
      category: '종합 대시보드',
      items: [
        { id: 'dashboard', label: '부서별 스마트 대시보드', icon: '📊' },
      ],
    },
    {
      category: '전자 결재',
      items: [
        { id: 'approval-submit', label: '결재선 지정 & 상신', icon: '📤' },
        { id: 'approval-action', label: '결재 심사 (승인/반려)', icon: '⚖️' },
        { id: 'approval-list', label: '결재 진행 문서함', icon: '📋' },
      ],
    },
    {
      category: '일반 문서 관리',
      items: [
        { id: 'doc-upload', label: '일반 문서 기안 등록', icon: '📄' },
        { id: 'doc-list', label: '일반 문서 대장 조회', icon: '📁' },
      ],
    },
    {
      category: '도면 관리',
      items: [
        { id: 'drawing-upload', label: '도면 기안 & 외부 BOM 등록', icon: '📝' },
        { id: 'drawing-detail', label: '도면 상세 & BOM 뷰어', icon: '🔍' },
      ],
    },
    {
      category: '현장 원격 통제',
      items: [
        { id: 'sse-monitor', label: '현장 단말 SSE 실시간 모니터링', icon: '📟' },
      ],
    },
    {
      category: '외부 연동',
      items: [
        { id: 'sso-smartmanager', label: 'SmartManager (SSO)', icon: '🏢' },
      ],
    },
  ];

  const handleMenuClick = (id: string) => {
    if (id === 'sso-smartmanager') {
      alert('[SmartManager SSO] 사내 ERP/SmartManager 시스템으로 단일 인증(SSO) 로그인합니다.');
      window.open('https://smartmanager.company.com/sso/login?token=MOCK_SSO_TOKEN_2026', '_blank');
      return;
    }
    onSelectMenu(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", backgroundColor: '#f8fafc' }}>
      
      {/* 1. 상단 헤더 바 (Top Header Bar) */}
      <header style={{ height: '60px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
            D
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' }}>DMS 결재문서도면 관리 시스템</span>
          <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' }}>
            Agentic Harness v2026.7
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '20px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }}></span>
            <span>시스템 정상 작동 중</span>
          </div>
          <div style={{ color: '#e2e8f0', fontWeight: '500' }}>
            👤 홍길동 수석연구원 <span style={{ color: '#64748b', fontSize: '12px' }}>(설계기술팀)</span>
          </div>
        </div>
      </header>

      {/* 2단 및 3단 본문 레이아웃 (Main Container) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 2. 좌측 메뉴 사이드바 (Left Navigation Bar) */}
        <aside style={{ width: '250px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '16px 12px', gap: '20px', overflowY: 'auto' }}>
          {menuItems.map((group, idx) => (
            <div key={idx}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '8px' }}>
                {group.category}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.items.map((item) => {
                  const isActive = activeMenu === item.id;
                  const isSso = item.id.startsWith('sso-');
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: isActive ? '#eff6ff' : isSso ? '#f0fdf4' : 'transparent',
                        color: isActive ? '#2563eb' : isSso ? '#166534' : '#475569',
                        fontWeight: isActive || isSso ? '700' : '500',
                        fontSize: '13.5px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{item.icon}</span>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 'auto', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
            <div style={{ fontWeight: '600', color: '#334155', marginBottom: '2px' }}>SmartManager 상태</div>
            <div>BOM 마스터 바인딩 활성화</div>
          </div>
        </aside>

        {/* 3. 우측 메인 개별 화면 영역 (Right Content Panel) */}
        <main style={{ flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto', padding: '20px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
