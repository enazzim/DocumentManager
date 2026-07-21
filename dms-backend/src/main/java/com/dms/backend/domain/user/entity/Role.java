package com.dms.backend.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @Column(name = "role_name", length = 30)
    private String roleName;

    @Column(name = "description", length = 100)
    private String description;
}
