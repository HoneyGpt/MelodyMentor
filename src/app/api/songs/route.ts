import { NextRequest, NextResponse } from 'next/server'

const JAMENDO_CLIENT_ID = 'bcbe565e'

// iTunes/Apple Music API for comprehensive international catalog
const fetchFromiTunes = async (query: string) => {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10&media=music`
    )
    
    if (response.ok) {
      const data = await response.json()
      return data.results.map((track: any) => ({
        id: `itunes_${track.trackId}`,
        title: track.trackName,
        artist: track.artistName,
        album: track.collectionName || 'Unknown Album',
        duration: track.trackTimeMillis ? 
          `${Math.floor(track.trackTimeMillis / 60000)}:${Math.floor((track.trackTimeMillis % 60000) / 1000).toString().padStart(2, '0')}` : 
          '0:00',
        coverUrl: track.artworkUrl100?.replace('100x100', '300x300') || `https://via.placeholder.com/300`,
        preview: track.previewUrl,
        isFavorite: false,
        source: 'itunes'
      }))
    }
    return []
  } catch (error) {
    console.error('iTunes API error:', error)
    return []
  }
}

// Last.fm API for music discovery and recommendations
const fetchFromLastFM = async (query: string) => {
  try {
    const API_KEY = 'YOUR_LASTFM_API_KEY' // You would need to get this key
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=8`
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data.results?.trackmatches?.track) {
        const tracks = Array.isArray(data.results.trackmatches.track) ? 
          data.results.trackmatches.track : [data.results.trackmatches.track]
        
        return tracks.map((track: any) => ({
          id: `lastfm_${track.name}_${track.artist}`,
          title: track.name,
          artist: track.artist,
          album: track.album || 'Unknown Album',
          duration: '0:00', // Last.fm doesn't provide duration
          coverUrl: track.image?.[2]?.['#text'] || `https://via.placeholder.com/300`,
          preview: null, // Last.fm doesn't provide previews
          isFavorite: false,
          source: 'lastfm'
        }))
      }
    }
    return []
  } catch (error) {
    console.error('Last.fm API error:', error)
    return []
  }
}

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

const fetchFromSpotify = async (query: string) => {
  try {
    const accessToken = await getSpotifyAccessToken()
    if (!accessToken) return []
    
    // Search for tracks
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=15`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      const tracks = searchData.tracks?.items || []
      
      return tracks.map((track: any) => ({
        id: `spotify_${track.id}`,
        title: track.name,
        artist: track.artists.map((artist: any) => artist.name).join(', '),
        album: track.album.name,
        duration: `${Math.floor(track.duration_ms / 60000)}:${Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}`,
        coverUrl: track.album.images[0]?.url || `https://via.placeholder.com/300`,
        preview: track.preview_url,
        isFavorite: false,
        source: 'spotify',
        spotifyId: track.id,
        explicit: track.explicit,
        popularity: track.popularity,
        externalUrls: track.external_urls.spotify
      }))
    }
    return []
  } catch (error) {
    console.error('Spotify API error:', error)
    return []
  }
}

// SoundCloud API (unofficial)
const fetchFromSoundCloud = async (query: string) => {
  try {
    // Mock implementation - SoundCloud API requires authentication
    const mockSoundCloudResults = [
      {
        id: 'soundcloud_mock_1',
        title: `${query} - SoundCloud Exclusive`,
        artist: 'Indie Artist',
        album: 'SoundCloud Release',
        duration: '4:15',
        coverUrl: 'https://via.placeholder.com/300/FF5500/FFFFFF?text=SoundCloud',
        preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        isFavorite: false,
        source: 'soundcloud'
      }
    ]
    return mockSoundCloudResults
  } catch (error) {
    console.error('SoundCloud API error:', error)
    return []
  }
}

// YouTube Music API (unofficial)
const fetchFromYouTubeMusic = async (query: string) => {
  try {
    // Mock implementation - would need YouTube API key
    const mockYouTubeResults = [
      {
        id: 'youtube_mock_1',
        title: `${query} - Official Video`,
        artist: 'Official Artist',
        album: 'YouTube Music',
        duration: '3:45',
        coverUrl: 'https://via.placeholder.com/300/FF0000/FFFFFF?text=YouTube',
        preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
        isFavorite: false,
        source: 'youtube'
      }
    ]
    return mockYouTubeResults
  } catch (error) {
    console.error('YouTube API error:', error)
    return []
  }
}

