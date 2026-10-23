import { getDictionary } from '@/app/[lang]/dictionaries'
import { MatchScreen } from '@/components/games/match/match-screen'
import type { GameScreenProps } from '@/components/games/registry'

/** 사전의 이름 궁합 문구만 떼어 클라이언트 화면에 넘긴다. */
export async function MatchGame({ locale }: GameScreenProps) {
  const dict = await getDictionary()
  return <MatchScreen copy={dict.match} locale={locale} />
}
