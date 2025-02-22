'use client'

import { Tooltip } from './shadcn/tooltip'

interface ActionTooltipProps {
  label: string
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

export const ActionTooltip = ({ label, children, side, align }: ActionTooltipProps) => {
  return (
    <Tooltip.Provider>
      <Tooltip delayDuration={50}>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Content side={side} align={align} className="border-none">
          <p className="font-semibold text-sm capitalize">{label.toLowerCase()}</p>
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  )
}
