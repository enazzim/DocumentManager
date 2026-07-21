package com.dms.backend.domain.document.repository;

import com.dms.backend.domain.document.entity.DocumentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentAuditLogRepository extends JpaRepository<DocumentAuditLog, Long> {
    List<DocumentAuditLog> findByDocumentIdOrderByCreatedAtDesc(Long documentId);
}
