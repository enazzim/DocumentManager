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
        log.info("Creating new document: docNumber={}, docType={}", request.getDocNumber(), request.getDocType());

        if (documentRepository.findByDocNumber(request.getDocNumber()).isPresent()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE, "이미 존재하는 문서번호입니다: " + request.getDocNumber());
        }

        // 1. 도면 대표 엔티티 생성
        ApprovalStatus initialApproval = (request.getDocType() == DocType.EXTERNAL) 
                ? ApprovalStatus.APPROVED 
                : ApprovalStatus.DRAFT;
        
        LifecycleStatus initialLifecycle = (request.getDocType() == DocType.EXTERNAL)
                ? LifecycleStatus.ACTIVE
                : LifecycleStatus.DRAFT;

        Document document = Document.builder()
                .docNumber(request.getDocNumber())
                .title(request.getTitle())
                .docType(request.getDocType())
                .approvalStatus(initialApproval)
                .lifecycleStatus(initialLifecycle)
                .fileStatus(FileStatus.STAGED)
                .authorId(request.getAuthorId() != null ? request.getAuthorId() : 1L)
                .version(1)
                .build();

        Document savedDoc = documentRepository.save(document);

        // 2. 도면 세부 정보 생성
        DrawingDetail drawingDetail = DrawingDetail.builder()
                .document(savedDoc)
                .partNumber(request.getPartNumber())
                .partName(request.getPartName())
                .revision(request.getRevision())
                .cadType(request.getCadType())
                .scale(request.getScale())
                .build();
        drawingDetailRepository.save(drawingDetail);

        // 3. 외부 BOM 목록 저장
        if (request.getBomList() != null && !request.getBomList().isEmpty()) {
            List<DrawingBom> boms = request.getBomList().stream()
                    .map(dto -> DrawingBom.builder()
                            .document(savedDoc)
                            .externalItemId(dto.getExternalItemId())
                            .itemCode(dto.getItemCode())
                            .itemName(dto.getItemName())
                            .itemSource(dto.getItemSource() != null ? dto.getItemSource() : "ERP")
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
                .reason("신규 도면 등록 (" + request.getDocType() + ")")
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
}
