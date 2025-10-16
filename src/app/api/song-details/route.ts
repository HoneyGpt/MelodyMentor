import { NextRequest, NextResponse } from 'next/server'

// Spotify API integration
const getSpotifyAccessToken = async () => {
  try {
    const clientId = '3007ee64e0a14f8abc4f14b0c623eb43'
    const clientSecret = '9791cc703b554072b6975eaad8b2c544'
    
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.access_token
    }
    return null
  } catch (error) {
    console.error('Spotify auth error:', error)
    return null
  }
}

// Get detailed track information from Spotify
const getSpotifyTrackDetails = async (trackId: string) => {
  try {
    const accessToken = await getSpotifyAccessToken()
    if (!accessToken) return null
    
    const [trackResponse, audioFeaturesResponse] = await Promise.all([
      fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ])
    
    if (trackResponse.ok && audioFeaturesResponse.ok) {
      const trackData = await trackResponse.json()
      const audioFeatures = await audioFeaturesResponse.json()
      
      return {
        ...trackData,
        audioFeatures
      }
    }
    return null
  } catch (error) {
    console.error('Spotify track details error:', error)
    return null
  }
}

// Get lyrics using a lyrics API (using a free service)
const getLyrics = async (artist: string, title: string) => {
  try {
    // Using a public lyrics API - in production, you might want to use a paid service
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    )
    
    if (response.ok) {
      const data = await response.json()
      return data.lyrics || null
    }
    
    // Fallback to another service
    const fallbackResponse = await fetch(
      `https://lyric-api.herokuapp.com/api/find/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    )
    
    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json()
      return data.lyric || null
    }
    
    return null
  } catch (error) {
    console.error('Lyrics fetch error:', error)
    return null
  }
}

// Get song analysis using AI
const getSongAnalysis = async (artist: string, title: string, album: string) => {
  try {
    const ZAI = await import('z-ai-web-dev-sdk')
    const zai = await ZAI.create()
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a music expert. Provide a brief, engaging analysis of the song including its genre, mood, and what makes it special. Keep it under 150 words.'
        },
        {
          role: 'user',
          content: `Analyze the song "${title}" by ${artist} from the album "${album}".`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    })
    
    return completion.choices[0]?.message?.content || null
  } catch (error) {
    console.error('Song analysis error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const trackId = searchParams.get('trackId')
  const artist = searchParams.get('artist')
  const title = searchParams.get('title')
  const album = searchParams.get('album')
  
  if (!trackId || !artist || !title) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }
  
  try {
    // Get detailed track information
    const trackDetails = await getSpotifyTrackDetails(trackId.replace('spotify_', ''))
    
    // Get lyrics
    const lyrics = await getLyrics(artist, title)
    
    // Get AI analysis
    const analysis = await getSongAnalysis(artist, title, album || '')
    
    return NextResponse.json({
      trackDetails,
      lyrics,
      analysis,
      success: true
    })
    
  } catch (error) {
    console.error('Song details API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch song details', success: false },
      { status: 500 }
    )
  }
}