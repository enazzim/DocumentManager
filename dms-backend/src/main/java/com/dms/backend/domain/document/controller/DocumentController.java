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

        DocumentResponse doc = documentService.getDocument(documentId);
        String rev = (doc != null && doc.getRevision() != null) ? doc.getRevision() : "V1-1";

        String targetFileName = documentId + "_" + rev + "_" + file.getOriginalFilename();
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
     * 🔄 도면 차수 개정 (Revision Up) 및 파일 교체 API
     */
    @PostMapping("/{documentId}/revision")
    public ApiResponse<DocumentResponse> revisionUpDocument(
            @PathVariable Long documentId,
            @RequestParam("newRevision") String newRevision,
            @RequestParam("changeReason") String changeReason,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        log.info("REST Request to Revision Up document #{}: newRevision={}, changeReason={}", documentId, newRevision, changeReason);

        DocumentResponse response = documentService.revisionUpDocument(documentId, newRevision, changeReason);

        if (file != null && !file.isEmpty()) {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String targetFileName = documentId + "_" + newRevision + "_" + file.getOriginalFilename();
            Path targetPath = uploadPath.resolve(targetFileName);
            Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            log.info("Revision file saved on disk: {}", targetPath.toAbsolutePath());
        }

        return ApiResponse.success(response);
    }

    /**
     * 📄 백엔드 로컬 물리 저장소(uploads/drawings/)에 저장된 실제 도면 파일 서빙
     * ?revision=V1-1 구버전 조회 및 ?download=true 지원
     */
    @GetMapping("/{documentId}/file")
    public ResponseEntity<Resource> getDocumentFile(
            @PathVariable Long documentId,
            @RequestParam(value = "revision", required = false) String revisionParam,
            @RequestParam(value = "download", required = false, defaultValue = "false") boolean download) {
        log.info("REST Request to view stored document file for doc #{}, revisionParam={}, downloadMode={}", documentId, revisionParam, download);

        File folder = new File(UPLOAD_DIR);
        if (folder.exists() && folder.isDirectory()) {
            File[] matchingFiles = folder.listFiles((dir, name) -> name.startsWith(documentId + "_"));
            if (matchingFiles != null && matchingFiles.length > 0) {
                // 1. 파일들을 파일 생성/수정시각(lastModified) 오름차순(과거 -> 최근)으로 정렬
                java.util.Arrays.sort(matchingFiles, (f1, f2) -> Long.compare(f1.lastModified(), f2.lastModified()));

                File targetFile = null;

                // 2. 특정 개정 차수(revisionParam) 요청 시 해당 차수 파일 검색
                if (revisionParam != null && !revisionParam.trim().isEmpty()) {
                    String reqRev = revisionParam.trim().toUpperCase();

                    // 2-1. 파일명 명시적 차수 태그 매핑 검색 ({documentId}_{reqRev}_)
                    for (File f : matchingFiles) {
                        String upperName = f.getName().toUpperCase();
                        if (upperName.startsWith(documentId + "_" + reqRev + "_") || upperName.contains("_" + reqRev + "_")) {
                            targetFile = f;
                            break;
                        }
                    }

                    // 2-2. 과거 등록 파일 등 명시적 차수가 없는 경우: 시순 서열 기반(1-indexed) 1:1 파일 매핑
                    if (targetFile == null) {
                        int vIdx = parseVersionIndexFromRevision(reqRev);
                        if (vIdx >= 0 && vIdx < matchingFiles.length) {
                            targetFile = matchingFiles[vIdx];
                        }
                    }
                }

                // 3. 차수 미지정 시 (메인 뷰어 최신 도면 요청)
                if (targetFile == null) {
                    try {
                        DocumentResponse doc = documentService.getDocument(documentId);
                        String currentRev = (doc != null && doc.getRevision() != null) ? doc.getRevision().toUpperCase() : null;
                        if (currentRev != null) {
                            for (File f : matchingFiles) {
                                String upperName = f.getName().toUpperCase();
                                if (upperName.startsWith(documentId + "_" + currentRev + "_") || upperName.contains("_" + currentRev + "_")) {
                                    targetFile = f;
                                    break;
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                }

                // 4. 여전히 선택된 파일이 없는 경우, 오름차순 목록의 맨 마지막(가장 최근 파일) 선택
                if (targetFile == null) {
                    targetFile = matchingFiles[matchingFiles.length - 1];
                }

                log.info("Found matching document file on disk: {}", targetFile.getAbsolutePath());
                Resource resource = new FileSystemResource(targetFile);

                String ext = ".pdf";
                int dotIdx = targetFile.getName().lastIndexOf('.');
                if (dotIdx >= 0) {
                    ext = targetFile.getName().substring(dotIdx);
                }

                String customFileName;
                try {
                    DocumentResponse doc = documentService.getDocument(documentId);
                    String rev = (revisionParam != null && !revisionParam.trim().isEmpty())
                            ? revisionParam.trim()
                            : ((doc != null && doc.getRevision() != null) ? doc.getRevision() : "V1");
                    String num = (doc != null && doc.getDocNumber() != null) ? doc.getDocNumber() : ("DOC_" + documentId);
                    customFileName = num + "_" + rev + ext;
                } catch (Exception e) {
                    customFileName = targetFile.getName();
                }

                String encodedFileName = java.net.URLEncoder.encode(customFileName, java.nio.charset.StandardCharsets.UTF_8)
                        .replaceAll("\\+", "%20");

                String disposition = download
                        ? "attachment; filename=\"" + customFileName + "\"; filename*=UTF-8''" + encodedFileName
                        : "inline; filename=\"" + customFileName + "\"; filename*=UTF-8''" + encodedFileName;

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(resource);
            }
        }

        log.warn("No file stored on disk for document #{}", documentId);
        return ResponseEntity.notFound().build();
    }

    private int parseVersionIndexFromRevision(String revStr) {
        if (revStr == null) return 0;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("^V?(\\d+)(?:[-.](\\d+))?$", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(revStr.trim());
        if (m.find()) {
            int minor = m.group(2) != null ? Integer.parseInt(m.group(2)) : 1;
            return Math.max(0, minor - 1);
        }
        return 0;
    }
}
