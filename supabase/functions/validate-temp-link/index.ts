import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuoteSubmission {
  estimated_value: number
  estimated_time: string
  estimated_completion_date: string
  completion_notes?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const action = url.searchParams.get('action') || 'validate'

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[validate-temp-link] Action: ${action}, Token: ${token.substring(0, 8)}...`)

    // Fetch and validate temporary link
    const { data: linkData, error: linkError } = await supabase
      .from('temporary_links')
      .select('*')
      .eq('token', token)
      .eq('type', 'quote')
      .single()

    if (linkError || !linkData) {
      console.log('[validate-temp-link] Token not found')
      return new Response(
        JSON.stringify({ state: 'not_found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if expired
    if (new Date(linkData.expires_at) < new Date()) {
      console.log('[validate-temp-link] Token expired')
      return new Response(
        JSON.stringify({ state: 'expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already used
    if (linkData.used_at) {
      console.log('[validate-temp-link] Token already used')
      return new Response(
        JSON.stringify({ state: 'used' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For validation action, fetch and return service call data
    if (action === 'validate') {
      // Fetch service call
      const { data: callData, error: callError } = await supabase
        .from('service_calls')
        .select('*')
        .eq('id', linkData.service_call_id)
        .single()

      if (callError || !callData) {
        console.log('[validate-temp-link] Service call not found')
        return new Response(
          JSON.stringify({ state: 'not_found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Fetch condominium
      const { data: condoData, error: condoError } = await supabase
        .from('condominiums')
        .select('name')
        .eq('id', callData.condominium_id)
        .single()

      if (condoError || !condoData) {
        console.log('[validate-temp-link] Condominium not found')
        return new Response(
          JSON.stringify({ state: 'not_found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Fetch photos and generate signed URLs
      const { data: photosData } = await supabase
        .from('service_call_photos')
        .select('id, photo_url, type')
        .eq('service_call_id', callData.id)
        .eq('type', 'initial')

      // Generate signed URLs for each photo
      const photosWithSignedUrls = []
      if (photosData && photosData.length > 0) {
        for (const photo of photosData) {
          // Extract the file path from the full URL
          const urlMatch = photo.photo_url.match(/service-call-photos\/(.+)/)
          if (urlMatch) {
            const filePath = urlMatch[1]
            const { data: signedUrl } = await supabase.storage
              .from('service-call-photos')
              .createSignedUrl(filePath, 3600) // 1 hour expiry

            if (signedUrl) {
              photosWithSignedUrls.push({
                ...photo,
                photo_url: signedUrl.signedUrl
              })
            }
          }
        }
      }

      console.log('[validate-temp-link] Returning valid data')
      return new Response(
        JSON.stringify({
          state: 'valid',
          serviceCall: callData,
          condominium: condoData,
          photos: photosWithSignedUrls,
          temporaryLink: linkData
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For submit action, update service call and mark link as used
    if (action === 'submit' && req.method === 'POST') {
      const body: QuoteSubmission = await req.json()

      // Validate submission data
      if (!body.estimated_value || body.estimated_value < 1) {
        return new Response(
          JSON.stringify({ error: 'Valor deve ser no mínimo R$ 1,00' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!body.estimated_time) {
        return new Response(
          JSON.stringify({ error: 'Tempo estimado é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!body.estimated_completion_date) {
        return new Response(
          JSON.stringify({ error: 'Data prevista é obrigatória' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify link is still valid before submitting
      const { data: freshLinkData, error: freshLinkError } = await supabase
        .from('temporary_links')
        .select('*')
        .eq('token', token)
        .single()

      if (freshLinkError || !freshLinkData || freshLinkData.used_at) {
        return new Response(
          JSON.stringify({ error: 'Link já foi utilizado ou expirou' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update service call with quote
      const { error: updateError } = await supabase
        .from('service_calls')
        .update({
          estimated_value: body.estimated_value,
          estimated_time: body.estimated_time,
          estimated_completion_date: body.estimated_completion_date,
          completion_notes: body.completion_notes || null,
          status: 'awaiting_approval',
        })
        .eq('id', linkData.service_call_id)

      if (updateError) {
        console.error('[validate-temp-link] Error updating service call:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar orçamento' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mark link as used
      const { error: markUsedError } = await supabase
        .from('temporary_links')
        .update({ used_at: new Date().toISOString() })
        .eq('id', linkData.id)

      if (markUsedError) {
        console.error('[validate-temp-link] Error marking link as used:', markUsedError)
      }

      // Create notification for manager (server-side, bypassing RLS)
      const { data: callData } = await supabase
        .from('service_calls')
        .select('created_by, title')
        .eq('id', linkData.service_call_id)
        .single()

      if (callData?.created_by) {
        await supabase.from('notifications').insert({
          user_id: callData.created_by,
          type: 'quote_received',
          title: 'Novo orçamento recebido',
          message: `O prestador enviou um orçamento de R$ ${body.estimated_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para o chamado "${callData.title}"`,
          data: { service_call_id: linkData.service_call_id },
        })
      }

      console.log('[validate-temp-link] Quote submitted successfully')
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[validate-temp-link] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
