import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Grid3X3, Upload, Palette, Save, Star, ArrowRight } from 'lucide-react'

interface HomePageProps {
  onNavigate: (page: string) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Design Your Perfect
              <span className="text-blue-600 block">Picture Frame Wall</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create stunning custom frame arrangements with our interactive designer. 
              Choose from 11 frame sizes, upload your photos, and bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                onClick={() => onNavigate('designer')}
              >
                Start Designing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3"
                onClick={() => onNavigate('gallery')}
              >
                View Gallery
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Create
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional tools and features to design the perfect frame wall for your space
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Grid3X3 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Interactive Grid</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Design on a flexible 8×8 grid with drag-and-drop functionality for perfect arrangements
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Palette className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-xl">11 Frame Sizes</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  From 4×6" to 20×24" - choose the perfect size for each photo in your collection
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Easy Upload</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Drag and drop your photos directly into frames with instant preview and cropping
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Save className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Save & Share</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Save your designs, share with friends, and order your custom frame wall
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See real-time pricing as you design. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Small Frames</CardTitle>
                <div className="text-3xl font-bold text-blue-600">$15.99</div>
                <CardDescription>4×6" starting price</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-2" />
                    Premium quality frames
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-2" />
                    Professional printing
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-2" />
                    Fast shipping
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg border-blue-200 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Medium Frames</CardTitle>
                <div className="text-3xl font-bold text-blue-600">$32.99</div>
                <CardDescription>8×10" starting price</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-2" />
                    Premium quality frames
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-2" />
                    Professional printing
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-2" />
                    Free shipping over $100
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Large Frames</CardTitle>
                <div className="text-3xl font-bold text-blue-600">$89.99</div>
                <CardDescription>20×24" starting price</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-2" />
                    Premium quality frames
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-2" />
                    Professional printing
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-2" />
                    White glove delivery
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Create Your Frame Wall?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of customers who have transformed their spaces with FrameWall
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
            onClick={() => onNavigate('designer')}
          >
            Start Your Design
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  )
}