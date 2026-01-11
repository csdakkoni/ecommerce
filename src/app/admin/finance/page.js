'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Wallet, TrendingUp, TrendingDown, Plus, Calendar, Filter,
    DollarSign, CreditCard, Package, Truck, Users, Building,
    PieChart, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function FinancePage() {
    const [period, setPeriod] = useState('month'); // week, month, year
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        orderCount: 0,
    });
    const [expenses, setExpenses] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [expensesByCategory, setExpensesByCategory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        category_id: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchData();
    }, [period]);

    const getPeriodDates = () => {
        const end = new Date();
        const start = new Date();

        switch (period) {
            case 'week':
                start.setDate(end.getDate() - 7);
                break;
            case 'month':
                start.setMonth(end.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(end.getFullYear() - 1);
                break;
        }

        return { start, end };
    };

    async function fetchData() {
        setLoading(true);
        const { start, end } = getPeriodDates();

        // Fetch orders for revenue
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, status, created_at')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .not('status', 'in', '("cancelled","refunded")');

        const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

        // Fetch expense categories
        const { data: categories } = await supabase
            .from('expense_categories')
            .select('*')
            .order('name');

        setExpenseCategories(categories || []);

        // Fetch expenses
        const { data: expenseData } = await supabase
            .from('expenses')
            .select('*, expense_categories(name, color)')
            .gte('expense_date', start.toISOString().split('T')[0])
            .lte('expense_date', end.toISOString().split('T')[0])
            .order('expense_date', { ascending: false });

        setExpenses(expenseData || []);

        const totalExpenses = (expenseData || []).reduce((sum, e) => sum + (e.amount || 0), 0);

        // Group expenses by category
        const categoryTotals = {};
        (expenseData || []).forEach(exp => {
            const catName = exp.expense_categories?.name || 'Diğer';
            const catColor = exp.expense_categories?.color || '#6B7280';
            if (!categoryTotals[catName]) {
                categoryTotals[catName] = { total: 0, color: catColor };
            }
            categoryTotals[catName].total += exp.amount;
        });

        setExpensesByCategory(Object.entries(categoryTotals).map(([name, data]) => ({
            name,
            total: data.total,
            color: data.color
        })));

        setSummary({
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            orderCount: (orders || []).length,
        });

        setLoading(false);
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();

        await supabase.from('expenses').insert({
            category_id: newExpense.category_id || null,
            amount: parseFloat(newExpense.amount),
            description: newExpense.description,
            expense_date: newExpense.expense_date,
        });

        setShowExpenseModal(false);
        setNewExpense({
            category_id: '',
            amount: '',
            description: '',
            expense_date: new Date().toISOString().split('T')[0],
        });
        fetchData();
    };

    const deleteExpense = async (id) => {
        if (!confirm('Bu gideri silmek istediğinize emin misiniz?')) return;
        await supabase.from('expenses').delete().eq('id', id);
        fetchData();
    };

    // Chart Data
    const expenseChartData = {
        labels: expensesByCategory.map(c => c.name),
        datasets: [{
            data: expensesByCategory.map(c => c.total),
            backgroundColor: expensesByCategory.map(c => c.color),
            borderWidth: 0,
        }]
    };

    const periodLabels = {
        week: 'Bu Hafta',
        month: 'Bu Ay',
        year: 'Bu Yıl'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="w-7 h-7" />
                        Finans
                    </h1>
                    <p className="text-muted-foreground">Gelir, gider ve karlılık takibi</p>
                </div>
                <div className="flex gap-2">
                    {['week', 'month', 'year'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${period === p
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Toplam Gelir</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {loading ? '—' : formatCurrency(summary.totalRevenue)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.orderCount} sipariş
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Toplam Gider</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {loading ? '—' : formatCurrency(summary.totalExpenses)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {expenses.length} kayıt
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Net Kar</p>
                            <p className={`text-2xl font-bold mt-1 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {loading ? '—' : formatCurrency(summary.netProfit)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                {summary.netProfit >= 0 ? (
                                    <><ArrowUpRight className="w-3 h-3 text-green-500" /> Karlı</>
                                ) : (
                                    <><ArrowDownRight className="w-3 h-3 text-red-500" /> Zararlı</>
                                )}
                            </p>
                        </div>
                        <div className={`p-3 rounded-xl ${summary.netProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            <DollarSign className={`w-5 h-5 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Kar Marjı</p>
                            <p className="text-2xl font-bold mt-1">
                                {loading || summary.totalRevenue === 0 ? '—' :
                                    `%${((summary.netProfit / summary.totalRevenue) * 100).toFixed(1)}`}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <PieChart className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Expense Chart */}
                <div className="card p-5">
                    <h3 className="font-semibold mb-4">Gider Dağılımı</h3>
                    {expensesByCategory.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-muted-foreground">
                            Gider verisi yok
                        </div>
                    ) : (
                        <div className="h-48">
                            <Doughnut
                                data={expenseChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom' }
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Recent Expenses */}
                <div className="card lg:col-span-2">
                    <div className="p-5 border-b flex items-center justify-between">
                        <h3 className="font-semibold">Son Giderler</h3>
                        <button
                            onClick={() => setShowExpenseModal(true)}
                            className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            Gider Ekle
                        </button>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Henüz gider kaydı yok
                        </div>
                    ) : (
                        <div className="divide-y max-h-80 overflow-y-auto">
                            {expenses.slice(0, 10).map(expense => (
                                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: expense.expense_categories?.color || '#6B7280' }}
                                        />
                                        <div>
                                            <p className="font-medium">{expense.description || expense.expense_categories?.name || 'Gider'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(expense.expense_date).toLocaleDateString('tr-TR')}
                                                {expense.expense_categories?.name && ` • ${expense.expense_categories.name}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-red-600">
                                            -{formatCurrency(expense.amount)}
                                        </span>
                                        <button
                                            onClick={() => deleteExpense(expense.id)}
                                            className="text-muted-foreground hover:text-red-600 text-sm"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Category Summary */}
            <div className="card">
                <div className="p-5 border-b">
                    <h3 className="font-semibold">Kategori Bazlı Giderler</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-5">
                    {expenseCategories.map(cat => {
                        const catExpense = expensesByCategory.find(e => e.name === cat.name);
                        return (
                            <div key={cat.id} className="text-center p-4 rounded-xl bg-muted/30">
                                <div
                                    className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                                    style={{ backgroundColor: cat.color + '20' }}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                </div>
                                <p className="text-sm font-medium truncate">{cat.name}</p>
                                <p className="text-lg font-bold">
                                    {formatCurrency(catExpense?.total || 0)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-md">
                        <div className="p-5 border-b">
                            <h3 className="text-lg font-semibold">Yeni Gider</h3>
                        </div>
                        <form onSubmit={handleAddExpense} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Kategori</label>
                                <select
                                    value={newExpense.category_id}
                                    onChange={(e) => setNewExpense({ ...newExpense, category_id: e.target.value })}
                                    className="input w-full"
                                >
                                    <option value="">Seçiniz</option>
                                    {expenseCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Tutar (₺)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Açıklama</label>
                                <input
                                    type="text"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="input w-full"
                                    placeholder="Gider açıklaması..."
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Tarih</label>
                                <input
                                    type="date"
                                    value={newExpense.expense_date}
                                    onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowExpenseModal(false)}
                                    className="btn btn-outline flex-1"
                                >
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
