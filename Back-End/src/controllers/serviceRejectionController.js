const ServiceRequested = require('../models/ServiceRequest');
const ServiceRejected = require('../models/ServiceRejected');
const Notification = require('../models/Notification');
const SNNotification = require('../models/SNNotification');

const handleServiceRejection = async (serviceId) => {
  try {
    // Find the service in ServiceRequest collection
    const service = await ServiceRequested.findById(serviceId);
    
    if (!service) {
      throw new Error('Service request not found');
    }

    // Create new rejected service entry
    const rejectedService = new ServiceRejected({
      serviceNeeder: {
        id: service.serviceNeeder.id,
        name: service.serviceNeeder.name,
        phoneNumber: service.serviceNeeder.phoneNumber
      },
      serviceProvider: {
        id: service.serviceProvider.id,
        name: service.serviceProvider.name,
        phoneNumber: service.serviceProvider.phoneNumber
      },
      serviceDetails: {
        serviceType: service.serviceDetails.serviceType,
        location: service.serviceDetails.location,
        address: service.serviceDetails.address,
        date: service.serviceDetails.date,
        timeFrom: service.serviceDetails.timeFrom,
        timeTo: service.serviceDetails.timeTo,
        totalHours: service.serviceDetails.totalHours,
        feePerHour: service.serviceDetails.feePerHour,
        totalFee: service.serviceDetails.totalFee
      },
      status: 'rejected',
      createdAt: service.createdAt
    });

    // Create notification for service needer
    const snNotification = new SNNotification({
      serviceNeederId: service.serviceNeeder.id,
      serviceRequestId: service._id,
      serviceProvider: {
        id: service.serviceProvider.id,
        name: service.serviceProvider.name,
        phoneNumber: service.serviceProvider.phoneNumber
      },
      message: `Your service request for ${service.serviceDetails.serviceType} has been rejected by ${service.serviceProvider.name}`,
      status: 'rejected'
    });

    // Save rejected service and create notification
    await Promise.all([
      rejectedService.save(),
      snNotification.save(),
      // Update notification status
      Notification.findOneAndUpdate(
        { serviceRequestId: serviceId },
        { status: 'rejected' }
      ),
      // Delete from service requests collection
      ServiceRequested.findByIdAndDelete(serviceId)
    ]);

    return {
      rejectedService,
      notification: snNotification
    };

  } catch (error) {
    throw new Error(`Error handling service rejection: ${error.message}`);
  }
};

module.exports = handleServiceRejection;