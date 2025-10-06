import { Router } from 'express'
import { googleDriveService } from '../services/googleDrive'
import { CSVProcessor } from '../services/csvProcessor'
import { FileProcessingResult } from '../types/shared'

export const driveRoutes = Router()

// Connect a bank account to a Google Drive folder
driveRoutes.post('/connect/:bankAccountId', async (req, res) => {
  try {
    const { bankAccountId } = req.params
    const { folderId } = req.body
    const supabase = (req as any).supabase

    // Update bank account with Google Drive folder ID
    const { error } = await supabase
      .from('bank_accounts')
      .update({ 
        google_drive_folder_id: folderId,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', bankAccountId)

    if (error) {
      throw error
    }

    res.json({ success: true, message: 'Bank account connected to Google Drive folder' })
  } catch (error) {
    console.error('Error connecting to Drive:', error)
    res.status(500).json({ success: false, message: 'Failed to connect to Google Drive' })
  }
})

// Search for Google Drive folders
driveRoutes.get('/folders/search', async (req, res) => {
  try {
    const { query } = req.query as { query: string }
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query parameter required' })
    }

    const folders = await googleDriveService.searchFolders(query)
    res.json({ success: true, folders })
  } catch (error) {
    console.error('Error searching folders:', error)
    res.status(500).json({ success: false, message: 'Failed to search folders' })
  }
})

// Sync transactions from Google Drive
driveRoutes.post('/sync/:bankAccountId', async (req, res) => {
  try {
    const { bankAccountId } = req.params
    const supabase = (req as any).supabase

    // Get bank account details
    const { data: bankAccount, error: accountError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', bankAccountId)
      .single()

    if (accountError || !bankAccount) {
      return res.status(404).json({ success: false, message: 'Bank account not found' })
    }

    if (!bankAccount.google_drive_folder_id) {
      return res.status(400).json({ success: false, message: 'Bank account not connected to Google Drive' })
    }

    // Get files from Google Drive folder
    const files = await googleDriveService.getFolderContents(bankAccount.google_drive_folder_id)
    
    // Filter for CSV files only for now
    const csvFiles = files.filter(file => 
      file.mimeType === 'text/csv' || 
      file.name.toLowerCase().endsWith('.csv')
    )

    if (csvFiles.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No CSV files found in folder',
        transactionsProcessed: 0,
        duplicatesSkipped: 0
      } as FileProcessingResult)
    }

    let totalProcessed = 0
    let totalDuplicates = 0
    const errors: string[] = []

    // Process each CSV file
    for (const file of csvFiles) {
      try {
        // Check if file was already processed
        const { data: existingLog } = await supabase
          .from('processing_log')
          .select('id')
          .eq('file_name', file.name)
          .single()

        if (existingLog) {
          totalDuplicates++
          continue
        }

        // Download and process file
        const fileBuffer = await googleDriveService.downloadFile(file.id)
        const transactions = await CSVProcessor.processCSV(fileBuffer, bankAccountId, bankAccount.user_id)

        if (transactions.length > 0) {
          // Insert transactions
          const { error: insertError } = await supabase
            .from('transactions')
            .insert(transactions)

          if (insertError) {
            throw insertError
          }

          // Log successful processing
          await supabase
            .from('processing_log')
            .insert({
              file_name: file.name,
              file_hash: `drive_${file.id}`,
              transaction_count: transactions.length
            })

          totalProcessed += transactions.length
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        errors.push(`Failed to process ${file.name}: ${error.message}`)
      }
    }

    // Update last sync time
    await supabase
      .from('bank_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', bankAccountId)

    const result: FileProcessingResult = {
      success: true,
      message: `Processed ${csvFiles.length} files`,
      transactionsProcessed: totalProcessed,
      duplicatesSkipped: totalDuplicates,
      errors: errors.length > 0 ? errors : undefined
    }

    res.json(result)
  } catch (error) {
    console.error('Error syncing from Drive:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync from Google Drive',
      transactionsProcessed: 0,
      duplicatesSkipped: 0
    } as FileProcessingResult)
  }
})

// Get sync status for a bank account
driveRoutes.get('/status/:bankAccountId', async (req, res) => {
  try {
    const { bankAccountId } = req.params
    const supabase = (req as any).supabase

    const { data: bankAccount, error } = await supabase
      .from('bank_accounts')
      .select('google_drive_folder_id, last_sync_at')
      .eq('id', bankAccountId)
      .single()

    if (error || !bankAccount) {
      return res.status(404).json({ success: false, message: 'Bank account not found' })
    }

    res.json({
      success: true,
      connected: !!bankAccount.google_drive_folder_id,
      lastSync: bankAccount.last_sync_at,
      folderId: bankAccount.google_drive_folder_id
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    res.status(500).json({ success: false, message: 'Failed to get sync status' })
  }
})