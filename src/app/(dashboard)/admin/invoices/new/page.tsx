'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Building2, 
  User, 
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Brand {
  id: string;
  name: string;
  description?: string;
}

interface Project {
  id: string;
  name: string;
  brandId: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface InvoiceItem {
  id: string;
  projectId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    brandId: '',
    clientUserId: '',
    title: '',
    description: '',
    dueDate: '',
    periodStart: '',
    periodEnd: '',
    taxAmount: 0,
    notes: '',
  });

  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      projectId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    }
  ]);

  // Data for dropdowns
  const [brands, setBrands] = useState<Brand[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Load user and check permissions
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        
        if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
          toast.error('Access denied. Admin access required.');
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Fetch initial data
  useEffect(() => {
    if (user?.role && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch brands, projects, and clients in parallel
      const [brandsRes, projectsRes, clientsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?role=CLIENT`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [brandsData, projectsData, clientsData] = await Promise.all([
        brandsRes.json(),
        projectsRes.json(),
        clientsRes.json(),
      ]);

      if (brandsData.success) setBrands(brandsData.data.brands || []);
      if (projectsData.success) setProjects(projectsData.data.projects || []);
      if (clientsData.success) setClients(clientsData.data.users || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle invoice item changes
  const handleItemChange = (itemId: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Handle "none" project selection
        if (field === 'projectId' && value === 'none') {
          updatedItem.projectId = '';
        }
        
        // Recalculate total price
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Add new invoice item
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      projectId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setItems(prev => [...prev, newItem]);
  };

  // Remove invoice item
  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalAmount = subtotal + formData.taxAmount;

  // Filter projects by selected brand
  const filteredProjects = projects.filter(project => 
    !formData.brandId || project.brandId === formData.brandId
  );

  // Submit form
  const handleSubmit = async (status: 'DRAFT' | 'SENT') => {
    try {
      console.log('Submitting invoice with data:', formData, 'items:', items);
      
      // Validation
      if (!formData.brandId) {
        toast.error('Please select a brand');
        return;
      }
      
      if (!formData.clientUserId) {
        toast.error('Please select a client');
        return;
      }
      
      if (!formData.title.trim()) {
        toast.error('Please enter an invoice title');
        return;
      }
      
      if (!formData.dueDate) {
        toast.error('Please select a due date');
        return;
      }

      // Validate items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.description.trim()) {
          toast.error(`Please enter description for item ${i + 1}`);
          return;
        }
        if (item.quantity <= 0) {
          toast.error(`Please enter a valid quantity for item ${i + 1}`);
          return;
        }
        if (item.unitPrice < 0) {
          toast.error(`Unit price cannot be negative for item ${i + 1}`);
          return;
        }
      }

      setSubmitting(true);
      const token = localStorage.getItem('token');

      const payload = {
        ...formData,
        items: items.map(({ id, ...item }) => item), // Remove temporary id
        status,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Invoice ${status === 'DRAFT' ? 'saved as draft' : 'created and sent'} successfully`);
        router.push('/admin/invoices');
      } else {
        throw new Error(data.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Loading Form...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we prepare the invoice form.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push('/admin/invoices')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Invoice 📝
            </h1>
            <p className="text-gray-600">
              Create a new invoice manually with custom line items.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Invoice Information
                </CardTitle>
                <CardDescription>
                  Basic invoice details and client information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brandId">Brand *</Label>
                    <Select value={formData.brandId} onValueChange={(value) => handleInputChange('brandId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="clientUserId">Client *</Label>
                    <Select value={formData.clientUserId} onValueChange={(value) => handleInputChange('clientUserId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} ({client.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Invoice Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter invoice title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Invoice description (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="periodStart">Period Start</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={formData.periodStart}
                      onChange={(e) => handleInputChange('periodStart', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodEnd">Period End</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={formData.periodEnd}
                      onChange={(e) => handleInputChange('periodEnd', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Invoice Items
                    </CardTitle>
                    <CardDescription>
                      Add line items for services or products
                    </CardDescription>
                  </div>
                  <Button onClick={addItem} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Project (Optional)</Label>
                        <Select
                          value={item.projectId || 'none'}
                          onValueChange={(value) => handleItemChange(item.id, 'projectId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No project</SelectItem>
                            {filteredProjects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Service or product description"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Unit Price (₺) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Total Price (₺)</Label>
                        <Input
                          type="number"
                          value={item.totalPrice.toFixed(2)}
                          readOnly
                          className="bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Additional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="taxAmount">Tax Amount (₺)</Label>
                  <Input
                    id="taxAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => handleInputChange('taxAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes (optional)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₺{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₺{formData.taxAmount.toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₺{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Button
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={submitting}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button
                    onClick={() => handleSubmit('SENT')}
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Creating...' : 'Create & Send'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Form Info */}
            <Card className="border-0 shadow-2xl bg-blue-50/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900 mb-2">Invoice Creation</h3>
                  <p className="text-sm text-blue-700">
                    Fill in all required fields and add invoice items to create a new invoice.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 