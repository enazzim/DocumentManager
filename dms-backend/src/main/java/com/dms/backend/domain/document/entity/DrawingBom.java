package com.dms.backend.domain.document.entity;

import lombok.*;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "drawing_boms", indexes = {
    @Index(name = "idx_bom_document_id", columnList = "document_id"),
    @Index(name = "idx_bom_external_item", columnList = "external_item_id, item_code")
})
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DrawingBom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bom_id")
    private Long bomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "external_item_id", length = 100)
    private String externalItemId; // 외부 ERP/PLM 시스템의 Item 고유 ID 참조

    @Column(name = "item_code", nullable = false, length = 100)
    private String itemCode; // 외부 시스템 품목/자재 코드

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName; // 품목/자재명

    @Column(name = "item_source", length = 50)
    private String itemSource; // 참조 대상 외부 시스템 구분자 (예: ERP, PLM, MES)

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity; // 필요 자재 수량

    @Column(name = "unit", nullable = false, length = 20)
    private String unit; // 단위 (EA, M, KG 등)
}
