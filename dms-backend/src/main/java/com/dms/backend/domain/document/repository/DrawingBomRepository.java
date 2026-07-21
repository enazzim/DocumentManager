package com.dms.backend.domain.document.repository;

import com.dms.backend.domain.document.entity.DrawingBom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DrawingBomRepository extends JpaRepository<DrawingBom, Long> {
    List<DrawingBom> findByDocument_DocumentId(Long documentId);
    List<DrawingBom> findByItemCode(String itemCode);
    List<DrawingBom> findByExternalItemIdAndItemSource(String externalItemId, String itemSource);
}
