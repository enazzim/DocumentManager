package com.dms.backend.domain.approval.dto;

import com.dms.backend.domain.document.enums.ApprovalStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalLineResponse {
    private Long approvalLineId;
    private Long documentId;
    private Long approverId;
    private Integer stepSequence;
    private ApprovalStatus stepStatus;
    private String comment;
    private LocalDateTime approvedAt;
}
