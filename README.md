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
