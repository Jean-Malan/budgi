import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

export interface Category {
  name: string
  id: string
}

export interface CategorizationResult {
  categoryId: string | null
  confidence: number
  reasoning?: string
}

export async function categorizeTransactionWithAI(
  description: string,
  categories: Category[]
): Promise<CategorizationResult> {
  try {
    const prompt = `
You are a financial transaction categorization AI. Given a transaction description and a list of available categories, determine the most appropriate category.

Transaction Description: "${description}"

Available Categories:
${categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')}

Rules:
1. Only use categories from the provided list
2. If no category fits well, return null for categoryId
3. Provide a confidence score between 0 and 1
4. Consider common spending patterns and merchant names

Respond with a JSON object in this exact format:
{
  "categoryId": "category_id_here_or_null",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this category was chosen"
}

Examples:
- "WOOLWORTHS SUPERMARKET" → Groceries category
- "NETFLIX SUBSCRIPTION" → Entertainment category
- "UBER EATS ORDER" → Dining Out category
- "SHELL PETROL STATION" → Transport category
- "ELECTRICITY BILL" → Utilities category
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful financial assistant that categorizes transactions accurately. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    try {
      const result = JSON.parse(content)
      
      // Validate the response structure
      if (typeof result !== 'object' || 
          (!result.categoryId && result.categoryId !== null) ||
          typeof result.confidence !== 'number' ||
          result.confidence < 0 || result.confidence > 1) {
        throw new Error('Invalid response structure')
      }

      // Validate categoryId exists in provided categories
      if (result.categoryId && !categories.find(c => c.id === result.categoryId)) {
        result.categoryId = null
        result.confidence = 0
        result.reasoning = 'Category not found in available options'
      }

      return {
        categoryId: result.categoryId,
        confidence: result.confidence,
        reasoning: result.reasoning
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      return {
        categoryId: null,
        confidence: 0,
        reasoning: 'Failed to parse AI response'
      }
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    return {
      categoryId: null,
      confidence: 0,
      reasoning: 'AI service unavailable'
    }
  }
}

export async function suggestCategoryForTransaction(
  description: string,
  recentTransactions: Array<{ description: string; category: string }>
): Promise<string[]> {
  try {
    const prompt = `
Based on this transaction description and recent similar transactions, suggest potential category names:

Transaction: "${description}"

Recent similar transactions:
${recentTransactions.map(t => `"${t.description}" → ${t.category}`).join('\n')}

Suggest 3-5 relevant category names that would fit this transaction. Return as a JSON array of strings.
Common categories include: Groceries, Entertainment, Transport, Utilities, Dining Out, Shopping, Healthcare, etc.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful financial assistant. Always respond with valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 100
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    const suggestions = JSON.parse(content)
    return Array.isArray(suggestions) ? suggestions : []
  } catch (error) {
    console.error('Error getting category suggestions:', error)
    return []
  }
}