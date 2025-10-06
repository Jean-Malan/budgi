import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { driveRoutes } from './routes/drive'

// Load environment variables
dotenv.config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// Add supabase to request context
app.use((req, res, next) => {
  (req as any).supabase = supabase
  next()
})

// Routes
app.use('/api/drive', driveRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Finance API server running on http://localhost:${PORT}`)
})