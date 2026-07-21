package com.dms.backend.domain.document.service;

import com.dms.backend.domain.document.dto.*;
import com.dms.backend.domain.document.entity.*;
import com.dms.backend.domain.document.enums.*;
import com.dms.backend.domain.document.repository.*;
import com.dms.backend.global.exception.CustomException;
import com.dms.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DrawingDetailRepository drawingDetailRepository;
    private final DrawingBomRepository drawingBomRepository;
    private final DocumentAuditLogRepository auditLogRepository;

    @Transactional
    public DocumentResponse createDocument(DocumentCreateRequest request) {
        log.info("Creating or updating document: docNumber={}, docType={}", request.getDocNumber(), request.getDocType());

        String resolvedPartNumber = (request.getPartNumber() != null && !request.getPartNumber().trim().isEmpty())
                ? request.getPartNumber().trim()
                : "미발급 (시제품 샘플)";

        ApprovalStatus initialApproval = (request.getDocType() == DocType.EXTERNAL) 
                ? ApprovalStatus.APPROVED 
                : ApprovalStatus.DRAFT;
        
        LifecycleStatus initialLifecycle = (request.getDocType() == DocType.EXTERNAL)
                ? LifecycleStatus.ACTIVE
                : LifecycleStatus.DRAFT;

        Document document = documentRepository.findByDocNumber(request.getDocNumber())
                .orElseGet(() -> Document.builder()
                        .docNumber(request.getDocNumber())
                        .authorId(request.getAuthorId() != null ? request.getAuthorId() : 1L)
                        .version(1)
                        .build());

        document.setTitle(request.getTitle());
        document.setDocType(request.getDocType());
        document.setApprovalStatus(initialApproval);
        document.setLifecycleStatus(initialLifecycle);
        document.setFileStatus(FileStatus.STAGED);

        Document savedDoc = documentRepository.save(document);

        // 2. 도면 세부 정보 생성 또는 업데이트
        DrawingDetail drawingDetail = drawingDetailRepository.findByDocument_DocumentId(savedDoc.getDocumentId())
                .orElseGet(() -> DrawingDetail.builder().document(savedDoc).build());

        drawingDetail.setPartNumber(resolvedPartNumber);
        drawingDetail.setPartName(request.getPartName() != null ? request.getPartName() : request.getTitle());
        drawingDetail.setRevision(request.getRevision() != null ? request.getRevision() : "V1-1");
        drawingDetail.setCadType(request.getCadType());
        drawingDetail.setScale(request.getScale());

        drawingDetailRepository.save(drawingDetail);

        // 3. 외부 BOM 목록 저장 (기존 BOM 삭제 후 재등록)
        drawingBomRepository.deleteByDocument_DocumentId(savedDoc.getDocumentId());
        if (request.getBomList() != null && !request.getBomList().isEmpty()) {
            List<DrawingBom> boms = request.getBomList().stream()
                    .map(dto -> DrawingBom.builder()
                            .document(savedDoc)
                            .externalItemId(dto.getExternalItemId())
                            .itemCode(dto.getItemCode())
                            .itemName(dto.getItemName())
                            .itemSource(dto.getItemSource() != null ? dto.getItemSource() : "SmartManager")
                            .quantity(dto.getQuantity())
                            .unit(dto.getUnit())
                            .build())
                    .collect(Collectors.toList());
            drawingBomRepository.saveAll(boms);
        }

        // 4. 감사 로그 기록
        DocumentAuditLog auditLog = DocumentAuditLog.builder()
                .documentId(savedDoc.getDocumentId())
                .actionType("CREATE")
                .actorId(savedDoc.getAuthorId())
                .reason("도면 기안/수정 (" + request.getDocType() + ")")
                .build();
        auditLogRepository.save(auditLog);

        // 5. S3 업로드용 Presigned URL 모의 생성
        String mockPresignedUrl = "https://dms-s3-bucket.s3.amazonaws.com/staged/" + savedDoc.getDocNumber() + "?presigned=true";

        return convertToResponse(savedDoc, drawingDetail, mockPresignedUrl);
    }

    public DocumentResponse getDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException(ErrorCode.DOCUMENT_NOT_FOUND, "존재하지 않는 도면입니다: " + documentId));
        DrawingDetail detail = drawingDetailRepository.findByDocument_DocumentId(documentId).orElse(null);
        return convertToResponse(document, detail, null);
    }

    public List<DocumentResponse> getAllDocuments() {
        return documentRepository.findAll().stream()
                .map(doc -> {
                    DrawingDetail detail = drawingDetailRepository.findByDocument_DocumentId(doc.getDocumentId()).orElse(null);
                    return convertToResponse(doc, detail, null);
                })
                .collect(Collectors.toList());
    }

    private DocumentResponse convertToResponse(Document doc, DrawingDetail detail, String presignedUrl) {
        List<DrawingBom> boms = drawingBomRepository.findByDocument_DocumentId(doc.getDocumentId());
        List<DrawingBomDto> bomDtos = boms.stream()
                .map(b -> DrawingBomDto.builder()
                        .externalItemId(b.getExternalItemId())
                        .itemCode(b.getItemCode())
                        .itemName(b.getItemName())
                        .itemSource(b.getItemSource())
                        .quantity(b.getQuantity())
                        .unit(b.getUnit())
                        .build())
                .collect(Collectors.toList());

        return DocumentResponse.builder()
                .documentId(doc.getDocumentId())
                .docNumber(doc.getDocNumber())
                .title(doc.getTitle())
                .docType(doc.getDocType())
                .approvalStatus(doc.getApprovalStatus())
                .lifecycleStatus(doc.getLifecycleStatus())
                .fileStatus(doc.getFileStatus())
                .version(doc.getVersion())
                .partNumber(detail != null ? detail.getPartNumber() : null)
                .partName(detail != null ? detail.getPartName() : null)
                .revision(detail != null ? detail.getRevision() : null)
                .cadType(detail != null ? detail.getCadType() : null)
                .scale(detail != null ? detail.getScale() : null)
                .presignedUploadUrl(presignedUrl)
                .bomList(bomDtos)
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }

    /**
     * 도면 문서 및 연관 BOM/Detail 정보 안전 삭제 (폐기)
     */
    @Transactional
    public void deleteDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException(ErrorCode.DOCUMENT_NOT_FOUND));

        drawingBomRepository.deleteByDocument_DocumentId(documentId);
        drawingDetailRepository.deleteByDocument_DocumentId(documentId);
        documentRepository.delete(document);
        log.info("[도면 삭제] 문서 ID #{} 안전 폐기 완료", documentId);
    }
}
