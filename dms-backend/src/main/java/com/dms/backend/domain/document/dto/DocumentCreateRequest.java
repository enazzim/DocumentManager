package com.dms.backend.domain.document.dto;

import com.dms.backend.domain.document.enums.DocType;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentCreateRequest {
    private String docNumber;
    private String title;
    private DocType docType;
    private Long authorId;
    
    // 도면 특화 정보
    private String partNumber;
    private String partName;
    private String revision;
    private String cadType;
    private String scale;

    // 외부 BOM 항목들
    private List<DrawingBomDto> bomList;
}
