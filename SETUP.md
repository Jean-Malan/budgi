# Personal Finance Management App

A Vue.js application for Jean and Izzy to manage budgets and automatically categorize bank transactions using AI.

## Features

### ✅ Completed Features
- **Multi-user Budget Management**: Separate profiles for Jean and Izzy
- **Category Management**: Create and edit expense categories with custom colors
- **Transaction Management**: Manual transaction entry and categorization
- **AI-Powered Categorization**: OpenAI integration for automatic transaction categorization
- **Dashboard Analytics**: Budget vs actual spending with visual progress indicators
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### 🚧 Features Ready for Implementation
- **Bank Statement Processing**: CSV parser for Commonwealth, ANZ, and Westpac
- **Google Drive Integration**: Monitor folders for new statement uploads
- **Background Processing**: Supabase Edge Functions for automated tasks
- **Duplicate Detection**: Smart handling of overlapping statement periods

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account
- OpenAI API key

### 2. Database Setup
1. Create a new Supabase project
2. Run the SQL script in `database/schema.sql` in your Supabase SQL editor
3. This will create all necessary tables and insert default users (Jean & Izzy)

### 3. Environment Configuration
1. Copy `.env` to `.env.local`
2. Update the following variables:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```

## Architecture

### Frontend (Vue 3 + TypeScript)
- **Stores**: Pinia stores for auth and budget management
- **Components**: Modular Vue components with Tailwind CSS
- **Views**: Dashboard, Budget Management, and Transaction views

### Backend (Supabase)
- **Database**: PostgreSQL with real-time subscriptions
- **Edge Functions**: Serverless functions for background processing
- **Authentication**: Simple user switching for Jean/Izzy

### AI Integration (OpenAI)
- **Transaction Categorization**: GPT-3.5-turbo for smart categorization
- **Confidence Scoring**: Reliability metrics for AI suggestions
- **Learning System**: Context-aware categorization based on patterns

## Usage Guide

### Getting Started
1. The app auto-logs in as Jean by default
2. Switch between Jean and Izzy using the nav bar buttons
3. Start by setting up budget categories and monthly income

### Budget Management
1. Go to **Budget** page
2. Set your monthly income
3. Create expense categories with budget amounts
4. Choose colors for visual identification

### Transaction Management
1. Add transactions manually via **Transactions** page
2. Use "Auto-Categorize" for AI-powered categorization
3. Review and correct AI suggestions as needed
4. View confidence scores for AI categorizations

### Dashboard Analytics
- View budget vs actual spending
- Monitor category-wise progress
- Check for uncategorized transactions
- Track monthly financial health

## Bank Statement Processing

### Supported Formats
- **Commonwealth Bank**: Date, Description, Credit Amount, Debit Amount, Balance
- **ANZ**: Date, Amount, Description, Balance  
- **Westpac**: Date, Description, Debit Amount, Credit Amount, Running Balance

### CSV Processing (Ready for Implementation)
```javascript
import { parseCSVBankStatement, detectBankFormat } from '@/lib/bankStatementParser'

const csvContent = '...' // Your CSV content
const format = detectBankFormat(csvContent)
const { transactions, errors } = parseCSVBankStatement(csvContent, format)
```

## Edge Functions (Supabase)

### Deploy Functions
```bash
supabase functions deploy process-statements
supabase functions deploy auto-categorize
```

### Set Environment Variables
```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

### Schedule Daily Processing (pg_cron)
```sql
SELECT cron.schedule('daily-statement-processing', '0 9 * * *', 'SELECT net.http_post(
  url := ''https://your-project.supabase.co/functions/v1/process-statements'',
  headers := ''{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}''
);');
```

## Google Drive Integration (Next Steps)

To complete the Google Drive integration:

1. **Google Cloud Setup**
   - Create Google Cloud project
   - Enable Google Drive API
   - Create service account with Drive access
   - Download credentials JSON

2. **Folder Structure**
   ```
   /Finance Statements
     /Jean
       /2024-10-statements.csv
     /Izzy  
       /2024-10-statements.csv
   ```

3. **Implementation**
   - Monitor folders for new files
   - Download and parse CSV statements
   - Handle duplicate detection via file hashing
   - Process backdated transactions intelligently

## Development Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

## Project Structure

```
src/
├── components/           # Reusable Vue components
│   ├── NavBar.vue       # Navigation component
├── views/               # Page components
│   ├── DashboardView.vue # Main dashboard
│   ├── BudgetView.vue   # Budget management
│   └── TransactionsView.vue # Transaction management
├── stores/              # Pinia stores
│   ├── auth.ts          # User authentication
│   └── budget.ts        # Budget and transaction data
├── lib/                 # Utility libraries
│   ├── supabase.ts      # Supabase client
│   ├── openai.ts        # OpenAI integration
│   └── bankStatementParser.ts # CSV parsing
└── router/              # Vue Router configuration

supabase/
├── functions/           # Edge Functions
│   ├── process-statements/ # Daily statement processing
│   └── auto-categorize/    # AI categorization
└── migrations/          # Database migrations

database/
└── schema.sql          # Database schema and initial data
```

## Security Notes

- API keys are client-side (for demo purposes)
- In production, move OpenAI calls to Edge Functions
- Implement proper authentication and row-level security
- Never commit API keys to version control

## Next Steps for Production

1. **Enhanced Security**
   - Implement proper Supabase Auth
   - Move AI processing to server-side
   - Add row-level security policies

2. **Google Drive Integration**
   - Complete OAuth2 flow for Drive access
   - Implement file monitoring and processing
   - Add intelligent duplicate detection

3. **Advanced Features**
   - Export reports to Excel/PDF
   - Bill prediction and reminders
   - Savings goals tracking
   - Multi-bank account support

4. **Performance Optimization**
   - Implement data pagination
   - Add caching for frequent queries
   - Optimize bundle size

## Contributing

This is a personal finance app for Jean and Izzy. Feel free to adapt the code for your own use case!