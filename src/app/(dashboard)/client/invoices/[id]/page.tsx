'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building2,
  User,
  Calendar,
  FileText,
  DollarSign,
  Eye,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  description?: string;
  status: string;
  issueDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paidDate?: string;
  notes?: string;
  brand: {
    id: string;
    name: string;
  };
  createdByUser: {
    id: string;
    name: string;
  };
  items: InvoiceItem[];
  _count: {
    items: number;
  };
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  project?: {
    id: string;
    name: string;
  };
}

export default function ClientInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user and check permissions
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        
        if (user.role !== 'CLIENT') {
          toast.error('Access denied. This page is for clients only.');
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

  // Fetch invoice details
  useEffect(() => {
    if (user?.role === 'CLIENT') {
      fetchInvoice();
    }
  }, [user, invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      console.log('Client Invoice API Response:', data); // Debug log

      if (data.success) {
        // Check if data.data has invoice property (nested structure)
        const invoiceData = data.data.invoice || data.data;
        console.log('Final client invoice data:', invoiceData); // Debug log
        setInvoice(invoiceData);
      } else {
        throw new Error(data.error || 'Failed to fetch invoice');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Draft', variant: 'secondary' as const, icon: FileText },
      SENT: { label: 'Sent', variant: 'default' as const, icon: Clock },
      PAID: { label: 'Paid', variant: 'default' as const, icon: CheckCircle2, className: 'bg-green-600' },
      OVERDUE: { label: 'Overdue', variant: 'destructive' as const, icon: AlertTriangle },
      CANCELLED: { label: 'Cancelled', variant: 'outline' as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'PAID' && status !== 'CANCELLED' && new Date(dueDate) < new Date();
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
                  <h3 className="text-lg font-semibold mb-2">Loading Invoice...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we fetch the invoice details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Invoice Not Found</h3>
                  <p className="text-muted-foreground mb-4">
                    The invoice you're looking for doesn't exist or you don't have access to it.
                  </p>
                  <Button onClick={() => router.push('/client/invoices')}>
                    Back to Invoices
                  </Button>
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/client/invoices')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {invoice.invoiceNumber}
                </h1>
                {getStatusBadge(invoice.status)}
                {isOverdue(invoice.dueDate, invoice.status) && (
                  <Badge variant="destructive" className="animate-pulse">
                    Overdue
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">{invoice.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => toast.info('PDF download coming soon!')}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            {invoice.status === 'SENT' && (
              <Button
                onClick={() => toast.info('Online payment coming soon!')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Online
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Information */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Invoice Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Service Provider</span>
                    </div>
                    <p className="text-blue-600 font-medium">{invoice.brand?.name || 'Unknown Brand'}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Created By</span>
                    </div>
                    <p className="text-gray-900">{invoice.createdByUser?.name || 'Unknown User'}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Issue Date</span>
                    </div>
                    <p className="text-gray-900">{formatDate(invoice.issueDate)}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Due Date</span>
                    </div>
                    <p className={`font-medium ${isOverdue(invoice.dueDate, invoice.status) ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </div>

                {invoice.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{invoice.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Service Period Start</h4>
                    <p className="text-gray-900">{formatDate(invoice.periodStart)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Service Period End</h4>
                    <p className="text-gray-900">{formatDate(invoice.periodEnd)}</p>
                  </div>
                </div>

                {invoice.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Services & Items ({invoice.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!invoice.items || invoice.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No invoice items found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoice.items.map((item, index) => (
                      <div key={item.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <h4 className="font-medium">{item.description}</h4>
                            {item.project && (
                              <Badge variant="outline" className="text-xs">
                                {item.project.name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatCurrency(item.totalPrice)}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Quantity:</span> {item.quantity}
                          </div>
                          <div>
                            <span className="font-medium">Unit Price:</span> {formatCurrency(item.unitPrice)}
                          </div>
                          <div className="text-right">
                            <span className="font-medium">Total:</span> {formatCurrency(item.totalPrice)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                  {invoice.paidAmount > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Paid Amount:</span>
                        <span>{formatCurrency(invoice.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Remaining:</span>
                        <span className={invoice.totalAmount - invoice.paidAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(invoice.totalAmount - invoice.paidAmount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {invoice.status === 'SENT' && (
                  <div className="pt-4 border-t space-y-2">
                    <Button
                      onClick={() => toast.info('Online payment coming soon!')}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Now
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                      Secure online payment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Status */}
            <Card className="border-0 shadow-2xl bg-blue-50/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900 mb-2">Invoice Status</h3>
                  <p className="text-sm text-blue-700">
                    Current status: <strong>{invoice.status}</strong>
                  </p>
                  {invoice.paidDate && (
                    <p className="text-sm text-green-700 mt-2">
                      Paid on: {formatDate(invoice.paidDate)}
                    </p>
                  )}
                  {isOverdue(invoice.dueDate, invoice.status) && (
                    <p className="text-sm text-red-700 mt-2 font-medium">
                      ⚠️ This invoice is overdue
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 