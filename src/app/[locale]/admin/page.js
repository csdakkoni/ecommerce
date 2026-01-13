'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Package, ShoppingCart, Users, TrendingUp, ChevronRight, Clock,
    AlertTriangle, DollarSign, ArrowUp, ArrowDown, Boxes, Tag, MessageSquare
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        todayOrders: 0,
        totalCustomers: 0,
        pendingInquiries: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7'); // 7, 30, 90 days

    useEffect(() => {
        fetchDashboardData();
    }, [period]);

    async function fetchDashboardData() {
        setLoading(true);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const periodStart = new Date();
        periodStart.setDate(periodStart.getDate() - parseInt(period));

        // Fetch products count
        const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        // Fetch all orders
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        const allOrders = orders || [];
        const pendingOrders = allOrders.filter(o =>
            ['pending', 'paid', 'preparing'].includes(o.status)
        );
        const totalRevenue = allOrders
            .filter(o => !['cancelled', 'refunded'].includes(o.status))
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        // Today's stats
        const todayOrders = allOrders.filter(o => new Date(o.created_at) >= today);
        const todayRevenue = todayOrders
            .filter(o => !['cancelled', 'refunded'].includes(o.status))
            .reduce((sum, o) => sum + (o.total_amount || 0), 0);

        // Customers count (unique emails)
        const uniqueEmails = new Set(allOrders.map(o => o.guest_email || o.user_id).filter(Boolean));

        setStats({
            totalProducts: productsCount || 0,
            totalOrders: allOrders.length,
            pendingOrders: pendingOrders.length,
            totalRevenue: totalRevenue,
            todayRevenue: todayRevenue,
            todayOrders: todayOrders.length,
            totalCustomers: uniqueEmails.size,
        });

        setRecentOrders(allOrders.slice(0, 5));

        // Calculate sales by day for chart
        const salesByDay = {};
        for (let i = parseInt(period); i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            salesByDay[dateStr] = { revenue: 0, orders: 0 };
        }

        allOrders.forEach(order => {
            if (['cancelled', 'refunded'].includes(order.status)) return;
            const dateStr = new Date(order.created_at).toISOString().split('T')[0];
            if (salesByDay[dateStr]) {
                salesByDay[dateStr].revenue += order.total_amount || 0;
                salesByDay[dateStr].orders += 1;
            }
        });

        setSalesData(Object.entries(salesByDay).map(([date, data]) => ({
            date,
            ...data
        })));

        // Fetch order items for top products
        const { data: orderItems } = await supabase
            .from('order_items')
            .select('product_id, product_name, quantity, price');

        // Calculate top products
        const productSales = {};
        (orderItems || []).forEach(item => {
            if (!productSales[item.product_id]) {
                productSales[item.product_id] = {
                    name: item.product_name,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[item.product_id].quantity += item.quantity;
            productSales[item.product_id].revenue += item.price * item.quantity;
        });

        const topProductsList = Object.entries(productSales)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        setTopProducts(topProductsList);

        setLowStockProducts(variants || []);

        // Fetch pending inquiries count
        const { count: pendingInquiriesCount } = await supabase
            .from('inquiries')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        setStats(prev => ({
            ...prev,
            pendingInquiries: pendingInquiriesCount || 0
        }));

        setLoading(false);
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short'
        });
    };

    const statusLabels = {
        pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-700' },
        paid: { label: 'Ödendi', color: 'bg-blue-100 text-blue-700' },
        preparing: { label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-700' },
        shipped: { label: 'Kargolandı', color: 'bg-cyan-100 text-cyan-700' },
        delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700' },
        cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700' },
    };

    const statCards = [
        {
            title: 'Toplam Satış',
            value: formatCurrency(stats.totalRevenue),
            subtitle: `Bugün: ${formatCurrency(stats.todayRevenue)}`,
            icon: TrendingUp,
            color: 'bg-emerald-500',
            trend: stats.todayRevenue > 0 ? 'up' : null
        },
        {
            title: 'Bekleyen Siparişler',
            value: stats.pendingOrders.toString(),
            subtitle: 'İşlem bekliyor',
            icon: Clock,
            color: 'bg-amber-500',
            highlight: stats.pendingOrders > 0
        },
        {
            title: 'Toplam Sipariş',
            value: stats.totalOrders.toString(),
            subtitle: `Bugün: ${stats.todayOrders}`,
            icon: ShoppingCart,
            color: 'bg-blue-500'
        },
        {
            title: 'Toplam Ürün',
            value: stats.totalProducts.toString(),
            subtitle: 'Aktif ürün',
            icon: Package,
            color: 'bg-violet-500'
        },
        {
            title: 'Bekleyen Sorular',
            value: stats.pendingInquiries.toString(),
            subtitle: 'Yanıt bekliyor',
            icon: MessageSquare,
            color: 'bg-indigo-500',
            highlight: stats.pendingInquiries > 0
        },
    ];

    // Chart configurations
    const salesChartData = {
        labels: salesData.map(d => formatDate(d.date)),
        datasets: [
            {
                label: 'Satış (₺)',
                data: salesData.map(d => d.revenue),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const salesChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => formatCurrency(context.raw)
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatCurrency(value)
                }
            }
        }
    };

    const ordersChartData = {
        labels: salesData.map(d => formatDate(d.date)),
        datasets: [
            {
                label: 'Sipariş',
                data: salesData.map(d => d.orders),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 4,
            }
        ]
    };

    const ordersChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Mağaza performansınızı takip edin</p>
                </div>
                <div className="flex gap-2">
                    {[
                        { value: '7', label: '7 Gün' },
                        { value: '30', label: '30 Gün' },
                        { value: '90', label: '90 Gün' }
                    ].map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${period === p.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={i}
                            className={`card p-5 ${stat.highlight ? 'ring-2 ring-amber-500/50' : ''}`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {loading ? '—' : stat.value}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        {stat.trend === 'up' && <ArrowUp className="w-3 h-3 text-green-500" />}
                                        {stat.subtitle}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <div className="card p-5">
                    <h3 className="font-semibold mb-4">Satış Grafiği</h3>
                    <div className="h-64">
                        {!loading && <Line data={salesChartData} options={salesChartOptions} />}
                    </div>
                </div>

                {/* Orders Chart */}
                <div className="card p-5">
                    <h3 className="font-semibold mb-4">Sipariş Sayıları</h3>
                    <div className="h-64">
                        {!loading && <Bar data={ordersChartData} options={ordersChartOptions} />}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="card lg:col-span-2">
                    <div className="p-5 border-b flex justify-between items-center">
                        <h3 className="font-semibold">Son Siparişler</h3>
                        <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Tümü <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                    ) : recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Henüz sipariş bulunmuyor
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentOrders.map((order) => {
                                const status = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100' };
                                return (
                                    <div key={order.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium">#{order.id.substring(0, 8).toUpperCase()}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.guest_info?.first_name} {order.guest_info?.last_name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Side Widgets */}
                <div className="space-y-6">
                    {/* Top Products */}
                    <div className="card">
                        <div className="p-5 border-b">
                            <h3 className="font-semibold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                En Çok Satanlar
                            </h3>
                        </div>
                        {topProducts.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Henüz satış verisi yok
                            </div>
                        ) : (
                            <div className="divide-y">
                                {topProducts.map((product, i) => (
                                    <div key={product.id} className="flex items-center gap-3 p-3">
                                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.quantity} adet satıldı</p>
                                        </div>
                                        <span className="text-sm font-semibold text-green-600">
                                            {formatCurrency(product.revenue)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Low Stock Alert */}
                    <div className="card">
                        <div className="p-5 border-b">
                            <h3 className="font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Düşük Stok Uyarısı
                            </h3>
                        </div>
                        {lowStockProducts.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Tüm stoklar yeterli
                            </div>
                        ) : (
                            <div className="divide-y">
                                {lowStockProducts.map((variant) => (
                                    <div key={variant.id} className="flex items-center justify-between p-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{variant.products?.name}</p>
                                            <p className="text-xs text-muted-foreground">{variant.name}</p>
                                        </div>
                                        <span className={`text-sm font-bold ${variant.stock_quantity <= 0 ? 'text-red-600' :
                                            variant.stock_quantity < 5 ? 'text-amber-600' : 'text-muted-foreground'
                                            }`}>
                                            {variant.stock_quantity} adet
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link
                            href="/admin/stock"
                            className="block p-3 text-center text-sm text-primary hover:bg-muted/50 border-t"
                        >
                            Stok Yönetimi →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
