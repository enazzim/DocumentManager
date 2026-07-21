package com.dms.backend.domain.approval.repository;

import com.dms.backend.domain.approval.entity.ApprovalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalLineRepository extends JpaRepository<ApprovalLine, Long> {
    List<ApprovalLine> findByDocument_DocumentIdOrderByStepSequenceAsc(Long documentId);
}
