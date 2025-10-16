import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=10`
    )
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      items: data.items?.map((item: any) => ({
        id: {
          videoId: item.id.videoId
        },
        snippet: {
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnails: {
            medium: {
              url: item.snippet.thumbnails.medium.url
            }
          }
        }
      })) || []
    })
    
  } catch (error) {
    console.error('YouTube API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from YouTube API' }, 
      { status: 500 }
    )
  }
}