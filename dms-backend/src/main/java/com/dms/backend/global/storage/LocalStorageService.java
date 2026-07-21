package com.dms.backend.global.storage;

import com.dms.backend.global.exception.CustomException;
import com.dms.backend.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private final Path rootPath;

    public LocalStorageService(@Value("${storage.local.upload-dir:uploads}") String uploadDir) {
        this.rootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootPath);
            log.info("로컬 업로드 디렉토리 생성 완료: {}", this.rootPath);
        } catch (IOException e) {
            log.error("업로드 디렉토리 생성 실패: ", e);
            throw new CustomException(ErrorCode.FILE_STORAGE_ERROR, "로컬 업로드 디렉토리를 생성할 수 없습니다.");
        }
    }

    @Override
    public String uploadFile(String directory, String fileName, MultipartFile file) {
        try {
            String uniqueName = UUID.randomUUID() + "_" + fileName;
            Path targetDir = this.rootPath.resolve(directory).normalize();
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(uniqueName).normalize();
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String storageKey = directory + "/" + uniqueName;
            log.info("로컬 파일 업로드 성공: {}", storageKey);
            return storageKey;
        } catch (IOException e) {
            log.error("로컬 파일 저장 실패: ", e);
            throw new CustomException(ErrorCode.FILE_STORAGE_ERROR, "파일 저장에 실패했습니다.");
        }
    }

    @Override
    public InputStream downloadFile(String storageKey) {
        try {
            Path filePath = this.rootPath.resolve(storageKey).normalize();
            if (!Files.exists(filePath)) {
                throw new CustomException(ErrorCode.FILE_STORAGE_ERROR, "지정한 파일이 로컬 스토리지에 존재하지 않습니다.");
            }
            return Files.newInputStream(filePath);
        } catch (IOException e) {
            log.error("로컬 파일 읽기 실패: ", e);
            throw new CustomException(ErrorCode.FILE_STORAGE_ERROR, "파일을 읽어올 수 없습니다.");
        }
    }

    @Override
    public void deleteFile(String storageKey) {
        try {
            Path filePath = this.rootPath.resolve(storageKey).normalize();
            Files.deleteIfExists(filePath);
            log.info("로컬 파일 삭제 성공: {}", storageKey);
        } catch (IOException e) {
            log.error("로컬 파일 삭제 실패: ", e);
            throw new CustomException(ErrorCode.FILE_STORAGE_ERROR, "파일 삭제에 실패했습니다.");
        }
    }

    @Override
    public String generatePresignedUploadUrl(String directory, String fileName, int durationMinutes) {
        // 로컬 테스트용 모의 Presigned Upload URL
        String uniqueName = UUID.randomUUID() + "_" + fileName;
        return "/api/v1/files/local-upload?key=" + directory + "/" + uniqueName;
    }

    @Override
    public String generatePresignedDownloadUrl(String storageKey, int durationMinutes) {
        // 로컬 테스트용 모의 Presigned Download URL
        return "/api/v1/files/download?key=" + storageKey;
    }
}
