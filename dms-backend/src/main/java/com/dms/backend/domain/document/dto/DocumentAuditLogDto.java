package com.dms.backend.domain.document.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentAuditLogDto {
    private Long auditLogId;
    private Long documentId;
    private String actionType;
    private Long actorId;
    private String reason;
    private LocalDateTime createdAt;
}
