-- ========================================================
-- DocumentManager Database Schema (MariaDB 11.4 Target)
-- ========================================================

DROP TABLE IF EXISTS signature_keys_metadata;
DROP TABLE IF EXISTS approval_audit_logs;
DROP TABLE IF EXISTS system_notifications;
DROP TABLE IF EXISTS recent_searches;
DROP TABLE IF EXISTS saved_search_filters;
DROP TABLE IF EXISTS drawings;
DROP TABLE IF EXISTS documents;

-- 1. 일반 결재 및 도면 기안 문서 마스터 테이블
CREATE TABLE documents (
    id VARCHAR(36) NOT NULL,
    previous_version_document_id VARCHAR(36),
    document_no VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    document_type VARCHAR(20) NOT NULL, -- 'REQ'(품의), 'DRAW'(도면), 'PUR'(구매)
    workflow_type VARCHAR(20) NOT NULL, -- 'INTERNAL', 'EXTERNAL'
    approval_status VARCHAR(20) NOT NULL, -- DRAFT, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED
    lifecycle_status VARCHAR(20) NOT NULL, -- DRAFT, ACTIVE, SUPERSEDED, DEPRECATED, DELETED
    security_grade VARCHAR(20) NOT NULL DEFAULT 'GRADE_3', -- GRADE_1, GRADE_2, GRADE_3 (ABAC 속성)
    owner_department VARCHAR(50) NOT NULL, -- (ABAC 부서 속성)
    project_code VARCHAR(50), -- (ABAC 프로젝트 속성)
    version_major INT NOT NULL DEFAULT 1,
    version_minor INT NOT NULL DEFAULT 0,
    version_lock BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active_previous_id VARCHAR(36) GENERATED ALWAYS AS (
        CASE WHEN previous_version_document_id IS NULL THEN id 
             ELSE previous_version_document_id 
        END
    ) STORED,
    PRIMARY KEY (id),
    CONSTRAINT FK_Doc_PreviousVersion FOREIGN KEY (previous_version_document_id) REFERENCES documents(id),
    CONSTRAINT UQ_Document_No_Version UNIQUE (document_no, version_major, version_minor),
    CONSTRAINT UQ_Doc_ActivePrevious UNIQUE (active_previous_id),
    CONSTRAINT CHK_Doc_WorkflowType CHECK (workflow_type IN ('INTERNAL', 'EXTERNAL')),
    CONSTRAINT CHK_Doc_ApprovalStatus CHECK (approval_status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT CHK_Doc_LifecycleStatus CHECK (lifecycle_status IN ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'DEPRECATED', 'DELETED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 도면 상세 테이블
CREATE TABLE drawings (
    drawing_id VARCHAR(36) NOT NULL,
    part_no VARCHAR(50) NOT NULL,
    part_name VARCHAR(100) NOT NULL,
    model_group VARCHAR(50) NOT NULL, -- (ABAC 기종 속성)
    drawing_type VARCHAR(20) NOT NULL, -- 'DEV', 'PROD'
    storage_key VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    linearized BOOLEAN NOT NULL DEFAULT FALSE,
    file_state VARCHAR(20) NOT NULL, -- STAGED, PENDING_CONFIRM, CONFIRMED, MOVE_FAILED, CORRUPTED
    doc_approval_status VARCHAR(20) NOT NULL, 
    doc_lifecycle_status VARCHAR(20) NOT NULL, 
    hash_tags VARCHAR(500), -- 쉼표(,) 구분 다차원 검색용 태그
    version_lock BIGINT NOT NULL DEFAULT 0,
    active_part_key VARCHAR(150) GENERATED ALWAYS AS (
        CASE WHEN doc_lifecycle_status = 'ACTIVE' THEN CONCAT(part_no, '_', model_group) 
             ELSE drawing_id 
        END
    ) STORED,
    PRIMARY KEY (drawing_id),
    CONSTRAINT FK_Drawing_Document FOREIGN KEY (drawing_id) REFERENCES documents(id) ON DELETE RESTRICT,
    CONSTRAINT UQ_Drawing_ActivePartKey UNIQUE (active_part_key),
    CONSTRAINT CHK_Drawing_FileState CHECK (file_state IN ('STAGED', 'PENDING_CONFIRM', 'CONFIRMED', 'MOVE_FAILED', 'CORRUPTED')),
    CONSTRAINT CHK_Drawing_ApprovalStatus CHECK (doc_approval_status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT CHK_Drawing_LifecycleStatus CHECK (doc_lifecycle_status IN ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'DEPRECATED', 'DELETED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 즐겨찾는 검색 조건 저장 테이블
CREATE TABLE saved_search_filters (
    filter_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    filter_name VARCHAR(100) NOT NULL,
    query_json TEXT NOT NULL CHECK (JSON_VALID(query_json)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (filter_id),
    CONSTRAINT UQ_SavedSearch_UserFilter UNIQUE (user_id, filter_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 최근 검색 기록 저장 테이블
CREATE TABLE recent_searches (
    search_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id VARCHAR(50) NOT NULL,
    query_json TEXT NOT NULL CHECK (JSON_VALID(query_json)),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (search_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 알림 테이블 (Notification Domain)
CREATE TABLE system_notifications (
    notification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    recipient_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 감사 로그 테이블
CREATE TABLE approval_audit_logs (
    log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    approval_id VARCHAR(36) NOT NULL,
    document_id VARCHAR(36) NOT NULL,
    step_no INT NOT NULL,
    actor_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(30) NOT NULL,
    proxy_approver_id VARCHAR(50),
    proxy_reason TEXT,
    comment TEXT,
    old_steps_json LONGTEXT CHECK (JSON_VALID(old_steps_json)),
    new_steps_json LONGTEXT CHECK (JSON_VALID(new_steps_json)),
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id, logged_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (UNIX_TIMESTAMP(logged_at)) (
    PARTITION p2026_q1 VALUES LESS THAN (UNIX_TIMESTAMP('2026-04-01 00:00:00')),
    PARTITION p2026_q2 VALUES LESS THAN (UNIX_TIMESTAMP('2026-07-01 00:00:00')),
    PARTITION p2026_q3 VALUES LESS THAN (UNIX_TIMESTAMP('2026-10-01 00:00:00')),
    PARTITION p2026_q4 VALUES LESS THAN (UNIX_TIMESTAMP('2027-01-01 00:00:00')),
    PARTITION p_max VALUES LESS THAN MAXVALUE
);

-- 7. 서명 비밀키 상태 메타데이터 테이블 (유출 대비 무효화 지원)
CREATE TABLE signature_keys_metadata (
    key_id VARCHAR(50) NOT NULL,
    secret_key_encrypted VARCHAR(512) NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (key_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 부모 테이블 INSERT 시점의 workflow_type에 따른 status 및 EXTERNAL 임시 격리 대기 트리거
DELIMITER $$
CREATE TRIGGER trg_auto_approve_external
BEFORE INSERT ON documents
FOR EACH ROW
BEGIN
    IF NEW.workflow_type = 'EXTERNAL' THEN
        SET NEW.approval_status = 'APPROVED';
        SET NEW.lifecycle_status = 'DRAFT';
    ELSE
        SET NEW.approval_status = 'DRAFT';
        SET NEW.lifecycle_status = 'DRAFT';
    END IF;
END$$
DELIMITER ;

-- 9. 부모 테이블 INSERT 완료 직후 EXTERNAL 도면에 대한 SYSTEM 감사 로그 강제 적재 트리거
DELIMITER $$
CREATE TRIGGER trg_log_external_auto_approve
AFTER INSERT ON documents
FOR EACH ROW
BEGIN
    IF NEW.workflow_type = 'EXTERNAL' THEN
        INSERT INTO approval_audit_logs (
            approval_id, document_id, step_no, actor_id, action_type, comment
        ) VALUES (
            'SYSTEM_AUTO', NEW.id, 0, 'SYSTEM', 'AUTO_APPROVE_EXTERNAL', '바이어 도면 수신 즉시 배포 자동 승인 대기'
        );
    END IF;
END$$
DELIMITER ;

-- 10. 자식 도면 인서트 시점의 doc_status 자동 복사 트리거
DELIMITER $$
CREATE TRIGGER trg_set_initial_doc_status
BEFORE INSERT ON drawings
FOR EACH ROW
BEGIN
    SELECT approval_status, lifecycle_status INTO @app_status, @lf_status 
    FROM documents WHERE id = NEW.drawing_id;
    SET NEW.doc_approval_status = @app_status;
    SET NEW.doc_lifecycle_status = @lf_status;
END$$
DELIMITER ;

-- 11. 문서 상태 변경(UPDATE) 시 drawings 테이블 동기화 트리거
DELIMITER $$
CREATE TRIGGER trg_sync_doc_status
AFTER UPDATE ON documents
FOR EACH ROW
BEGIN
    IF NEW.approval_status <> OLD.approval_status OR NEW.lifecycle_status <> OLD.lifecycle_status THEN
        UPDATE drawings 
        SET doc_approval_status = NEW.approval_status, 
            doc_lifecycle_status = NEW.lifecycle_status,
            version_lock = version_lock + 1 
        WHERE drawing_id = NEW.id;
    END IF;
END$$
DELIMITER ;
