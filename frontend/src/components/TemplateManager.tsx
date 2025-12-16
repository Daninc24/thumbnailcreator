import React, { useState, useEffect } from "react";
import type { ThumbnailTemplate, CustomizableTemplate } from "../types/templates";
import axiosInstance from "../api/axiosInstance";
import { toast } from "./Toast";

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: ThumbnailTemplate) => void;
  onTemplateEdit: (template: ThumbnailTemplate) => void;
}

interface SavedTemplate extends CustomizableTemplate {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  downloads: number;
  rating: number;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
  onTemplateEdit
}) => {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"my-templates" | "public" | "create">("my-templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, activeTab]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "my-templates" 
        ? "/templates/my-templates" 
        : "/templates/public";
      
      const response = await axiosInstance.get(endpoint, {
        params: {
          search: searchQuery,
          category: selectedCategory !== "all" ? selectedCategory : undefined
        }
      });
      
      setTemplates(response.data.templates || []);
    } catch (error: any) {
      console.error("Failed to fetch templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await axiosInstance.delete(`/templates/${templateId}`);
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error: any) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    }
  };

  const duplicateTemplate = async (template: SavedTemplate) => {
    try {
      const response = await axiosInstance.post("/templates/duplicate", {
        templateId: template._id,
        name: `${template.name} - Copy`
      });
      
      toast.success("Template duplicated successfully");
      fetchTemplates();
    } catch (error: any) {
      console.error("Failed to duplicate template:", error);
      toast.error("Failed to duplicate template");
    }
  };

  const togglePublic = async (templateId: string, isPublic: boolean) => {
    try {
      await axiosInstance.patch(`/templates/${templateId}`, {
        isPublic: !isPublic
      });
      
      toast.success(`Template ${!isPublic ? "published" : "unpublished"} successfully`);
      fetchTemplates();
    } catch (error: any) {
      console.error("Failed to update template:", error);
      toast.error("Failed to update template");
    }
  };

  const categories = [
    "all", "gaming", "vlog", "education", "business", 
    "entertainment", "tech", "fitness", "food"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Template Manager
            </h2>
            <p className="text-gray-400 mt-1">Manage your custom thumbnail templates</p>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800 border-b border-slate-700 px-6">
          <div className="flex space-x-1">
            {[
              { id: "my-templates", name: "My Templates", icon: "📁" },
              { id: "public", name: "Public Gallery", icon: "🌐" },
              { id: "create", name: "Create New", icon: "➕" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center space-x-2 border-b-2 ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        {(activeTab === "my-templates" || activeTab === "public") && (
          <div className="bg-slate-800 border-b border-slate-700 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              
              <button
                onClick={fetchTemplates}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "create" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-slate-800 rounded-xl p-8 text-center">
                <svg className="w-16 h-16 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">Create New Template</h3>
                <p className="text-gray-400 mb-6">
                  Start with a base template and customize it using the advanced editor
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      // Create blank template
                      const blankTemplate: ThumbnailTemplate = {
                        id: `blank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: "Blank Template",
                        category: "custom",
                        difficulty: "beginner",
                        textConfig: {
                          fontSize: 72,
                          fontFamily: "Arial",
                          color: "#FFFFFF",
                          strokeColor: "#000000",
                          strokeWidth: 2,
                          position: "center",
                          alignment: "center"
                        },
                        backgroundEffects: {},
                        decorativeElements: {}
                      };
                      onTemplateEdit(blankTemplate);
                      onClose();
                    }}
                    className="p-6 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                  >
                    <div className="text-2xl mb-2">🎨</div>
                    <h4 className="font-semibold text-white mb-1">Blank Canvas</h4>
                    <p className="text-sm text-gray-400">Start from scratch with a blank template</p>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Import existing template
                      toast.info("Select a base template from the gallery first");
                      setActiveTab("public");
                    }}
                    className="p-6 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                  >
                    <div className="text-2xl mb-2">📋</div>
                    <h4 className="font-semibold text-white mb-1">From Template</h4>
                    <p className="text-sm text-gray-400">Customize an existing template</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {(activeTab === "my-templates" || activeTab === "public") && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-gray-400">Loading templates...</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Templates Found</h3>
                  <p className="text-gray-400 mb-4">
                    {activeTab === "my-templates" 
                      ? "You haven't created any custom templates yet."
                      : "No public templates match your search criteria."
                    }
                  </p>
                  {activeTab === "my-templates" && (
                    <button
                      onClick={() => setActiveTab("create")}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Create Your First Template
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(template => (
                    <div key={template._id} className="bg-slate-800 rounded-xl overflow-hidden shadow-lg">
                      {/* Template Preview */}
                      <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 p-4 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-2xl font-bold mb-1">{template.name}</div>
                          <div className="text-sm opacity-75">{template.category}</div>
                        </div>
                      </div>
                      
                      {/* Template Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white">{template.name}</h3>
                            <p className="text-sm text-gray-400 capitalize">{template.category}</p>
                          </div>
                          {activeTab === "my-templates" && (
                            <div className="flex items-center space-x-1">
                              {template.isPublic && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Public</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {activeTab === "public" && (
                          <div className="flex items-center space-x-4 text-xs text-gray-400 mb-3">
                            <span>⭐ {template.rating.toFixed(1)}</span>
                            <span>📥 {template.downloads}</span>
                            <span>📅 {new Date(template.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              onTemplateSelect(template);
                              onClose();
                            }}
                            className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                          >
                            Use Template
                          </button>
                          
                          {activeTab === "my-templates" ? (
                            <>
                              <button
                                onClick={() => {
                                  onTemplateEdit(template);
                                  onClose();
                                }}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              
                              <button
                                onClick={() => duplicateTemplate(template)}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                                title="Duplicate"
                              >
                                📋
                              </button>
                              
                              <button
                                onClick={() => togglePublic(template._id, template.isPublic)}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                                title={template.isPublic ? "Make Private" : "Make Public"}
                              >
                                {template.isPublic ? "🔓" : "🔒"}
                              </button>
                              
                              <button
                                onClick={() => deleteTemplate(template._id)}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => duplicateTemplate(template)}
                              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                              title="Save to My Templates"
                            >
                              💾
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;