import { parse } from 'csv-parse/sync'
import { Transaction } from '../types/shared'

interface CSVRow {
  date: string
  description: string
  amount: string
  balance?: string
  category?: string
}

export class CSVProcessor {
  static async processCSV(fileBuffer: Buffer, bankAccountId: string, userId: string): Promise<Partial<Transaction>[]> {
    try {
      const csvText = fileBuffer.toString('utf-8')
      
      // Parse CSV with flexible column detection
      const records: CSVRow[] = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      })

      const transactions: Partial<Transaction>[] = []

      for (const record of records) {
        // Try to map CSV columns to our transaction format
        const transaction = this.mapCSVRowToTransaction(record, bankAccountId, userId)
        if (transaction) {
          transactions.push(transaction)
        }
      }

      return transactions
    } catch (error) {
      console.error('Error processing CSV:', error)
      throw new Error('Failed to process CSV file')
    }
  }

  private static mapCSVRowToTransaction(row: CSVRow, bankAccountId: string, userId: string): Partial<Transaction> | null {
    try {
      // Flexible date parsing
      const date = this.parseDate(row.date)
      if (!date) return null

      // Flexible amount parsing
      const amount = this.parseAmount(row.amount)
      if (amount === null) return null

      // Determine if it's income or expense
      const is_income = amount > 0

      return {
        user_id: userId,
        bank_account_id: bankAccountId,
        description: row.description?.trim() || 'Unknown transaction',
        amount: Math.abs(amount),
        date: date.toISOString().split('T')[0],
        is_income,
        is_categorized: false,
        confidence_score: null,
        is_debt: false,
        debt_creditor_id: null,
        debt_debtor_id: null,
        debt_split_percentage: null,
        debt_status: null,
        debt_remaining_amount: null
      }
    } catch (error) {
      console.error('Error mapping CSV row:', error)
      return null
    }
  }

  private static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null

    // Try various date formats
    const formats = [
      // ISO format
      /^\d{4}-\d{2}-\d{2}$/,
      // DD/MM/YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      // MM/DD/YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      // DD-MM-YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/
    ]

    const cleanDate = dateStr.trim()
    
    // Try parsing as-is first
    let date = new Date(cleanDate)
    if (!isNaN(date.getTime())) {
      return date
    }

    // Try manual parsing for DD/MM/YYYY format
    const ddmmyyyy = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      if (!isNaN(date.getTime())) {
        return date
      }
    }

    return null
  }

  private static parseAmount(amountStr: string): number | null {
    if (!amountStr) return null

    // Remove currency symbols, spaces, and commas
    const cleanAmount = amountStr
      .toString()
      .replace(/[$£€¥,\s]/g, '')
      .replace(/[()]/g, '') // Remove parentheses
      .trim()

    // Handle negative amounts in parentheses (accounting format)
    const isNegative = amountStr.includes('(') && amountStr.includes(')')

    const amount = parseFloat(cleanAmount)
    if (isNaN(amount)) return null

    return isNegative ? -Math.abs(amount) : amount
  }
}