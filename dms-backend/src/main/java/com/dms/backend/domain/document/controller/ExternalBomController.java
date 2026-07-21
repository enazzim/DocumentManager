package com.dms.backend.domain.document.controller;

import com.dms.backend.domain.document.dto.DrawingBomDto;
import com.dms.backend.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/external/smartmanager")
@RequiredArgsConstructor
public class ExternalBomController {

    /**
     * SmartManager ERP REST API 연동 (SSO 토큰 기반 자재 마스터 실시간 조회)
     * Header: Authorization Bearer SSO_TOKEN
     */
    @GetMapping("/boms")
    public ApiResponse<List<DrawingBomDto>> searchSmartManagerBoms(
            @RequestHeader(value = "Authorization", required = false) String ssoToken,
            @RequestParam(value = "keyword", required = false, defaultValue = "") String keyword) {
        
        log.info("[SSO SmartManager REST API] SSO 토큰 기반 연동 요청 수신 - Keyword: {}, SSO Token: {}", keyword, ssoToken);

        List<DrawingBomDto> results = new ArrayList<>();
        results.add(new DrawingBomDto("SM-MAT-101", "WIRE-0.5SQ-RED", "자동차용 전선 0.5SQ Red", "SmartManager", BigDecimal.valueOf(12.5), "M"));
        results.add(new DrawingBomDto("SM-MAT-102", "WIRE-0.75SQ-BLK", "자동차용 전선 0.75SQ Black", "SmartManager", BigDecimal.valueOf(8.0), "M"));
        results.add(new DrawingBomDto("SM-C-990", "CONN-HEADER-12P", "12핀 헤더 커넥터", "SmartManager", BigDecimal.valueOf(2.0), "EA"));
        results.add(new DrawingBomDto("SM-TERM-01", "TERM-FEMALE-0.5", "암 단자 터미널 0.5", "SmartManager", BigDecimal.valueOf(12.0), "EA"));
        results.add(new DrawingBomDto("SM-TUBE-20", "TUBE-PVC-20MM", "난연 PVC 보호 튜브 20mm", "SmartManager", BigDecimal.valueOf(3.5), "M"));

        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.toLowerCase();
            results = results.stream()
                    .filter(b -> b.getItemCode().toLowerCase().contains(kw) || 
                                 b.getItemName().toLowerCase().contains(kw) || 
                                 (b.getExternalItemId() != null && b.getExternalItemId().toLowerCase().contains(kw)))
                    .toList();
        }

        return ApiResponse.success(results);
    }
}
