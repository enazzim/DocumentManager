import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DrawingUploadForm } from './components/DrawingUploadForm';
import { DrawingDetailView } from './components/DrawingDetailView';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<number>(1);

  const handleNavigateToDetail = (docId: number) => {
    setSelectedDocId(docId);
    setActiveMenu('drawing-detail');
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'approval-submit':
        return (
          <div style={containerStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>결재선 지정 & 상신</h2>
            <p style={{ color: '#64748b', marginTop: '6px' }}>전자 결재 상신 및 차수별 결재자 지정 구역입니다.</p>
          </div>
        );
      case 'approval-action':
        return (
          <div style={containerStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>결재 심사 (승인/반려)</h2>
            <p style={{ color: '#64748b', marginTop: '6px' }}>결재자 전용 도면 검토 및 승인/반려 심사 구역입니다.</p>
          </div>
        );
      case 'approval-list':
        return (
          <div style={containerStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>결재 진행 문서함</h2>
            <p style={{ color: '#64748b', marginTop: '6px' }}>진행 중이거나 승인 완료된 결재 문서 대장입니다.</p>
          </div>
        );
      case 'doc-upload':
        return (
          <div style={containerStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>일반 문서 기안 등록</h2>
            <p style={{ color: '#64748b', marginTop: '6px' }}>일반 서류/보고서 기안 작성 구역입니다.</p>
          </div>
        );
      case 'doc-list':
        return (
          <div style={containerStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>일반 문서 대장 조회</h2>
            <p style={{ color: '#64748b', marginTop: '6px' }}>등록된 일반 문서를 통합 조회합니다.</p>
          </div>
        );
      case 'drawing-upload':
        return <DrawingUploadForm onSuccessNavigate={handleNavigateToDetail} />;
      case 'drawing-detail':
        return <DrawingDetailView documentId={selectedDocId} />;
      case 'sse-monitor':
        return (
          <div style={containerStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>현장 단말 SSE 실시간 모니터링</h2>
            <p style={{ color: '#64748b', marginTop: '6px' }}>현장 단말기 화면 원격 강제 제어 및 SSE 실시간 대시보드 구역입니다.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeMenu={activeMenu} onSelectMenu={setActiveMenu}>
      {renderContent()}
    </Layout>
  );
}

export default App;
