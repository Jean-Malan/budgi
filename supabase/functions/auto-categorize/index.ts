import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Get uncategorized transactions
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select(`
        id,
        description,
        user_id,
        users!inner(id, name)
      `)
      .eq('is_categorized', false)
      .eq('is_income', false)

    if (transactionsError) throw transactionsError

    for (const transaction of transactions) {
      // Get user's categories
      const { data: categories, error: categoriesError } = await supabaseClient
        .from('categories')
        .select('id, name')
        .eq('user_id', transaction.user_id)

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
        continue
      }

      if (!categories || categories.length === 0) {
        console.log(`No categories found for user ${transaction.user_id}`)
        continue
      }

      // Call OpenAI for categorization
      try {
        const prompt = `
Categorize this transaction: "${transaction.description}"

Available categories:
${categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')}

Respond with JSON: {"categoryId": "id_or_null", "confidence": 0.85}
`

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a financial categorization assistant. Always respond with valid JSON.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 100
          })
        })

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content

        if (content) {
          const result = JSON.parse(content)
          
          if (result.categoryId && result.confidence > 0.7) {
            // Update transaction with category
            await supabaseClient
              .from('transactions')
              .update({
                category_id: result.categoryId,
                is_categorized: true,
                confidence_score: result.confidence
              })
              .eq('id', transaction.id)

            console.log(`Categorized transaction ${transaction.id} as ${result.categoryId}`)
          }
        }
      } catch (error) {
        console.error(`Error categorizing transaction ${transaction.id}:`, error)
      }

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Auto-categorization completed',
        processed_count: transactions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in auto-categorization:', error)
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