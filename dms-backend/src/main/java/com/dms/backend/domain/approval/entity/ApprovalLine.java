package com.dms.backend.domain.approval.entity;

import com.dms.backend.domain.document.entity.Document;
import com.dms.backend.domain.document.enums.ApprovalStatus;
import lombok.*;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "approval_lines")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ApprovalLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approval_line_id")
    private Long approvalLineId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "approver_id", nullable = false)
    private Long approverId;

    @Column(name = "step_sequence", nullable = false)
    private Integer stepSequence;

    @Enumerated(EnumType.STRING)
    @Column(name = "step_status", nullable = false, length = 30)
    private ApprovalStatus stepStatus;

    @Column(name = "comment", length = 500)
    private String comment;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
