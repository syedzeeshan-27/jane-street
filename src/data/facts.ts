/**
 * Real numbers, all from SEBI's interim order dated 3 July 2025
 * (WTM/AN/MRD/MRD-SEC-3/31516/2025-26). Paragraph references in comments.
 * These are SEBI's allegations in an interim order under appeal, not a court finding.
 */
export const SEBI_ORDER_URL = 'https://www.sebi.gov.in/sebi_data/attachdocs/jul-2025/1751584518593.pdf'

export const jan17 = {
  date: '17 January 2024',
  prevClose: 48125.1, // Table 5
  open: 46573.95,
  high: 47212.75,
  low: 45979.6,
  close: 46064.45,
  patch1: { from: '09:15', to: '11:47', buyCrore: 4370.03, optionsCrore: 32114.96, ratio: 7.3 }, // para 15.2, 15.27
  patch2: { from: '11:49', to: '15:30', sellCrore: 5372.12 }, // para 15.49.3
  underlyingLossCrore: 61.6, // para 15.43
  optionsProfitCrore: 734.93, // para 15.49.4
  first8min: { boughtCrore: 572, optionsCrore: 8751, multiple: 15 }, // para 15.11 to 15.13
}

export const liquidity = {
  // Table 2, cash-equivalent traded turnover on 17 Jan 2024, INR crore
  cash: 29225,
  stockFutures: 43589,
  indexFutures: 32607,
  options: 10317127,
  optionsVsCash: 353,
  optionsVsAll: 98,
  // Table 3, unique entities trading that day
  entitiesCash: 4675,
  entitiesFutures: 26593,
  entitiesOptions: 1615011,
}

export const pattern = {
  intradayDays: 15, // para 15.55
  intradayOptionsProfitCrore: 3914, // para 15.56
  intradayUnderlyingLossCrore: 199.7,
  closeDays: 3, // para 16
  closeExample: { date: '10 July 2024', soldCrore: 2800, optionsCrore: 44153.87 },
  closeOptionsProfitCrore: 560,
  totalDays: 18,
  impoundedCrore: 4843.57, // para 62.1
}

export const fullPeriod = {
  from: 'January 2023',
  to: 'March 2025',
  indexOptionsProfitCrore: 43289.33, // Table 4
  otherLossesCrore: 7687.21,
  totalProfitCrore: 36502.12,
  bankNiftyShareOfOptionsProfitCrore: 17319.26,
}

export const timeline = [
  { when: 'April 2024', what: 'A US lawsuit by Jane Street against former employees mentions a secret India options strategy. Attention turns to its Indian trades.' },
  { when: 'Feb 2025', what: 'NSE sends Jane Street a caution letter asking it to stop the pattern.' },
  { when: 'May 2025', what: 'SEBI says a similar expiry day pattern was still seen in Nifty on 15 May.' },
  { when: '3 July 2025', what: 'SEBI interim order: ₹4,843.57 crore of alleged gains to be impounded, four entities barred from the market.' },
  { when: '14 July 2025', what: 'Jane Street deposits the full amount in escrow, while denying wrongdoing.' },
  { when: '21 July 2025', what: 'SEBI allows the group back into the market. The case moves to appeal.' },
]

/** SEBI's own leverage example, para 10. */
export const leverageExample = { cash: 100, futuresMargin: 20, optionPremium: 1 }
