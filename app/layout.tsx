import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {title:'레이싱 튜닝 분석실 | Racing Tuning Lab',description:'차량 튜닝 파라미터를 물리 시뮬레이션으로 비교하는 무료 분석기'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
