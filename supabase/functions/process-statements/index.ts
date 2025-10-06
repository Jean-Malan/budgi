import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BankTransaction {
  date: string
  description: string
  amount: number
  is_income: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // This would integrate with Google Drive API to fetch new statements
    // For now, we'll simulate the process
    
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('id, name')

    if (usersError) throw usersError

    for (const user of users) {
      console.log(`Processing statements for ${user.name}`)
      
      // Simulate checking Google Drive folder for new statements
      // In reality, this would:
      // 1. Connect to Google Drive API
      // 2. List files in the user's statement folder
      // 3. Check against processing_log to avoid duplicates
      // 4. Download and parse new CSV/PDF files
      // 5. Extract transaction data
      
      // For demo, we'll insert some sample transactions
      const sampleTransactions: BankTransaction[] = [
        {
          date: new Date().toISOString().split('T')[0],
          description: 'WOOLWORTHS SUPERMARKET',
          amount: 85.50,
          is_income: false
        },
        {
          date: new Date().toISOString().split('T')[0],
          description: 'SALARY DEPOSIT',
          amount: 3500.00,
          is_income: true
        },
        {
          date: new Date().toISOString().split('T')[0],
          description: 'NETFLIX SUBSCRIPTION',
          amount: 15.99,
          is_income: false
        }
      ]

      // Insert transactions
      for (const transaction of sampleTransactions) {
        const { error: insertError } = await supabaseClient
          .from('transactions')
          .insert({
            user_id: user.id,
            date: transaction.date,
            description: transaction.description,
            amount: transaction.amount,
            is_income: transaction.is_income,
            is_categorized: false
          })

        if (insertError) {
          console.error(`Error inserting transaction for ${user.name}:`, insertError)
        }
      }

      // Log processing
      const fileName = `statements_${user.name}_${new Date().toISOString().split('T')[0]}.csv`
      const fileHash = `hash_${Date.now()}`
      
      await supabaseClient
        .from('processing_log')
        .insert({
          file_name: fileName,
          file_hash: fileHash,
          transaction_count: sampleTransactions.length
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Statements processed successfully',
        processed_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing statements:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})