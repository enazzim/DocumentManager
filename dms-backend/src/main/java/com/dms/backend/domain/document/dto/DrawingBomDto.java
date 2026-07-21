package com.dms.backend.domain.document.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DrawingBomDto {
    private String externalItemId;
    private String itemCode;
    private String itemName;
    private String itemSource;
    private BigDecimal quantity;
    private String unit;
}
