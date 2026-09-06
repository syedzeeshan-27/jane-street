// All real figures are from SEBI's interim order of 3 July 2025 (WTM/AN/MRD/MRD-SEC-3/31516/2025-26).
// Mirrors src/data/facts.ts so the site and the deck never disagree.
export const SEBI_ORDER_URL = 'https://www.sebi.gov.in/sebi_data/attachdocs/jul-2025/1751584518593.pdf'

export const jan17 = {
  prevClose: 48125.1,
  open: 46573.95,
  high: 47212.75,
  low: 45979.6,
  close: 46064.45,
  buyCrore: 4370.03,
  optionsCrore: 32114.96,
  ratio: 7.3,
  sellCrore: 5372.12,
  underlyingLossCrore: 61.6,
  optionsProfitCrore: 734.93,
  first8min: { boughtCrore: 572, optionsCrore: 8751 },
}

// Stylised intraday path anchored on SEBI's open, high, low and close. Not tick data.
export const jan17Path = {
  labels: ['09:15', '09:30', '10:00', '10:30', '11:00', '11:30', '11:47', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:30'],
  values: [46574, 46800, 47050, 47213, 47100, 46950, 46900, 46700, 46550, 46450, 46300, 46150, 45980, 46020, 46064],
}

export const liquidity = {
  cash: 29225,
  stockFutures: 43589,
  indexFutures: 32607,
  options: 10317127,
  optionsVsAll: 98,
  optionsVsCash: 353,
  entitiesCash: 4675,
  entitiesFutures: 26593,
  entitiesOptions: 1615011,
}

export const pattern = {
  intradayDays: 15,
  intradayOptionsProfitCrore: 3914,
  intradayUnderlyingLossCrore: 199.7,
  closeDays: 3,
  closeExample: { date: '10 July 2024', soldCrore: 2800, optionsCrore: 44153.87 },
  closeOptionsProfitCrore: 560,
  totalDays: 18,
  impoundedCrore: 4843.57,
}

// Table 4 of the order, January 2023 to March 2025, INR crore
export const segments = {
  labels: ['Index options', 'Stock options', 'Index futures', 'Stock futures', 'Cash (stocks)'],
  values: [43289.33, 899.99, -190.81, -7208.23, -288.17],
  total: 36502.12,
}

// Approximate Bank Nifty weights in early 2024, rounded, for the donut. Illustrative.
export const bankNiftyWeights = {
  labels: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank', 'Other 7 banks'],
  values: [28, 24, 10, 10, 9, 19],
}

export const leverageExample = { cash: 100, futuresMargin: 20, optionPremium: 1 }
