package com.dms.backend.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:http://localhost:*,http://127.0.0.1:*}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // application-local.yml / application-prod.yml 환경변수 기반 Origin 수용
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .toList();

        configuration.setAllowedOriginPatterns(origins);
        
        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // 허용할 헤더
        configuration.setAllowedHeaders(List.of("*"));
        
        // 클라이언트에 노출할 응답 헤더 (JWT Authorization 헤더 포함)
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type", "Set-Cookie"));
        
        // 자격 증명(쿠키/인증 헤더) 허용
        configuration.setAllowCredentials(true);
        
        // Preflight 요청 캐싱 시간 (1시간)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
