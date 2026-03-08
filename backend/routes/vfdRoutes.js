const express = require('express');
const router = express.Router();
const VfdData = require('../models/VfdData');
const DeviceCommand = require('../models/DeviceCommand');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

const normalizeDeviceId = (value) => (value || '').trim().toUpperCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/vfd-data - ESP32 sends VFD data
router.post('/vfd-data', async (req, res) => {
  try {
    const {
      deviceId,
      status,
      runFrequency,
      dcBusVoltage,
      outputCurrent,
      fault,
      communicationStatus
    } = req.body;

    const normalizedDeviceId = normalizeDeviceId(deviceId);

    // Validate required fields
    if (!normalizedDeviceId || status === undefined || runFrequency === undefined || 
        dcBusVoltage === undefined || outputCurrent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required VFD parameters'
      });
    }

    // Create new VFD data entry
    const vfdData = new VfdData({
      deviceId: normalizedDeviceId,
      status,
      runFrequency,
      dcBusVoltage,
      outputCurrent,
      fault: fault || '0x00 No Fault',
      communicationStatus: communicationStatus || 'Communication OK',
      timestamp: new Date()
    });

    await vfdData.save();

    res.status(201).json({
      success: true,
      message: 'VFD data saved successfully',
      data: vfdData
    });

  } catch (error) {
    console.error('VFD data save error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving VFD data'
    });
  }
});

// GET /api/my-device-data - Get latest data for logged-in user's device
router.get('/my-device-data', authenticateToken, async (req, res) => {
  try {
    const userDeviceId = normalizeDeviceId(req.user.deviceId);

    if (!userDeviceId) {
      return res.status(400).json({
        success: false,
        message: 'No device assigned to this user'
      });
    }

    // Get latest data for user's device
    const latestData = await VfdData.findOne({
      deviceId: { $regex: `^${escapeRegex(userDeviceId)}$`, $options: 'i' }
    })
      .sort({ timestamp: -1 });

    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: 'No data found for your device'
      });
    }

    res.json({
      success: true,
      data: latestData
    });

  } catch (error) {
    console.error('Get device data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching device data'
    });
  }
});

// GET /api/device-history/:deviceId - Get historical data for a specific device
router.get('/device-history/:deviceId', authenticateToken, async (req, res) => {
  try {
    const deviceId = normalizeDeviceId(req.params.deviceId);
    const userDeviceId = normalizeDeviceId(req.user.deviceId);
    const { limit = 50 } = req.query;

    // Check if user has access to this device
    if (req.user.role !== 'admin' && userDeviceId !== deviceId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this device data'
      });
    }

    const historicalData = await VfdData.find({
      deviceId: { $regex: `^${escapeRegex(deviceId)}$`, $options: 'i' }
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: historicalData.length,
      data: historicalData
    });

  } catch (error) {
    console.error('Get device history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching device history'
    });
  }
});

// GET /api/all-vfd-data - Admin gets all devices latest data
router.get('/all-vfd-data', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get all unique device IDs
    const deviceIds = await VfdData.distinct('deviceId');

    // Get latest data for each device
    const allDevicesData = await Promise.all(
      deviceIds.map(async (deviceId) => {
        const latestData = await VfdData.findOne({ deviceId })
          .sort({ timestamp: -1 });
        return latestData;
      })
    );

    // Filter out null values
    const filteredData = allDevicesData.filter(data => data !== null);

    res.json({
      success: true,
      count: filteredData.length,
      data: filteredData
    });

  } catch (error) {
    console.error('Get all VFD data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching all VFD data'
    });
  }
});

// DELETE /api/vfd-data - Delete specific VFD data entries
router.delete('/vfd-data', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of data IDs to delete'
      });
    }

    const userDeviceId = normalizeDeviceId(req.user.deviceId);

    // Build query: users can only delete their own device data, admins can delete any
    const query = { _id: { $in: ids } };
    if (req.user.role !== 'admin') {
      query.deviceId = { $regex: `^${escapeRegex(userDeviceId)}$`, $options: 'i' };
    }

    const result = await VfdData.deleteMany(query);

    res.json({
      success: true,
      message: `${result.deletedCount} record(s) deleted successfully`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Delete VFD data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting VFD data'
    });
  }
});

