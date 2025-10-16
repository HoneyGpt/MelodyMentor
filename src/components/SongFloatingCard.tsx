'use client'

import { useState, useEffect } from 'react'
import { X, Music, Clock, Heart, Share2, ExternalLink, Mic, TrendingUp, Radio, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface SongDetails {
  id: string
  title: string
  artist: string
  album: string
  duration: string
  coverUrl: string
  preview: string
  isFavorite: boolean
  source: string
  spotifyId?: string
  explicit?: boolean
  popularity?: number
  externalUrls?: string
}

interface TrackDetails {
  name: string
  artists: { name: string }[]
  album: {
    name: string
    release_date: string
    total_tracks: number
    images: { url: string }[]
  }
  duration_ms: number
  explicit: boolean
  popularity: number
  external_urls: { spotify: string }
  preview_url: string
  audioFeatures?: {
    danceability: number
    energy: number
    valence: number
    tempo: number
    acousticness: number
    instrumentalness: number
    liveness: number
    speechiness: number
  }
}

interface SongFloatingCardProps {
  song: SongDetails
  isOpen: boolean
  onClose: () => void
  onPlay: (preview: string) => void
  onToggleFavorite: (songId: string) => void
}

export default function SongFloatingCard({ 
  song, 
  isOpen, 
  onClose, 
  onPlay, 
  onToggleFavorite 
}: SongFloatingCardProps) {
  const [trackDetails, setTrackDetails] = useState<TrackDetails | null>(null)
  const [lyrics, setLyrics] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'lyrics' | 'analysis'>('details')

  useEffect(() => {
    if (isOpen && song) {
      fetchSongDetails()
    }
  }, [isOpen, song])

  const fetchSongDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/song-details?trackId=${song.id}&artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}&album=${encodeURIComponent(song.album)}`
      )
      const data = await response.json()
      
      if (data.success) {
        setTrackDetails(data.trackDetails)
        setLyrics(data.lyrics)
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Error fetching song details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const downloadPreview = async () => {
    if (!song.preview) return
    
    try {
      const response = await fetch(song.preview)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${song.title} - ${song.artist}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading preview:', error)
    }
  }

  const getAudioFeatureColor = (value: number, type: string) => {
    const intensity = Math.round(value * 100)
    switch (type) {
      case 'danceability':
      case 'energy':
        return `bg-gradient-to-r from-yellow-400 to-orange-500`
      case 'valence':
        return `bg-gradient-to-r from-green-400 to-blue-500`
      case 'acousticness':
        return `bg-gradient-to-r from-amber-400 to-orange-600`
      default:
        return `bg-gradient-to-r from-blue-400 to-purple-500`
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'spotify':
        return <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold">Spotify</span>
      case 'itunes':
        return <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-semibold">iTunes</span>
      case 'deezer':
        return <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-semibold">Deezer</span>
      case 'jamendo':
        return <span className="text-xs bg-teal-500 text-white px-2 py-1 rounded-full font-semibold">Jamendo</span>
      case 'popular':
        return <span className="text-xs bg-pink-500 text-white px-2 py-1 rounded-full font-semibold">Popular</span>
      default:
        return <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full font-semibold">Other</span>
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-md shadow-2xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="relative h-48 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
            
            <div className="flex items-end gap-6">
              <img
                src={song.coverUrl}
                alt={song.title}
                className="w-32 h-32 rounded-xl shadow-lg object-cover"
              />
              <div className="flex-1 text-white">
                <h2 className="text-3xl font-bold mb-2">{song.title}</h2>
                <p className="text-xl opacity-90 mb-2">{song.artist}</p>
                <div className="flex items-center gap-3">
                  {getSourceIcon(song.source)}
                  {song.explicit && (
                    <Badge variant="secondary" className="bg-red-500 text-white">Explicit</Badge>
                  )}
                  {trackDetails?.popularity && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">{trackDetails.popularity}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 p-6 border-b">
            <Button
              onClick={() => onPlay(song.preview)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6"
              disabled={!song.preview}
            >
              <Music className="w-4 h-4 mr-2" />
              Play Preview
            </Button>
            
            <Button
              onClick={downloadPreview}
              variant="outline"
              className="rounded-full"
              disabled={!song.preview}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onToggleFavorite(song.id)}
              className="rounded-full"
            >
              <Heart className={`w-4 h-4 mr-2 ${song.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {song.isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
            
            {trackDetails?.external_urls?.spotify && (
              <Button
                variant="outline"
                onClick={() => window.open(trackDetails.external_urls.spotify, '_blank')}
                className="rounded-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Spotify
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {(['details', 'lyrics', 'analysis'] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab)}
                className={`rounded-none capitalize flex-1 ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {tab === 'details' && <Music className="w-4 h-4 mr-2" />}
                {tab === 'lyrics' && <Mic className="w-4 h-4 mr-2" />}
                {tab === 'analysis' && <TrendingUp className="w-4 h-4 mr-2" />}
                {tab}
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'details' && trackDetails && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Track Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Album</p>
                          <p className="font-medium">{trackDetails.album.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Release Date</p>
                          <p className="font-medium">{new Date(trackDetails.album.release_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium">{formatDuration(trackDetails.duration_ms)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Track Number</p>
                          <p className="font-medium">1 of {trackDetails.album.total_tracks}</p>
                        </div>
                      </div>
                    </div>

                    {trackDetails.audioFeatures && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Audio Features</h3>
                        <div className="space-y-3">
                          {Object.entries(trackDetails.audioFeatures).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="capitalize text-sm font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getAudioFeatureColor(value as number, key)}`}
                                    style={{ width: `${(value as number) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600 w-12 text-right">
                                  {Math.round((value as number) * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'lyrics' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Lyrics</h3>
                    {lyrics ? (
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {lyrics}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Lyrics not available for this song</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">AI Analysis</h3>
                    {analysis ? (
                      <div className="prose max-w-none">
                        <p className="text-sm leading-relaxed">{analysis}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Analysis not available for this song</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}