'use client'

import { useId } from 'react'
import { InlineScript } from '@/components/inline-script'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

function format(d: Date) {
  const ymd = [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())]
  return {
    label: `${ymd.join('.')} ${WEEKDAYS[d.getDay()]}`,
    iso: ymd.join('-'),
  }
}

/**
 * 오늘 날짜는 방문자의 시간대 기준이어야 하므로 서버에서 계산하지 않는다.
 * - 첫 로드·새로고침: 프리렌더 셸에는 자리표시자만 두고, 인라인 스크립트가 첫 페인트 전에 채운다.
 * - 클라이언트 이동(언어 전환 등): 브라우저에서 렌더링되므로 바로 계산한다.
 */
export function TodayDate({ label }: { label: string }) {
  const id = useId()
  const today = typeof window === 'undefined' ? null : format(new Date())

  return (
    <span className="font-mono text-xs tracking-[0.1em] text-ink-3">
      {label}{' '}
      <time
        id={id}
        dateTime={today?.iso}
        suppressHydrationWarning
        className="font-medium text-ink-2"
      >
        {today?.label ?? '—'}
      </time>
      <InlineScript
        html={`(function(){var e=document.getElementById(${JSON.stringify(id)});if(!e)return;var d=new Date(),w=${JSON.stringify(WEEKDAYS)},p=function(n){return n<10?"0"+n:""+n},y=[d.getFullYear(),p(d.getMonth()+1),p(d.getDate())];e.textContent=y.join(".")+" "+w[d.getDay()];e.setAttribute("datetime",y.join("-"))})()`}
      />
    </span>
  )
}
