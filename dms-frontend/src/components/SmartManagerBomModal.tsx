import React, { useState } from 'react';
import type { DrawingBomDto } from '../api/documentApi';

interface SmartManagerBomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItems: (selectedBoms: DrawingBomDto[]) => void;
}

export const SmartManagerBomModal: React.FC<SmartManagerBomModalProps> = ({ isOpen, onClose, onSelectItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  // SmartManager ERP에 등록된 정식 자재 마스터 모의 데이터
  const masterItems: DrawingBomDto[] = [
    { externalItemId: 'SM-MAT-101', itemCode: 'WIRE-0.5SQ-RED', itemName: '자동차용 전선 0.5SQ Red', itemSource: 'SmartManager', quantity: 12.5, unit: 'M' },
    { externalItemId: 'SM-MAT-102', itemCode: 'WIRE-0.75SQ-BLK', itemName: '자동차용 전선 0.75SQ Black', itemSource: 'SmartManager', quantity: 8.0, unit: 'M' },
    { externalItemId: 'SM-C-990', itemCode: 'CONN-HEADER-12P', itemName: '12핀 헤더 커넥터', itemSource: 'SmartManager', quantity: 2.0, unit: 'EA' },
    { externalItemId: 'SM-TERM-01', itemCode: 'TERM-FEMALE-0.5', itemName: '암 단자 터미널 0.5', itemSource: 'SmartManager', quantity: 12.0, unit: 'EA' },
    { externalItemId: 'SM-TUBE-20', itemCode: 'TUBE-PVC-20MM', itemName: '난연 PVC 보호 튜브 20mm', itemSource: 'SmartManager', quantity: 3.5, unit: 'M' },
  ];

  const filteredItems = masterItems.filter(
    (item) =>
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.externalItemId && item.externalItemId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleToggleSelect = (externalItemId: string) => {
    if (selectedIds.includes(externalItemId)) {
      setSelectedIds(selectedIds.filter((id) => id !== externalItemId));
    } else {
      setSelectedIds([...selectedIds, externalItemId]);
    }
  };

  const handleApply = () => {
    const selectedBoms = masterItems.filter((item) => item.externalItemId && selectedIds.includes(item.externalItemId));
    onSelectItems(selectedBoms);
    setSelectedIds([]);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#ffffff', width: '680px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {/* 모달 헤더 */}
        <div style={{ padding: '20px 24px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>🏢 SmartManager 자재 마스터 검색 및 가져오기</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>사내 SmartManager ERP 자재 목록에서 BOM 항목을 선택해 폼으로 가져옵니다.</p>
          </div>
          <button onClick={onClose} style={{ backgroundColor: 'transparent', color: '#94a3b8', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>

        {/* 모달 검색바 */}
        <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="자재 코드, 자재명 또는 SmartManager Item ID 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* 자재 테이블 */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px', width: '40px', textAlign: 'center' }}>선택</th>
                <th style={{ padding: '8px' }}>SmartManager Item ID</th>
                <th style={{ padding: '8px' }}>자재 코드</th>
                <th style={{ padding: '8px' }}>자재명</th>
                <th style={{ padding: '8px' }}>기본단위</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isChecked = item.externalItemId ? selectedIds.includes(item.externalItemId) : false;
                return (
                  <tr
                    key={item.externalItemId}
                    onClick={() => item.externalItemId && handleToggleSelect(item.externalItemId)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: isChecked ? '#eff6ff' : 'transparent' }}
                  >
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                      />
                    </td>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>{item.externalItemId}</td>
                    <td style={{ padding: '10px 8px', fontWeight: '700', color: '#0f172a' }}>{item.itemCode}</td>
                    <td style={{ padding: '10px 8px' }}>{item.itemName}</td>
                    <td style={{ padding: '10px 8px', color: '#64748b' }}>{item.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 모달 푸터 */}
        <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
            선택된 자재: <strong style={{ color: '#2563eb' }}>{selectedIds.length}</strong> 건
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
              취소
            </button>
            <button
              onClick={handleApply}
              disabled={selectedIds.length === 0}
              style={{ backgroundColor: selectedIds.length > 0 ? '#059669' : '#cbd5e1', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed' }}
            >
              🔗 선택 자재 BOM으로 가져오기 ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