// GET /api/devices - Get list of all devices
router.get('/devices', authenticateToken, async (req, res) => {
  try {
    const deviceIds = await VfdData.distinct('deviceId');
    
    res.json({
      success: true,
      count: deviceIds.length,
      devices: deviceIds
    });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching devices'
    });
  }
});

// GET /api/statistics - Admin gets system statistics
router.get('/statistics', authenticateToken, isAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDevices = await VfdData.distinct('deviceId');
    const totalDataPoints = await VfdData.countDocuments();

    res.json({
      success: true,
      statistics: {
        totalUsers,
        totalDevices: totalDevices.length,
        totalDataPoints,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// POST /api/motor-control - Send motor ON/OFF command to a device
router.post('/motor-control', authenticateToken, async (req, res) => {
  try {
    const { deviceId, command } = req.body;
    const normalizedDeviceId = normalizeDeviceId(deviceId);

    if (!normalizedDeviceId || !['MOTOR_ON', 'MOTOR_OFF'].includes(command)) {
      return res.status(400).json({
        success: false,
        message: 'Valid deviceId and command (MOTOR_ON or MOTOR_OFF) are required'
      });
    }

    // Users can only control their own device
    const userDeviceId = normalizeDeviceId(req.user.deviceId);
    if (req.user.role !== 'admin' && userDeviceId !== normalizedDeviceId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only control your own device.'
      });
    }

    // Mark any previous pending commands for this device as acknowledged
    await DeviceCommand.updateMany(
      { deviceId: normalizedDeviceId, status: 'pending' },
      { status: 'acknowledged' }
    );

    // Create new command
    const deviceCommand = new DeviceCommand({
      deviceId: normalizedDeviceId,
      command,
      issuedBy: req.user._id
    });

    await deviceCommand.save();

    res.status(201).json({
      success: true,
      message: `${command === 'MOTOR_ON' ? 'Motor ON' : 'Motor OFF'} command sent to ${normalizedDeviceId}`,
      data: deviceCommand
    });

  } catch (error) {
    console.error('Motor control error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending motor command'
    });
  }
});

// GET /api/motor-command/:deviceId - ESP32 polls for pending commands
router.get('/motor-command/:deviceId', async (req, res) => {
  try {
    const deviceId = normalizeDeviceId(req.params.deviceId);

    const pendingCommand = await DeviceCommand.findOne({
      deviceId: { $regex: `^${escapeRegex(deviceId)}$`, $options: 'i' },
      status: 'pending'
    }).sort({ createdAt: -1 });

    if (!pendingCommand) {
      return res.json({
        success: true,
        command: null,
        message: 'No pending commands'
      });
    }

    // Mark as acknowledged
    pendingCommand.status = 'acknowledged';
    await pendingCommand.save();

    res.json({
      success: true,
      command: pendingCommand.command,
      message: `Command: ${pendingCommand.command}`
    });

  } catch (error) {
    console.error('Get motor command error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching motor command'
    });
  }
});

// GET /api/motor-status/:deviceId - Get latest motor command status for a device
router.get('/motor-status/:deviceId', authenticateToken, async (req, res) => {
  try {
    const deviceId = normalizeDeviceId(req.params.deviceId);

    const latestCommand = await DeviceCommand.findOne({
      deviceId: { $regex: `^${escapeRegex(deviceId)}$`, $options: 'i' }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      motorState: latestCommand ? latestCommand.command : null,
      status: latestCommand ? latestCommand.status : null
    });

  } catch (error) {
    console.error('Get motor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching motor status'
    });
  }
});

// GET /api/all-motor-status - Admin gets motor status for all devices
router.get('/all-motor-status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const deviceIds = await VfdData.distinct('deviceId');

    const statuses = await Promise.all(
      deviceIds.map(async (deviceId) => {
        const latestCommand = await DeviceCommand.findOne({ deviceId })
          .sort({ createdAt: -1 });
        return {
          deviceId,
          motorState: latestCommand ? latestCommand.command : null,
          status: latestCommand ? latestCommand.status : null
        };
      })
    );

    res.json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('Get all motor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching all motor statuses'
    });
  }
});

module.exports = router;
