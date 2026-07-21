package com.dms.backend.domain.document.enums;

public enum ApprovalStatus {
    DRAFT,          // 기안 작성중
    UNDER_REVIEW,   // 결재 심사중
    APPROVED,       // 최종 승인 완료
    REJECTED,       // 결재 반려
    CANCELLED       // 기안 취소
}
