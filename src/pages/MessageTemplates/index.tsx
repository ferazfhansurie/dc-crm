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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
        <ToastContainer />
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-purple-500/10 pointer-events-none" />
            <div className="relative flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 backdrop-blur-sm flex items-center justify-center border border-slate-200 dark:border-white/10 mb-6">
                <Lucide icon="Info" className="w-10 h-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Templates Not Required</h2>
              <p className="text-slate-600 dark:text-white/70 text-center max-w-md">
                Your WhatsApp connection is using the unofficial API (QR code method). 
                Message templates are only required for the Official WhatsApp Business API.
              </p>
              <div className="mt-6 px-4 py-2 bg-slate-100 dark:bg-white/5 backdrop-blur-sm rounded-full border border-slate-200 dark:border-white/10">
                <p className="text-slate-500 dark:text-white/60 text-sm">
                  Current connection: <span className="font-medium text-slate-700 dark:text-white/90">{connectionInfo?.connectionType || 'wwebjs'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <ToastContainer />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-white/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-purple-500/10 pointer-events-none" />
          <div className="relative p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Lucide icon="FileText" className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Message Templates</h1>
                  <p className="text-slate-500 dark:text-white/60 text-sm mt-0.5">
                    Manage your WhatsApp Business API templates
                  </p>
                  {connectionInfo && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs text-slate-400 dark:text-white/50">
                        {connectionInfo.connectionType}
                        {connectionInfo.displayPhoneNumber && ` • ${connectionInfo.displayPhoneNumber}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={fetchTemplates}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm border border-slate-200 dark:border-white/20 rounded-xl text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                >
                  <Lucide icon="RefreshCw" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={syncTemplates}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-sm border border-slate-200 dark:border-white/20 rounded-xl text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                >
                  {isSyncing ? (
                    <>
                      <LoadingIcon icon="oval" color="currentColor" className="w-4 h-4" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Lucide icon="Download" className="w-4 h-4" />
                      Sync from Meta
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 rounded-xl text-white transition-all duration-200 flex items-center gap-2 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
                >
                  <Lucide icon="Plus" className="w-4 h-4" />
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 p-5 overflow-hidden group hover:scale-105 transition-transform duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Lucide icon="FileText" className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{templates.length}</p>
              <p className="text-sm text-slate-500 dark:text-white/50 mt-1">Total Templates</p>
            </div>
          </div>
          
          <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 p-5 overflow-hidden group hover:scale-105 transition-transform duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Lucide icon="CheckCircle" className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{templates.filter(t => t.status === 'APPROVED').length}</p>
              <p className="text-sm text-slate-500 dark:text-white/50 mt-1">Approved</p>
            </div>
          </div>
          
          <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 p-5 overflow-hidden group hover:scale-105 transition-transform duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Lucide icon="Clock" className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{templates.filter(t => t.status === 'PENDING').length}</p>
              <p className="text-sm text-slate-500 dark:text-white/50 mt-1">Pending Review</p>
            </div>
          </div>
          
          <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 p-5 overflow-hidden group hover:scale-105 transition-transform duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Lucide icon="XCircle" className="w-5 h-5 text-red-500 dark:text-red-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{templates.filter(t => t.status === 'REJECTED').length}</p>
              <p className="text-sm text-slate-500 dark:text-white/50 mt-1">Rejected</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="relative bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-purple-500/10 dark:from-blue-500/20 dark:via-violet-500/20 dark:to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-300/30 dark:border-blue-400/30 p-5 overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Lucide icon="Info" className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">24-Hour Messaging Window</h3>
              <p className="text-sm text-slate-600 dark:text-white/70 mt-1">
                With the Official WhatsApp API, you can only send free-form messages within 24 hours of receiving a customer message. 
                After that, you must use an approved template to re-engage. Create templates here and they'll be submitted to Meta for review.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Lucide icon="Search" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat', paddingRight: '2.5rem' }}
            >
              <option value="all" className="bg-white dark:bg-slate-800">All Categories</option>
              <option value="MARKETING" className="bg-white dark:bg-slate-800">Marketing</option>
              <option value="UTILITY" className="bg-white dark:bg-slate-800">Utility</option>
              <option value="AUTHENTICATION" className="bg-white dark:bg-slate-800">Authentication</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat', paddingRight: '2.5rem' }}
            >
              <option value="all" className="bg-white dark:bg-slate-800">All Statuses</option>
              <option value="APPROVED" className="bg-white dark:bg-slate-800">Approved</option>
              <option value="PENDING" className="bg-white dark:bg-slate-800">Pending</option>
              <option value="REJECTED" className="bg-white dark:bg-slate-800">Rejected</option>
            </select>
          </div>
        </div>

        {/* Templates List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingIcon icon="oval" className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            <span className="mt-4 text-slate-500 dark:text-white/60">Loading templates...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Lucide icon="FileText" className="w-8 h-8 text-slate-400 dark:text-white/40" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No templates found</h3>
            <p className="text-slate-500 dark:text-white/50 mt-2">
              {templates.length === 0 
                ? "Click 'Sync from Meta' to fetch your templates or create a new one"
                : "No templates match your current filters"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id}
                className="relative bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 overflow-hidden group hover:border-blue-400/50 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowPreviewModal(true);
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-white truncate">{template.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Language: {template.language}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end ml-3">
                      {getStatusBadge(template.status)}
                      {getCategoryBadge(template.category)}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/10">
                    <p className="text-sm text-slate-600 dark:text-white/70 whitespace-pre-wrap line-clamp-4">
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
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-400/20">
                            {btn.text}
                          </span>
                        ))
                      }
                    </div>
                  )}

                  {/* Delete button */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTemplate(template.name);
                      }}
                      className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Lucide icon="Trash2" className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog
        open={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedTemplate(null);
        }}
      >
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-white/20 shadow-2xl transition-all">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5 dark:from-blue-500/10 dark:to-violet-500/10 pointer-events-none rounded-3xl" />
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                      <Lucide icon="Eye" className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Template Preview</h3>
                  </div>
                  <button 
                    onClick={() => setShowPreviewModal(false)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-white/70 hover:text-slate-700 dark:hover:text-white transition-colors"
                  >
                    <Lucide icon="X" className="w-5 h-5" />
                  </button>
                </div>
                
                {selectedTemplate && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-800 dark:text-white">{selectedTemplate.name}</h4>
                      <div className="flex gap-2">
                        {getStatusBadge(selectedTemplate.status)}
                        {getCategoryBadge(selectedTemplate.category)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-500 dark:text-white/60">
                      Language: {selectedTemplate.language}
                    </div>

                    {/* Template Preview Card (WhatsApp style) */}
                    <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-600/20 dark:to-emerald-700/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-500/20">
                      <div className="bg-white rounded-xl shadow-lg max-w-sm mx-auto overflow-hidden">
                        {selectedTemplate.components?.map((comp, idx) => (
                          <div key={idx}>
                            {comp.type === 'HEADER' && comp.text && (
                              <div className="px-4 pt-3 font-semibold text-gray-800">
                                {comp.text}
                              </div>
                            )}
                            {comp.type === 'HEADER' && comp.format === 'IMAGE' && (
                              <div className="bg-gray-100 h-32 flex items-center justify-center">
                                <Lucide icon="Image" className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            {comp.type === 'BODY' && comp.text && (
                              <div className="px-4 py-2 text-gray-700 whitespace-pre-wrap text-sm">
                                {comp.text}
                              </div>
                            )}
                            {comp.type === 'FOOTER' && comp.text && (
                              <div className="px-4 pb-2 text-xs text-gray-500">
                                {comp.text}
                              </div>
                            )}
                            {comp.type === 'BUTTONS' && comp.buttons && (
                              <div className="border-t border-gray-100">
                                {comp.buttons.map((btn, btnIdx) => (
                                  <button
                                    key={btnIdx}
                                    className="w-full py-2.5 text-center text-blue-500 hover:bg-gray-50 border-t border-gray-100 first:border-t-0 text-sm font-medium"
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
                      <div className="bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-400/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/30 flex items-center justify-center flex-shrink-0">
                            <Lucide icon="AlertCircle" className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">This template has variables</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300/70 mt-1">
                              Variables like {'{{1}}'}, {'{{2}}'} will need to be filled in when sending the message.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Create Template Modal */}
      <Dialog
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
      >
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/20 p-6 shadow-2xl transition-all">
              <Dialog.Title className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                    <Lucide icon="Plus" className="w-5 h-5 text-white" />
                  </div>
                  <span>Create Message Template</span>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-white/70 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <Lucide icon="X" className="w-5 h-5" />
                </button>
              </Dialog.Title>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="my_template_name"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                  />
                  <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                    Lowercase letters, numbers, and underscores only. Spaces will be converted to underscores.
                  </p>
                </div>

                {/* Category & Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Category</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                    >
                      <option value="UTILITY" className="bg-white dark:bg-slate-800">Utility</option>
                      <option value="MARKETING" className="bg-white dark:bg-slate-800">Marketing</option>
                      <option value="AUTHENTICATION" className="bg-white dark:bg-slate-800">Authentication</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Language</label>
                    <select
                      value={createForm.language}
                      onChange={(e) => setCreateForm({ ...createForm, language: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-800">{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Header */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Header (Optional)</label>
                  <select
                    value={createForm.headerType}
                    onChange={(e) => setCreateForm({ ...createForm, headerType: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all mb-2"
                  >
                    <option value="none" className="bg-white dark:bg-slate-800">No Header</option>
                    <option value="text" className="bg-white dark:bg-slate-800">Text Header</option>
                  </select>
                  {createForm.headerType === 'text' && (
                    <input
                      type="text"
                      value={createForm.headerText}
                      onChange={(e) => setCreateForm({ ...createForm, headerText: e.target.value })}
                      placeholder="Header text"
                      maxLength={60}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                    />
                  )}
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                    Body Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={createForm.bodyText}
                    onChange={(e) => handleBodyTextChange(e.target.value)}
                    placeholder="Hello {{1}}, your order {{2}} has been shipped!"
                    rows={4}
                    maxLength={1024}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all resize-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                    Use {'{{1}}'}, {'{{2}}'}, etc. for variables. Max 1024 characters.
                  </p>
                </div>

                {/* Variable Examples */}
                {createForm.bodyExamples.length > 0 && (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/10">
                    <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">
                      Example values for variables <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {createForm.bodyExamples.map((example, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 dark:text-white/50 w-16">{`{{${idx + 1}}}`}:</span>
                          <input
                            type="text"
                            value={example}
                            onChange={(e) => {
                              const newExamples = [...createForm.bodyExamples];
                              newExamples[idx] = e.target.value;
                              setCreateForm({ ...createForm, bodyExamples: newExamples });
                            }}
                            placeholder={`Example for variable ${idx + 1}`}
                            className="flex-1 px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-white/50 mt-2">
                      Meta requires example values to understand how variables will be used.
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">Footer (Optional)</label>
                  <input
                    type="text"
                    value={createForm.footerText}
                    onChange={(e) => setCreateForm({ ...createForm, footerText: e.target.value })}
                    placeholder="Footer text (e.g., Reply STOP to unsubscribe)"
                    maxLength={60}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                  />
                </div>

                {/* Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-white/80">Buttons (Optional)</label>
                    <button
                      type="button"
                      onClick={handleAddButton}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center font-medium"
                    >
                      <Lucide icon="Plus" className="w-4 h-4 mr-1" />
                      Add Button
                    </button>
                  </div>
                  
                  {createForm.buttons.length > 0 && (
                    <div className="space-y-3">
                      {createForm.buttons.map((btn, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-700 dark:text-white/80">Button {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveButton(idx)}
                              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Lucide icon="Trash2" className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <select
                              value={btn.type}
                              onChange={(e) => handleButtonChange(idx, 'type', e.target.value)}
                              className="px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all text-sm"
                            >
                              <option value="QUICK_REPLY" className="bg-white dark:bg-slate-800">Quick Reply</option>
                              <option value="URL" className="bg-white dark:bg-slate-800">URL</option>
                              <option value="PHONE_NUMBER" className="bg-white dark:bg-slate-800">Phone Number</option>
                            </select>
                            <input
                              type="text"
                              value={btn.text}
                              onChange={(e) => handleButtonChange(idx, 'text', e.target.value)}
                              placeholder="Button text"
                              maxLength={25}
                              className="px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all text-sm"
                            />
                          </div>
                          
                          {btn.type === 'URL' && (
                            <input
                              type="url"
                              value={btn.url || ''}
                              onChange={(e) => handleButtonChange(idx, 'url', e.target.value)}
                              placeholder="https://example.com"
                              className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all text-sm"
                            />
                          )}
                          
                          {btn.type === 'PHONE_NUMBER' && (
                            <input
                              type="tel"
                              value={btn.phone_number || ''}
                              onChange={(e) => handleButtonChange(idx, 'phone_number', e.target.value)}
                              placeholder="+60123456789"
                              className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-white/50 mt-1">Maximum 3 buttons allowed.</p>
                </div>

                {/* Preview */}
                <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">Preview</label>
                  <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-600/20 dark:to-emerald-700/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-500/20">
                    <div className="bg-white rounded-xl shadow-lg max-w-sm mx-auto overflow-hidden">
                      {createForm.headerType === 'text' && createForm.headerText && (
                        <div className="px-4 pt-3 font-semibold text-gray-800">
                          {createForm.headerText}
                        </div>
                      )}
                      <div className="px-4 py-2 text-gray-700 whitespace-pre-wrap text-sm">
                        {createForm.bodyText || 'Your message text will appear here...'}
                      </div>
                      {createForm.footerText && (
                        <div className="px-4 pb-2 text-xs text-gray-500">
                          {createForm.footerText}
                        </div>
                      )}
                      {createForm.buttons.length > 0 && (
                        <div className="border-t border-gray-100">
                          {createForm.buttons.filter(btn => btn.text).map((btn, idx) => (
                            <button
                              key={idx}
                              className="w-full py-2.5 text-center text-blue-500 hover:bg-gray-50 border-t border-gray-100 first:border-t-0 text-sm font-medium"
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
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/20 rounded-xl text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white transition-all duration-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createTemplate}
                  disabled={isCreating}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 rounded-xl text-white transition-all duration-200 flex items-center gap-2 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <LoadingIcon icon="oval" color="white" className="w-4 h-4" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Lucide icon="Plus" className="w-4 h-4" />
                      Create Template
                    </>
                  )}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default MessageTemplatesPage;
