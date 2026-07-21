package com.dms.backend.domain.document.enums;

public enum FileStatus {
    STAGED,          // 파일 최초 업로드 (임시 적재)
    PENDING_CONFIRM, // 파일 커밋 (검증 큐 적재)
    CONFIRMED,       // 무결성 검증 통과 (정상)
    CORRUPTED,       // 무결성 에러 / 감염
    MOVE_FAILED      // 영구 보관소 이관 실패
}
