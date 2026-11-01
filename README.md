# Epson 투사거리 계산기 (비공식)

브라우저에서 `index.html` 을 열면 바로 동작합니다 (오프라인, 설치 불필요).
엡손(Seiko Epson)의 공식 도구가 아닙니다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 화면 구조 |
| `css/style.css` | 스타일 |
| `js/data/lenses.js` | 교체형 렌즈 데이터 (패널 등급별 거리 공식·시프트·출처) |
| `js/data/projectors.js` | 본체 데이터 (시리즈, 패널 비율, 렌즈 등급) |
| `js/calc.js` | 계산 함수 (화면 크기, 패널 맞춤, 거리, 시프트) |
| `js/ui.js` | 화면 표시 |
| `js/main.js` | 이벤트 연결, 경고 생성 |
| `tests/calc.test.js` | 엡손 매뉴얼 표 대조 테스트 (`node --test tests/calc.test.js`) |

## 계산 기준

- 거리(cm) = a × 패널 영상 대각선(인치) + b
  - a, b 는 엡손 사양서의 렌즈별 "Projection Distance Formula" 값입니다.
- 스크린 비율이 패널과 다를 때(엡손 사양서와 같은 방식)
  - 스크린이 더 넓으면 가로 맞춤 (패널 가로 = 스크린 가로)
  - 스크린이 더 좁으면 세로 맞춤 (패널 세로 = 스크린 세로)

## 데이터 출처 (엡손 공식 문서)

| 패널 등급 | 해당 본체 | 출처 |
|---|---|---|
| 0.76" WUXGA/WXGA | PU1006~PU1008, L1050U~L1405U, G7000 시리즈 | EB-PU2010 series, EB-L1505U series, EB-L1075U series, EB-G7905U series 사양서 |
| 1.03" WUXGA | PU2010B, PU2100/PU2200, L1500UH~L1755U, L20000U | EB-PU2220 series, EB-PU2010 series, EB-L1755U series, EB-L20000U series 사양서 |
| 1.04" 4K (16:9) | PQ2008~PQ2220, L12000Q | EB-PQ2220B, EB-PQ2010 series 사양서 / Pro L12000QNL 매뉴얼 대조 |
| L25000/L30000 계열 | L25000U, L30000U | EB-L30000U series 사양서 / Pro L25000U 매뉴얼 투사거리 표 |

- 고정 렌즈 기종(회의실형, 소형, UST, 램프형)의 투사비·시프트 값은 원본 파일 값이며 공식 자료와 대조하지 않았습니다.
- 밝기·무게 등 일반 제원은 검증하지 않았습니다.
- 설치 전에는 반드시 해당 기종 매뉴얼 또는 엡손 공식 계산기로 최종 확인하세요.
