import React, { useState, useEffect, useCallback } from "react";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from "@/components/Base/Headless";
import LoadingIcon from "@/components/Base/LoadingIcon";

interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  example?: any;
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

interface MessageTemplate {
  id: string;
  name: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: TemplateComponent[];
  syncedAt?: string;
}

interface ConnectionInfo {
  connectionType: string;
  status: string;
  displayPhoneNumber?: string;
  requiresTemplates: boolean;
}

interface TemplateButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
  text: string;
  url?: string;
  phone_number?: string;
}

interface CreateTemplateForm {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerType: 'none' | 'text';
  headerText: string;
  bodyText: string;
  bodyExamples: string[];
  footerText: string;
  buttons: TemplateButton[];
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'en_US', name: 'English (US)' },
  { code: 'en_GB', name: 'English (UK)' },
  { code: 'ms', name: 'Malay' },
  { code: 'zh_CN', name: 'Chinese (Simplified)' },
  { code: 'zh_TW', name: 'Chinese (Traditional)' },
  { code: 'id', name: 'Indonesian' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt_BR', name: 'Portuguese (Brazil)' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

const MessageTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [phoneIndex, setPhoneIndex] = useState<number>(0);
  
  // Create template modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTemplateForm>({
    name: '',
    category: 'UTILITY',
    language: 'en',
    headerType: 'none',
    headerText: '',
    bodyText: '',
    bodyExamples: [],
    footerText: '',
    buttons: []
  });

  const baseUrl = 'https://bisnesgpt.jutateknologi.com';

  // Fetch user/company data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (!userEmail) return;

        const response = await fetch(
          `${baseUrl}/api/user-data?email=${encodeURIComponent(userEmail)}`,
          { credentials: "include" }
        );
        
        if (response.ok) {
          const userData = await response.json();
          setCompanyId(userData.company_id);
          setPhoneIndex(userData.phone || 0);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Fetch connection info and templates when companyId is available
  useEffect(() => {
    if (companyId) {
      fetchConnectionInfo();
      fetchTemplates();
    }
  }, [companyId, phoneIndex]);

  const fetchConnectionInfo = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/api/templates/connection-type/${companyId}?phoneIndex=${phoneIndex}`,
        { credentials: "include" }
      );
      
      if (response.ok) {
        const data = await response.json();
        setConnectionInfo(data);
      }
    } catch (error) {
      console.error("Error fetching connection info:", error);
    }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/api/templates/${companyId}?phoneIndex=${phoneIndex}`,
        { credentials: "include" }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to fetch templates");
    } finally {
      setIsLoading(false);
    }
  };

  const syncTemplates = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${baseUrl}/api/templates/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ companyId, phoneIndex })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Synced ${data.synced} templates from Meta`);
        fetchTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to sync templates');
      }
    } catch (error) {
      console.error("Error syncing templates:", error);
      toast.error("Failed to sync templates from Meta");
    } finally {
      setIsSyncing(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      category: 'UTILITY',
      language: 'en',
      headerType: 'none',
      headerText: '',
      bodyText: '',
      bodyExamples: [],
      footerText: '',
      buttons: []
    });
  };

  const countVariables = (text: string): number => {
    const matches = text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.length : 0;
  };

  const handleBodyTextChange = (text: string) => {
    const varCount = countVariables(text);
    const newExamples = [...createForm.bodyExamples];
    
    // Adjust examples array size
    while (newExamples.length < varCount) {
      newExamples.push('');
    }
    while (newExamples.length > varCount) {
      newExamples.pop();
    }
    
    setCreateForm({ ...createForm, bodyText: text, bodyExamples: newExamples });
  };

  const handleAddButton = () => {
    if (createForm.buttons.length >= 3) {
      toast.warning('Maximum 3 buttons allowed');
      return;
    }
    setCreateForm({
      ...createForm,
      buttons: [...createForm.buttons, { type: 'QUICK_REPLY', text: '' }]
    });
  };

  const handleRemoveButton = (index: number) => {
    const newButtons = createForm.buttons.filter((_, i) => i !== index);
    setCreateForm({ ...createForm, buttons: newButtons });
  };

  const handleButtonChange = (index: number, field: keyof TemplateButton, value: string) => {
    const newButtons = [...createForm.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setCreateForm({ ...createForm, buttons: newButtons });
  };

  const createTemplate = async () => {
    if (!createForm.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!createForm.bodyText.trim()) {
      toast.error('Body text is required');
      return;
    }

    // Validate variable examples
    const varCount = countVariables(createForm.bodyText);
    if (varCount > 0 && createForm.bodyExamples.some(ex => !ex.trim())) {
      toast.error('Please provide example values for all variables');
      return;
    }

    setIsCreating(true);
    try {
      const payload: any = {
        companyId,
        phoneIndex,
        name: createForm.name,
        category: createForm.category,
        language: createForm.language,
        body: {
          text: createForm.bodyText,
          examples: varCount > 0 ? createForm.bodyExamples : undefined
        }
      };

      if (createForm.headerType === 'text' && createForm.headerText.trim()) {
        payload.header = {
          format: 'TEXT',
          text: createForm.headerText
        };
      }

      if (createForm.footerText.trim()) {
        payload.footer = {
          text: createForm.footerText
        };
      }

      if (createForm.buttons.length > 0) {
        payload.buttons = createForm.buttons.filter(btn => btn.text.trim());
      }

      const response = await fetch(`${baseUrl}/api/templates/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Template created successfully! It will be reviewed by Meta.');
        setShowCreateModal(false);
        resetCreateForm();
        fetchTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create template');
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTemplate = async (templateName: string) => {
    if (!confirm(`Are you sure you want to delete template "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `${baseUrl}/api/templates/${companyId}/${templateName}?phoneIndex=${phoneIndex}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Approved</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Pending</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'MARKETING':
        return <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full">Marketing</span>;
      case 'UTILITY':
        return <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">Utility</span>;
      case 'AUTHENTICATION':
        return <span className="px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">Authentication</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">{category}</span>;
    }
  };

  const getTemplatePreview = (template: MessageTemplate): string => {
    if (!template.components) return '';
    
    const parts: string[] = [];
    
    for (const comp of template.components) {
      if (comp.type === 'HEADER' && comp.text) {
        parts.push(comp.text);
      }
      if (comp.type === 'BODY' && comp.text) {
        parts.push(comp.text);
      }
      if (comp.type === 'FOOTER' && comp.text) {
        parts.push(`[${comp.text}]`);
      }
    }
    
    return parts.join('\n\n');
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getTemplatePreview(template).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (!connectionInfo?.requiresTemplates) {
    return (
      <div className="p-5">
        <ToastContainer />
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow">
          <Lucide icon="Info" className="w-16 h-16 text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Templates Not Required</h2>
          <p className="text-gray-600 text-center max-w-md">
            Your WhatsApp connection is using the unofficial API (QR code method). 
            Message templates are only required for the Official WhatsApp Business API.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Current connection: <span className="font-medium">{connectionInfo?.connectionType || 'wwebjs'}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <ToastContainer />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Message Templates</h2>
          <p className="text-gray-600 mt-1">
            Manage your WhatsApp Business API message templates
          </p>
          {connectionInfo && (
            <p className="text-sm text-gray-500 mt-1">
              Connected via: <span className="font-medium">{connectionInfo.connectionType}</span>
              {connectionInfo.displayPhoneNumber && ` • ${connectionInfo.displayPhoneNumber}`}
            </p>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline-secondary"
            onClick={fetchTemplates}
            disabled={isLoading}
          >
            <Lucide icon="RefreshCw" className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline-secondary"
            onClick={syncTemplates}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <LoadingIcon icon="oval" color="white" className="w-4 h-4 mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <Lucide icon="Download" className="w-4 h-4 mr-2" />
                Sync from Meta
              </>
            )}
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Lucide icon="Plus" className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Lucide icon="Info" className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-800">24-Hour Messaging Window</h3>
            <p className="text-sm text-blue-700 mt-1">
              When using the Official WhatsApp API, you can only send free-form messages within 24 hours of receiving a message from a customer. 
              After 24 hours, you must use an approved message template to re-engage the conversation.
            </p>
            <p className="text-sm text-blue-700 mt-1">
              You can create templates directly from this page. Templates will be submitted to Meta for approval.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Lucide icon="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="MARKETING">Marketing</option>
          <option value="UTILITY">Utility</option>
          <option value="AUTHENTICATION">Authentication</option>
        </select>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Templates</p>
          <p className="text-2xl font-bold text-gray-800">{templates.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {templates.filter(t => t.status === 'APPROVED').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {templates.filter(t => t.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">
            {templates.filter(t => t.status === 'REJECTED').length}
          </p>
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingIcon icon="oval" className="w-8 h-8" />
          <span className="ml-2 text-gray-600">Loading templates...</span>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Lucide icon="FileText" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">No templates found</h3>
          <p className="text-gray-500 mt-1">
            {templates.length === 0 
              ? "Click 'Sync from Meta' to fetch your templates"
              : "No templates match your current filters"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div 
              key={template.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedTemplate(template);
                setShowPreviewModal(true);
              }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{template.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Language: {template.language}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {getStatusBadge(template.status)}
                    {getCategoryBadge(template.category)}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 mt-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                    {getTemplatePreview(template) || 'No preview available'}
                  </p>
                </div>

                {/* Buttons preview */}
                {template.components?.some(c => c.type === 'BUTTONS') && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.components
                      .filter(c => c.type === 'BUTTONS')
                      .flatMap(c => c.buttons || [])
                      .map((btn, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {btn.text}
                        </span>
                      ))
                    }
                  </div>
                )}

                {/* Delete button */}
                <div className="mt-3 pt-3 border-t flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTemplate(template.name);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center"
                  >
                    <Lucide icon="Trash2" className="w-3 h-3 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog
        open={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedTemplate(null);
        }}
      >
        <Dialog.Panel className="max-w-2xl">
          <Dialog.Title>
            <div className="flex items-center justify-between">
              <span>Template Preview</span>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Lucide icon="X" className="w-5 h-5" />
              </button>
            </div>
          </Dialog.Title>
          
          {selectedTemplate && (
            <Dialog.Description className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTemplate.status)}
                    {getCategoryBadge(selectedTemplate.category)}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  Language: {selectedTemplate.language}
                </div>

                {/* Template Preview Card (WhatsApp style) */}
                <div className="bg-[#e5ddd5] rounded-lg p-4">
                  <div className="bg-white rounded-lg shadow max-w-sm mx-auto">
                    {selectedTemplate.components?.map((comp, idx) => (
                      <div key={idx}>
                        {comp.type === 'HEADER' && comp.text && (
                          <div className="px-4 pt-3 font-semibold text-gray-800">
                            {comp.text}
                          </div>
                        )}
                        {comp.type === 'HEADER' && comp.format === 'IMAGE' && (
                          <div className="bg-gray-200 h-32 flex items-center justify-center">
                            <Lucide icon="Image" className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        {comp.type === 'BODY' && comp.text && (
                          <div className="px-4 py-2 text-gray-700 whitespace-pre-wrap">
                            {comp.text}
                          </div>
                        )}
                        {comp.type === 'FOOTER' && comp.text && (
                          <div className="px-4 pb-2 text-xs text-gray-500">
                            {comp.text}
                          </div>
                        )}
                        {comp.type === 'BUTTONS' && comp.buttons && (
                          <div className="border-t">
                            {comp.buttons.map((btn, btnIdx) => (
                              <button
                                key={btnIdx}
                                className="w-full py-2 text-center text-blue-500 hover:bg-gray-50 border-t first:border-t-0"
                              >
                                {btn.type === 'URL' && <Lucide icon="ExternalLink" className="w-4 h-4 inline mr-1" />}
                                {btn.type === 'PHONE_NUMBER' && <Lucide icon="Phone" className="w-4 h-4 inline mr-1" />}
                                {btn.text}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variables info */}
                {selectedTemplate.components?.some(c => c.text?.includes('{{')) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <Lucide icon="AlertCircle" className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">This template has variables</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Variables like {'{{1}}'}, {'{{2}}'} will need to be filled in when sending the message.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Dialog.Description>
          )}
        </Dialog.Panel>
      </Dialog>

      {/* Create Template Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
      >
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
              <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <span>Create Message Template</span>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Lucide icon="X" className="w-5 h-5" />
                </button>
              </Dialog.Title>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="my_template_name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lowercase letters, numbers, and underscores only. Spaces will be converted to underscores.
                  </p>
                </div>

                {/* Category & Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="UTILITY">Utility</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="AUTHENTICATION">Authentication</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={createForm.language}
                      onChange={(e) => setCreateForm({ ...createForm, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Header */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Header (Optional)</label>
                  <select
                    value={createForm.headerType}
                    onChange={(e) => setCreateForm({ ...createForm, headerType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-2"
                  >
                    <option value="none">No Header</option>
                    <option value="text">Text Header</option>
                  </select>
                  {createForm.headerType === 'text' && (
                    <input
                      type="text"
                      value={createForm.headerText}
                      onChange={(e) => setCreateForm({ ...createForm, headerText: e.target.value })}
                      placeholder="Header text"
                      maxLength={60}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  )}
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={createForm.bodyText}
                    onChange={(e) => handleBodyTextChange(e.target.value)}
                    placeholder="Hello {{1}}, your order {{2}} has been shipped!"
                    rows={4}
                    maxLength={1024}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {'{{1}}'}, {'{{2}}'}, etc. for variables. Max 1024 characters.
                  </p>
                </div>

                {/* Variable Examples */}
                {createForm.bodyExamples.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Example values for variables <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {createForm.bodyExamples.map((example, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 w-16">{`{{${idx + 1}}}`}:</span>
                          <input
                            type="text"
                            value={example}
                            onChange={(e) => {
                              const newExamples = [...createForm.bodyExamples];
                              newExamples[idx] = e.target.value;
                              setCreateForm({ ...createForm, bodyExamples: newExamples });
                            }}
                            placeholder={`Example for variable ${idx + 1}`}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Meta requires example values to understand how variables will be used.
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Footer (Optional)</label>
                  <input
                    type="text"
                    value={createForm.footerText}
                    onChange={(e) => setCreateForm({ ...createForm, footerText: e.target.value })}
                    placeholder="Footer text (e.g., Reply STOP to unsubscribe)"
                    maxLength={60}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Buttons (Optional)</label>
                    <button
                      type="button"
                      onClick={handleAddButton}
                      className="text-sm text-primary hover:text-primary-dark flex items-center"
                    >
                      <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                      Add Button
                    </button>
                  </div>
                  
                  {createForm.buttons.length > 0 && (
                    <div className="space-y-3">
                      {createForm.buttons.map((btn, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Button {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveButton(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Lucide icon="Trash2" className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <select
                              value={btn.type}
                              onChange={(e) => handleButtonChange(idx, 'type', e.target.value)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            >
                              <option value="QUICK_REPLY">Quick Reply</option>
                              <option value="URL">URL</option>
                              <option value="PHONE_NUMBER">Phone Number</option>
                            </select>
                            <input
                              type="text"
                              value={btn.text}
                              onChange={(e) => handleButtonChange(idx, 'text', e.target.value)}
                              placeholder="Button text"
                              maxLength={25}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                          
                          {btn.type === 'URL' && (
                            <input
                              type="url"
                              value={btn.url || ''}
                              onChange={(e) => handleButtonChange(idx, 'url', e.target.value)}
                              placeholder="https://example.com"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            />
                          )}
                          
                          {btn.type === 'PHONE_NUMBER' && (
                            <input
                              type="tel"
                              value={btn.phone_number || ''}
                              onChange={(e) => handleButtonChange(idx, 'phone_number', e.target.value)}
                              placeholder="+60123456789"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Maximum 3 buttons allowed.</p>
                </div>

                {/* Preview */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                  <div className="bg-[#e5ddd5] rounded-lg p-4">
                    <div className="bg-white rounded-lg shadow max-w-sm mx-auto">
                      {createForm.headerType === 'text' && createForm.headerText && (
                        <div className="px-4 pt-3 font-semibold text-gray-800">
                          {createForm.headerText}
                        </div>
                      )}
                      <div className="px-4 py-2 text-gray-700 whitespace-pre-wrap">
                        {createForm.bodyText || 'Your message text will appear here...'}
                      </div>
                      {createForm.footerText && (
                        <div className="px-4 pb-2 text-xs text-gray-500">
                          {createForm.footerText}
                        </div>
                      )}
                      {createForm.buttons.length > 0 && (
                        <div className="border-t">
                          {createForm.buttons.filter(btn => btn.text).map((btn, idx) => (
                            <button
                              key={idx}
                              className="w-full py-2 text-center text-blue-500 hover:bg-gray-50 border-t first:border-t-0"
                            >
                              {btn.type === 'URL' && <Lucide icon="ExternalLink" className="w-4 h-4 inline mr-1" />}
                              {btn.type === 'PHONE_NUMBER' && <Lucide icon="Phone" className="w-4 h-4 inline mr-1" />}
                              {btn.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={createTemplate}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <LoadingIcon icon="oval" color="white" className="w-4 h-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Lucide icon="Plus" className="w-4 h-4 mr-2" />
                      Create Template
                    </>
                  )}
                </Button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default MessageTemplatesPage;
