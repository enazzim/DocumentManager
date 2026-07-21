package com.dms.backend.domain.approval.service;

import com.dms.backend.domain.approval.dto.*;
import com.dms.backend.domain.approval.entity.ApprovalLine;
import com.dms.backend.domain.approval.repository.ApprovalLineRepository;
import com.dms.backend.domain.document.entity.Document;
import com.dms.backend.domain.document.entity.DocumentAuditLog;
import com.dms.backend.domain.document.enums.ApprovalStatus;
import com.dms.backend.domain.document.enums.LifecycleStatus;
import com.dms.backend.domain.document.repository.DocumentAuditLogRepository;
import com.dms.backend.domain.document.repository.DocumentRepository;
import com.dms.backend.global.exception.CustomException;
import com.dms.backend.global.exception.ErrorCode;
import com.dms.backend.global.sse.SseEmitterRepository;
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
public class ApprovalService {

    private final DocumentRepository documentRepository;
    private final ApprovalLineRepository approvalLineRepository;
    private final DocumentAuditLogRepository auditLogRepository;
    private final SseEmitterRepository sseEmitterRepository;

    @Transactional
    public List<ApprovalLineResponse> submitApproval(ApprovalSubmitRequest request) {
        log.info("Submitting document for approval: documentId={}", request.getDocumentId());

        Document document = documentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new CustomException(ErrorCode.DOCUMENT_NOT_FOUND, "존재하지 않는 도면입니다: " + request.getDocumentId()));

        if (document.getApprovalStatus() == ApprovalStatus.UNDER_REVIEW) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE, "이미 결재 심사 중인 도면입니다.");
        }

        // 1. 결재선 엔티티 저장
        List<ApprovalLine> lines = request.getApproverSteps().stream()
                .map(step -> ApprovalLine.builder()
                        .document(document)
                        .approverId(step.getApproverId())
                        .stepSequence(step.getStepSequence())
                        .stepStatus(ApprovalStatus.DRAFT)
                        .build())
                .collect(Collectors.toList());

        List<ApprovalLine> savedLines = approvalLineRepository.saveAll(lines);

        // 2. 문서 결재 상태 전이 (DRAFT -> UNDER_REVIEW)
        document.setApprovalStatus(ApprovalStatus.UNDER_REVIEW);

        // 3. 감사 로그 기록
        DocumentAuditLog auditLog = DocumentAuditLog.builder()
                .documentId(document.getDocumentId())
                .actionType("SUBMIT")
                .actorId(request.getSubmitterId() != null ? request.getSubmitterId() : 1L)
                .reason("결재선 상신 완료 (" + savedLines.size() + "단계)")
                .build();
        auditLogRepository.save(auditLog);

        // 4. SSE 브로드캐스트 이벤트 발행 (상신 알림)
        sseEmitterRepository.sendToAll("DOCUMENT_SUBMITTED", "도면 [" + document.getDocNumber() + "] 이 상신되었습니다.");

        return convertToResponseList(savedLines);
    }

    @Transactional
    public ApprovalLineResponse processApproval(Long approvalLineId, ApprovalActionRequest request) {
        log.info("Processing approval action: lineId={}, isApproved={}", approvalLineId, request.getIsApproved());

        ApprovalLine line = approvalLineRepository.findById(approvalLineId)
                .orElseThrow(() -> new CustomException(ErrorCode.DOCUMENT_NOT_FOUND, "존재하지 않는 결재선입니다: " + approvalLineId));

        Document document = line.getDocument();

        if (request.getIsApproved()) {
            line.setStepStatus(ApprovalStatus.APPROVED);
            line.setApprovedAt(LocalDateTime.now());
            line.setComment(request.getComment());

            // 모든 차수의 결재가 완료되었는지 체크
            List<ApprovalLine> allLines = approvalLineRepository.findByDocument_DocumentIdOrderByStepSequenceAsc(document.getDocumentId());
            boolean allApproved = allLines.stream().allMatch(l -> l.getStepStatus() == ApprovalStatus.APPROVED);

            if (allApproved) {
                // 최종 승인 완료 -> ACTIVE 격상
                document.setApprovalStatus(ApprovalStatus.APPROVED);
                document.setLifecycleStatus(LifecycleStatus.ACTIVE);

                // 현장 단말기 화면 원격 강제 리로드 SSE 알림 발행
                sseEmitterRepository.sendToAll("FORCE_RELOAD", "도면 [" + document.getDocNumber() + "] 최종 승인 완료로 현장 단말 리로드 강제 실행");
            }
        } else {
            // 결재 반려
            line.setStepStatus(ApprovalStatus.REJECTED);
            line.setComment(request.getComment());

            document.setApprovalStatus(ApprovalStatus.REJECTED);

            // 반려 알림 SSE 발행
            sseEmitterRepository.sendToAll("DOCUMENT_REJECTED", "도면 [" + document.getDocNumber() + "] 반려 처리: " + request.getComment());
        }

        // 감사 로그
        DocumentAuditLog audit = DocumentAuditLog.builder()
                .documentId(document.getDocumentId())
                .actionType(request.getIsApproved() ? "APPROVE" : "REJECT")
                .actorId(request.getApproverId())
                .reason(request.getComment())
                .build();
        auditLogRepository.save(audit);

        return convertToResponse(line);
    }

    public List<ApprovalLineResponse> getApprovalLines(Long documentId) {
        List<ApprovalLine> lines = approvalLineRepository.findByDocument_DocumentIdOrderByStepSequenceAsc(documentId);
        return convertToResponseList(lines);
    }

    private ApprovalLineResponse convertToResponse(ApprovalLine line) {
        return ApprovalLineResponse.builder()
                .approvalLineId(line.getApprovalLineId())
                .documentId(line.getDocument().getDocumentId())
                .approverId(line.getApproverId())
                .stepSequence(line.getStepSequence())
                .stepStatus(line.getStepStatus())
                .comment(line.getComment())
                .approvedAt(line.getApprovedAt())
                .build();
    }

    private List<ApprovalLineResponse> convertToResponseList(List<ApprovalLine> lines) {
        return lines.stream().map(this::convertToResponse).collect(Collectors.toList());
    }
}
