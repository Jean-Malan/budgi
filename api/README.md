# Finance App API

Minimal TypeScript backend for Google Drive integration and transaction processing.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Copy your Supabase credentials from the main app's .env
   ```

3. **Database migration:**
   ```bash
   # Run the database migration in your Supabase database
   psql -d your_database < ../database/002_add_google_drive_fields.sql
   ```

4. **Google Drive API setup:**
   - Create a Google Cloud Project
   - Enable the Google Drive API
   - Create a Service Account
   - Download the service account key JSON file
   - Update `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` in .env

## Development

```bash
# Run API server only
npm run dev

# Run both frontend and API (from main directory)
npm run dev:full
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/drive/folders/search?query=bank` - Search Google Drive folders
- `POST /api/drive/connect/:bankAccountId` - Connect bank account to Drive folder
- `GET /api/drive/status/:bankAccountId` - Get connection status
- `POST /api/drive/sync/:bankAccountId` - Sync transactions from Drive

## File Format Support

Currently supports CSV files with flexible column mapping:
- Date (various formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)
- Description
- Amount (handles currency symbols, parentheses for negatives)
- Optional: Balance, Category

## Architecture

- **Express.js** - Minimal web server
- **Supabase** - Database integration (shared with frontend)
- **Google APIs** - Drive integration
- **csv-parse** - CSV processing
- **TypeScript** - Type safety across stack