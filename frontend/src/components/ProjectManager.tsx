import React, { useState, useEffect } from "react";
import { toast } from "./Toast";

interface Project {
  id: string;
  name: string;
  description: string;
  thumbnails: string[];
  createdAt: string;
  updatedAt: string;
  status: "active" | "completed" | "archived";
  tags: string[];
}

interface ProjectManagerProps {
  onProjectSelect: (project: Project) => void;
  currentImages: string[];
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  onProjectSelect,
  currentImages
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    tags: ""
  });
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "archived">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    // Load from localStorage for now (could be API call)
    const savedProjects = localStorage.getItem("thumbnail_projects");
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  };

  const saveProjects = (updatedProjects: Project[]) => {
    localStorage.setItem("thumbnail_projects", JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  const createProject = () => {
    if (!newProject.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    const project: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      thumbnails: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      tags: newProject.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
    };

    const updatedProjects = [project, ...projects];
    saveProjects(updatedProjects);
    
    setNewProject({ name: "", description: "", tags: "" });
    setShowCreateModal(false);
    toast.success("Project created successfully!");
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    const updatedProjects = projects.map(project =>
      project.id === projectId
        ? { ...project, ...updates, updatedAt: new Date().toISOString() }
        : project
    );
    saveProjects(updatedProjects);
  };

  const deleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      const updatedProjects = projects.filter(project => project.id !== projectId);
      saveProjects(updatedProjects);
      toast.success("Project deleted successfully!");
    }
  };

  const addThumbnailsToProject = (projectId: string) => {
    if (currentImages.length === 0) {
      toast.error("No images to add to project");
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newThumbnails = currentImages.filter(img => !project.thumbnails.includes(img));
    if (newThumbnails.length === 0) {
      toast.info("All current images are already in this project");
      return;
    }

    updateProject(projectId, {
      thumbnails: [...project.thumbnails, ...newThumbnails]
    });
    
    toast.success(`Added ${newThumbnails.length} thumbnails to ${project.name}`);
  };

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === "all" || project.status === filter;
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Project Manager
        </h2>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Project</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex space-x-2">
          {["all", "active", "completed", "archived"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-white truncate">{project.name}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{project.description}</p>
              </div>
              
              <div className="flex items-center space-x-2 ml-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                
                <div className="relative">
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
              <span>{project.thumbnails.length} thumbnails</span>
              <span>{formatDate(project.updatedAt)}</span>
            </div>

            {/* Tags */}
            {project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {project.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-slate-600 text-xs text-gray-300 rounded">
                    {tag}
                  </span>
                ))}
                {project.tags.length > 3 && (
                  <span className="px-2 py-1 bg-slate-600 text-xs text-gray-300 rounded">
                    +{project.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => onProjectSelect(project)}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              >
                Open
              </button>
              
              <button
                onClick={() => addThumbnailsToProject(project.id)}
                disabled={currentImages.length === 0}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                title="Add current images to project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              <button
                onClick={() => deleteProject(project.id)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                title="Delete project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-400">
            {searchTerm ? "No projects match your search" : "No projects yet. Create your first project!"}
          </p>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-700 p-6">
              <h3 className="text-xl font-semibold text-white">Create New Project</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe your project..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <input
                  type="text"
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                  placeholder="gaming, tutorial, review (comma separated)"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="border-t border-slate-700 p-6 flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;