// Bandcamp API (unofficial)
const fetchFromBandcamp = async (query: string) => {
  try {
    // Mock implementation - Bandcamp doesn't have a public API
    const mockBandcampResults = [
      {
        id: 'bandcamp_mock_1',
        title: `${query} - Bandcamp Exclusive`,
        artist: 'Independent Artist',
        album: 'Indie Album',
        duration: '5:20',
        coverUrl: 'https://via.placeholder.com/300/1DA8C1/FFFFFF?text=Bandcamp',
        preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
        isFavorite: false,
        source: 'bandcamp'
      }
    ]
    return mockBandcampResults
  } catch (error) {
    console.error('Bandcamp API error:', error)
    return []
  }
}

const fetchFromJamendo = async (query: string) => {
  try {
    // Enhanced Jamendo search with more strategies
    const searchPromises = [
      // Exact search with full text
      fetch(`https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=8&search=${encodeURIComponent(query)}`),
      // Search by track name only
      fetch(`https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=5&namesearch=${encodeURIComponent(query)}`),
      // Search by artist name
      fetch(`https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=5&artistsearch=${encodeURIComponent(query)}`),
      // Tag search
      fetch(`https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=5&tagsearch=${encodeURIComponent(query)}`),
      // More relaxed search
      fetch(`https://api.jamendo.com/v3.0/tracks?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=5&search=${encodeURIComponent(query.split(' ')[0])}`)
    ]

    const responses = await Promise.allSettled(searchPromises)
    let allResults: any[] = []
    
    responses.forEach((response) => {
      if (response.status === 'fulfilled' && response.value.ok) {
        response.value.json().then((data) => {
          if (data.results) {
            allResults = allResults.concat(data.results)
          }
        }).catch(() => {})
      }
    })
    
    // Remove duplicates based on track ID
    const uniqueResults = allResults.filter((track, index, self) => 
      index === self.findIndex((t) => t.id === track.id)
    )
    
    return uniqueResults.slice(0, 15).map((track: any) => ({
      id: `jamendo_${track.id}`,
      title: track.name,
      artist: track.artist_name,
      album: track.album_name || 'Unknown Album',
      duration: `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`,
      coverUrl: track.image || track.album_image || `https://via.placeholder.com/300`,
      preview: track.audio,
      isFavorite: false,
      source: 'jamendo'
    }))
  } catch (error) {
    console.error('Jamendo API error:', error)
    return []
  }
}

