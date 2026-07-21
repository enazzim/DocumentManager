package com.dms.backend.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "departments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @Column(name = "department_code", length = 50)
    private String departmentCode;

    @Column(name = "department_name", nullable = false, length = 100)
    private String departmentName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_code")
    private Department parentDepartment;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
