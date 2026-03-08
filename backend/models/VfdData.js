const mongoose = require('mongoose');

const vfdDataSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    trim: true,
    index: true
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['STOPPED', 'RUNNING', 'FAULT', 'STANDBY'],
    default: 'STOPPED'
  },
  runFrequency: {
    type: Number,
    required: [true, 'Run frequency is required'],
    min: 0,
    default: 0
  },
  dcBusVoltage: {
    type: Number,
    required: [true, 'DC Bus voltage is required'],
    min: 0,
    default: 0
  },
  outputCurrent: {
    type: Number,
    required: [true, 'Output current is required'],
    min: 0,
    default: 0
  },
  fault: {
    type: String,
    default: '0x00 No Fault'
  },
  communicationStatus: {
    type: String,
    required: [true, 'Communication status is required'],
    default: 'Communication OK'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for faster queries
vfdDataSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('VfdData', vfdDataSchema);
