import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Slider } from '../components/ui/slider'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Grid3X3, Upload, Save, Download, Trash2, RotateCcw, DollarSign, Eye, LogIn } from 'lucide-react'
import { FRAME_SIZES } from '../data/frameSizes'
import { FrameSize, GridCell } from '../types'
import { blink } from '../blink/client'

export function DesignerPage() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [gridRows, setGridRows] = useState(3)
  const [gridCols, setGridCols] = useState(4)
  const [cells, setCells] = useState<GridCell[]>([])
  const [draggedCell, setDraggedCell] = useState<GridCell | null>(null)
  const [designName, setDesignName] = useState('')
  const [totalPrice, setTotalPrice] = useState(0)
  const [selectedCellForFrame, setSelectedCellForFrame] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Authentication state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setAuthLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Initialize grid cells
  const initializeCells = useCallback(() => {
    const newCells: GridCell[] = []
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        newCells.push({
          id: `${row}-${col}`,
          row,
          col
        })
      }
    }
    setCells(newCells)
  }, [gridRows, gridCols])

  // Calculate total price
  const calculateTotalPrice = useCallback(() => {
    const total = cells.reduce((sum, cell) => {
      const price = cell.frameSize?.price || 0
      return sum + (typeof price === 'number' ? price : 0)
    }, 0)
    // Ensure the total is always a proper number with 2 decimal places
    const validTotal = Number(total.toFixed(2))
    setTotalPrice(isNaN(validTotal) ? 0 : validTotal)
  }, [cells])

  // Update cells when grid size changes
  useEffect(() => {
    initializeCells()
  }, [initializeCells])

  // Calculate total price when cells change
  useEffect(() => {
    calculateTotalPrice()
  }, [calculateTotalPrice])

  const handleCellClick = (cellId: string) => {
    const cell = cells.find(c => c.id === cellId)
    if (!cell?.frameSize) {
      // Open frame size selector for this cell
      setSelectedCellForFrame(cellId)
    }
  }

  const handleFrameSizeSelect = (frameSize: FrameSize) => {
    if (selectedCellForFrame) {
      setCells(prev => prev.map(cell => 
        cell.id === selectedCellForFrame 
          ? { ...cell, frameSize }
          : cell
      ))
      setSelectedCellForFrame(null)
    }
  }

  const handleImageUpload = async (cellId: string, file: File) => {
    try {
      const { publicUrl } = await blink.storage.upload(file, `designs/${Date.now()}-${file.name}`)
      
      setCells(prev => prev.map(cell => 
        cell.id === cellId 
          ? { ...cell, imageUrl: publicUrl, imageName: file.name }
          : cell
      ))
    } catch (error) {
      console.error('Failed to upload image:', error)
    }
  }

  const handleDrop = (e: React.DragEvent, cellId: string) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleImageUpload(cellId, imageFile)
    }
  }

  const handleFileSelect = (cellId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          handleImageUpload(cellId, file)
        }
      }
      fileInputRef.current.click()
    }
  }

  const clearCell = (cellId: string) => {
    setCells(prev => prev.map(cell => 
      cell.id === cellId 
        ? { ...cell, frameSize: undefined, imageUrl: undefined, imageName: undefined }
        : cell
    ))
  }

  const clearAllCells = () => {
    setCells(prev => prev.map(cell => ({
      ...cell,
      frameSize: undefined,
      imageUrl: undefined,
      imageName: undefined
    })))
  }

  const saveDesign = async () => {
    if (!user) {
      alert('Please sign in to save your design')
      return
    }

    if (!designName.trim()) {
      alert('Please enter a design name')
      return
    }

    try {
      // Validate that totalPrice is a valid number
      const validTotalPrice = Number(totalPrice)
      if (isNaN(validTotalPrice) || validTotalPrice < 0) {
        alert('Invalid total price calculated. Please check your frame selections.')
        return
      }
      
      // Generate a unique ID for the design
      const designId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Prepare design data with proper field names matching database schema
      const designData = {
        id: designId,
        name: designName.trim(),
        user_id: user.id, // Use snake_case to match database schema
        grid_rows: Number(gridRows),
        grid_cols: Number(gridCols),
        cells: JSON.stringify(cells),
        total_price: validTotalPrice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Saving design with data:', designData)
      
      await blink.db.designs.create(designData)
      
      alert('Design saved successfully!')
      setDesignName('')
    } catch (error) {
      console.error('Failed to save design:', error)
      alert('Failed to save design. Please try again.')
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading designer...</p>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Grid3X3 className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-8">
            Please sign in to access the Frame Wall Designer and save your custom designs.
          </p>
          <Button onClick={() => blink.auth.login()} size="lg" className="w-full">
            <LogIn className="mr-2 h-5 w-5" />
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Frame Wall Designer</h1>
          <p className="text-gray-600">Create your perfect picture frame arrangement</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Grid Size Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5" />
                  Grid Size
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Rows: {gridRows}</Label>
                  <Slider
                    value={[gridRows]}
                    onValueChange={(value) => setGridRows(value[0])}
                    max={8}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Columns: {gridCols}</Label>
                  <Slider
                    value={[gridCols]}
                    onValueChange={(value) => setGridCols(value[0])}
                    max={8}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Design Canvas</CardTitle>
                    <p className="text-sm text-gray-600">
                      Click empty cells to select frame size, drag images to upload
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="grid gap-3 p-6 bg-white rounded-lg border-2 border-dashed border-gray-200"
                  style={{
                    gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                    gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                    minHeight: '400px'
                  }}
                >
                  {cells.map((cell) => {
                    // Calculate relative size for visual representation
                    const getVisualScale = (frameSize: any) => {
                      if (!frameSize) return 1
                      const area = frameSize.width * frameSize.height
                      const minArea = 4 * 6
                      const maxArea = 20 * 24
                      return 0.7 + (area - minArea) / (maxArea - minArea) * 0.6 // Scale between 0.7 and 1.3
                    }

                    const scale = getVisualScale(cell.frameSize)

                    return (
                      <div
                        key={cell.id}
                        className="relative flex items-center justify-center"
                      >
                        <div
                          className={`relative border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
                            cell.frameSize 
                              ? 'border-blue-500 bg-blue-50 shadow-md' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                          style={{
                            width: `${80 * scale}px`,
                            height: `${80 * scale}px`,
                            transform: cell.frameSize ? `scale(${scale})` : 'scale(1)',
                            transformOrigin: 'center'
                          }}
                          onClick={() => handleCellClick(cell.id)}
                          onDrop={(e) => handleDrop(e, cell.id)}
                          onDragOver={(e) => e.preventDefault()}
                        >
                      {cell.imageUrl ? (
                        <div className="relative w-full h-full">
                          <img
                            src={cell.imageUrl}
                            alt={cell.imageName}
                            className="w-full h-full object-cover rounded-md"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              clearCell(cell.id)
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          {cell.frameSize && (
                            <Badge className="absolute bottom-1 left-1 text-xs">
                              {cell.frameSize.name}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-600">
                          {cell.frameSize ? (
                            <div 
                              className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleFileSelect(cell.id)
                              }}
                            >
                              <Upload className="h-6 w-6 mb-1" />
                              <span className="text-xs text-center">Add Image</span>
                              <span className="text-xs text-center font-medium text-blue-600">
                                {cell.frameSize.name}
                              </span>
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <div className="text-2xl mb-1">+</div>
                              <span className="text-xs text-center">Select Frame</span>
                            </div>
                          )}
                        </div>
                      )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Total Price and Actions - Below Canvas */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {/* Price Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Total Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    ${totalPrice.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {cells.filter(cell => cell.frameSize).length} frames selected
                  </p>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        Save Design
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Design</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="designName">Design Name</Label>
                          <Input
                            id="designName"
                            value={designName}
                            onChange={(e) => setDesignName(e.target.value)}
                            placeholder="My Frame Wall Design"
                          />
                        </div>
                        <Button onClick={saveDesign} className="w-full">
                          Save Design
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" className="w-full" onClick={clearAllCells}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />

      {/* Frame Size Selection Dialog */}
      <Dialog open={selectedCellForFrame !== null} onOpenChange={() => setSelectedCellForFrame(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Frame Size</DialogTitle>
            <p className="text-sm text-gray-600">Choose a frame size for this position</p>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {FRAME_SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => handleFrameSizeSelect(size)}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-blue-700">
                      {size.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {size.width}" × {size.height}"
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    ${size.price}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>3D Frame Wall Preview</DialogTitle>
            <p className="text-sm text-gray-600">
              Realistic preview with proportional frame sizes and 3D depth
            </p>
          </DialogHeader>
          <div className="space-y-6">
            {/* Preview Canvas */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-lg">
              <div 
                className="grid gap-6 mx-auto bg-white p-8 rounded-lg shadow-2xl"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                  gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                  maxWidth: '700px',
                  minHeight: '400px'
                }}
              >
                {cells.map((cell) => {
                  // Calculate relative size based on frame dimensions
                  const getFrameScale = (frameSize: any) => {
                    if (!frameSize) return 1
                    const area = frameSize.width * frameSize.height
                    const minArea = 4 * 6 // 4x6 is smallest
                    const maxArea = 20 * 24 // 20x24 is largest
                    return 0.6 + (area - minArea) / (maxArea - minArea) * 0.8 // Scale between 0.6 and 1.4
                  }

                  const scale = getFrameScale(cell.frameSize)
                  const frameDepth = cell.frameSize ? Math.max(8, scale * 12) : 4

                  return (
                    <div
                      key={cell.id}
                      className="relative flex items-center justify-center"
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'center'
                      }}
                    >
                      {cell.frameSize ? (
                        <div
                          className="relative bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 rounded-sm shadow-2xl"
                          style={{
                            width: `${Math.max(80, cell.frameSize.width * 4)}px`,
                            height: `${Math.max(80, cell.frameSize.height * 4)}px`,
                            boxShadow: `
                              0 ${frameDepth}px ${frameDepth * 2}px rgba(0,0,0,0.3),
                              inset 0 2px 4px rgba(255,255,255,0.2),
                              inset 0 -2px 4px rgba(0,0,0,0.3)
                            `,
                            border: '3px solid #92400e',
                            borderRadius: '4px'
                          }}
                        >
                          {/* Inner frame shadow */}
                          <div 
                            className="absolute inset-2 bg-white rounded-sm shadow-inner"
                            style={{
                              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)'
                            }}
                          >
                            {cell.imageUrl ? (
                              <img
                                src={cell.imageUrl}
                                alt={cell.imageName}
                                className="w-full h-full object-cover rounded-sm"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-sm">
                                <div className="text-gray-400 text-xs text-center mb-1">
                                  {cell.frameSize.name}
                                </div>
                                <div className="text-gray-300 text-xs">
                                  ${cell.frameSize.price}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Frame highlight */}
                          <div 
                            className="absolute inset-0 rounded-sm"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
                            }}
                          />
                          
                          {/* Size label */}
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                            <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {cell.frameSize.name}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                          <span className="text-gray-400 text-xs">Empty</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Preview Summary */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Design Summary</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Grid Size: {gridRows} × {gridCols}</p>
                  <p>Total Frames: {cells.filter(cell => cell.frameSize).length}</p>
                  <p>With Images: {cells.filter(cell => cell.imageUrl).length}</p>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Pricing</h3>
                <div className="text-2xl font-bold text-green-700">
                  ${totalPrice.toFixed(2)}
                </div>
                <p className="text-sm text-green-600">Total estimated cost</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}