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

import java.time.LocalDateTime;
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
        
        LifecycleStatus initialLifecycle;
        if (request.getLifecycleStatus() != null) {
            initialLifecycle = request.getLifecycleStatus();
        } else if (request.getTitle() != null && request.getTitle().contains("[개발/시제품]")) {
            initialLifecycle = LifecycleStatus.DEVELOPMENT;
        } else if (request.getTitle() != null && request.getTitle().contains("[양산확정]")) {
            initialLifecycle = LifecycleStatus.MASS_PRODUCTION;
        } else {
            initialLifecycle = LifecycleStatus.DEVELOPMENT;
        }

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

        LifecycleStatus resolvedLifecycle = doc.getLifecycleStatus();
        if (resolvedLifecycle == LifecycleStatus.ACTIVE || resolvedLifecycle == null) {
            if (doc.getTitle() != null && doc.getTitle().contains("[개발/시제품]")) {
                resolvedLifecycle = LifecycleStatus.DEVELOPMENT;
            } else if (doc.getTitle() != null && doc.getTitle().contains("[양산확정]")) {
                resolvedLifecycle = LifecycleStatus.MASS_PRODUCTION;
            }
        }

        List<DocumentAuditLog> auditLogs = auditLogRepository.findByDocumentIdOrderByCreatedAtDesc(doc.getDocumentId());
        List<DocumentAuditLogDto> auditLogDtos = auditLogs.stream()
                .map(a -> DocumentAuditLogDto.builder()
                        .auditLogId(a.getAuditLogId())
                        .documentId(a.getDocumentId())
                        .actionType(a.getActionType())
                        .actorId(a.getActorId())
                        .reason(a.getReason())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return DocumentResponse.builder()
                .documentId(doc.getDocumentId())
                .docNumber(doc.getDocNumber())
                .title(doc.getTitle())
                .docType(doc.getDocType())
                .approvalStatus(doc.getApprovalStatus())
                .lifecycleStatus(resolvedLifecycle)
                .fileStatus(doc.getFileStatus())
                .isDeleted(doc.getIsDeleted() != null ? doc.getIsDeleted() : false)
                .version(doc.getVersion())
                .partNumber(detail != null ? detail.getPartNumber() : null)
                .partName(detail != null ? detail.getPartName() : null)
                .revision(detail != null ? detail.getRevision() : null)
                .cadType(detail != null ? detail.getCadType() : null)
                .scale(detail != null ? detail.getScale() : null)
                .presignedUploadUrl(presignedUrl)
                .bomList(bomDtos)
                .auditLogs(auditLogDtos)
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }

    /**
     * 1. 소프트 삭제 (휴지통 이동)
     */
    @Transactional
    public void moveToTrash(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException(ErrorCode.DOCUMENT_NOT_FOUND, "존재하지 않는 도면입니다: " + documentId));

        document.setIsDeleted(true);
        document.setLifecycleStatus(LifecycleStatus.DELETED);
        documentRepository.save(document);
        log.info("[휴지통 이동] 문서 ID #{} (isDeleted=true)", documentId);
    }

    /**
     * 2. 도면 복구 (정상 대장으로 복원)
     */
    @Transactional
    public void restoreFromTrash(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException(ErrorCode.DOCUMENT_NOT_FOUND, "존재하지 않는 도면입니다: " + documentId));

        document.setIsDeleted(false);
        if (document.getTitle() != null && document.getTitle().contains("[개발/시제품]")) {
            document.setLifecycleStatus(LifecycleStatus.DEVELOPMENT);
        } else if (document.getTitle() != null && document.getTitle().contains("[양산확정]")) {
            document.setLifecycleStatus(LifecycleStatus.MASS_PRODUCTION);
        } else {
            document.setLifecycleStatus(LifecycleStatus.DEVELOPMENT);
        }
        documentRepository.save(document);
        log.info("[도면 복구] 문서 ID #{} (isDeleted=false, status={})", documentId, document.getLifecycleStatus());
    }

    /**
     * 3. 영구 삭제 (물리 삭제)
     */
    @Transactional
    public void deleteDocument(Long documentId) {
        java.util.Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isPresent()) {
            drawingBomRepository.deleteByDocument_DocumentId(documentId);
            drawingDetailRepository.deleteByDocument_DocumentId(documentId);
            documentRepository.delete(docOpt.get());
            log.info("[영구 삭제] 문서 ID #{} DB 물리 삭제 완료", documentId);
        } else {
            log.warn("[영구 삭제] DB에 존재하지 않는 문서 ID #{}, 무시 완료", documentId);
        }
    }

    /**
     * 4. 도면 차수 개정 (Revision Up)
     */
    @Transactional
    public DocumentResponse revisionUpDocument(Long documentId, String newRevision, String changeReason) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new CustomException(ErrorCode.DOCUMENT_NOT_FOUND, "존재하지 않는 도면입니다: " + documentId));

        int newVersion = (document.getVersion() != null ? document.getVersion() : 1) + 1;
        document.setVersion(newVersion);
        document.setUpdatedAt(LocalDateTime.now());

        DrawingDetail detail = drawingDetailRepository.findByDocument_DocumentId(documentId).orElse(null);
        if (detail != null) {
            detail.setRevision(newRevision);
            drawingDetailRepository.save(detail);
        } else {
            detail = DrawingDetail.builder()
                    .document(document)
                    .revision(newRevision)
                    .partName(document.getTitle())
                    .partNumber("미발급 (시제품)")
                    .cadType("PDF")
                    .scale("1:1")
                    .build();
            drawingDetailRepository.save(detail);
        }

        documentRepository.save(document);

        // 개정 사유 (Audit Log) DB 영구 기록
        DocumentAuditLog auditLog = DocumentAuditLog.builder()
                .documentId(documentId)
                .actionType("REVISION_UP (" + newRevision + ")")
                .actorId(document.getAuthorId() != null ? document.getAuthorId() : 1L)
                .reason(changeReason)
                .build();
        auditLogRepository.save(auditLog);

        log.info("[차수 개정 완료] 문서 ID #{} (v{} - 차수: {}, 사유: {})", documentId, newVersion, newRevision, changeReason);

        String presignedUrl = "/api/v1/documents/" + document.getDocumentId() + "/file";
        return convertToResponse(document, detail, presignedUrl);
    }
}
