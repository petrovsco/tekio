// The Terms of Service, as data (RFC 0111 in tekio.rfcs, rfcs/0111-terms-of-service.md).
// Kept apart from the sheet that shows them so a web page or a native client
// can render the same words; a copied legal text disagrees with itself.
//
// A draft until reviewed: the bracketed fields are the operator's to supply,
// and DRAFT goes false in the same edit that fills them.

export interface TermsSection {
  heading: string
  paragraphs: string[]
}

export const TERMS_DRAFT = true
export const TERMS_UPDATED = '2026-10-20'

export const TERMS: TermsSection[] = [
  {
    heading: 'Who we are',
    paragraphs: [
      'Tekiō is a service for seeing what your training is missing. It is run by [operator name], [registered address] ("we"). These terms apply when you use Tekiō on the web or in our apps.',
      'Tekiō’s source code is open source under the Apache License 2.0. That licence covers the code. These terms cover the service we run, and the Tekiō name and logo, which the code licence does not give you.',
    ],
  },
  {
    heading: 'Not medical advice',
    paragraphs: [
      'Tekiō gives general information about training and recovery. It is not a medical device, and it does not diagnose, treat or prevent any condition.',
      'Its reads are estimates. Readiness and the body map are worked out from what you log and from wearable readings, and both can be wrong. Treat them as one input, never as a doctor’s opinion.',
      'Talk to a doctor before you start or change a training programme, especially if you have a health condition, an injury, are pregnant, or have recently given blood. Stop at once and seek help if you feel chest pain, faintness or dizziness, or unusual shortness of breath.',
      'You choose how you train, and you train at your own risk.',
    ],
  },
  {
    heading: 'Who can use Tekiō',
    paragraphs: [
      'You must be 16 or older. An account is for one person: keep your sign-in to yourself, and tell us if you think someone else has used it.',
    ],
  },
  {
    heading: 'Your data',
    paragraphs: [
      'What you log is yours. You let us store and process it only to run Tekiō for you: to show you your reads, and to pass it to services you connect. We never sell it.',
      'You can export your entries at any time from Profile. How we handle personal data is set out in our privacy policy.',
      'When something breaks, the app sends us an automatic error report so we can fix it. Error reports describe the fault, not you: they carry no personal data and are not linked to your account.',
    ],
  },
  {
    heading: 'Connected services',
    paragraphs: [
      'You can connect other services, such as a watch platform that syncs your sessions or an assistant that reads or plans your training. A connected service acts on your instruction, and its own terms apply to it. We are not responsible for what another service sends us or for its availability. You can disconnect it at any time.',
    ],
  },
  {
    heading: 'Free and paid',
    paragraphs: [
      'Logging by hand and every read over it are free. Features that write data automatically, such as AI that plans your sessions, an assistant linked to your account, or syncs from other apps, may carry a small charge. You will always see the price before you pay, and nothing is charged without your say.',
      'At launch every feature is free.',
    ],
  },
  {
    heading: 'Subscriptions',
    paragraphs: [
      'A subscription renews at the end of each period until you cancel it. You can cancel at any time; it then runs to the end of the period you paid for and does not renew.',
      'If you buy through the App Store or Google Play, that store takes the payment, and its rules on renewal and refunds apply.',
      'If you live in the EU or the UK, you may withdraw from a purchase within 14 days without giving a reason. If you ask us to start the paid feature straight away, you agree to pay for the part you used before you withdrew.',
      'We will tell you at least 30 days before a price changes, and the new price applies from your next renewal.',
    ],
  },
  {
    heading: 'Fair use',
    paragraphs: [
      'Do not try to reach another person’s data, overload or disrupt the service, or use it for anything unlawful. If you find a security problem, please report it to us privately before telling anyone else; we welcome it.',
    ],
  },
  {
    heading: 'Changes to the service',
    paragraphs: [
      'Tekiō is improved all the time, so features may change or be removed. If we ever close the service, we will tell you at least 30 days ahead so you can export your data.',
    ],
  },
  {
    heading: 'Our liability',
    paragraphs: [
      'Nothing in these terms limits our liability where the law does not allow it to be limited, including for death or personal injury caused by our negligence, or for fraud, and nothing takes away your rights as a consumer.',
      'Otherwise we are not liable for loss we could not reasonably have foreseen, and our total liability to you is limited to what you paid us in the 12 months before the claim.',
    ],
  },
  {
    heading: 'Ending',
    paragraphs: [
      'You can stop using Tekiō and delete your account at any time. We may suspend or close an account that seriously or repeatedly breaks these terms, and we will tell you why unless the law prevents it.',
    ],
  },
  {
    heading: 'Changes to these terms',
    paragraphs: [
      'If we change these terms in a way that matters, we will tell you in the app at least 30 days before the change takes effect. If you do not agree, you can close your account before then.',
    ],
  },
  {
    heading: 'Law and contact',
    paragraphs: [
      'These terms are governed by the law of [country], and disputes go to its courts. If you are a consumer, you keep the protection of the mandatory laws of the country you live in, and you may bring a claim there.',
      'Questions about these terms: [contact address].',
    ],
  },
]
