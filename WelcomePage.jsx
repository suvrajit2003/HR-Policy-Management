import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';

// --- IMPORTANT: CONFIGURE YOUR API BASE URL HERE ---
const API_BASE_URL = "http://localhost:1000"; // Ensure this matches your backend port

const WelcomePage = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("username") || "User";
    const userId = localStorage.getItem("userId");

    // State for individual performance data
    const [dailyPerformanceData, setDailyPerformanceData] = useState([]);
    const [weeklyPerformanceData, setWeeklyPerformanceData] = useState([]);
    const [monthlyPerformanceData, setMonthlyPerformanceData] = useState([]);

    // State for admin performance data (all users)
    const [adminDailyPerPeriodPerformance, setAdminDailyPerPeriodPerformance] = useState([]);
    const [adminWeeklyPerPeriodPerformance, setAdminWeeklyPerPeriodPerformance] = useState([]);
    const [adminMonthlyPerPeriodPerformance, setAdminMonthlyPerPeriodPerformance] = useState([]);
    const [allUsersOverallPerformance, setAllUsersOverallPerformance] = useState([]);

    // States to store unique employee names for dynamic Bar components in admin charts
    const [dailyChartEmployeeNames, setDailyChartEmployeeNames] = useState([]);
    const [weeklyChartEmployeeNames, setWeeklyChartEmployeeNames] = useState([]);
    const [monthlyChartEmployeeNames, setMonthlyChartEmployeeNames] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getWelcomeMessage = () => {
        switch (role?.toLowerCase()) {
            case "admin":
            case "superadmin":
                return "Welcome Super Admin!";
            case "hr":
                return "Welcome HR!";
            case "employee":
                return "Welcome Employee!";
            default:
                return "Welcome!";
        }
    };

    const showIndividualPerformanceCharts = ["employee", "hr"].includes(role?.toLowerCase());
    const showAdminPerformanceCharts = ["admin", "superadmin"].includes(role?.toLowerCase());

    // --- Color palette for dynamic bars ---
    const colors = [
        '#8884d8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#b5c99a',
        '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff7300', '#c9c9ff', '#9b59b6', '#3498db',
        '#e74c3c', '#27ae60', '#f1c40f', '#95a5a6', '#d35400', '#c0392b', '#7f8c8d', '#2c3e50'
    ];


    const processIndividualPerformanceData = useCallback((tasks) => {
        const dailyMap = new Map();
        const weeklyMap = new Map();
        const monthlyMap = new Map();

        const currentYear = moment().year();

        // Daily: Last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = moment().subtract(i, 'days');
            dailyMap.set(date.format('YYYY-MM-DD'), { totalRatingSum: 0, count: 0, periodLabel: date.format('MMM DD') });
        }

        // Weekly: Last 3 weeks
        for (let i = 2; i >= 0; i--) {
            const weekStart = moment().subtract(i, 'weeks').startOf('isoWeek');
            weeklyMap.set(weekStart.format('YYYY-WW'), { totalRatingSum: 0, count: 0, periodLabel: `Week ${weekStart.isoWeek()} (${weekStart.format('MMM DD')})` });
        }

        // Monthly: All months of the CURRENT YEAR
        for (let i = moment().month(); i >= 0; i--) { // Iterate from current month down to January
            const monthStart = moment().month(i).startOf('month');
            monthlyMap.set(monthStart.format('YYYY-MM'), { totalRatingSum: 0, count: 0, periodLabel: monthStart.format('MMM YYYY') });
        }


        tasks.forEach(task => {
            if (typeof task.rating === 'number' && task.completedAt) {
                const date = moment(task.completedAt);
                const taskYear = date.year();

                // Daily Aggregation (Last 7 Days)
                const dayKey = date.format('YYYY-MM-DD');
                if (dailyMap.has(dayKey)) {
                    const dayData = dailyMap.get(dayKey);
                    dayData.totalRatingSum += task.rating;
                    dayData.count += 1;
                }

                // Weekly Aggregation (Last 3 Weeks)
                const weekKey = date.format('YYYY-WW');
                if (weeklyMap.has(weekKey)) {
                    const weekData = weeklyMap.get(weekKey);
                    weekData.totalRatingSum += task.rating;
                    weekData.count += 1;
                }

                // Monthly Aggregation (Current Year Only)
                if (taskYear === currentYear) { // Only process if task is in the current year
                    const monthKey = date.format('YYYY-MM');
                    // Add if not already pre-populated (for months within current year but before current month)
                    if (!monthlyMap.has(monthKey)) {
                        monthlyMap.set(monthKey, { totalRatingSum: 0, count: 0, periodLabel: date.format('MMM YYYY') });
                    }
                    const monthData = monthlyMap.get(monthKey);
                    monthData.totalRatingSum += task.rating;
                    monthData.count += 1;
                }

            } else {
                console.warn("Task skipped in individual performance processing (missing rating or completedAt):", task);
            }
        });

        const formatChartData = (map) => {
            return Array.from(map.values())
                .map(data => ({
                    periodLabel: data.periodLabel,
                    averageRating: data.count > 0 ? parseFloat((data.totalRatingSum / data.count).toFixed(2)) : 0,
                    totalPossibleRating: 5
                }))
                // Sort by actual date values, not string representation
                .sort((a, b) => {
                    const dateA = moment(a.periodLabel, ["MMM DD", "Week WW (MMM DD)", "MMM YYYY"]);
                    const dateB = moment(b.periodLabel, ["MMM DD", "Week WW (MMM DD)", "MMM YYYY"]);
                    return dateA.valueOf() - dateB.valueOf();
                });
        };

        setDailyPerformanceData(formatChartData(dailyMap));
        setWeeklyPerformanceData(formatChartData(weeklyMap));
        setMonthlyPerformanceData(formatChartData(monthlyMap));

    }, []);

    // --- Data Processing for Admin Charts ---
    const processAdminPerformanceCharts = useCallback((tasks) => {
        const overallUserMap = new Map();

        const dailyAggregates = new Map();
        const weeklyAggregates = new Map();
        const monthlyAggregates = new Map();

        const uniqueEmployeeNames = new Set();
        const currentYear = moment().year();


        // 1. Initialize time periods (even if no tasks yet)
        // Daily: Last 3 days (Changed from 7)
        for (let i = 2; i >= 0; i--) { // Changed loop from 6 to 2
            const date = moment().subtract(i, 'days');
            dailyAggregates.set(date.format('YYYY-MM-DD'), { periodLabel: date.format('MMM DD'), employees: new Map() });
        }
        // Weekly: Last 3 weeks
        for (let i = 2; i >= 0; i--) {
            const weekStart = moment().subtract(i, 'weeks').startOf('isoWeek');
            weeklyAggregates.set(weekStart.format('YYYY-WW'), { periodLabel: `Week ${weekStart.isoWeek()} (${weekStart.format('MMM DD')})`, employees: new Map() });
        }
        // Monthly: All months of the CURRENT YEAR
        for (let i = moment().month(); i >= 0; i--) { // Iterate from current month down to January
            const monthStart = moment().month(i).startOf('month');
            monthlyAggregates.set(monthStart.format('YYYY-MM'), { periodLabel: monthStart.format('MMM YYYY'), employees: new Map() });
        }


        // 2. Aggregate task data
        tasks.forEach(task => {
            if (
                typeof task.rating === 'number' &&
                task.completedAt &&
                task.assignedTo &&
                task.assignedToName
            ) {
                const employeeId = task.assignedTo;
                const employeeName = task.assignedToName;
                const date = moment(task.completedAt);
                const taskYear = date.year();

                uniqueEmployeeNames.add(employeeName); // Collect all employee names

                // Overall performance (All time)
                if (!overallUserMap.has(employeeId)) {
                    overallUserMap.set(employeeId, { totalRatingSum: 0, count: 0, name: employeeName });
                }
                overallUserMap.get(employeeId).totalRatingSum += task.rating;
                overallUserMap.get(employeeId).count += 1;

                // Daily aggregation
                const dayKey = date.format('YYYY-MM-DD');
                // Only process daily tasks if they fall within the last 3 initialized days
                if (dailyAggregates.has(dayKey)) {
                    let dayData = dailyAggregates.get(dayKey);
                    if (!dayData.employees.has(employeeName)) {
                        dayData.employees.set(employeeName, { totalRatingSum: 0, count: 0 });
                    }
                    let empDayStats = dayData.employees.get(employeeName);
                    empDayStats.totalRatingSum += task.rating;
                    empDayStats.count += 1;
                }

                // Weekly aggregation
                const weekKey = date.format('YYYY-WW');
                if (!weeklyAggregates.has(weekKey)) { // Handle older data if it exists beyond 3 weeks
                    weeklyAggregates.set(weekKey, { periodLabel: `Week ${date.isoWeek()} (${date.startOf('isoWeek').format('MMM DD')})`, employees: new Map() });
                }
                let weekData = weeklyAggregates.get(weekKey);
                if (!weekData.employees.has(employeeName)) {
                    weekData.employees.set(employeeName, { totalRatingSum: 0, count: 0 });
                }
                let empWeekStats = weekData.employees.get(employeeName);
                empWeekStats.totalRatingSum += task.rating;
                empWeekStats.count += 1;

                // Monthly aggregation (Current Year Only)
                if (taskYear === currentYear) { // Only process if task is in the current year
                    const monthKey = date.format('YYYY-MM');
                    if (!monthlyAggregates.has(monthKey)) {
                        monthlyAggregates.set(monthKey, { periodLabel: date.format('MMM YYYY'), employees: new Map() });
                    }
                    let monthData = monthlyAggregates.get(monthKey);
                    if (!monthData.employees.has(employeeName)) {
                        monthData.employees.set(employeeName, { totalRatingSum: 0, count: 0 });
                    }
                    let empMonthStats = monthData.employees.get(employeeName);
                    empMonthStats.totalRatingSum += task.rating;
                    empMonthStats.count += 1;
                }

            } else {
                console.warn("Task skipped in admin performance processing (missing rating, completedAt, assignedTo, or assignedToName):", task);
            }
        });

        // 3. Transform aggregated maps into Recharts-friendly array format for grouped bars
        const convertAggregatesToGroupedChartData = (aggregateMap) => {
            const chartData = [];
            Array.from(aggregateMap.values())
                .sort((a, b) => {
                    const dateA = moment(a.periodLabel, ["MMM DD", "Week WW (MMM DD)", "MMM YYYY"]);
                    const dateB = moment(b.periodLabel, ["MMM DD", "Week WW (MMM DD)", "MMM YYYY"]);
                    return dateA.valueOf() - dateB.valueOf();
                })
                .forEach(periodData => {
                    const entry = { periodLabel: periodData.periodLabel };
                    uniqueEmployeeNames.forEach(empName => {
                        const empStats = periodData.employees.get(empName);
                        entry[empName] = empStats && empStats.count > 0 ? parseFloat((empStats.totalRatingSum / empStats.count).toFixed(2)) : 0;
                    });
                    chartData.push(entry);
                });
            return chartData;
        };

        setAdminDailyPerPeriodPerformance(convertAggregatesToGroupedChartData(dailyAggregates));
        setAdminWeeklyPerPeriodPerformance(convertAggregatesToGroupedChartData(weeklyAggregates));
        setAdminMonthlyPerPeriodPerformance(convertAggregatesToGroupedChartData(monthlyAggregates));

        const createOverallAdminChartData = (map) => Array.from(map.values())
            .filter((data) => data.count > 0)
            .map(data => ({
                name: data.name,
                averageRating: data.count > 0 ? parseFloat((data.totalRatingSum / data.count).toFixed(2)) : 0,
                totalPossibleRating: 5
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        setAllUsersOverallPerformance(createOverallAdminChartData(overallUserMap));

        const sortedUniqueEmployeeNames = Array.from(uniqueEmployeeNames).sort();
        setDailyChartEmployeeNames(sortedUniqueEmployeeNames);
        setWeeklyChartEmployeeNames(sortedUniqueEmployeeNames);
        setMonthlyChartEmployeeNames(sortedUniqueEmployeeNames);

    }, []);

    // --- Fetch Data Effect ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                let response;
                let data;

                if (showIndividualPerformanceCharts && userId) {
                    response = await fetch(`${API_BASE_URL}/api/performance/${userId}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    data = await response.json();
                    processIndividualPerformanceData(data);
                } else if (showAdminPerformanceCharts) {
                    response = await fetch(`${API_BASE_URL}/api/all_performance`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    data = await response.json();
                    processAdminPerformanceCharts(data);
                } else {
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error("Failed to fetch performance data:", e);
                setError("Failed to load performance data. Please ensure the backend is running and data is available. Error: " + e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [
        role,
        userId,
        showIndividualPerformanceCharts,
        showAdminPerformanceCharts,
        processIndividualPerformanceData,
        processAdminPerformanceCharts,
    ]);

    // --- Reusable Chart Component ---
    const CustomBarChart = ({ title, data, dataKeyXAxis, avgRatingFill, employeeNames = [], showTotalPossibleRating = true, height }) => {
        const isIndividualChart = !employeeNames || employeeNames.length === 0;

        const chartHeight = height || (isIndividualChart ? 180 : 250);

        const hasData = data.length > 0 && (
            isIndividualChart
                ? data.some(d => d.averageRating > 0)
                : data.some(d => employeeNames.some(empName => d[empName] > 0))
        );

        return (
            <div className="w-full h-auto p-4 md:p-6 border border-gray-200 rounded-xl bg-white shadow-md flex flex-col items-center justify-between transition-all duration-300 ease-in-out hover:shadow-lg">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 text-center w-full">{title}</h3>
                {hasData ? (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                            barCategoryGap="15%"
                            barGap={5}
                        >
                            <CartesianGrid strokeDashArray="4 4" stroke="#e0e0e0" vertical={false} />
                            <XAxis
                                dataKey={dataKeyXAxis}
                                interval={0}
                                angle={-360} // Slightly less angle for better readability
                                textAnchor="end"
                                height={60}
                                style={{ fontSize: '12px', fill: '#555' }}
                            />
                            <YAxis
                                domain={[0, 5]}
                                ticks={[0, 1, 2, 3, 4, 5]}
                                width={40}
                                style={{ fontSize: '12px', fill: '#555' }}
                                label={{ value: 'Avg. Rating', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px', fill: '#555' } }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #ccc', borderRadius: '8px', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#333', fontSize: '13px', marginBottom: '5px' }}
                                itemStyle={{ fontSize: '12px', color: '#555' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '15px', fontSize: "12px", textAlign: "center", textTransform: "capitalize" }} />

                            {isIndividualChart ? (
                                <>
                                    <Bar dataKey="averageRating" fill={avgRatingFill} name="Your Average Rating" barSize={30} radius={[5, 5, 0, 0]} />
                                    {showTotalPossibleRating && <Bar dataKey="totalPossibleRating" fill="#ced4da" name="Possible Rating (5)" barSize={30} radius={[5, 5, 0, 0]} />}
                                </>
                            ) : (
                                employeeNames.map((empName, index) => (
                                    <Bar
                                        key={empName}
                                        dataKey={empName}
                                        fill={colors[index % colors.length]}
                                        name={empName}
                                        barSize={15}
                                        radius={[3, 3, 0, 0]}
                                    />
                                ))
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500 text-base mt-4">No performance data available for this period or employees.</p>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-start w-full min-h-screen p-4 md:p-8 box-border font-sans bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Welcome Card */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl text-center max-w-xl w-full mb-8 mt-10 transform transition-all duration-500 hover:scale-105">
                <h1 className="text-4xl md:text-5xl mb-3 text-gray-800 font-extrabold tracking-tight">
                    {getWelcomeMessage()}
                </h1>
                <p className="text-xl md:text-2xl mb-5 text-blue-600 font-semibold animate-pulse">
                    Hello, <strong className="font-extrabold text-blue-800">{username}</strong> 👋
                </p>
                <p className="text-base text-gray-600">
                    Explore your dashboard to see performance insights and manage tasks.
                </p>
            </div>

            {/* Individual Performance Charts Section */}
            {showIndividualPerformanceCharts && (
                <div className="p-6 bg-white rounded-3xl shadow-xl mt-8 w-full max-w-5xl flex flex-col items-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center border-b-2 border-blue-200 pb-2">Your Performance Statistics</h2>
                    {loading && <p className="text-gray-600 text-lg py-10">Loading your performance data...</p>}
                    {error && <p className="text-red-600 text-lg py-10">Error: {error}</p>}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                            <CustomBarChart
                                title="Daily Performance (Last 7 Days)"
                                data={dailyPerformanceData}
                                dataKeyXAxis="periodLabel"
                                avgRatingFill="#4299E1" // Blue-500
                                height={220}
                            />
                            <CustomBarChart
                                title="Weekly Performance (Last 3 Weeks)"
                                data={weeklyPerformanceData}
                                dataKeyXAxis="periodLabel"
                                avgRatingFill="#48BB78" // Green-500
                                height={220}
                            />
                            <CustomBarChart
                                title="Monthly Performance (Current Year)"
                                data={monthlyPerformanceData}
                                dataKeyXAxis="periodLabel"
                                avgRatingFill="#F6AD55" // Orange-400
                                height={220}
                            />
                        </div>
                    )}
                     {!loading && !error && dailyPerformanceData.length === 0 && weeklyPerformanceData.length === 0 && monthlyPerformanceData.length === 0 && (
                        <p className="text-gray-500 text-base mt-4">No performance data available for you at this time.</p>
                    )}
                </div>
            )}

            {/* Admin Performance Charts Section */}
            {showAdminPerformanceCharts && (
                <div className="p-6 bg-white rounded-3xl shadow-xl mt-8 w-full max-w-5xl flex flex-col items-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center border-b-2 border-blue-200 pb-2">Admin Performance Overview</h2>
                    {loading && <p className="text-gray-600 text-lg py-10">Loading all users' performance data...</p>}
                    {error && <p className="text-red-600 text-lg py-10">Error: {error}</p>}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 gap-8 w-full">
                            <CustomBarChart
                                title={`Daily Performance (Last 3 Days) - All Employees`}
                                data={adminDailyPerPeriodPerformance}
                                dataKeyXAxis="periodLabel"
                                employeeNames={dailyChartEmployeeNames}
                                height={300}
                            />

                            <CustomBarChart
                                title={`Weekly Performance (Last 3 Weeks) - All Employees`}
                                data={adminWeeklyPerPeriodPerformance}
                                dataKeyXAxis="periodLabel"
                                employeeNames={weeklyChartEmployeeNames}
                                height={300}
                            />

                            <CustomBarChart
                                title={`Monthly Performance (Current Year) - All Employees`}
                                data={adminMonthlyPerPeriodPerformance}
                                dataKeyXAxis="periodLabel"
                                employeeNames={monthlyChartEmployeeNames}
                                height={300}
                            />

                            {/* Overall Average Rating Per Employee (All Time) */}
                            <CustomBarChart
                                title="Overall Average Rating Per Employee (All Time)"
                                data={allUsersOverallPerformance}
                                dataKeyXAxis="name"
                                showTotalPossibleRating={false}
                                avgRatingFill="#3182CE" // Blue-600
                                height={300}
                            />
                        </div>
                    )}
                     {!loading && !error && allUsersOverallPerformance.length === 0 && (
                        <p className="text-gray-500 text-base mt-4">No overall performance data available for employees at this time.</p>
                    )}
                </div>
            )}

            {!showIndividualPerformanceCharts && !showAdminPerformanceCharts && !loading && (
                <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg text-center max-w-lg w-11/12 mt-8">
                    <p className="text-xl text-gray-700">Please log in to view your dashboard content.</p>
                </div>
            )}
        </div>
    );
};

WelcomePage.propTypes = {
    // No PropTypes defined in the original snippet, so none added here.
    // If you intend to pass props to WelcomePage, define them here.
};

export default WelcomePage;