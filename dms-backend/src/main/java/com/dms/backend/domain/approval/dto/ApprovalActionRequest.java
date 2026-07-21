package com.dms.backend.domain.approval.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalActionRequest {
    private Long approverId;
    private Boolean isApproved; // true: 승인, false: 반려
    private String comment;
}
