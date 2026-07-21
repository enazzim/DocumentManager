package com.dms.backend.domain.document.dto;

import com.dms.backend.domain.document.enums.ApprovalStatus;
import com.dms.backend.domain.document.enums.DocType;
import com.dms.backend.domain.document.enums.FileStatus;
import com.dms.backend.domain.document.enums.LifecycleStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponse {
    private Long documentId;
    private String docNumber;
    private String title;
    private DocType docType;
    private ApprovalStatus approvalStatus;
    private LifecycleStatus lifecycleStatus;
    private FileStatus fileStatus;
    private Boolean isDeleted;
    private Integer version;
    private String partNumber;
    private String partName;
    private String revision;
    private String cadType;
    private String scale;
    private String presignedUploadUrl;
    private List<DrawingBomDto> bomList;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
