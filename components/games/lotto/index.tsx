import { getDictionary } from '@/app/[lang]/dictionaries'
import { LottoScreen } from '@/components/games/lotto/lotto-screen'
import type { GameScreenProps } from '@/components/games/registry'

/** 사전의 로또 문구와, 운세에서 빌려 쓰는 간지·오행·시진 이름을 클라이언트 화면에 넘긴다. */
export async function LottoGame({ locale }: GameScreenProps) {
  const dict = await getDictionary()
  const { stems, branches, elements, chart, hours } = dict.fortune
  return (
    <LottoScreen
      copy={dict.lotto}
      saju={{ stems, branches, elements, chart, hours }}
      locale={locale}
    />
  )
}
