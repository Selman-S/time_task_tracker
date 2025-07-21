'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, FolderOpen, CheckCircle, Clock, Users, TrendingUp, TrendingDown, Calendar, ArrowRight, DollarSign, Timer, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TeamMember {
  user: {
    id: string;
    name: string;
    email: string;
  };
  hourlyRate: number;
  currentMonthHours: number;
  previousMonthHours: number;
  currentMonthBilling: number;
  performanceChange: number;
}

interface TimeTracking {
  currentMonthHours: number;
  previousMonthHours: number;
  performanceChange: number;
  dailyAverage: number;
}

interface Billing {
  currentMonthAmount: number;
  previousMonthAmount: number;
  billingChange: number;
  averageHourlyRate: number;
  projectedMonthlyAmount: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    totalTimeHours: number;
  };
}

interface Brand {
  id: string;
  name: string;
  description?: string;
  permissionLevel: string;
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    totalTimeHours: number;
  };
  timeTracking: TimeTracking;
  billing: Billing;
  teamPerformance: TeamMember[];
  projects: Project[];
}

interface DashboardSummary {
  totalCurrentMonthHours: number;
  totalCurrentMonthBilling: number;
  totalPreviousMonthHours: number;
  totalPreviousMonthBilling: number;
  overallPerformanceChange: number;
  overallBillingChange: number;
  projectedMonthlyBilling: number;
}

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  summary: DashboardSummary;
  brands: Brand[];
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('30days');

  // Load user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
        
        // Check if user is CLIENT
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

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/dashboard?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data when user or dateRange changes
  useEffect(() => {
    if (user?.role === 'CLIENT') {
      fetchDashboardData();
    }
  }, [user, dateRange]);

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7days': return 'Last 7 days';
      case '30days': return 'Last 30 days';
      case '90days': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <BarChart3 className="w-4 h-4 text-gray-600" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
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
                  <h3 className="text-lg font-semibold mb-2">Loading Dashboard...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we load your projects and billing information.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                  <p className="text-muted-foreground mb-4">
                    No brands found for your account. Please contact your administrator to assign brand access.
                  </p>
                  <Button onClick={() => router.push('/dashboard')} variant="outline">
                    Go to Main Dashboard
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
        {/* Welcome Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {dashboardData.user.name}! 👋
            </h2>
            <p className="text-gray-600">
              Here's your comprehensive business overview with billing and performance metrics.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <Calendar className="w-3 h-3 mr-1" />
              {getDateRangeLabel(dateRange)}
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Month Hours */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-3xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.totalCurrentMonthHours}h</p>
                  <p className="text-sm text-blue-700">This Month</p>
                  <div className="flex items-center mt-2">
                    {getChangeIcon(dashboardData.summary.overallPerformanceChange)}
                    <span className={`text-xs ml-1 ${getChangeColor(dashboardData.summary.overallPerformanceChange)}`}>
                      {dashboardData.summary.overallPerformanceChange > 0 ? '+' : ''}{dashboardData.summary.overallPerformanceChange}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Timer className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Month Billing */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-3xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.summary.totalCurrentMonthBilling)}</p>
                  <p className="text-sm text-green-700">Current Billing</p>
                  <div className="flex items-center mt-2">
                    {getChangeIcon(dashboardData.summary.overallBillingChange)}
                    <span className={`text-xs ml-1 ${getChangeColor(dashboardData.summary.overallBillingChange)}`}>
                      {dashboardData.summary.overallBillingChange > 0 ? '+' : ''}{dashboardData.summary.overallBillingChange}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projected Monthly Billing */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-3xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.summary.projectedMonthlyBilling)}</p>
                  <p className="text-sm text-purple-700">Projected Total</p>
                  <div className="flex items-center mt-2">
                    <Target className="w-3 h-3 text-purple-600" />
                    <span className="text-xs ml-1 text-purple-600">End of Month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Projects */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-3xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.brands.reduce((sum, b) => sum + b.stats.totalProjects, 0)}</p>
                  <p className="text-sm text-orange-700">Active Projects</p>
                  <div className="flex items-center mt-2">
                    <FolderOpen className="w-3 h-3 text-orange-600" />
                    <span className="text-xs ml-1 text-orange-600">Across {dashboardData.brands.length} brands</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Brands Overview */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-gray-900">Your Brands</h3>
          <div className="grid gap-8">
            {dashboardData.brands.map((brand) => (
              <Card key={brand.id} className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-3 text-xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span>{brand.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {brand.permissionLevel}
                        </Badge>
                      </CardTitle>
                      {brand.description && (
                        <CardDescription className="mt-2 text-base">
                          {brand.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => router.push(`/client/brands/${brand.id}/projects`)}
                        variant="outline"
                        size="sm"
                        className="bg-white/50 hover:bg-white/80"
                      >
                        View Projects <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button
                        onClick={() => router.push(`/client/brands/${brand.id}/reports`)}
                        variant="outline"
                        size="sm"
                        className="bg-white/50 hover:bg-white/80"
                      >
                        View Reports
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Time Tracking & Billing Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Time Tracking Card */}
                    <Card className="bg-blue-50/50 border border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Timer className="w-5 h-5 text-blue-600" />
                          Time Tracking
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{brand.timeTracking.currentMonthHours}h</p>
                            <p className="text-xs text-blue-700">This Month</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-600">{brand.timeTracking.previousMonthHours}h</p>
                            <p className="text-xs text-gray-500">Previous Month</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Performance:</span>
                          <div className="flex items-center">
                            {getChangeIcon(brand.timeTracking.performanceChange)}
                            <span className={`text-sm ml-1 font-medium ${getChangeColor(brand.timeTracking.performanceChange)}`}>
                              {brand.timeTracking.performanceChange > 0 ? '+' : ''}{brand.timeTracking.performanceChange}%
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Daily Average: {brand.timeTracking.dailyAverage}h
                        </div>
                      </CardContent>
                    </Card>

                    {/* Billing Card */}
                    <Card className="bg-green-50/50 border border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          Billing Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(brand.billing.currentMonthAmount)}</p>
                            <p className="text-xs text-green-700">Current Month</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">{formatCurrency(brand.billing.projectedMonthlyAmount)}</p>
                            <p className="text-xs text-gray-500">Projected Total</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Change:</span>
                          <div className="flex items-center">
                            {getChangeIcon(brand.billing.billingChange)}
                            <span className={`text-sm ml-1 font-medium ${getChangeColor(brand.billing.billingChange)}`}>
                              {brand.billing.billingChange > 0 ? '+' : ''}{brand.billing.billingChange}%
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg. Rate: {formatCurrency(brand.billing.averageHourlyRate)}/hour
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Team Performance */}
                  {brand.teamPerformance.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        Team Performance
                      </h4>
                      <div className="grid gap-3">
                        {brand.teamPerformance.map((member) => (
                          <Card key={member.user.id} className="bg-gray-50/50 border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{member.user.name}</h5>
                                  <p className="text-sm text-gray-600">{formatCurrency(member.hourlyRate)}/hour</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <p className="text-lg font-semibold text-blue-600">{member.currentMonthHours}h</p>
                                    <p className="text-xs text-gray-500">This Month</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-semibold text-green-600">{formatCurrency(member.currentMonthBilling)}</p>
                                    <p className="text-xs text-gray-500">Billing</p>
                                  </div>
                                  <div className="flex items-center justify-center">
                                    {getChangeIcon(member.performanceChange)}
                                    <span className={`text-sm ml-1 font-medium ${getChangeColor(member.performanceChange)}`}>
                                      {member.performanceChange > 0 ? '+' : ''}{member.performanceChange}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Projects */}
                  {brand.projects.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-gray-600" />
                        Recent Projects
                      </h4>
                      <div className="grid gap-4">
                        {brand.projects.slice(0, 3).map((project) => (
                          <Card
                            key={project.id}
                            className="bg-gray-50/50 border border-gray-200 hover:bg-gray-100/50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/client/projects/${project.id}`)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{project.name}</h5>
                                  {project.description && (
                                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-6">
                                  <div className="text-center">
                                    <div className="text-lg font-semibold text-green-600">
                                      {project.stats.completionPercentage}%
                                    </div>
                                    <div className="text-xs text-gray-500">Complete</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-semibold text-blue-600">
                                      {project.stats.totalTimeHours}h
                                    </div>
                                    <div className="text-xs text-gray-500">Time</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-semibold text-purple-600">
                                      {project.stats.totalTasks}
                                    </div>
                                    <div className="text-xs text-gray-500">Tasks</div>
                                  </div>
                                  <ArrowRight className="w-5 h-5 text-gray-400" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {brand.projects.length > 3 && (
                        <div className="mt-4 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => router.push(`/client/brands/${brand.id}/projects`)}
                            className="hover:bg-white/80"
                          >
                            View All {brand.projects.length} Projects
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 