import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiCurrencyRupee,
    HiArrowLeft,
    HiCalendar,
    HiTrendingUp,
    HiDownload,
    HiFilter
} from 'react-icons/hi';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import DoctorSidebar from '../../Components/Doctor/Sidebar';

export default function DoctorEarningsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [earnings, setEarnings] = useState({
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        pending: 0
    });
    const [timeFilter, setTimeFilter] = useState('all'); // all, month, year
    const [doctorProfile, setDoctorProfile] = useState(null);

    useEffect(() => {
        checkDoctorAuth();
    }, []);

    const checkDoctorAuth = () => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'doctor') {
                alert('Access denied. Doctor privileges required.');
                navigate('/');
                return;
            }
            fetchData(token);
        } catch (error) {
            console.error('Error parsing user data:', error);
            navigate('/login');
        }
    };

    const fetchData = async (token) => {
        try {
            setLoading(true);

            // Fetch Doctor Profile to get standard fee
            const profileRes = await axios.get(`${API_BASE_URL}/api/doctor/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctorProfile(profileRes.data.doctor);
            const standardFee = profileRes.data.doctor?.consultationFee || 500;

            // Fetch Appointments (All)
            const appointmentsRes = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=all`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const allAppointments = appointmentsRes.data.appointments || [];

            // Calculate Earnings
            // We only count 'consulted' (completed) appointments as earned
            const completedAppointments = allAppointments.filter(apt => apt.status === 'consulted');

            let totalEarned = 0;
            let monthEarned = 0;
            let lastMonthEarned = 0;
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const earningsData = completedAppointments.map(apt => {
                // Use fee from appointment if saved, otherwise fall back to profile fee
                const fee = apt.consultationFee || standardFee;
                const date = new Date(apt.booking_date);

                totalEarned += fee;

                if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                    monthEarned += fee;
                }

                // Simple last month logic (needs better handling for Jan/Dec edge case)
                const lastMonthDate = new Date();
                lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
                if (date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear()) {
                    lastMonthEarned += fee;
                }

                return {
                    ...apt,
                    fee
                };
            });

            setAppointments(earningsData.reverse()); // Newest first
            setEarnings({
                total: totalEarned,
                thisMonth: monthEarned,
                lastMonth: lastMonthEarned,
                count: earningsData.length
            });

        } catch (error) {
            console.error('Error fetching earnings data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex">
            <DoctorSidebar />
            <div className="flex-1 ml-64">
                {/* Header */}
                <div className="bg-white shadow-lg border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 sm:py-8 space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <button
                                    onClick={() => navigate('/doctor/dashboard')}
                                    className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                                >
                                    <HiArrowLeft className="h-5 w-5 text-gray-600" />
                                </button>
                                <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                                        <HiCurrencyRupee className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Earnings & Financials</h1>
                                        <p className="text-base sm:text-lg text-gray-600 mt-1">Track your revenue and consultation history</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => alert('Download report functionality coming soon!')}
                                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <HiDownload className="h-4 w-4" />
                                    <span>Download Report</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(earnings.total)}</p>
                                </div>
                                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <HiCurrencyRupee className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-emerald-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">This Month</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(earnings.thisMonth)}</p>
                                </div>
                                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <HiCalendar className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Consultations</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{earnings.count}</p>
                                </div>
                                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <HiTrendingUp className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                            <div className="flex items-center space-x-2">
                                <HiFilter className="text-gray-400" />
                                <select
                                    className="border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                >
                                    <option value="all">All Time</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {appointments.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <p>No completed consultations found.</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {appointments.map((apt) => (
                                            <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(apt.booking_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{apt.patient_name}</div>
                                                    <div className="text-xs text-gray-500">Token: #{apt.token_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    Consultation ({apt.appointmentType || 'General'})
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Paid
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                    {formatCurrency(apt.fee)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
