package com.dms.backend.domain.document.controller;

import com.dms.backend.domain.document.dto.*;
import com.dms.backend.domain.document.service.DocumentService;
import com.dms.backend.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // 📁 백엔드 실제 물리 저장 디렉터리 경로 (프로젝트 루트 / uploads / drawings)
    private static final String UPLOAD_DIR = "uploads/drawings/";

    @GetMapping
    public ApiResponse<List<DocumentResponse>> getAllDocuments() {
        log.info("REST Request to get all documents");
        return ApiResponse.success(documentService.getAllDocuments());
    }

    @PostMapping
    public ApiResponse<DocumentResponse> createDocument(@RequestBody DocumentCreateRequest request) {
        log.info("REST Request to create document: {}", request.getDocNumber());
        DocumentResponse response = documentService.createDocument(request);
        return ApiResponse.success(response);
    }

    /**
     * 📤 실제 도면 파일 업로드 API (로컬 PC 물리 디렉터리 저장)
     */
    @PostMapping("/{documentId}/upload")
    public ApiResponse<String> uploadFile(
            @PathVariable Long documentId,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        log.info("REST Request to upload file for doc #{}: {}", documentId, file.getOriginalFilename());
        
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String targetFileName = documentId + "_" + file.getOriginalFilename();
        Path targetPath = uploadPath.resolve(targetFileName);
        Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

        log.info("File successfully saved to local disk storage: {}", targetPath.toAbsolutePath());
        return ApiResponse.success("파일이 로컬 물리 저장소에 저장되었습니다: " + targetPath.toAbsolutePath());
    }

    @GetMapping("/{documentId}")
    public ApiResponse<DocumentResponse> getDocument(@PathVariable Long documentId) {
        log.info("REST Request to get document: {}", documentId);
        DocumentResponse response = documentService.getDocument(documentId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{documentId}")
    public ApiResponse<Void> deleteDocument(@PathVariable Long documentId) {
        log.info("REST Request to move document #{} to trash (soft delete)", documentId);
        documentService.moveToTrash(documentId);
        return ApiResponse.success(null);
    }

    @PostMapping("/{documentId}/restore")
    public ApiResponse<Void> restoreDocument(@PathVariable Long documentId) {
        log.info("REST Request to restore document #{} from trash", documentId);
        documentService.restoreFromTrash(documentId);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{documentId}/permanent")
    public ApiResponse<Void> permanentDeleteDocument(@PathVariable Long documentId) {
        log.info("REST Request to permanently delete document #{}", documentId);
        documentService.deleteDocument(documentId);
        return ApiResponse.success(null);
    }

    /**
     * 📄 백엔드 로컬 물리 저장소(uploads/drawings/)에 저장된 실제 도면 파일 서빙
     */
    @GetMapping("/{documentId}/file")
    public ResponseEntity<Resource> getDocumentFile(@PathVariable Long documentId) {
        log.info("REST Request to view stored document file for doc #{}", documentId);

        // 1. 해당 문서 ID(documentId)의 실제 업로드 파일만 탐색
        File folder = new File(UPLOAD_DIR);
        if (folder.exists() && folder.isDirectory()) {
            File[] matchingFiles = folder.listFiles((dir, name) -> name.startsWith(documentId + "_"));
            if (matchingFiles != null && matchingFiles.length > 0) {
                File targetFile = matchingFiles[0];
                log.info("Found matching document file on disk: {}", targetFile.getAbsolutePath());
                Resource resource = new FileSystemResource(targetFile);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + targetFile.getName() + "\"")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(resource);
            }
        }

        // 2. 해당 문서에 첨부된 실제 파일이 없는 경우 404 Not Found 반환 (다른 도면 오버랩 방지!)
        log.warn("No file stored on disk for document #{}", documentId);
        return ResponseEntity.notFound().build();
    }
}
