package com.dms.backend.domain.document.repository;

import com.dms.backend.domain.document.entity.Document;
import com.dms.backend.domain.document.enums.ApprovalStatus;
import com.dms.backend.domain.document.enums.LifecycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    Optional<Document> findByDocNumber(String docNumber);
    List<Document> findByApprovalStatus(ApprovalStatus status);
    List<Document> findByLifecycleStatus(LifecycleStatus status);
}
