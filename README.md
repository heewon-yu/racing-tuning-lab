# Racing Tuning Lab

독립적인 Next.js 15 / TypeScript / Tailwind CSS / Recharts 기반 차량 튜닝 시뮬레이터.

## 시작

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Vercel 프로젝트를 GitHub 저장소 `heewon-yu/racing-tuning-lab`에 연결하면 별도 API/DB 없이 정적 배포됩니다.

## 물리 모델

`lib/physicsEngine.ts`: 0.05초 적분, 엔진 토크·출력 상한, 기어비·변속, 휠 그립 제한, 공기저항, 구름저항, 다운포스 근사. 차량별 정확한 토크맵·서스펜션·트랙 노면 정보가 없는 비교용 모델이며 실측 성능 인증 수치가 아닙니다.

## 레이싱 데이터·핸들링 분석 (/analysis)

- 사용자 입력 가능: 전/후륜 타이어 압력(psi), 캠버(°), 토(°), 스프링(N/mm), 안티롤바(1~10), 댐퍼(1~10), 차고(mm), 윙(1~10)
- 기준 세팅 저장 후 비교: 샘플 코스의 **모델 랩타임**, 거리 기반 **Delta-T**, 속도 프로파일, G-G 마찰원, 코너 진입/중간/탈출 밸런스
- 불가능한 신호 분석은 제공하지 않음: 실측 드라이버의 제동/스로틀/조향, ABS/TCS/ESC 개입, 휠속도 기반 슬립률, 실제 GPS/영상 라인 분석
- 임의 코스와 튜닝 효과 계수는 **가정값**. 타이어 온도·하중 민감도·지오메트리·실제 에어로 맵·서스펜션 스트로크가 없으므로 유효 그립, 밸런스 점수, 랩타임은 실차 검증 수치가 아님.
- 서킷 각 10m 간격의 모델 코너 속도 제한, 전진 가속/역방향 감속 경계, 거리 기반 누적 시간을 사용. G-G 그래프는 모델 계산값.

### 참고 문헌 (외부 기술 자료)
- https://openengineering.ca/race-vehicle-dynamics/modules/m02-tires/l3-combined-slip.html
- https://openengineering.ca/race-vehicle-dynamics/modules/m03-load-transfer/l1-load-transfer.html
- https://www.racecar-engineering.com/tech-explained/tyre-dynamics/
- https://www.racecar-engineering.com/tech-explained/springs-and-dampers/
- https://optimumg.com/vehicle-setup-and-kinematics-qa-series/
- https://motorsport.nda.ac.uk/news/a-basic-guide-on-setting-up-a-race-car/
