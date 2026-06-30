const roomService = require('../services/room.service');

const roomController = {
  getRoomCalendar(req, res, next) {
    return roomService.getRoomCalendar(req, res, next);
  },

  getRoomDetail(req, res, next) {
    return roomService.getRoomDetail(req, res, next);
  },

  listRooms(req, res, next) {
    return roomService.listRooms(req, res, next);
  },

  searchRooms(req, res, next) {
    return roomService.searchRooms(req, res, next);
  },

  submitRoomReview(req, res, next) {
    return roomService.submitRoomReview(req, res, next);
  }
};

module.exports = roomController;
