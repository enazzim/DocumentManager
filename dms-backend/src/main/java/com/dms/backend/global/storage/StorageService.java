package com.dms.backend.global.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

public interface StorageService {

    String uploadFile(String directory, String fileName, MultipartFile file);

    InputStream downloadFile(String storageKey);

    void deleteFile(String storageKey);

    String generatePresignedUploadUrl(String directory, String fileName, int durationMinutes);

    String generatePresignedDownloadUrl(String storageKey, int durationMinutes);
}
