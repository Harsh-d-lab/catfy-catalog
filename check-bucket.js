const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Use values from .env.example for testing
const supabaseUrl = 'https://ahstwimhkvifixhsrplr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoc3R3aW1oa3ZpZml4aHNycGxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkyODcyNiwiZXhwIjoyMDcxNTA0NzI2fQ.EVmZXWhtfbrd7KsyrayADw1OfD3djez2SS7DWHLsIVc'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndCreateBucket() {
  try {
    console.log('Checking if catfy-uploads bucket exists...')
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }
    
    console.log('Existing buckets:', buckets.map(b => b.name))
    
    const bucketExists = buckets.some(bucket => bucket.name === 'catfy-uploads')
    
    if (bucketExists) {
      console.log('✅ catfy-uploads bucket already exists')
    } else {
      console.log('❌ catfy-uploads bucket does not exist. Creating...')
      
      const { data, error } = await supabase.storage.createBucket('catfy-uploads', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (error) {
        console.error('Error creating bucket:', error)
      } else {
        console.log('✅ Successfully created catfy-uploads bucket')
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkAndCreateBucket()