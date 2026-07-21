package com.dms.backend.domain.approval.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalSubmitRequest {
    private Long documentId;
    private Long submitterId;
    private List<ApproverStepDto> approverSteps;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApproverStepDto {
        private Long approverId;
        private Integer stepSequence;
    }
}
