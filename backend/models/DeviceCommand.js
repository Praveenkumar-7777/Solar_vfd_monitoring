const mongoose = require('mongoose');

const deviceCommandSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    trim: true,
    index: true
  },
  command: {
    type: String,
    required: [true, 'Command is required'],
    enum: ['MOTOR_ON', 'MOTOR_OFF']
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged'],
    default: 'pending'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

deviceCommandSchema.index({ deviceId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('DeviceCommand', deviceCommandSchema);
