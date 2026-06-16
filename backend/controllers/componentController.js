const Component = require('../models/Component');
const Data = require('../models/Data');

// Create a new Component
exports.createComponent = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and Type are required' });
    }

    const existingComponent = await Component.findOne({ name });
    if (existingComponent) {
      return res.status(400).json({ error: 'A component with this name already exists' });
    }

    const component = new Component({ name, type });
    await component.save();

    res.status(201).json(component);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Retrieve all Components with their connections and latest data version
exports.getComponents = async (req, res) => {
  try {
    const components = await Component.find()
      .populate('connectedComponents', 'name type')
      .populate({
        path: 'dataHistory',
        options: { sort: { versionNumber: -1 } } // Sort history descending
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

// Upload file for a component (handles version control + affected components traversal)
exports.uploadFile = async (req, res) => {
  try {
    const { id } = req.params; // Component ID
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const component = await Component.findById(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    // Find latest version of data for this component
    const latestData = await Data.findOne({ componentId: id }).sort({ versionNumber: -1 });

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
      versionNumber: nextVersionNumber,
      version: versionStr,
      previousVersion: previousVersionId
    });

    await newData.save();

    // Push into Component's dataHistory array
    component.dataHistory.push(newData._id);
    await component.save();

    // BFS graph traversal to find affected components
    const affectedComponents = await getAffectedComponents(id);

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

    // Get all version records for this component
    const history = await Data.find({ componentId: id })
      .sort({ versionNumber: -1 })
      .populate('previousVersion', 'version fileName');

    res.status(200).json({
      component: { id: component._id, name: component.name, type: component.type },
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
