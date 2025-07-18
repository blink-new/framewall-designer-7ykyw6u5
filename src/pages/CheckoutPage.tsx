import React, { useState, useEffect } from 'react';
import { blink } from '../blink/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, CreditCard, Package } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface CheckoutPageProps {
  designId: string;
  onNavigate: (page: string) => void;
}

interface Design {
  id: string;
  name: string;
  grid_rows: number;
  grid_cols: number;
  cells: string;
  total_price: number;
}

export function CheckoutPage({ designId, onNavigate }: CheckoutPageProps) {
  const [design, setDesign] = useState<Design | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    shippingAddress: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      if (state.user) {
        setFormData(prev => ({
          ...prev,
          customerName: state.user.displayName || '',
          customerEmail: state.user.email || ''
        }));
      }
      setLoading(state.isLoading);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadDesign = async () => {
      try {
        const designs = await blink.db.designs.list({
          where: { id: designId }
        });
        if (designs.length > 0) {
          setDesign(designs[0]);
        }
      } catch (error) {
        console.error('Failed to load design:', error);
        toast({
          title: "Error",
          description: "Failed to load design details",
          variant: "destructive"
        });
      }
    };

    if (designId) {
      loadDesign();
    }
  }, [designId]);

  const parseFrameCells = (cellsJson: string) => {
    try {
      const cells = JSON.parse(cellsJson);
      const frameSummary: { [key: string]: number } = {};
      
      Object.values(cells).forEach((cell: any) => {
        if (cell.frameSize) {
          frameSummary[cell.frameSize] = (frameSummary[cell.frameSize] || 0) + 1;
        }
      });
      
      return frameSummary;
    } catch {
      return {};
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitOrder = async () => {
    if (!design || !user) return;

    // Validate form
    if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const frameSummary = parseFrameCells(design.cells);
      
      // Create order in database
      await blink.db.orders.create({
        id: orderId,
        user_id: user.id,
        design_id: design.id,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        shipping_address: formData.shippingAddress,
        order_status: 'received',
        total_amount: design.total_price,
        frame_details: JSON.stringify({
          design_name: design.name,
          grid_size: `${design.grid_rows}×${design.grid_cols}`,
          frame_summary: frameSummary,
          customer_notes: formData.notes,
          phone: formData.phone
        }),
        order_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Send confirmation email to customer
      await sendOrderConfirmationEmail(orderId, formData, design, frameSummary);

      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${orderId.slice(-8)} has been received. You'll receive updates via email.`,
      });

      // Navigate back to gallery
      onNavigate('gallery');
      
    } catch (error) {
      console.error('Failed to place order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const sendOrderConfirmationEmail = async (orderId: string, customerData: any, design: Design, frameSummary: any) => {
    try {
      const frameList = Object.entries(frameSummary)
        .map(([size, count]) => `<li>${count}x ${size}" frames</li>`)
        .join('');

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563EB; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">FrameWall Order Confirmation</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2>Thank you for your order, ${customerData.customerName}!</h2>
            
            <p>We've received your custom frame arrangement order and will begin processing it shortly.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Order Details</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Design:</strong> ${design.name}</p>
              <p><strong>Grid Size:</strong> ${design.grid_rows}×${design.grid_cols}</p>
              <p><strong>Total Amount:</strong> $${design.total_price.toFixed(2)}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Frame Summary</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${frameList}
              </ul>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Shipping Address</h3>
              <p style="white-space: pre-line; margin: 0;">${customerData.shippingAddress}</p>
            </div>
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2563EB;">What's Next?</h3>
              <p>• We'll send you updates as your order progresses</p>
              <p>• Processing typically takes 2-3 business days</p>
              <p>• Shipping takes 3-5 business days</p>
              <p>• You'll receive tracking information once shipped</p>
            </div>
            
            <p>Thank you for choosing FrameWall for your custom picture frame needs!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
              <p>Questions? Contact us at support@framewall.com</p>
            </div>
          </div>
        </div>
      `;

      await blink.notifications.email({
        to: customerData.customerEmail,
        from: 'orders@framewall.com',
        subject: `FrameWall Order Confirmation - #${orderId.slice(-8)}`,
        html: emailContent,
        text: `Thank you for your FrameWall order! Order ID: ${orderId}. Design: ${design.name}. Total: $${design.total_price.toFixed(2)}. We'll send you updates as your order progresses.`
      });

    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't throw error - order should still succeed
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Design Not Found</h3>
            <p className="text-gray-600 mb-4">The design you're trying to checkout could not be found.</p>
            <Button onClick={() => onNavigate('gallery')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gallery
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const frameSummary = parseFrameCells(design.cells);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('gallery')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Complete your custom frame order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{design.name}</h3>
                <p className="text-gray-600">{design.grid_rows}×{design.grid_cols} grid arrangement</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Frame Details:</h4>
                <div className="space-y-1">
                  {Object.entries(frameSummary).map(([size, count]) => (
                    <div key={size} className="flex justify-between text-sm">
                      <span>{count}x {size}" frames</span>
                      <span className="text-gray-600">
                        ${((count as number) * 25).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>${design.total_price.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email Address *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="shippingAddress">Shipping Address *</Label>
                <Textarea
                  id="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                  placeholder="Enter your complete shipping address including street, city, state, and ZIP code"
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Special Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any special instructions or notes for your order"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleSubmitOrder}
                disabled={processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Place Order - ${design.total_price.toFixed(2)}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                By placing this order, you agree to our terms of service and privacy policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}