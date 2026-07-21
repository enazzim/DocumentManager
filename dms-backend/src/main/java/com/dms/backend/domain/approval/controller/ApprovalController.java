package com.dms.backend.domain.approval.controller;

import com.dms.backend.domain.approval.dto.*;
import com.dms.backend.domain.approval.service.ApprovalService;
import com.dms.backend.global.common.ApiResponse;
import com.dms.backend.global.sse.SseEmitterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;
    private final SseEmitterRepository sseEmitterRepository;

    @PostMapping("/submit")
    public ApiResponse<List<ApprovalLineResponse>> submitApproval(@RequestBody ApprovalSubmitRequest request) {
        log.info("REST Request to submit approval for document: {}", request.getDocumentId());
        List<ApprovalLineResponse> responses = approvalService.submitApproval(request);
        return ApiResponse.success(responses);
    }

    @PostMapping("/{approvalLineId}/action")
    public ApiResponse<ApprovalLineResponse> processApproval(
            @PathVariable("approvalLineId") Long approvalLineId,
            @RequestBody ApprovalActionRequest request) {
        log.info("REST Request to process approval for line: {}", approvalLineId);
        ApprovalLineResponse response = approvalService.processApproval(approvalLineId, request);
        return ApiResponse.success(response);
    }

    @GetMapping("/documents/{documentId}")
    public ApiResponse<List<ApprovalLineResponse>> getApprovalLines(@PathVariable("documentId") Long documentId) {
        log.info("REST Request to get approval lines for document: {}", documentId);
        List<ApprovalLineResponse> responses = approvalService.getApprovalLines(documentId);
        return ApiResponse.success(responses);
    }

    // 현장 단말기 및 웹 화면 SSE 실시간 원격 제어 구독 API
    @GetMapping(value = "/sse/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeSse() {
        String emitterId = UUID.randomUUID().toString();
        SseEmitter sseEmitter = new SseEmitter(60 * 1000L * 60); // 1시간
        sseEmitterRepository.save(emitterId, sseEmitter);

        sseEmitter.onCompletion(() -> sseEmitterRepository.deleteById(emitterId));
        sseEmitter.onTimeout(() -> sseEmitterRepository.deleteById(emitterId));

        // 최초 연결 시 더미 이벤트 전송
        try {
            sseEmitter.send(SseEmitter.event().name("CONNECT").data("SSE Connection established: " + emitterId));
        } catch (Exception e) {
            log.error("Failed to send initial SSE connect event", e);
        }

        return sseEmitter;
    }
}
