package com.dms.backend.domain.document.enums;

public enum LifecycleStatus {
    DRAFT,           // 임시 / 비활성
    DEVELOPMENT,     // 시제품 / 개발 도면
    MASS_PRODUCTION, // 양산 확정 도면
    ACTIVE,          // 현장 배포 활성 도면
    SUPERSEDED,      // 개정되어 구버전화
    DEPRECATED,      // 단종 / 사용 폐기
    DELETED          // 논리 삭제
}
