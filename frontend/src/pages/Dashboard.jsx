import React, { useEffect, useState } from 'react';
import { getComponents } from '../services/api';
import CreateComponentModal from '../components/CreateComponentModal';
import ConnectComponentModal from '../components/ConnectComponentModal';

const TreeNode = ({ node, selectedNodeId, onSelectNode, expandedNodes, onToggleExpand }) => {
  const isSelected = selectedNodeId === node._id;
  const isExpanded = !!expandedNodes[node._id];
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="tree-node" style={{ userSelect: 'none' }}>
      <div 
        className={`tree-node-row ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelectNode(node)}
      >
        <div 
          className={`tree-node-arrow ${isExpanded ? 'expanded' : ''}`}
          style={{ opacity: hasChildren ? 1 : 0, pointerEvents: hasChildren ? 'auto' : 'none' }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node._id);
          }}
        >
          ▶
        </div>
        <span className="tree-node-icon">
          {node.type === 'Module' ? '📁' : node.type === 'Sub-module' ? '📂' : '⚙️'}
        </span>
        <span className="tree-node-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.name}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div className="tree-node-children">
          {node.children.map(child => (
            <TreeNode 
              key={child._id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ onNavigate, currentUser }) => {
  const [components, setComponents] = useState([]);
  const [treeRoots, setTreeRoots] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('Design Data'); // Default Tab
  const [expandedNodes, setExpandedNodes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  const engineeringCategories = [
    'RF & Microwave Components',
    'Signal Processing Components',
    'Communication Components',
    'Power Components',
    'Mechanical Components',
    'Environmental Components',
    'Cooling Components',
    'Storage Components',
    'Software Components',
    'Control Components',
    'Security Components',
    'Maintenance Components'
  ];

  const fetchComponents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getComponents();
      setComponents(data);
    } catch (err) {
      setError('Failed to fetch components. Is backend server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  // Build tree hierarchy and handle expansion/filters
  useEffect(() => {
    if (components.length === 0) return;

    // Filter components flat list first
    let filteredComps = [...components];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredComps = filteredComps.filter(c => c.name.toLowerCase().includes(query));
    }

    if (categoryFilter) {
      filteredComps = filteredComps.filter(c => c.category === categoryFilter);
    }

    // Build recursive map for rendering
    const map = {};
    const roots = [];
    const autoExpand = {};

    // Initialize map
    components.forEach(item => {
      map[item._id] = { ...item, children: [] };
    });

    // Link children to parents
    components.forEach(item => {
      const parentId = item.parent && (item.parent._id || item.parent);
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[item._id]);
      }
    });

    // Pick roots that either have no parent OR their parent is not in the list (in case parent got filtered out)
    components.forEach(item => {
      const parentId = item.parent && (item.parent._id || item.parent);
      const isRoot = !parentId || !map[parentId];
      
      // If filters are active, ensure the element itself or one of its descendants/ancestors matches
      if (isRoot) {
        roots.push(map[item._id]);
      }
    });

    // If search active, auto-expand matching node parents
    if (searchQuery.trim() || categoryFilter) {
      filteredComps.forEach(comp => {
        let currentParent = comp.parent;
        while (currentParent) {
          const pId = typeof currentParent === 'object' ? currentParent._id : currentParent;
          autoExpand[pId] = true;
          const parentObj = components.find(c => c._id === pId);
          currentParent = parentObj ? parentObj.parent : null;
        }
      });
      setExpandedNodes(prev => ({ ...prev, ...autoExpand }));
    }

    setTreeRoots(roots);
  }, [components, searchQuery, categoryFilter]);

  const handleToggleExpand = (id) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
  };

  const buildBreadcrumb = (node) => {
    let path = node.name;
    let current = node;
    while (current.parent) {
      const parentId = typeof current.parent === 'object' ? current.parent._id : current.parent;
      const parentComp = components.find(c => c._id === parentId);
      if (!parentComp) break;
      path = `${parentComp.name} ➔ ${path}`;
      current = parentComp;
    }
    return `Naval Surface Surveillance Radar ➔ ${path}`;
  };

  // Enforce Manufacturer Permission check
  const isAssignedManufacturer = selectedNode && 
    currentUser.role === 'Manufacturer' && 
    currentUser.assignedComponent && 
    (currentUser.assignedComponent._id === selectedNode._id || currentUser.assignedComponent === selectedNode._id);

  // Filter files belonging to active component & category tab
  const getTabFiles = () => {
    if (!selectedNode || !selectedNode.dataHistory) return [];
    return selectedNode.dataHistory.filter(file => file.category === activeTab);
  };

  const currentTabFiles = getTabFiles();

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h2>System MBPS Breakdown Explorer</h2>
          <p className="subtitle">Modularized Platform Breakdown Structure (MBPS) Navigator</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-layout-new">
        {/* Sidebar Navigation Tree */}
        <div className="dashboard-sidebar">
          <h3>Radar Hierarchy</h3>
          
          <input 
            type="text" 
            placeholder="🔍 Search components..." 
            className="sidebar-search-box"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select 
            className="sidebar-search-box"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">-- All Categories --</option>
            {engineeringCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {loading ? (
            <p className="text-muted">Loading tree...</p>
          ) : (
            <div className="tree-container">
              {treeRoots.map(root => (
                <TreeNode 
                  key={root._id}
                  node={root}
                  selectedNodeId={selectedNode?._id}
                  onSelectNode={handleSelectNode}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail View Panel */}
        <div className="dashboard-detail-panel">
          {!selectedNode ? (
            <div className="empty-state">
              <h3>No Element Selected</h3>
              <p>Please select a module, sub-module, or component from the Radar Hierarchy on the left to view lifecycle data and history.</p>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Node Detail Header */}
              <div className="detail-header-new">
                <div className="detail-title-block">
                  <h2>{selectedNode.name}</h2>
                  <div className="detail-subtitle-row">
                    <span><strong>Type:</strong> {selectedNode.type}</span>
                    <span><strong>Classification:</strong> <span className="text-highlight">{selectedNode.category}</span></span>
                  </div>
                  <p className="subtitle" style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                    {buildBreadcrumb(selectedNode)}
                  </p>
                </div>

                <div className="detail-action-block">
                  {isAssignedManufacturer ? (
                    <>
                      <button className="btn btn-secondary" onClick={() => setIsConnectOpen(true)}>
                        Link Component
                      </button>
                      <button className="btn btn-primary" onClick={() => onNavigate('upload', selectedNode._id)}>
                        Upload Version
                      </button>
                    </>
                  ) : (
                    <span className="read-only-badge">
                      🔒 Read-Only View
                    </span>
                  )}
                </div>
              </div>

              {/* Warnings / Permissions Info */}
              {!isAssignedManufacturer && currentUser.role === 'Manufacturer' && (
                <div className="alert" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', fontSize: '0.85rem', margin: 0 }}>
                  🛡️ You are registered as the manufacturer for <strong>{currentUser.assignedComponent?.name || 'Unassigned'}</strong>. You have view-only access to this module.
                </div>
              )}

              {/* Standardized Data Tabs */}
              <div className="category-tabs-container">
                {['Design Data', 'Procurement Data', 'Production Data', 'Performance Data'].map(tab => (
                  <button 
                    key={tab} 
                    className={`category-tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Files in Category View */}
              <div className="tab-content-panel">
                {currentTabFiles.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem' }}>
                    <p style={{ margin: 0 }}>No records found under the <strong>{activeTab}</strong> category for this node.</p>
                    {isAssignedManufacturer && (
                      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onNavigate('upload', selectedNode._id)}>
                        Upload First Version
                      </button>
                    )}
                  </div>
                ) : (
                  currentTabFiles.map(file => {
                    const downloadUrl = `/api/components/download/${file._id}`;
                    return (
                      <div key={file._id} className="file-row-card">
                        <div className="file-info-main">
                          <div className="file-header-new">
                            <span className="version-pill">{file.version}</span>
                            <span className="file-name-new">{file.fileName}</span>
                          </div>
                          <p className="file-desc-new">{file.changeDescription}</p>
                          <div className="file-meta-row">
                            <span>Uploaded by: <strong className="file-meta-author">{file.uploadedBy?.name || 'System'}</strong></span>
                            <span>Date: {new Date(file.uploadedAt).toLocaleString()}</span>
                            <span>Size: {(file.fileSize / 1024).toFixed(2)} KB</span>
                          </div>
                        </div>
                        <div className="file-actions-new">
                          <a 
                            href={downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-download"
                          >
                            📥 Download
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* History Button for selected component */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <button className="btn btn-secondary" onClick={() => onNavigate('history', selectedNode._id)}>
                  🕒 View Comprehensive Version Tree Lineage
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      <CreateComponentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onComponentCreated={fetchComponents}
        defaultParentId={selectedNode?._id}
      />
      <ConnectComponentModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        components={components}
        onComponentsConnected={fetchComponents}
      />
    </div>
  );
};

export default Dashboard;
