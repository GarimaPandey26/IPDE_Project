const Component = require('../models/Component');
const Data = require('../models/Data');
const Dependency = require('../models/Dependency');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create a new Component
exports.createComponent = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access Denied: Only Admins can add components to the system hierarchy' });
    }

    const { name, type, category, parentId } = req.body;

    if (!name || !type || !category) {
      return res.status(400).json({ error: 'Name, Type, and Category are required' });
    }

    if (!['Module', 'Sub-module', 'Component'].includes(type)) {
      return res.status(400).json({ error: 'Invalid component type' });
    }

    const existingComponent = await Component.findOne({ name });
    if (existingComponent) {
      return res.status(400).json({ error: 'A component with this name already exists' });
    }

    let parent = null;
    if (parentId) {
      const parentComponent = await Component.findById(parentId);
      if (!parentComponent) {
        return res.status(404).json({ error: 'Parent component not found' });
      }
      parent = parentComponent._id;
    }

    const component = new Component({ name, type, category, parent });
    await component.save();

    res.status(201).json(component);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Retrieve all Components with their connections, parent relationships, and full data history
exports.getComponents = async (req, res) => {
  try {
    const components = await Component.find()
      .populate('parent', 'name type')
      .populate('connectedComponents', 'name type')
      .populate({
        path: 'dataHistory',
        options: { sort: { versionNumber: -1 } },
        populate: {
          path: 'uploadedBy',
          select: 'name email role'
        }
      });

    res.status(200).json(components);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Connect two components (Bidirectional connection)
exports.connectComponents = async (req, res) => {
  try {
    const { componentIdA, componentIdB } = req.body;

    if (!componentIdA || !componentIdB) {
      return res.status(400).json({ error: 'Both componentIdA and componentIdB are required' });
    }

    if (componentIdA === componentIdB) {
      return res.status(400).json({ error: 'Cannot connect a component to itself' });
    }

    // Role-based authorization: Only Admin OR assigned manufacturer of either A or B can create connections
    const isAdmin = req.user.role === 'Admin';
    const isAssignedToA = req.user.role === 'Manufacturer' && req.user.assignedComponent?.toString() === componentIdA;
    const isAssignedToB = req.user.role === 'Manufacturer' && req.user.assignedComponent?.toString() === componentIdB;
    
    if (!isAdmin && (!isAssignedToA && !isAssignedToB)) {
      return res.status(403).json({ error: 'Only Admins or the assigned manufacturer of these components can modify connections' });
    }

    const compA = await Component.findById(componentIdA);
    const compB = await Component.findById(componentIdB);

    if (!compA || !compB) {
      return res.status(404).json({ error: 'One or both components not found' });
    }

    // Add B to A's connections if not already connected
    if (!compA.connectedComponents.includes(componentIdB)) {
      compA.connectedComponents.push(componentIdB);
      await compA.save();
    }

    // Add A to B's connections if not already connected
    if (!compB.connectedComponents.includes(componentIdA)) {
      compB.connectedComponents.push(componentIdA);
      await compB.save();
    }

    res.status(200).json({
      message: 'Components connected successfully',
      compA: { id: compA._id, name: compA.name, connections: compA.connectedComponents },
      compB: { id: compB._id, name: compB.name, connections: compB.connectedComponents }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload file for a component (handles version control + category-specific history + RBAC)
exports.uploadFile = async (req, res) => {
  try {
    const { id } = req.params; // Component ID
    const { category, changeDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!category) {
      return res.status(400).json({ error: 'Standardized data category is required' });
    }

    const allowedCategories = ['Design Data', 'Procurement Data', 'Production Data', 'Performance Data'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid standardized data category' });
    }

    // Admin or Manufacturer Access Control
    const isAdmin = req.user.role === 'Admin';
    const isManufacturer = req.user.role === 'Manufacturer';
    const isAssigned = req.user.assignedComponent && (req.user.assignedComponent._id?.toString() === id || req.user.assignedComponent.toString() === id);

    if (!isAdmin && (!isManufacturer || !isAssigned)) {
      return res.status(403).json({ 
        error: `Upload denied: You must be an Admin or the assigned manufacturer of this component ("${req.user.assignedComponent?.name || 'none'}") to upload files`
      });
    }

    const component = await Component.findById(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Find latest version of data for this component in this specific category
    const latestData = await Data.findOne({ componentId: id, category }).sort({ versionNumber: -1 });

    let nextVersionNumber = 1;
    let previousVersionId = null;

    if (latestData) {
      nextVersionNumber = latestData.versionNumber + 1;
      previousVersionId = latestData._id;
    }

    const versionStr = `v${nextVersionNumber}`;

    // Create the Data record
    const newData = new Data({
      componentId: id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      category,
      uploadedBy: req.user._id,
      changeDescription: changeDescription || `Initial release of ${category}`,
      versionNumber: nextVersionNumber,
      version: versionStr,
      previousVersion: previousVersionId
    });

    await newData.save();

    // Push into Component's dataHistory array and reset status to Active
    component.status = 'Active';
    component.dataHistory.push(newData._id);
    await component.save();

    // Determine affected components and generate notifications if category is Design Data
    let affectedComponents = [];
    if (category === 'Design Data') {
      affectedComponents = await handleDesignChangeNotifications(id, component.name, versionStr);
    } else {
      // Fallback to connected components BFS for other types of data if needed
      affectedComponents = await getAffectedComponents(id);
    }

    // Populate creator detail on return
    await newData.populate('uploadedBy', 'name email role');

    res.status(201).json({
      message: 'File uploaded successfully',
      data: newData,
      affectedComponents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get version history chain of a component
exports.getVersionHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const component = await Component.findById(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Get all version records for this component (populated with uploader & previous version)
    const history = await Data.find({ componentId: id })
      .sort({ versionNumber: -1 })
      .populate('uploadedBy', 'name email role')
      .populate('previousVersion', 'version fileName category');

    res.status(200).json({
      component: { id: component._id, name: component.name, type: component.type, category: component.category },
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download file by data record ID
exports.downloadFile = async (req, res) => {
  try {
    const data = await Data.findById(req.params.dataId);
    if (!data) {
      return res.status(404).json({ error: 'File record not found' });
    }
    const path = require('path');
    const absolutePath = path.resolve(data.filePath);
    res.download(absolutePath, data.fileName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function: BFS to find all transitively affected components in the connections graph
async function getAffectedComponents(startComponentId) {
  const visited = new Set();
  const queue = [startComponentId.toString()];
  visited.add(startComponentId.toString());

  const affected = [];

  while (queue.length > 0) {
    const currentId = queue.shift();

    const comp = await Component.findById(currentId).populate('connectedComponents');
    if (!comp) continue;

    for (const neighbor of comp.connectedComponents) {
      const neighborIdStr = neighbor._id.toString();
      if (!visited.has(neighborIdStr)) {
        visited.add(neighborIdStr);
        queue.push(neighborIdStr);
        affected.push({
          _id: neighbor._id,
          name: neighbor.name,
          type: neighbor.type
        });
      }
    }
  }

  return affected;
}

// Helper function: BFS to find affected components in the new Dependency table and generate notifications
async function handleDesignChangeNotifications(sourceComponentId, sourceComponentName, versionStr) {
  // BFS to find all affected dependent components
  const allDeps = await Dependency.find()
    .populate('sourceComponent', 'name type')
    .populate('dependentComponent', 'name type');

  const adjList = {};
  allDeps.forEach(dep => {
    if (!dep.sourceComponent || !dep.dependentComponent) return;
    const srcId = dep.sourceComponent._id.toString();
    if (!adjList[srcId]) {
      adjList[srcId] = [];
    }
    adjList[srcId].push({
      id: dep.dependentComponent._id.toString(),
      name: dep.dependentComponent.name,
      type: dep.dependentComponent.type,
      impactLevel: dep.impactLevel
    });
  });

  const queue = [sourceComponentId.toString()];
  const visited = new Set([sourceComponentId.toString()]);
  const affected = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const neighbors = adjList[currentId] || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        queue.push(neighbor.id);
        
        affected.push({
          _id: neighbor.id,
          name: neighbor.name,
          type: neighbor.type,
          impactLevel: neighbor.impactLevel
        });

        // 1. Find manufacturers assigned to this component
        const manufacturers = await User.find({
          role: 'Manufacturer',
          assignedComponent: neighbor.id
        });

        const message = `${neighbor.name} may be affected due to changes in ${sourceComponentName} Design (${versionStr}). Please review and update your component.`;

        if (manufacturers.length > 0) {
          for (const mfg of manufacturers) {
            const notif = new Notification({
              sourceComponent: sourceComponentId,
              affectedComponent: neighbor.id,
              uploadedVersion: versionStr,
              message,
              status: 'Unread',
              recipient: mfg._id
            });
            await notif.save();
          }
        } else {
          // Store system-wide notification with recipient null so admins/viewers see it
          const notif = new Notification({
            sourceComponent: sourceComponentId,
            affectedComponent: neighbor.id,
            uploadedVersion: versionStr,
            message,
            status: 'Unread',
            recipient: null
          });
          await notif.save();
        }

        // Mark the affected component as "Review Required"
        await Component.findByIdAndUpdate(neighbor.id, { status: 'Review Required' });
      }
    }
  }

  return affected;
}

