/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as eventRegistrationConfirmation } from './event-registration-confirmation.tsx'
import { template as orderPaymentSuccess } from './order-payment-success.tsx'
import { template as welcomeMember } from './welcome-member.tsx'
import { template as quizResult } from './quiz-result.tsx'
import { template as blogPostPublished } from './blog-post-published.tsx'
import { template as blogPostSubscriberNotice } from './blog-post-subscriber-notice.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
  'event-registration-confirmation': eventRegistrationConfirmation,
  'order-payment-success': orderPaymentSuccess,
  'welcome-member': welcomeMember,
  'quiz-result': quizResult,
  'blog-post-published': blogPostPublished,
  'blog-post-subscriber-notice': blogPostSubscriberNotice,
}
