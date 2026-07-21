package com.dms.backend.domain.document.controller;

import com.dms.backend.domain.document.dto.*;
import com.dms.backend.domain.document.service.DocumentService;
import com.dms.backend.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    public ApiResponse<DocumentResponse> createDocument(@RequestBody DocumentCreateRequest request) {
        log.info("REST Request to create document: {}", request.getDocNumber());
        DocumentResponse response = documentService.createDocument(request);
        return ApiResponse.success(response);
    }

    @GetMapping("/{documentId}")
    public ApiResponse<DocumentResponse> getDocument(@PathVariable("documentId") Long documentId) {
        log.info("REST Request to get document: {}", documentId);
        DocumentResponse response = documentService.getDocument(documentId);
        return ApiResponse.success(response);
    }
}
