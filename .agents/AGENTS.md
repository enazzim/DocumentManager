작성일: 2026년 7월 21일
작성자: PRODEV

## 전역 에이전틱 하네스(Agentic Harness) 통제 지침
본 DMS 프로젝트 개발 수행 시 AI 코딩 에이전트는 환각(Hallucination) 및 이상 행동을 차단하기 위해 아래 **'에이전틱 하네스 통제 프레임워크(지시문서 + 가드레일 + 피드백루프 + MCP)'**를 항시 전역 우선 규칙으로 자동 참조합니다.

- **1. 기본 참조 지시문서**: `results/260721_하네스_지시문서_구현가이드.md`
- **2. 기본 참조 가드레일 문서**: `results/260721_하네스_가드레일_설정가이드.md`
- **3. 기본 참조 피드백루프 문서**: `results/260721_하네스_피드백루프_설정가이드.md`
- **4. 기본 참조 MCP연동 문서**: `results/260721_하네스_MCP_연동가이드.md`
- **패키지 위치 규격**: 백엔드는 `com.dms.backend.domain`, 프론트엔드는 `dms-frontend/src/components/` 및 `dms-frontend/src/api/` 구조 준수
- **공통 응답 Wrapper**: 모든 백엔드 REST Controller 구현 시 `com.dms.backend.global.common.ApiResponse` Wrapper 활용
- **작업 수행 순서**: 지시문서의 3절 구현 미션 1(공통 구조) -> 미션 2(DMS Entity) -> 미션 3(Controller/Service) -> 미션 4(React UI) 순서 준수

---

## 전역 코딩 가드레일 (Guardrails & Constraints)
AI 에이전트는 바이브 코딩 진행 시 아래 가드레일 제약 사항을 엄격히 준수해야 합니다.

- **임의 기능/화면 생성 금지 (Scope Freeze)**: 지시문서(`results/260721_하네스_지시문서_구현가이드.md`) 및 미션 프롬프트에 명시되지 않은 신규 화면, 불필요한 유틸리티, 오버 엔지니어링 기능을 임의로 추가하는 행위 전면 금지 (YAGNI 원칙 준수)
- **보안/기밀 통제**: DB 비밀번호, AWS Secret Key 등 인프라 기밀 정보를 소스코드 내에 절대 하드코딩 금지 (`@Value` 또는 `application.yml` 환경변수 참조)
- **파일 수정 통제**: `.env`, `build.gradle`, `application-local.yml` 등 핵심 인프라 설정 파일은 명시적 지시 없이 무단 편집 금지
- **아키텍처 레이어 통제**: REST Controller에서 `JpaRepository` 직접 주입/호출 금지 (반드시 Service 계층을 경유)
- **API 응답 객체 통제**: REST Controller 반환 시 JPA Entity 직접 반환 금지 (반드시 `ApiResponse.of(DTO)` 표준 규격 통일)
- **코드 품질 통제**: `System.out.println()` 및 `e.printStackTrace()` 사용 전면 금지 (반드시 `@Slf4j` 기반 `log.info()`, `log.error()` 활용)
- **결과물 저장 통제**: 분석 보고서 및 가이드 문서는 반드시 `results/` 디렉터리 내에만 생성

---

## 전역 자율 피드백 루프 (Autonomic Feedback Loop)
AI 에이전트는 코드 작성 및 수정 후 아래 검증 루프를 자율적으로 실행하고 자가 정정해야 합니다.

- **백엔드 검증 실행**: Java/Spring 코드 생성/수정 후 `./gradlew test` 또는 `./gradlew compileJava` 실행하여 컴파일 및 단원 테스트 성공 확인
- **프론트엔드 검증 실행**: React/TypeScript 코드 생성/수정 후 `npx tsc --noEmit`을 실행하여 타입 컴파일 오류 0건 검증
- **오류 자가 정정 (Self-Correction)**: 빌드/검증 실패 발생 시 StackTrace 및 컴파일 에러 원인을 분석하여 소스코드를 즉시 자가 수정 후 재검증 (최대 3회 재시도)

---

## 전역 MCP 연동 지침 (Model Context Protocol Guidelines)
AI 에이전트는 DMS 개발 진행 시 필요에 따라 5대 MCP 서버 및 외부 도구를 적극 활용합니다.

- **Database MCP 연동**: DB 데이터 적재 검증 시 Database MCP를 이용하여 DMS 테이블 데이터 조회 및 검증
- **AWS S3 MCP 연동**: 도면 파일 업로드 테스트 시 S3 버킷 접근성 및 Presigned URL 검증
- **Git / GitHub MCP 연동**: 바이브 코딩 미션 단위 구현 완료 시 Git branch 생성, 커밋 및 PR 자동 상신
- **Web Search MCP 연동**: 외부 기술 사양 미비 시 표준 웹 데이터시트 자동 검색 및 보완
- **Filesystem MCP 연동**: 프로젝트 내 소스코드 파일 및 가이드 문서 안전 탐색 및 편집
