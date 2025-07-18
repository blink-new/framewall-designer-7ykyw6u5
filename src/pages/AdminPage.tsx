import React, { useState, useEffect } from 'react';
import { blink } from '../blink/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Package, Clock, Truck, CheckCircle, Eye, Mail } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Order {
  id: string;
  user_id: string;
  design_id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  order_status: 'received' | 'printing' | 'shipped' | 'delivered';
  total_amount: number;
  frame_details: string;
  order_date: string;
  updated_at: string;
  notes?: string;
}

interface Design {
  id: string;
  name: string;
  grid_rows: number;
  grid_cols: number;
  cells: string;
  total_price: number;
}

const statusConfig = {
  received: { icon: Package, color: 'bg-blue-500', label: 'Received' },
  printing: { icon: Clock, color: 'bg-yellow-500', label: 'Printing' },
  shipped: { icon: Truck, color: 'bg-purple-500', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'bg-green-500', label: 'Delivered' }
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    loadDesigns();
  }, []);

  const loadOrders = async () => {
    try {
      const ordersData = await blink.db.orders.list({
        orderBy: { order_date: 'desc' }
      });
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDesigns = async () => {
    try {
      const designsData = await blink.db.designs.list();
      setDesigns(designsData);
    } catch (error) {
      console.error('Failed to load designs:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string) => {
    setUpdatingStatus(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await blink.db.orders.update(orderId, {
        order_status: newStatus,
        updated_at: new Date().toISOString(),
        notes: notes || order.notes
      });

      // Send email notification
      await sendStatusUpdateEmail(order, newStatus);

      // Update local state
      setOrders(orders.map(o => 
        o.id === orderId 
          ? { ...o, order_status: newStatus as any, updated_at: new Date().toISOString(), notes: notes || o.notes }
          : o
      ));

      toast({
        title: "Success",
        description: `Order status updated to ${statusConfig[newStatus as keyof typeof statusConfig].label}`,
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const sendStatusUpdateEmail = async (order: Order, newStatus: string) => {
    try {
      const statusLabel = statusConfig[newStatus as keyof typeof statusConfig].label;
      const design = designs.find(d => d.id === order.design_id);
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563EB; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">FrameWall Order Update</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2>Hello ${order.customer_name},</h2>
            
            <p>Your FrameWall order has been updated!</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Order Details</h3>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Design:</strong> ${design?.name || 'Custom Design'}</p>
              <p><strong>Status:</strong> <span style="color: #2563EB; font-weight: bold;">${statusLabel}</span></p>
              <p><strong>Total Amount:</strong> $${order.total_amount.toFixed(2)}</p>
            </div>
            
            ${newStatus === 'shipped' ? `
              <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2563EB;">📦 Your order is on its way!</h3>
                <p>Your custom frame arrangement has been shipped and should arrive within 3-5 business days.</p>
              </div>
            ` : ''}
            
            ${newStatus === 'delivered' ? `
              <div style="background: #e7f7e7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #16a34a;">✅ Order Delivered!</h3>
                <p>Your custom frame arrangement has been delivered. We hope you love your new FrameWall!</p>
              </div>
            ` : ''}
            
            <p>Thank you for choosing FrameWall for your custom picture frame needs!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
              <p>Questions? Contact us at support@framewall.com</p>
            </div>
          </div>
        </div>
      `;

      await blink.notifications.email({
        to: order.customer_email,
        from: 'orders@framewall.com',
        subject: `FrameWall Order Update - ${statusLabel}`,
        html: emailContent,
        text: `Hello ${order.customer_name}, your FrameWall order (${order.id}) status has been updated to: ${statusLabel}. Total: $${order.total_amount.toFixed(2)}`
      });

    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw error - order update should still succeed
    }
  };

  const getDesignDetails = (designId: string) => {
    return designs.find(d => d.id === designId);
  };

  const parseFrameDetails = (frameDetails: string) => {
    try {
      return JSON.parse(frameDetails);
    } catch {
      return {};
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.order_status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600">Manage and track all FrameWall orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = orders.filter(o => o.order_status === status).length;
            const Icon = config.icon;
            return (
              <Card key={status}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{config.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                    <div className={`p-3 rounded-full ${config.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="printing">Printing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {statusFilter === 'all' ? 'No orders have been placed yet.' : `No orders with status "${statusFilter}".`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const design = getDesignDetails(order.design_id);
              const frameDetails = parseFrameDetails(order.frame_details);
              const statusInfo = statusConfig[order.order_status] || statusConfig.received;
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.id.slice(-8)}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={`${statusInfo.color} text-white`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Customer</p>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-gray-500">{order.customer_email}</p>
                          </div>
                          
                          <div>
                            <p className="text-gray-600">Design</p>
                            <p className="font-medium">{design?.name || 'Custom Design'}</p>
                            <p className="text-gray-500">
                              {design ? `${design.grid_rows}×${design.grid_cols} grid` : 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-600">Order Date</p>
                            <p className="font-medium">
                              {new Date(order.order_date).toLocaleDateString()}
                            </p>
                            <p className="text-gray-500">
                              ${order.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details - #{order.id.slice(-8)}</DialogTitle>
                            </DialogHeader>
                            
                            {selectedOrder && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Customer Name</Label>
                                    <p className="mt-1">{selectedOrder.customer_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                                    <p className="mt-1">{selectedOrder.customer_email}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Shipping Address</Label>
                                  <p className="mt-1 whitespace-pre-line">{selectedOrder.shipping_address}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Order Date</Label>
                                    <p className="mt-1">{new Date(selectedOrder.order_date).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                                    <p className="mt-1 text-lg font-semibold">${selectedOrder.total_amount.toFixed(2)}</p>
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Frame Details</Label>
                                  <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                                    <pre className="text-sm whitespace-pre-wrap">
                                      {JSON.stringify(frameDetails, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Update Status</Label>
                                  <div className="mt-2 space-y-3">
                                    <Select 
                                      value={selectedOrder.order_status} 
                                      onValueChange={(value) => setSelectedOrder({...selectedOrder, order_status: value as any})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="received">Received</SelectItem>
                                        <SelectItem value="printing">Printing</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    
                                    <Textarea
                                      placeholder="Add notes (optional)"
                                      value={selectedOrder.notes || ''}
                                      onChange={(e) => setSelectedOrder({...selectedOrder, notes: e.target.value})}
                                    />
                                    
                                    <Button 
                                      onClick={() => updateOrderStatus(selectedOrder.id, selectedOrder.order_status, selectedOrder.notes)}
                                      disabled={updatingStatus === selectedOrder.id}
                                      className="w-full"
                                    >
                                      <Mail className="h-4 w-4 mr-2" />
                                      {updatingStatus === selectedOrder.id ? 'Updating...' : 'Update Status & Send Email'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Select 
                          value={order.order_status} 
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                          disabled={updatingStatus === order.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="printing">Printing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {order.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {order.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}