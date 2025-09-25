const ServiceRequest = require("../models/ServiceRequest");
const ServiceAccepted = require("../models/ServiceAccepted");
const ServiceNeeder = require("../models/ServiceNeeder");
const ApprovedServiceProvider = require("../models/ApprovedServiceProvider");
const CompletedService = require("../models/CompletedService");
const ActiveService = require("../models/ActiveService");

// Get analytics dashboard data
const getAnalyticsData = async (req, res) => {
  try {
    // Get total counts
    const totalServiceNeeders = await ServiceNeeder.countDocuments();
    const totalServiceProviders =
      await ApprovedServiceProvider.countDocuments();
    const totalUsers = totalServiceNeeders + totalServiceProviders;

    const totalServices = await ServiceRequest.countDocuments();
    const activeServices = await ActiveService.countDocuments();
    const completedServices = await CompletedService.countDocuments();

    // Calculate total revenue from completed services
    const revenueData = await CompletedService.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$serviceDetails.totalFee" },
        },
      },
    ]);
    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Get services by type
    const servicesByType = await ServiceRequest.aggregate([
      {
        $group: {
          _id: "$serviceDetails.serviceType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: "$_id",
          value: "$count",
          _id: 0,
        },
      },
    ]);

    // Add colors to service types
    const colors = [
      "#FFD700",
      "#4ECDC4",
      "#FF6B6B",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
    ];
    const servicesByTypeWithColors = servicesByType.map((service, index) => ({
      ...service,
      color: colors[index % colors.length],
    }));

    // Get revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await CompletedService.aggregate([
      {
        $match: {
          completedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$completedAt" },
            month: { $month: "$completedAt" },
          },
          revenue: { $sum: "$serviceDetails.totalFee" },
          services: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: "$_id.month" },
              "/",
              { $toString: "$_id.year" },
            ],
          },
          revenue: 1,
          services: 1,
          _id: 0,
        },
      },
    ]);

    // Get user growth by month (service needers vs providers)
    const userGrowthNeeders = await ServiceNeeder.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const userGrowthProviders = await ApprovedServiceProvider.aggregate([
      {
        $match: {
          approvedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$approvedAt" },
            month: { $month: "$approvedAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Combine user growth data
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const userGrowth = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const needersData = userGrowthNeeders.find(
        (d) => d._id.year === year && d._id.month === month
      );
      const providersData = userGrowthProviders.find(
        (d) => d._id.year === year && d._id.month === month
      );

      userGrowth.push({
        month: monthNames[month - 1],
        serviceNeeders: needersData ? needersData.count : 0,
        providers: providersData ? providersData.count : 0,
      });
    }

    // Get service status distribution
    const pendingServices = await ServiceRequest.countDocuments();
    const acceptedServices = await ServiceAccepted.countDocuments();
    const rejectedServices = await ServiceRequest.countDocuments({
      status: "rejected",
    });

    const serviceStatus = [
      { name: "Pending", value: pendingServices, color: "#FFEAA7" },
      { name: "Active", value: activeServices, color: "#4ECDC4" },
      { name: "Completed", value: completedServices, color: "#96CEB4" },
      { name: "Rejected", value: rejectedServices, color: "#FF6B6B" },
    ];

    // Get top provider performance
    const providerPerformance = await CompletedService.aggregate([
      {
        $group: {
          _id: "$serviceProvider.id",
          name: { $first: "$serviceProvider.name" },
          completed: { $sum: 1 },
          revenue: { $sum: "$serviceDetails.totalFee" },
        },
      },
      {
        $sort: { completed: -1 },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          name: 1,
          completed: 1,
          revenue: { $divide: ["$revenue", 100] }, // Convert to hundreds for better chart display
          _id: 0,
        },
      },
    ]);

    // Calculate monthly growth rate
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const currentMonthUsers =
      (await ServiceNeeder.countDocuments({
        createdAt: {
          $gte: new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1
          ),
        },
      })) +
      (await ApprovedServiceProvider.countDocuments({
        approvedAt: {
          $gte: new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1
          ),
        },
      }));

    const lastMonthUsers =
      (await ServiceNeeder.countDocuments({
        createdAt: {
          $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        },
      })) +
      (await ApprovedServiceProvider.countDocuments({
        approvedAt: {
          $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        },
      }));

    const monthlyGrowth =
      lastMonthUsers > 0
        ? (
            ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) *
            100
          ).toFixed(1)
        : 0;

    const analyticsData = {
      kpis: {
        totalRevenue,
        activeServices,
        totalUsers,
        monthlyGrowth: `${monthlyGrowth}%`,
      },
      servicesByType: servicesByTypeWithColors,
      revenueByMonth,
      userGrowth,
      serviceStatus,
      providerPerformance,
    };

    res.status(200).json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res
      .status(500)
      .json({ message: "Error fetching analytics data", error: error.message });
  }
};

module.exports = {
  getAnalyticsData,
};
