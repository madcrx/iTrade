export type BrokerType =
  | 'stake'
  | 'commsec'
  | 'selfwealth'
  | 'ibkr'
  | 'etoro'
  | 'kraken'
  | 'binance'
  | 'coinbase'
  | 'webull'
  | 'tiger'

export interface BrokerConfig {
  id: BrokerType
  name: string
  logo: string
  color: string
  assetClasses: ('US_STOCK' | 'ASX_STOCK' | 'CRYPTO' | 'ETF')[]
  buildUrl: (symbol: string, action: 'BUY' | 'SELL', price?: number, quantity?: number) => string
}

export const BROKERS: BrokerConfig[] = [
  {
    id: 'stake',
    name: 'Stake',
    logo: '🟢',
    color: '#00d632',
    assetClasses: ['US_STOCK', 'ASX_STOCK', 'ETF'],
    buildUrl: (symbol, action) =>
      `https://hellostake.com/au/referred-by?referCode=trade&symbol=${symbol}&side=${action.toLowerCase()}`,
  },
  {
    id: 'commsec',
    name: 'CommSec',
    logo: '🏦',
    color: '#ffcc00',
    assetClasses: ['ASX_STOCK', 'ETF'],
    buildUrl: (symbol) =>
      `https://www.commsec.com.au/buy-shares.html?ticker=${symbol.replace('.AX', '')}`,
  },
  {
    id: 'selfwealth',
    name: 'SelfWealth',
    logo: '💼',
    color: '#0066cc',
    assetClasses: ['US_STOCK', 'ASX_STOCK', 'ETF'],
    buildUrl: (symbol, action) =>
      `https://www.selfwealth.com.au/platform/trade?ticker=${symbol}&type=${action.toLowerCase()}`,
  },
  {
    id: 'ibkr',
    name: 'Interactive Brokers',
    logo: '📊',
    color: '#cc0000',
    assetClasses: ['US_STOCK', 'ASX_STOCK', 'CRYPTO', 'ETF'],
    buildUrl: (symbol, action) =>
      `https://client.interactivebrokers.com/portal/#/trade?symbol=${symbol}&side=${action}`,
  },
  {
    id: 'etoro',
    name: 'eToro',
    logo: '🌐',
    color: '#00cc7a',
    assetClasses: ['US_STOCK', 'CRYPTO', 'ETF'],
    buildUrl: (symbol, action) =>
      `https://www.etoro.com/markets/${symbol.toLowerCase()}?openTrade=${action.toLowerCase()}`,
  },
  {
    id: 'kraken',
    name: 'Kraken',
    logo: '🐙',
    color: '#5741d9',
    assetClasses: ['CRYPTO'],
    buildUrl: (symbol, action) => {
      const pair = symbol.replace('-USD', 'USD').replace('/', '')
      return `https://www.kraken.com/u/trade#${action.toLowerCase()}/${pair}`
    },
  },
  {
    id: 'binance',
    name: 'Binance',
    logo: '🟡',
    color: '#f0b90b',
    assetClasses: ['CRYPTO'],
    buildUrl: (symbol, action) => {
      const pair = symbol.replace('-', '') + 'USDT'
      return `https://www.binance.com/en/trade/${pair}?type=spot&side=${action.toLowerCase()}`
    },
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    logo: '🔵',
    color: '#0052ff',
    assetClasses: ['CRYPTO'],
    buildUrl: (symbol, action) => {
      const asset = symbol.split('-')[0] || symbol
      return `https://www.coinbase.com/advanced-trade/spot/${asset}-USD?side=${action.toLowerCase()}`
    },
  },
  {
    id: 'webull',
    name: 'Webull',
    logo: '📱',
    color: '#00b4d8',
    assetClasses: ['US_STOCK', 'ETF', 'CRYPTO'],
    buildUrl: (symbol, action) =>
      `https://app.webull.com/trade?tickerId=${symbol}&action=${action.toLowerCase()}`,
  },
  {
    id: 'tiger',
    name: 'Tiger Brokers',
    logo: '🐯',
    color: '#ff6600',
    assetClasses: ['US_STOCK', 'ASX_STOCK', 'ETF'],
    buildUrl: (symbol, action) =>
      `https://www.tigersecurities.com.au/trade?symbol=${symbol}&action=${action.toLowerCase()}`,
  },
]

export function getBrokersForAsset(
  assetClass: 'US_STOCK' | 'ASX_STOCK' | 'CRYPTO' | 'ETF'
): BrokerConfig[] {
  return BROKERS.filter((b) => b.assetClasses.includes(assetClass))
}

export function buildBrokerUrl(
  brokerId: BrokerType,
  symbol: string,
  action: 'BUY' | 'SELL',
  price?: number,
  quantity?: number
): string {
  const broker = BROKERS.find((b) => b.id === brokerId)
  if (!broker) return '#'
  return broker.buildUrl(symbol, action, price, quantity)
}

export function suggestPositionSize(
  portfolioValue: number,
  riskPreference: 'conservative' | 'moderate' | 'aggressive',
  stopLossPct: number
): { riskPct: number; positionValue: number } {
  const riskPctMap = {
    conservative: 0.01,
    moderate: 0.02,
    aggressive: 0.03,
  }
  const riskPct = riskPctMap[riskPreference]
  const riskAmount = portfolioValue * riskPct
  const positionValue = stopLossPct > 0 ? riskAmount / (stopLossPct / 100) : portfolioValue * 0.05
  return { riskPct: riskPct * 100, positionValue: Math.min(positionValue, portfolioValue * 0.1) }
}