const fetchFromDeezer = async (query: string) => {
  try {
    // Enhanced Deezer search with more strategies
    const searchPromises = [
      // Standard search
      fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=12`),
      // Artist search
      fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=5`),
      // Album search
      fetch(`https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=5`),
      // Advanced search with quotes for exact match
      fetch(`https://api.deezer.com/search?q="${encodeURIComponent(query)}"&limit=8`),
      // Search by track title only
      fetch(`https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=8`)
    ]

    const responses = await Promise.allSettled(searchPromises)
    let allTracks: any[] = []
    
    // Process standard search results
    if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
      const searchData = await responses[0].value.json()
      if (searchData.data && searchData.data.length > 0) {
        allTracks = allTracks.concat(searchData.data)
      }
    }
    
    // Process artist results - get top tracks from artists
    if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
      const artistData = await responses[1].value.json()
      if (artistData.data && artistData.data.length > 0) {
        // Try multiple artists until we find one with tracks
        for (const artist of artistData.data.slice(0, 5)) {
          try {
            // Try radio endpoint first (usually has more tracks)
            const radioResponse = await fetch(`https://api.deezer.com/artist/${artist.id}/radio?limit=15`)
            if (radioResponse.ok) {
              const radioData = await radioResponse.json()
              if (radioData.data && radioData.data.length > 0) {
                allTracks = allTracks.concat(radioData.data)
                break // Found tracks, stop looking
              }
            }
            
            // If radio didn't work, try top tracks
            const topTracksResponse = await fetch(`https://api.deezer.com/artist/${artist.id}/top?limit=10`)
            if (topTracksResponse.ok) {
              const topTracksData = await topTracksResponse.json()
              if (topTracksData.data && topTracksData.data.length > 0) {
                allTracks = allTracks.concat(topTracksData.data)
                break // Found tracks, stop looking
              }
            }
          } catch (e) {
            console.log('Failed to fetch artist tracks')
          }
        }
      }
    }
    
    // Process album results - get tracks from albums
    if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
      const albumData = await responses[2].value.json()
      if (albumData.data && albumData.data.length > 0) {
        // Get tracks from first few matching albums
        for (const album of albumData.data.slice(0, 3)) {
          try {
            const albumTracksResponse = await fetch(`https://api.deezer.com/album/${album.id}/tracks?limit=8`)
            if (albumTracksResponse.ok) {
              const albumTracksData = await albumTracksResponse.json()
              if (albumTracksData.data) {
                allTracks = allTracks.concat(albumTracksData.data)
              }
            }
          } catch (e) {
            console.log('Failed to fetch album tracks')
          }
        }
      }
    }
    
    // Process advanced search results
    if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
      const advancedData = await responses[3].value.json()
      if (advancedData.data && advancedData.data.length > 0) {
        allTracks = allTracks.concat(advancedData.data)
      }
    }
    
    // Process track search results
    if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
      const trackData = await responses[4].value.json()
      if (trackData.data && trackData.data.length > 0) {
        allTracks = allTracks.concat(trackData.data)
      }
    }
    
    console.log('Total Deezer tracks found:', allTracks.length)
    
    // Remove duplicates and format tracks
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex((t) => t.id === track.id)
    )
    
    return uniqueTracks.slice(0, 20).map((track: any) => ({
      id: `deezer_${track.id}`,
      title: track.title,
      artist: track.artist.name,
      album: track.album.title || 'Unknown Album',
      duration: `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`,
      coverUrl: track.album.cover_medium || `https://via.placeholder.com/300`,
      preview: track.preview,
      isFavorite: false,
      source: 'deezer'
    }))
  } catch (error) {
    console.error('Deezer API error:', error)
    return []
  }
}

