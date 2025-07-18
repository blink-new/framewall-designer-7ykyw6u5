import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Eye, Trash2, Calendar, DollarSign, Grid3X3 } from 'lucide-react'
import { Design } from '../types'
import { blink } from '../blink/client'

interface GalleryPageProps {
  onNavigate: (page: string) => void
}

export function GalleryPage({ onNavigate }: GalleryPageProps) {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null)

  useEffect(() => {
    loadDesigns()
  }, [])

  const loadDesigns = async () => {
    try {
      const user = await blink.auth.me()
      const userDesigns = await blink.db.designs.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      
      const parsedDesigns = userDesigns.map(design => ({
        ...design,
        cells: JSON.parse(design.cells || '[]')
      }))
      
      setDesigns(parsedDesigns)
    } catch (error) {
      console.error('Failed to load designs:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return
    
    try {
      await blink.db.designs.delete(designId)
      setDesigns(prev => prev.filter(d => d.id !== designId))
    } catch (error) {
      console.error('Failed to delete design:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Design Gallery</h1>
            <p className="text-gray-600">Your saved frame wall designs</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Design Gallery</h1>
            <p className="text-gray-600">Your saved frame wall designs</p>
          </div>
          <Button onClick={() => onNavigate('designer')}>
            Create New Design
          </Button>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-16">
            <Grid3X3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No designs yet</h3>
            <p className="text-gray-600 mb-6">Start creating your first frame wall design</p>
            <Button onClick={() => onNavigate('designer')}>
              Create Your First Design
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <Card key={design.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="truncate">{design.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDesign(design.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Design Preview */}
                  <div 
                    className="aspect-video bg-white rounded-lg border-2 border-gray-200 p-2 mb-4"
                  >
                    <div 
                      className="grid gap-1 h-full"
                      style={{
                        gridTemplateColumns: `repeat(${design.gridCols}, 1fr)`,
                        gridTemplateRows: `repeat(${design.gridRows}, 1fr)`
                      }}
                    >
                      {design.cells.map((cell) => (
                        <div
                          key={cell.id}
                          className={`rounded border ${
                            cell.frameSize 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          {cell.imageUrl && (
                            <img
                              src={cell.imageUrl}
                              alt=""
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Design Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Grid3X3 className="h-4 w-4 mr-1" />
                        {design.gridRows}×{design.gridCols} grid
                      </div>
                      <Badge variant="secondary">
                        {design.cells.filter(cell => cell.frameSize).length} frames
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(design.createdAt)}
                      </div>
                      <div className="flex items-center font-semibold text-blue-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {design.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedDesign(design)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{selectedDesign?.name}</DialogTitle>
                        </DialogHeader>
                        {selectedDesign && (
                          <div className="space-y-4">
                            <div 
                              className="aspect-video bg-white rounded-lg border-2 border-gray-200 p-4"
                            >
                              <div 
                                className="grid gap-2 h-full"
                                style={{
                                  gridTemplateColumns: `repeat(${selectedDesign.gridCols}, 1fr)`,
                                  gridTemplateRows: `repeat(${selectedDesign.gridRows}, 1fr)`
                                }}
                              >
                                {selectedDesign.cells.map((cell) => (
                                  <div
                                    key={cell.id}
                                    className={`relative rounded border-2 ${
                                      cell.frameSize 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 bg-gray-50'
                                    }`}
                                  >
                                    {cell.imageUrl ? (
                                      <div className="relative w-full h-full">
                                        <img
                                          src={cell.imageUrl}
                                          alt={cell.imageName}
                                          className="w-full h-full object-cover rounded"
                                        />
                                        {cell.frameSize && (
                                          <Badge className="absolute bottom-1 left-1 text-xs">
                                            {cell.frameSize.name}
                                          </Badge>
                                        )}
                                      </div>
                                    ) : cell.frameSize && (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                        {cell.frameSize.name}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm">
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="font-semibold">Grid Size</div>
                                <div className="text-gray-600">{selectedDesign.gridRows}×{selectedDesign.gridCols}</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="font-semibold">Frames</div>
                                <div className="text-gray-600">
                                  {selectedDesign.cells.filter(cell => cell.frameSize).length} selected
                                </div>
                              </div>
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="font-semibold">Total Price</div>
                                <div className="text-blue-600 font-bold">${selectedDesign.totalPrice.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button size="sm" className="flex-1">
                      Order Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}