import { useState, useCallback, useRef } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Slider } from '../components/ui/slider'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Grid3X3, Upload, Save, Download, Trash2, RotateCcw, DollarSign } from 'lucide-react'
import { FRAME_SIZES } from '../data/frameSizes'
import { FrameSize, GridCell } from '../types'
import { blink } from '../blink/client'

export function DesignerPage() {
  const [gridRows, setGridRows] = useState(3)
  const [gridCols, setGridCols] = useState(4)
  const [selectedFrameSize, setSelectedFrameSize] = useState<FrameSize>(FRAME_SIZES[0])
  const [cells, setCells] = useState<GridCell[]>([])
  const [draggedCell, setDraggedCell] = useState<GridCell | null>(null)
  const [designName, setDesignName] = useState('')
  const [totalPrice, setTotalPrice] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      return sum + (cell.frameSize?.price || 0)
    }, 0)
    setTotalPrice(total)
  }, [cells])

  // Update cells when grid size changes
  useState(() => {
    initializeCells()
  })

  useState(() => {
    calculateTotalPrice()
  })

  const handleCellClick = (cellId: string) => {
    setCells(prev => prev.map(cell => 
      cell.id === cellId 
        ? { ...cell, frameSize: selectedFrameSize }
        : cell
    ))
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
    if (!designName.trim()) {
      alert('Please enter a design name')
      return
    }

    try {
      const user = await blink.auth.me()
      await blink.db.designs.create({
        name: designName,
        userId: user.id,
        gridRows,
        gridCols,
        cells: JSON.stringify(cells),
        totalPrice,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      alert('Design saved successfully!')
      setDesignName('')
    } catch (error) {
      console.error('Failed to save design:', error)
      alert('Failed to save design')
    }
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

            {/* Frame Size Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Frame Sizes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {FRAME_SIZES.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedFrameSize(size)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedFrameSize.id === size.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{size.name}</div>
                      <div className="text-sm text-gray-600">${size.price}</div>
                    </button>
                  ))}
                </div>
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
          </div>

          {/* Main Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Design Canvas</CardTitle>
                <p className="text-sm text-gray-600">
                  Click cells to add frames, drag images to upload
                </p>
              </CardHeader>
              <CardContent>
                <div 
                  className="grid gap-2 p-4 bg-white rounded-lg border-2 border-dashed border-gray-200"
                  style={{
                    gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                    gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                    aspectRatio: `${gridCols}/${gridRows}`
                  }}
                >
                  {cells.map((cell) => (
                    <div
                      key={cell.id}
                      className={`relative aspect-square border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
                        cell.frameSize 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
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
                        <div 
                          className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFileSelect(cell.id)
                          }}
                        >
                          <Upload className="h-6 w-6 mb-1" />
                          <span className="text-xs text-center">
                            {cell.frameSize ? cell.frameSize.name : 'Add Frame'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}