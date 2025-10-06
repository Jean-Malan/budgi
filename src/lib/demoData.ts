import { supabase } from './supabase'

export async function generateDemoData() {
  try {
    // Get Jean's user ID
    const { data: jean, error: jeanError } = await supabase
      .from('users')
      .select('id')
      .eq('name', 'Jean')
      .single()

    if (jeanError) throw jeanError

    // Get Jean's categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', jean.id)

    if (categoriesError) throw categoriesError

    const groceriesCategory = categories.find(c => c.name === 'Groceries')
    const entertainmentCategory = categories.find(c => c.name === 'Entertainment')
    const transportCategory = categories.find(c => c.name === 'Transport')
    const diningCategory = categories.find(c => c.name === 'Dining Out')

    // Generate sample transactions for the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const sampleTransactions = [
      // Week 1
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'WOOLWORTHS SUPERMARKET',
        amount: 127.50,
        is_income: false,
        category_id: groceriesCategory?.id,
        is_categorized: true,
        confidence_score: 0.95
      },
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'NETFLIX SUBSCRIPTION',
        amount: 15.99,
        is_income: false,
        category_id: entertainmentCategory?.id,
        is_categorized: true,
        confidence_score: 0.98
      },
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'SHELL SERVICE STATION',
        amount: 65.20,
        is_income: false,
        category_id: transportCategory?.id,
        is_categorized: true,
        confidence_score: 0.92
      },
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'SALARY DEPOSIT - ACME CORP',
        amount: 3500.00,
        is_income: true,
        category_id: null,
        is_categorized: true,
        confidence_score: null
      },
      
      // Week 2
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'COLES SUPERMARKET',
        amount: 89.30,
        is_income: false,
        category_id: groceriesCategory?.id,
        is_categorized: true,
        confidence_score: 0.96
      },
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'UBER EATS - PIZZA HUT',
        amount: 28.50,
        is_income: false,
        category_id: diningCategory?.id,
        is_categorized: true,
        confidence_score: 0.89
      },
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'SPOTIFY PREMIUM',
        amount: 11.99,
        is_income: false,
        category_id: entertainmentCategory?.id,
        is_categorized: true,
        confidence_score: 0.97
      },
      
      // Week 3
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'IGA SUPERMARKET',
        amount: 156.80,
        is_income: false,
        category_id: groceriesCategory?.id,
        is_categorized: true,
        confidence_score: 0.94
      },
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'CINEMA TICKETS - EVENT CINEMAS',
        amount: 32.00,
        is_income: false,
        category_id: entertainmentCategory?.id,
        is_categorized: true,
        confidence_score: 0.91
      },
      {
        user_id: jean.id,
        date: new Date(startOfMonth.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'UNKNOWN MERCHANT XYZ',
        amount: 45.00,
        is_income: false,
        category_id: null,
        is_categorized: false,
        confidence_score: null
      },
      
      // Recent uncategorized transactions
      {
        user_id: jean.id,
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'AMAZON MARKETPLACE',
        amount: 67.99,
        is_income: false,
        category_id: null,
        is_categorized: false,
        confidence_score: null
      },
      {
        user_id: jean.id,
        date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'BUNNINGS WAREHOUSE',
        amount: 123.45,
        is_income: false,
        category_id: null,
        is_categorized: false,
        confidence_score: null
      },
      {
        user_id: jean.id,
        date: now.toISOString().split('T')[0],
        description: 'MCDONALD\'S RESTAURANT',
        amount: 12.50,
        is_income: false,
        category_id: null,
        is_categorized: false,
        confidence_score: null
      }
    ]

    // Insert sample transactions
    const { error: transactionsError } = await supabase
      .from('transactions')
      .insert(sampleTransactions)

    if (transactionsError) throw transactionsError

    // Create a current month budget for Jean
    const currentMonth = {
      user_id: jean.id,
      period_start: startOfMonth.toISOString().split('T')[0],
      period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      total_income: 3500.00
    }

    const { error: budgetError } = await supabase
      .from('budgets')
      .upsert(currentMonth)

    if (budgetError) throw budgetError

    console.log('Demo data generated successfully!')
    return true

  } catch (error) {
    console.error('Error generating demo data:', error)
    return false
  }
}

export async function clearDemoData() {
  try {
    // Get Jean's user ID
    const { data: jean, error: jeanError } = await supabase
      .from('users')
      .select('id')
      .eq('name', 'Jean')
      .single()

    if (jeanError) throw jeanError

    // Delete Jean's transactions
    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', jean.id)

    // Delete Jean's budgets
    await supabase
      .from('budgets')
      .delete()
      .eq('user_id', jean.id)

    console.log('Demo data cleared successfully!')
    return true

  } catch (error) {
    console.error('Error clearing demo data:', error)
    return false
  }
}