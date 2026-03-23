'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DJ {
  name: string
  type: 'main' | 'support'
}

interface Floor {
  name: string
  djs: DJ[]
  active: boolean
}

const DEFAULT_FLOORS: Floor[] = [
  { name: 'Wohnzimmer', djs: [], active: true },
  { name: 'Bunker', djs: [], active: true }
]

export function EventForm({ event, onClose, onSuccess }: { event: any, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: event?.name || '',
    description: event?.description || '',
    date: event?.date ? new Date(event.date).toISOString().split('T')[0] : '',
    time: event?.time || '22:00',
    end_time: event?.end_time || '06:00',
    isOpenEnd: event?.end_time === 'Open End' || false,
    type: event?.type || 'clubnight',
    price: event?.price || 'CHF 25',
    image: event?.image || '',
    ticket_link: event?.ticket_link || '',
  })
  
  // Parse existing floors from event or use defaults
  const parseExistingFloors = (): Floor[] => {
    if (event?.timetable && Array.isArray(event.timetable)) {
      const existingFloors = event.timetable as Floor[]
      // Ensure all floors have the active property
      return existingFloors.map(f => ({
        ...f,
        active: f.active !== false // default to true if not set
      }))
    }
    return DEFAULT_FLOORS
  }
  
  const [floors, setFloors] = useState<Floor[]>(parseExistingFloors())
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url')
  const [previewUrl, setPreviewUrl] = useState(event?.image || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleFloor = (floorIndex: number) => {
    const newFloors = [...floors]
    newFloors[floorIndex].active = !newFloors[floorIndex].active
    setFloors(newFloors)
  }

  const addDJ = (floorIndex: number) => {
    const newFloors = [...floors]
    newFloors[floorIndex].djs.push({ name: '', type: 'support' })
    setFloors(newFloors)
  }

  const removeDJ = (floorIndex: number, djIndex: number) => {
    const newFloors = [...floors]
    newFloors[floorIndex].djs.splice(djIndex, 1)
    setFloors(newFloors)
  }

  const updateDJ = (floorIndex: number, djIndex: number, field: keyof DJ, value: string) => {
    const newFloors = [...floors]
    newFloors[floorIndex].djs[djIndex] = {
      ...newFloors[floorIndex].djs[djIndex],
      [field]: value
    }
    setFloors(newFloors)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `events/${fileName}`

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        alert('Error uploading image: ' + error.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image: publicUrl })
      setPreviewUrl(publicUrl)
    } catch (error) {
      console.error('Error:', error)
      alert('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = event ? `/api/events/${event.id}` : '/api/events'
      const method = event ? 'PUT' : 'POST'

      // Filter out empty DJs and inactive floors
      const cleanedFloors = floors
        .filter(floor => floor.active)
        .map(floor => ({
          name: floor.name,
          djs: floor.djs.filter(dj => dj.name.trim() !== '')
        }))

      const { isOpenEnd, ...dataToSend } = formData

      // Ensure all required fields are present
      const payload = {
        ...dataToSend,
        description: dataToSend.description || '',
        full_description: dataToSend.description || '',
        lineup: cleanedFloors.flatMap(f => f.djs.map(d => d.name)),
        timetable: cleanedFloors,
        image: dataToSend.image || '',
        ticket_link: dataToSend.ticket_link || '',
      }
      
      console.log('Sending payload:', payload)

      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          console.error('Non-JSON response:', text.substring(0, 200))
          alert('Server error: API returned HTML instead of JSON. Check console.')
          return
        }

        const data = await response.json()

        if (response.ok) {
          onSuccess()
        } else {
          console.error('API error:', data)
          alert('Error saving event: ' + (data.error || data.message || 'Unknown error'))
        }
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError)
        alert('Network error: ' + fetchError.message)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white/80 mb-2 text-sm">Event Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
            placeholder="e.g. TECHNO TUESDAY"
          />
        </div>
        <div>
          <label className="block text-white/80 mb-2 text-sm">Event Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="clubnight">Club Night</option>
            <option value="festival">Festival</option>
            <option value="special">Special Event</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-white/80 mb-2 text-sm">Description</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
          placeholder="Event description..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-white/80 mb-2 text-sm">Date *</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-white/80 mb-2 text-sm">Start Time</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-white/80 mb-2 text-sm">End Time</label>
          <input
            type="time"
            value={formData.isOpenEnd ? '' : formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value, isOpenEnd: false })}
            disabled={formData.isOpenEnd}
            className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isOpenEnd}
              onChange={(e) => setFormData({ 
                ...formData, 
                isOpenEnd: e.target.checked,
                end_time: e.target.checked ? 'Open End' : '06:00'
              })}
              className="w-4 h-4 rounded border-white/20 bg-black text-red-500 focus:ring-red-500"
            />
            <span className="text-white/70 text-sm">Open End</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white/80 mb-2 text-sm">Price</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
            placeholder="e.g. CHF 25"
          />
        </div>
        <div>
          <label className="block text-white/80 mb-2 text-sm">Ticket Link</label>
          <input
            type="url"
            value={formData.ticket_link}
            onChange={(e) => setFormData({ ...formData, ticket_link: e.target.value })}
            className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Floors & Lineup Section */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Lineup by Floor</h3>
        
        <div className="space-y-6">
          {floors.map((floor, floorIndex) => (
            <div 
              key={floor.name} 
              className={`bg-black/30 rounded-xl p-6 border transition-all ${
                floor.active ? 'border-white/10' : 'border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${floor.active ? 'bg-red-500' : 'bg-white/30'}`}></span>
                    {floor.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => toggleFloor(floorIndex)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
                      floor.active 
                        ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                    title={floor.active ? 'Floor active - click to deactivate' : 'Floor inactive - click to activate'}
                  >
                    {floor.active ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                  </button>
                </div>
                {floor.active && (
                  <button
                    type="button"
                    onClick={() => addDJ(floorIndex)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-500 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add DJ
                  </button>
                )}
              </div>

              {floor.active && (
                floor.djs.length === 0 ? (
                  <p className="text-white/40 text-sm italic">No DJs added yet</p>
                ) : (
                  <div className="space-y-3">
                    {floor.djs.map((dj, djIndex) => (
                      <div key={djIndex} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={dj.name}
                          onChange={(e) => updateDJ(floorIndex, djIndex, 'name', e.target.value)}
                          placeholder="DJ Name"
                          className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                        />
                        <select
                          value={dj.type}
                          onChange={(e) => updateDJ(floorIndex, djIndex, 'type', e.target.value)}
                          className="px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                        >
                          <option value="support">Support</option>
                          <option value="main">Main Act</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeDJ(floorIndex, djIndex)}
                          className="p-2 text-white/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
              
              {!floor.active && (
                <p className="text-white/40 text-sm italic">Floor is inactive - click &quot;Inactive&quot; to activate</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Image Section */}
      <div className="border-t border-white/10 pt-6">
        <label className="block text-white/80 mb-2 text-sm">Event Image</label>
        
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              uploadMode === 'url' 
                ? 'bg-red-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Image URL
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('file')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              uploadMode === 'file' 
                ? 'bg-red-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Upload File
          </button>
        </div>

        {uploadMode === 'url' ? (
          <input
            type="url"
            value={formData.image}
            onChange={(e) => {
              setFormData({ ...formData, image: e.target.value })
              setPreviewUrl(e.target.value)
            }}
            className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
            placeholder="https://images.unsplash.com/..."
          />
        ) : (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-8 border-2 border-dashed border-white/20 rounded-lg text-white/60 hover:border-red-500 hover:text-red-500 transition-colors flex flex-col items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8" />
                  <span>Click to upload image</span>
                  <span className="text-xs text-white/40">Max 5MB (JPG, PNG, WebP)</span>
                </>
              )}
            </button>
          </div>
        )}

        {previewUrl && (
          <div className="mt-4 relative">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-green-500" />
              <span className="text-white/70 text-sm">Image Preview</span>
            </div>
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl('')
                  setFormData({ ...formData, image: '' })
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
        </button>
      </div>
    </form>
  )
}
