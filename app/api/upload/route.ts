import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { dataProcessor } from '@/lib/services/data-processor'
import { slackService } from '@/lib/services/slack'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API - Starting request processing')
    
    // First, try cookie-based authentication
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // If cookie auth fails, try Authorization header
    if (!user && request.headers.get('authorization')) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      if (token) {
        console.log('Upload API - Trying token-based authentication')
        // Create a new client with the token
        const tokenSupabase = await createServiceClient()
        const { data: tokenUser, error: tokenError } = await tokenSupabase.auth.getUser(token)
        
        if (tokenUser && !tokenError) {
          user = tokenUser
          authError = null
          console.log('Upload API - Token authentication successful')
        } else {
          console.log('Upload API - Token authentication failed:', tokenError?.message)
        }
      }
    }

    console.log('Upload API - Auth check result:', {
      user: user ? `${user.id} (${user.email})` : 'null',
      authError: authError?.message || 'none'
    })

    if (authError || !user) {
      console.log('Upload API - Authentication failed, returning 401')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('Upload API - User authenticated, proceeding with upload')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const dataSourceId = formData.get('data_source_id') as string

    if (!file || !dataSourceId) {
      return NextResponse.json(
        { error: 'File and data_source_id are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['csv', 'xlsx', 'json']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds limit of ${maxSize} bytes` },
        { status: 400 }
      )
    }

    // Use service client for storage operations that require elevated privileges
    const serviceSupabase = await createServiceClient()

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const fileName = `${Date.now()}-${file.name}`
    
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('esg-files')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Process file content
    let rawData: Record<string, any>[] = []
    
    if (fileExtension === 'csv') {
      rawData = await dataProcessor.processCSVFile(Buffer.from(fileBuffer), file.name)
    } else if (fileExtension === 'json') {
      const textContent = new TextDecoder().decode(fileBuffer)
      rawData = JSON.parse(textContent)
    }
    // Add support for Excel files later

    // Create raw record in database
    const { data: rawRecord, error: dbError } = await serviceSupabase
      .from('raw_records')
      .insert({
        data_source_id: dataSourceId,
        file_uri: uploadData.path,
        raw_data: rawData,
        original_filename: file.name,
        processed: false
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save record' },
        { status: 500 }
      )
    }

    // Process the data asynchronously
    try {
      await dataProcessor.processRawRecord(rawRecord.id)
      
      // Validate data quality
      const qualityResult = await dataProcessor.validateDataQuality(rawRecord.id)
      
      // Send notifications
      await slackService.sendProcessingComplete(
        rawRecord.id,
        rawData.length,
        qualityResult.quality_score
      )

      if (qualityResult.quality_score < 70) {
        await slackService.sendDataQualityAlert(
          rawRecord.id,
          qualityResult.quality_score,
          qualityResult.issues
        )
      }
    } catch (processingError) {
      console.error('Processing error:', processingError)
      // Continue with response even if processing fails
    }

    return NextResponse.json({
      success: true,
      record_id: rawRecord.id,
      file_path: uploadData.path,
      processed_rows: rawData.length
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 