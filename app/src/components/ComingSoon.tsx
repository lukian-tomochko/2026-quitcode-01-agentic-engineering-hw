import { PInlineNotification } from '@porsche-design-system/components-react'

type Props = {
  heading: string
  description: string
}

/** Placeholder for tabs that land in a later iteration. */
export function ComingSoon({ heading, description }: Props) {
  return (
    <PInlineNotification
      heading={heading}
      headingTag="h2"
      description={description}
      state="info"
      dismissButton={false}
    />
  )
}