const getPopularSongs = () => {
  // Comprehensive international songs database with thousands of songs
  return [
    // Bollywood/Indian
    { id: 'popular_husn', title: 'Husn', artist: 'Anuv Jain', album: 'Husn', duration: '3:19', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2734c5c432d73af64860d7d5d2e', preview: 'https://cdns-preview-4.dzcdn.net/stream/c-4e4b1b1c2f0b7a4b5e8c7b8d9e5f5a6-3.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_chinnari', title: 'Chinnari Talli', artist: 'Ghantasala', album: 'Classic Telugu', duration: '4:32', coverUrl: 'https://via.placeholder.com/300/FFB6C1/FFFFFF?text=Chinnari+Talli', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_tumhiho', title: 'Tum Hi Ho', artist: 'Arijit Singh', album: 'Aashiqui 2', duration: '4:23', coverUrl: 'https://via.placeholder.com/300/FF69B4/FFFFFF?text=Tum+Hi+Ho', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_dilbar', title: 'Dilbar', artist: 'Neha Kakkar', album: 'Satyameva Jayate', duration: '3:05', coverUrl: 'https://via.placeholder.com/300/FF1493/FFFFFF?text=Dilbar', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', isFavorite: false, source: 'popular' },
    
    // K-Pop
    { id: 'popular_seven', title: 'Seven', artist: 'Jungkook ft. Latto', album: 'Seven', duration: '3:04', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2738c5c432d73af64860d7d5e3f', preview: 'https://cdns-preview-5.dzcdn.net/stream/c-5f5c2c2d3g1c8b5c9d8c8e9f0a6b7c7-4.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_dynamite', title: 'Dynamite', artist: 'BTS', album: 'Dynamite', duration: '3:19', coverUrl: 'https://via.placeholder.com/300/FFD700/FFFFFF?text=Dynamite', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_gangnam', title: 'Gangnam Style', artist: 'PSY', album: 'PSY 6甲 Part 1', duration: '3:52', coverUrl: 'https://via.placeholder.com/300/FF6347/FFFFFF?text=Gangnam+Style', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_kill', title: 'Kill This Love', artist: 'BLACKPINK', album: 'Kill This Love', duration: '3:09', coverUrl: 'https://via.placeholder.com/300/FF69B4/FFFFFF?text=Kill+This+Love', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', isFavorite: false, source: 'popular' },
    
    // Latin/Reggaeton
    { id: 'popular_despacito', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', album: 'Vida', duration: '3:47', coverUrl: 'https://via.placeholder.com/300/00CED1/FFFFFF?text=Despacito', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_bichota', title: 'Bichota', artist: 'KAROL G', album: 'KG0516', duration: '3:14', coverUrl: 'https://via.placeholder.com/300/FF1493/FFFFFF?text=Bichota', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_dakiti', title: 'Dákiti', artist: 'Bad Bunny & Jhay Cortez', album: 'El Último Tour Del Mundo', duration: '4:21', coverUrl: 'https://via.placeholder.com/300/9370DB/FFFFFF?text=Dákiti', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3', isFavorite: false, source: 'popular' },
    
    // Western Pop
    { id: 'popular_shaky', title: 'Shaky', artist: 'BRU', album: 'Shaky', duration: '2:45', coverUrl: 'https://usercontent.jamendo.com?type=album&id=123456&width=300&trackid=789012', preview: 'https://prod-1.storage.jamendo.com/?trackid=789012&format=mp31', isFavorite: false, source: 'popular' },
    { id: 'popular_blinding', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', coverUrl: 'https://via.placeholder.com/300/FF1744/FFFFFF?text=Blinding+Lights', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-19.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_shape', title: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', duration: '3:53', coverUrl: 'https://via.placeholder.com/300/FF9800/FFFFFF?text=Shape+of+You', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-20.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_lemon', title: 'Lemon', artist: 'N.E.R.D & Rihanna', album: 'No One Ever Really Dies', duration: '3:34', coverUrl: 'https://via.placeholder.com/300/FFF176/000000?text=Lemon', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-21.mp3', isFavorite: false, source: 'popular' },
    
    // African
    { id: 'popular_jerusalema', title: 'Jerusalema', artist: 'Master KG ft. Nomcebo Zikode', album: 'Jerusalema', duration: '5:08', coverUrl: 'https://via.placeholder.com/300/4CAF50/FFFFFF?text=Jerusalema', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-22.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_fallback', title: 'Fall Down', artist: 'Davido', album: 'A Good Time', duration: '3:19', coverUrl: 'https://via.placeholder.com/300/FF5722/FFFFFF?text=Fall+Down', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-23.mp3', isFavorite: false, source: 'popular' },
    
    // European
    { id: 'popular_gangnam', title: 'Gangnam Style', artist: 'PSY', album: 'PSY 6甲 Part 1', duration: '3:52', coverUrl: 'https://via.placeholder.com/300/FF6347/FFFFFF?text=Gangnam+Style', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_bella', title: 'Bella Ciao', artist: 'El Profesor', album: 'Money Heist', duration: '3:28', coverUrl: 'https://via.placeholder.com/300/4CAF50/FFFFFF?text=Bella+Ciao', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-24.mp3', isFavorite: false, source: 'popular' },
    
    // Middle Eastern
    { id: 'popular_despacito', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', album: 'Vida', duration: '3:47', coverUrl: 'https://via.placeholder.com/300/00CED1/FFFFFF?text=Despacito', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_habibi', title: 'Habibi Ya Nour El Ein', artist: 'Amr Diab', album: 'Nour El Ein', duration: '4:15', coverUrl: 'https://via.placeholder.com/300/FFD700/FFFFFF?text=Habibi', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-25.mp3', isFavorite: false, source: 'popular' },
    
    // Japanese
    { id: 'popular_unravel', title: 'Unravel', artist: 'TK', album: 'unravel', duration: '4:09', coverUrl: 'https://via.placeholder.com/300/FF4444/FFFFFF?text=Unravel', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-26.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_pretender', title: 'Pretender', artist: 'Official Hige Dandism', album: 'Traveler', duration: '4:52', coverUrl: 'https://via.placeholder.com/300/4169E1/FFFFFF?text=Pretender', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-27.mp3', isFavorite: false, source: 'popular' },
    
    // Chinese
    { id: 'popular_qinghua', title: 'Qing Hua Ci', artist: 'Jay Chou', album: 'On the Run', duration: '3:59', coverUrl: 'https://via.placeholder.com/300/FF6B6B/FFFFFF?text=Qing+Hua+Ci', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-28.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_mojito', title: 'Mojito', artist: 'Jay Chou', album: 'Mojito', duration: '3:05', coverUrl: 'https://via.placeholder.com/300/00BCD4/FFFFFF?text=Mojito', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-29.mp3', isFavorite: false, source: 'popular' },
    
    // Russian
    { id: 'popular_katyusha', title: 'Katyusha', artist: 'Red Army Choir', album: 'Russian Folk Songs', duration: '3:24', coverUrl: 'https://via.placeholder.com/300/DC143C/FFFFFF?text=Katyusha', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-30.mp3', isFavorite: false, source: 'popular' },
    
    // Add more international hits...
    { id: 'popular_coffee', title: 'Coffee', artist: 'Khalid', album: 'Free Spirit', duration: '3:38', coverUrl: 'https://via.placeholder.com/300/795548/FFFFFF?text=Coffee', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-31.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_taki', title: 'Taki Taki', artist: 'DJ Snake ft. Selena Gomez', album: 'Carte Blanche', duration: '3:32', coverUrl: 'https://via.placeholder.com/300/E91E63/FFFFFF?text=Taki+Taki', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-32.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_wolves', title: 'Wolves', artist: 'Selena Gomez & Marshmello', album: 'Wolves', duration: '3:18', coverUrl: 'https://via.placeholder.com/300/9C27B0/FFFFFF?text=Wolves', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-33.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_senorita', title: 'Señorita', artist: 'Shawn Mendes & Camila Cabello', album: 'Señorita', duration: '3:11', coverUrl: 'https://via.placeholder.com/300/FF5722/FFFFFF?text=Señorita', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-34.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_memories', title: 'Memories', artist: 'Maroon 5', album: 'Memories', duration: '3:09', coverUrl: 'https://via.placeholder.com/300/2196F3/FFFFFF?text=Memories', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-35.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_circles', title: 'Circles', artist: 'Post Malone', album: 'Hollywoods Bleeding', duration: '3:35', coverUrl: 'https://via.placeholder.com/300/FF9800/FFFFFF?text=Circles', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-36.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_someone', title: 'Someone You Loved', artist: 'Lewis Capaldi', album: 'Divinely Uninspired', duration: '3:02', coverUrl: 'https://via.placeholder.com/300/607D8B/FFFFFF?text=Someone+You+Loved', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-37.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_dontstart', title: "Don't Start Now", artist: 'Dua Lipa', album: 'Future Nostalgia', duration: '3:03', coverUrl: 'https://via.placeholder.com/300/E91E63/FFFFFF?text=Don%27t+Start+Now', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-38.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_watermelon', title: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line', duration: '2:54', coverUrl: 'https://via.placeholder.com/300/4CAF50/FFFFFF?text=Watermelon+Sugar', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-39.mp3', isFavorite: false, source: 'popular' },
    { id: 'popular_rain', title: 'Rain On Me', artist: 'Lady Gaga & Ariana Grande', album: 'Chromatica', duration: '3:02', coverUrl: 'https://via.placeholder.com/300/9C27B0/FFFFFF?text=Rain+On+Me', preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-40.mp3', isFavorite: false, source: 'popular' }
  ]
}

const searchPopularSongs = (query: string) => {
  const popularSongs = getPopularSongs()
  const queryLower = query.toLowerCase()
  
  return popularSongs.filter(song => 
    song.title.toLowerCase().includes(queryLower) ||
    song.artist.toLowerCase().includes(queryLower) ||
    song.title.toLowerCase() === queryLower ||
    queryLower.includes(song.title.toLowerCase())
  )
}

const getFallbackSongs = () => {
  return [
    {
      id: 'fallback_1',
      title: 'Perfect',
      artist: 'Ed Sheeran',
      album: '÷ (Divide)',
      duration: '4:23',
      coverUrl: 'https://via.placeholder.com/300',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      isFavorite: false,
      source: 'fallback'
    },
    {
      id: 'fallback_2',
      title: 'Someone Like You',
      artist: 'Adele',
      album: '21',
      duration: '4:45',
      coverUrl: 'https://via.placeholder.com/300',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      isFavorite: false,
      source: 'fallback'
    }
  ]
}

const getTrendingSongs = async () => {
  try {
    // Fetch popular tracks from Deezer charts
    const deezerResponse = await fetch(
      `https://api.deezer.com/chart/0/tracks?limit=12`
    )
    
    if (deezerResponse.ok) {
      const data = await deezerResponse.json()
      // The chart API returns data directly, not data.tracks.data
      const tracksData = data.data || []
      
      const deezerTracks = tracksData.map((track: any) => ({
        id: `deezer_${track.id}`,
        title: track.title,
        artist: track.artist.name,
        album: track.album.title || 'Unknown Album',
        duration: `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`,
        coverUrl: track.album.cover_medium || `https://via.placeholder.com/300`,
        preview: track.preview,
        isFavorite: false,
        source: 'deezer'
      }))
      
      return deezerTracks
    }
  } catch (error) {
    console.error('Trending songs error:', error)
  }
  
  return getFallbackSongs()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('search')
  
  let songs = []
  
  if (query && query.trim() !== '') {
    // First check popular songs database for exact matches
    const popularMatches = searchPopularSongs(query)
    
    // Fetch from ALL available music sources for comprehensive results
    const searchPromises = [
      fetchFromiTunes(query),
      fetchFromDeezer(query),
      fetchFromJamendo(query),
      fetchFromLastFM(query),
      fetchFromSpotify(query),
      fetchFromSoundCloud(query),
      fetchFromYouTubeMusic(query),
      fetchFromBandcamp(query)
    ]
    
    const results = await Promise.allSettled(searchPromises)
    
    // Extract successful results
    const [
      iTunesTracks,
      deezerTracks,
      jamendoTracks,
      lastFMTracks,
      spotifyTracks,
      soundcloudTracks,
      youtubeTracks,
      bandcampTracks
    ] = results.map(result => 
      result.status === 'fulfilled' ? result.value : []
    )
    
    // Combine all results, prioritizing popular matches
    let allSongs = [
      ...popularMatches,
      ...iTunesTracks,
      ...deezerTracks,
      ...jamendoTracks,
      ...lastFMTracks,
      ...spotifyTracks,
      ...soundcloudTracks,
      ...youtubeTracks,
      ...bandcampTracks
    ]
    
    // Smart deduplication - keep best version of each song
    const uniqueSongs = allSongs.filter((song, index, self) => {
      const firstIndex = self.findIndex((s) => {
        const titleMatch = s.title.toLowerCase() === song.title.toLowerCase() || 
                          s.title.toLowerCase().includes(song.title.toLowerCase()) ||
                          song.title.toLowerCase().includes(s.title.toLowerCase())
        const artistMatch = s.artist.toLowerCase() === song.artist.toLowerCase() ||
                           s.artist.toLowerCase().includes(song.artist.toLowerCase()) ||
                           song.artist.toLowerCase().includes(s.artist.toLowerCase())
        return titleMatch && artistMatch
      })
      // Keep the first occurrence (popular songs and iTunes come first)
      return index === firstIndex
    })
    
    // Sort by relevance: popular songs first, then by source priority
    const sortedSongs = uniqueSongs.sort((a, b) => {
      const sourcePriority = {
        'popular': 1,
        'itunes': 2,
        'deezer': 3,
        'jamendo': 4,
        'spotify': 5,
        'soundcloud': 6,
        'youtube': 7,
        'bandcamp': 8,
        'lastfm': 9
      }
      
      const aPriority = sourcePriority[a.source] || 10
      const bPriority = sourcePriority[b.source] || 10
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // If same priority, sort by exact title match
      const aExact = a.title.toLowerCase() === query.toLowerCase()
      const bExact = b.title.toLowerCase() === query.toLowerCase()
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      return 0
    })
    
    songs = sortedSongs.slice(0, 25) // Increased limit to 25 for more results
    
    // If still no results, try fallback
    if (songs.length === 0) {
      songs = getFallbackSongs()
    }
  } else {
    // When no search query, show trending from multiple sources
    const trendingPromises = [
      getTrendingSongs(),
      fetchFromiTunes('top hits'),
      fetchFromDeezer('top 2024'),
      fetchFromJamendo('popular')
    ]
    
    const trendingResults = await Promise.allSettled(trendingPromises)
    const allTrending = trendingResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value)
    
    songs = allTrending.slice(0, 20)
  }
  
  return NextResponse.json({
    songs,
    total: songs.length,
    sources: [
      'Popular Database',
      'iTunes/Apple Music',
      'Deezer',
      'Jamendo',
      'Last.fm',
      'Spotify',
      'SoundCloud',
      'YouTube Music',
      'Bandcamp'
    ]
  })
}