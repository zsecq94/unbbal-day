import { getDictionary } from '@/app/[lang]/dictionaries'
import type { GameScreenProps } from '@/components/games/registry'
import { FortuneScreen } from './fortune-screen'

/** 사전의 운세 문구만 떼어 클라이언트 화면에 넘긴다. */
export async function FortuneGame({ locale }: GameScreenProps) {
  const dict = await getDictionary()
  return <FortuneScreen copy={dict.fortune} locale={locale} />
}
