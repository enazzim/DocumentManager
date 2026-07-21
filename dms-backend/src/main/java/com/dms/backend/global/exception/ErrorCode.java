package com.dms.backend.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common Errors
    INVALID_INPUT_VALUE("C001", "잘못된 입력값입니다.", 400),
    METHOD_NOT_ALLOWED("C002", "지원하지 않는 HTTP 메서드입니다.", 405),
    INTERNAL_SERVER_ERROR("C003", "서버 내부 오류가 발생했습니다.", 500),

    // Auth & Security Errors
    UNAUTHORIZED("A001", "인증 정보가 유효하지 않거나 만료되었습니다.", 401),
    FORBIDDEN("A002", "해당 리소스에 대한 접근 권한이 없습니다.", 403),
    INVALID_TOKEN("A003", "손상되거나 유효하지 않은 JWT 토큰입니다.", 401),
    USER_NOT_FOUND("A004", "존재하지 않는 사용자 계정입니다.", 404),
    DUPLICATE_EMAIL("A005", "이미 등록된 이메일 주소입니다.", 409),

    // Document & Drawing Errors
    DOCUMENT_NOT_FOUND("D001", "존재하지 않는 문서입니다.", 404),
    DRAWING_NOT_FOUND("D002", "존재하지 않는 도면 메타데이터입니다.", 404),
    FILE_STORAGE_ERROR("D003", "파일 저장 또는 다운로드 처리 중 오류가 발생했습니다.", 500),
    FILE_CORRUPTED("D004", "파일 위변조 체크섬 검사 실패 또는 파일이 손상되었습니다.", 400),
    LOCK_CONFLICT("D005", "동시성 수정 락 충돌이 발생했습니다. 다시 시도해주세요.", 409);

    private final String code;
    private final String message;
    private final int status;
}
