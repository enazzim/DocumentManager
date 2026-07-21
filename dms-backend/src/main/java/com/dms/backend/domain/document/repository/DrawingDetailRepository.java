package com.dms.backend.domain.document.repository;

import com.dms.backend.domain.document.entity.DrawingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DrawingDetailRepository extends JpaRepository<DrawingDetail, Long> {
    Optional<DrawingDetail> findByDocument_DocumentId(Long documentId);
    void deleteByDocument_DocumentId(Long documentId);
    Optional<DrawingDetail> findByPartNumberAndRevision(String partNumber, String revision);
}
