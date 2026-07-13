const customerService = require('./customer-service.service');

const customerServiceController = {
  async listHotelServices(req, res, next) {
    try {
      const services = await customerService.listHotelServices();
      res.status(200).send({ services });
    } catch (error) {
      next(error);
    }
  },

  async getHotelServiceDetail(req, res, next) {
    try {
      const service = await customerService.getHotelServiceDetail(req.params.serviceId);
      res.status(200).send({ service });
    } catch (error) {
      next(error);
    }
  },

  async listCustomerServiceRequests(req, res, next) {
    try {
      const requests = await customerService.listCustomerServiceRequests(req.user);
      res.status(200).send({ requests });
    } catch (error) {
      next(error);
    }
  },

  async listCustomerServiceRooms(req, res, next) {
    try {
      const rooms = await customerService.listCustomerServiceRooms(req.user);
      res.status(200).send({ rooms });
    } catch (error) {
      next(error);
    }
  },

  async requestHotelService(req, res, next) {
    try {
      const request = await customerService.requestHotelService(req.params.serviceId, req.body, req.user);
      res.status(201).send({
        message: 'Yêu cầu dịch vụ đã được gửi đến nhân viên khách sạn.',
        request,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelCustomerServiceRequest(req, res, next) {
    try {
      const request = await customerService.cancelCustomerServiceRequest(req.params.requestId, req.user);
      res.status(200).send({
        message: 'Yêu cầu dịch vụ đã được hủy.',
        request,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = customerServiceController;
