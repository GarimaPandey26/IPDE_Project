const Dependency = require('../models/Dependency');
const Component = require('../models/Component');
const User = require('../models/User');

// Create a new dependency (Admin only)
exports.createDependency = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access Denied: Only Admins can define module dependencies' });
    }

    const { sourceComponentId, dependentComponentId, impactLevel } = req.body;

    if (!sourceComponentId || !dependentComponentId || !impactLevel) {
      return res.status(400).json({ error: 'Source component, Dependent component, and Impact level are required' });
    }

    if (sourceComponentId === dependentComponentId) {
      return res.status(400).json({ error: 'A component cannot depend on itself' });
    }

    // Verify both components exist
    const sourceComp = await Component.findById(sourceComponentId);
    const depComp = await Component.findById(dependentComponentId);

    if (!sourceComp || !depComp) {
      return res.status(404).json({ error: 'One or both components not found' });
    }

    // Check if dependency already exists
    const existing = await Dependency.findOne({
      sourceComponent: sourceComponentId,
      dependentComponent: dependentComponentId
    });

    if (existing) {
      return res.status(400).json({ error: 'This dependency relationship already exists' });
    }

    const dependency = new Dependency({
      sourceComponent: sourceComponentId,
      dependentComponent: dependentComponentId,
      impactLevel
    });

    await dependency.save();
    
    // Populate before returning
    await dependency.populate('sourceComponent', 'name type category');
    await dependency.populate('dependentComponent', 'name type category');

    res.status(201).json(dependency);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all dependencies
exports.getDependencies = async (req, res) => {
  try {
    const dependencies = await Dependency.find()
      .populate('sourceComponent', 'name type category')
      .populate('dependentComponent', 'name type category')
      .sort({ createdAt: -1 });

    res.status(200).json(dependencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a dependency (Admin only)
exports.deleteDependency = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access Denied: Only Admins can delete dependencies' });
    }

    const { id } = req.params;
    const deleted = await Dependency.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    res.status(200).json({ message: 'Dependency relationship deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Analyze Transitive Changes Impact BFS Traversal
exports.getImpactAnalysis = async (req, res) => {
  try {
    const { componentId } = req.params;
    const startComp = await Component.findById(componentId);
    if (!startComp) {
      return res.status(404).json({ error: 'Source component not found' });
    }

    // Get all dependency records
    const allDependencies = await Dependency.find()
      .populate('sourceComponent', 'name type')
      .populate('dependentComponent', 'name type');

    // Build Adjacency List: Source component ID -> Array of { dependent, impactLevel }
    const adjList = {};
    allDependencies.forEach(dep => {
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

    // BFS Traversal
    const queue = [componentId.toString()];
    const visited = new Set([componentId.toString()]);
    const affected = [];

    // Track path/impact propagation for response
    // maps component ID -> { parentId, impactLevel, pathString }
    const paths = {
      [componentId.toString()]: { parentId: null, impactLevel: 'Origin', path: [startComp.name] }
    };

    while (queue.length > 0) {
      const currentId = queue.shift();
      const currentPathObj = paths[currentId];
      const neighbors = adjList[currentId] || [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push(neighbor.id);

          const newPath = [...currentPathObj.path, neighbor.name];
          paths[neighbor.id] = {
            parentId: currentId,
            impactLevel: neighbor.impactLevel,
            path: newPath
          };

          // Find manufacturer assigned to this dependent component
          const manufacturers = await User.find({
            role: 'Manufacturer',
            assignedComponent: neighbor.id
          }).select('name email');

          affected.push({
            _id: neighbor.id,
            name: neighbor.name,
            type: neighbor.type,
            impactLevel: neighbor.impactLevel,
            path: newPath.join(' ➔ '),
            manufacturers: manufacturers.map(m => ({ name: m.name, email: m.email }))
          });
        }
      }
    }

    res.status(200).json({
      origin: {
        id: startComp._id,
        name: startComp.name,
        type: startComp.type
      },
      affected
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
