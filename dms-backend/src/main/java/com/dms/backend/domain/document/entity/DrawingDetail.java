package com.dms.backend.domain.document.entity;

import lombok.*;

import jakarta.persistence.*;

@Entity
@Table(name = "drawing_details")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DrawingDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "drawing_detail_id")
    private Long drawingDetailId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private Document document;

    @Column(name = "part_number", nullable = false, length = 100)
    private String partNumber;

    @Column(name = "part_name", nullable = false, length = 150)
    private String partName;

    @Column(name = "revision", nullable = false, length = 20)
    private String revision;

    @Column(name = "cad_type", length = 30)
    private String cadType;

    @Column(name = "scale", length = 20)
    private String scale;
}
