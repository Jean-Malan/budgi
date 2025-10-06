export interface BankTransaction {
  date: string
  description: string
  amount: number
  is_income: boolean
}

export interface ParseResult {
  transactions: BankTransaction[]
  errors: string[]
}

export function parseCSVBankStatement(csvContent: string, format: 'commonwealth' | 'anz' | 'westpac' = 'commonwealth'): ParseResult {
  const lines = csvContent.trim().split('\n')
  const transactions: BankTransaction[] = []
  const errors: string[] = []

  // Skip header row
  const dataLines = lines.slice(1)

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]?.trim()
    if (!line) continue

    try {
      const transaction = parseTransactionLine(line, format)
      if (transaction) {
        transactions.push(transaction)
      }
    } catch (error) {
      errors.push(`Line ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { transactions, errors }
}

function parseTransactionLine(line: string, format: string): BankTransaction | null {
  const fields = parseCSVLine(line)

  switch (format) {
    case 'commonwealth':
      return parseCommonwealthTransaction(fields)
    case 'anz':
      return parseANZTransaction(fields)
    case 'westpac':
      return parseWestpacTransaction(fields)
    default:
      throw new Error(`Unsupported bank format: ${format}`)
  }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  fields.push(current.trim())
  return fields
}

function parseCommonwealthTransaction(fields: string[]): BankTransaction | null {
  // Commonwealth Bank CSV format:
  // Date, Description, Credit Amount, Debit Amount, Balance
  if (fields.length < 5) {
    throw new Error('Invalid Commonwealth Bank transaction format')
  }

  const dateStr = fields[0] || ''
  const description = fields[1] || ''
  const creditStr = fields[2] || ''
  const debitStr = fields[3] || ''

  const date = parseDate(dateStr)
  if (!date) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }

  const credit = parseFloat(creditStr) || 0
  const debit = parseFloat(debitStr) || 0

  if (credit === 0 && debit === 0) {
    return null // Skip empty transactions
  }

  return {
    date: date.toISOString().split('T')[0] as string,
    description: description.trim(),
    amount: credit > 0 ? credit : debit,
    is_income: credit > 0
  }
}

function parseANZTransaction(fields: string[]): BankTransaction | null {
  // ANZ CSV format:
  // Date, Amount, Description, Balance
  if (fields.length < 4) {
    throw new Error('Invalid ANZ transaction format')
  }

  const dateStr = fields[0] || ''
  const amountStr = fields[1] || ''
  const description = fields[2] || ''

  const date = parseDate(dateStr)
  if (!date) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) {
    throw new Error(`Invalid amount: ${amountStr}`)
  }

  return {
    date: date.toISOString().split('T')[0] as string,
    description: description.trim(),
    amount: Math.abs(amount),
    is_income: amount > 0
  }
}

function parseWestpacTransaction(fields: string[]): BankTransaction | null {
  // Westpac CSV format:
  // Date, Description, Debit Amount, Credit Amount, Running Balance
  if (fields.length < 5) {
    throw new Error('Invalid Westpac transaction format')
  }

  const dateStr = fields[0] || ''
  const description = fields[1] || ''
  const debitStr = fields[2] || ''
  const creditStr = fields[3] || ''

  const date = parseDate(dateStr)
  if (!date) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }

  const credit = parseFloat(creditStr) || 0
  const debit = parseFloat(debitStr) || 0

  if (credit === 0 && debit === 0) {
    return null
  }

  return {
    date: date.toISOString().split('T')[0] as string,
    description: description.trim(),
    amount: credit > 0 ? credit : debit,
    is_income: credit > 0
  }
}

function parseDate(dateStr: string): Date | null {
  // Try common date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or D/M/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ]

  for (const format of formats) {
    const match = dateStr.match(format)
    if (match) {
      if (format === formats[0] && match) {
        // DD/MM/YYYY format
        const day = parseInt(match[1] || '1')
        const month = parseInt(match[2] || '1') - 1 // JavaScript months are 0-indexed
        const year = parseInt(match[3] || '2024')
        return new Date(year, month, day)
      } else if (format === formats[1]) {
        // YYYY-MM-DD format
        return new Date(dateStr)
      } else if (format === formats[2] && match) {
        // DD-MM-YYYY format
        const day = parseInt(match[1] || '1')
        const month = parseInt(match[2] || '1') - 1
        const year = parseInt(match[3] || '2024')
        return new Date(year, month, day)
      }
    }
  }

  return null
}

export function detectBankFormat(csvContent: string): string {
  const lines = csvContent.trim().split('\n')
  if (lines.length === 0) return 'commonwealth'

  const headerLine = lines[0]?.toLowerCase() || ''

  if (headerLine.includes('credit amount') && headerLine.includes('debit amount')) {
    if (headerLine.includes('running balance')) {
      return 'westpac'
    }
    return 'commonwealth'
  }

  if (headerLine.includes('amount') && headerLine.includes('balance')) {
    return 'anz'
  }

  return 'commonwealth' // Default fallback
}

export function generateSampleCSV(format: 'commonwealth' | 'anz' | 'westpac' = 'commonwealth'): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const formatDate = (date: Date) => {
    return format === 'anz' 
      ? date.toISOString().split('T')[0]
      : date.toLocaleDateString('en-AU')
  }

  switch (format) {
    case 'commonwealth':
      return `Date,Description,Credit Amount,Debit Amount,Balance
${formatDate(yesterday)},"SALARY DEPOSIT",3500.00,,3500.00
${formatDate(yesterday)},"WOOLWORTHS SUPERMARKET",,85.50,3414.50
${formatDate(today)},"NETFLIX SUBSCRIPTION",,15.99,3398.51
${formatDate(today)},"UBER EATS ORDER",,32.40,3366.11`

    case 'anz':
      return `Date,Amount,Description,Balance
${formatDate(yesterday)},3500.00,"SALARY DEPOSIT",3500.00
${formatDate(yesterday)},-85.50,"WOOLWORTHS SUPERMARKET",3414.50
${formatDate(today)},-15.99,"NETFLIX SUBSCRIPTION",3398.51
${formatDate(today)},-32.40,"UBER EATS ORDER",3366.11`

    case 'westpac':
      return `Date,Description,Debit Amount,Credit Amount,Running Balance
${formatDate(yesterday)},"SALARY DEPOSIT",,3500.00,3500.00
${formatDate(yesterday)},"WOOLWORTHS SUPERMARKET",85.50,,3414.50
${formatDate(today)},"NETFLIX SUBSCRIPTION",15.99,,3398.51
${formatDate(today)},"UBER EATS ORDER",32.40,,3366.11`

    default:
      return ''
  }
}