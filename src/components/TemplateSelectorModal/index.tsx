import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import LoadingIcon from "@/components/Base/LoadingIcon";

interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
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
  status: string;
  category: string;
  components: TemplateComponent[];
}

interface TemplateVariable {
  index: number;
  placeholder: string;
  value: string;
}

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (templateName: string, language: string, components: any[]) => Promise<void>;
  companyId: string;
  phoneIndex?: number;
  contactName?: string;
}

const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  onSend,
  companyId,
  phoneIndex = 0,
  contactName = ""
}) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const baseUrl = 'https://bisnesgpt.jutateknologi.com';

  useEffect(() => {
    if (isOpen && companyId) {
      fetchTemplates();
    }
  }, [isOpen, companyId, phoneIndex]);

  useEffect(() => {
    if (selectedTemplate) {
      extractVariables(selectedTemplate);
    }
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/api/templates/${companyId}/approved?phoneIndex=${phoneIndex}`,
        { credentials: "include" }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        throw new Error("Failed to fetch templates");
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const extractVariables = (template: MessageTemplate) => {
    const vars: TemplateVariable[] = [];
    
    template.components?.forEach(comp => {
      if (comp.text) {
        const matches = comp.text.match(/\{\{(\d+)\}\}/g);
        if (matches) {
          matches.forEach(match => {
            const index = parseInt(match.replace(/[{}]/g, ''));
            if (!vars.find(v => v.index === index)) {
              vars.push({
                index,
                placeholder: match,
                value: ''
              });
            }
          });
        }
      }
    });
    
    // Sort by index
    vars.sort((a, b) => a.index - b.index);
    setVariables(vars);
  };

  const getTemplatePreview = (template: MessageTemplate, withVariables = false): string => {
    if (!template.components) return '';
    
    let preview = '';
    
    for (const comp of template.components) {
      if (comp.type === 'HEADER' && comp.text) {
        let text = comp.text;
        if (withVariables) {
          variables.forEach(v => {
            text = text.replace(v.placeholder, v.value || `[Variable ${v.index}]`);
          });
        }
        preview += text + '\n\n';
      }
      if (comp.type === 'BODY' && comp.text) {
        let text = comp.text;
        if (withVariables) {
          variables.forEach(v => {
            text = text.replace(v.placeholder, v.value || `[Variable ${v.index}]`);
          });
        }
        preview += text + '\n\n';
      }
      if (comp.type === 'FOOTER' && comp.text) {
        preview += `[${comp.text}]`;
      }
    }
    
    return preview.trim();
  };

  const buildComponents = (): any[] => {
    const components: any[] = [];
    
    if (!selectedTemplate?.components) return components;

    // Build body parameters if there are variables
    const bodyVars = variables.filter(v => {
      // Check if this variable is in the body
      const bodyComp = selectedTemplate.components.find(c => c.type === 'BODY');
      return bodyComp?.text?.includes(v.placeholder);
    });

    if (bodyVars.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyVars.map(v => ({
          type: 'text',
          text: v.value
        }))
      });
    }

    // Build header parameters if there are variables
    const headerVars = variables.filter(v => {
      const headerComp = selectedTemplate.components.find(c => c.type === 'HEADER');
      return headerComp?.text?.includes(v.placeholder);
    });

    if (headerVars.length > 0) {
      components.push({
        type: 'header',
        parameters: headerVars.map(v => ({
          type: 'text',
          text: v.value
        }))
      });
    }

    return components;
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;

    // Validate all variables are filled
    const emptyVars = variables.filter(v => !v.value.trim());
    if (emptyVars.length > 0) {
      setError(`Please fill in all variables (${emptyVars.map(v => v.placeholder).join(', ')})`);
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const components = buildComponents();
      await onSend(selectedTemplate.name, selectedTemplate.language, components);
      onClose();
      setSelectedTemplate(null);
      setVariables([]);
    } catch (err: any) {
      console.error("Error sending template:", err);
      setError(err.message || "Failed to send template message");
    } finally {
      setIsSending(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getTemplatePreview(t).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MARKETING': return 'bg-purple-100 text-purple-800';
      case 'UTILITY': return 'bg-blue-100 text-blue-800';
      case 'AUTHENTICATION': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        onClose();
        setSelectedTemplate(null);
        setVariables([]);
        setError(null);
      }}
    >
      <Dialog.Panel className="max-w-3xl w-full">
        <Dialog.Title>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                <Lucide icon="Clock" className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <span className="font-semibold">Send Template Message</span>
                <p className="text-sm text-gray-500 font-normal">
                  24-hour window expired - Use a template to re-engage
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Lucide icon="X" className="w-5 h-5" />
            </button>
          </div>
        </Dialog.Title>

        <Dialog.Description className="mt-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <Lucide icon="AlertCircle" className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!selectedTemplate ? (
            // Template Selection View
            <div className="space-y-4">
              {/* Search */}
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

              {/* Templates List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingIcon icon="oval" className="w-8 h-8" />
                  <span className="ml-2 text-gray-600">Loading templates...</span>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <Lucide icon="FileText" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {templates.length === 0 
                      ? "No approved templates available. Create templates in Meta Business Manager."
                      : "No templates match your search"
                    }
                  </p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-800">{template.name}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Language: {template.language}</p>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {getTemplatePreview(template)}
                          </p>
                        </div>
                        <Lucide icon="ChevronRight" className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Template Configuration View
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setVariables([]);
                }}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <Lucide icon="ArrowLeft" className="w-4 h-4 mr-1" />
                Back to templates
              </button>

              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(selectedTemplate.category)}`}>
                  {selectedTemplate.category}
                </span>
              </div>

              {/* Variables Input */}
              {variables.length > 0 && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Fill in the variables:</p>
                  {variables.map((variable) => (
                    <div key={variable.index}>
                      <label className="block text-sm text-gray-600 mb-1">
                        Variable {variable.index} ({variable.placeholder})
                      </label>
                      <input
                        type="text"
                        value={variable.value}
                        onChange={(e) => {
                          const newVars = variables.map(v => 
                            v.index === variable.index 
                              ? { ...v, value: e.target.value }
                              : v
                          );
                          setVariables(newVars);
                        }}
                        placeholder={`Enter value for ${variable.placeholder}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Preview */}
              <div className="bg-[#e5ddd5] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <div className="bg-white rounded-lg shadow max-w-sm p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {getTemplatePreview(selectedTemplate, true)}
                  </p>
                  
                  {/* Buttons preview */}
                  {selectedTemplate.components?.some(c => c.type === 'BUTTONS') && (
                    <div className="mt-3 pt-2 border-t space-y-1">
                      {selectedTemplate.components
                        .filter(c => c.type === 'BUTTONS')
                        .flatMap(c => c.buttons || [])
                        .map((btn, idx) => (
                          <div key={idx} className="text-center text-blue-500 text-sm py-1">
                            {btn.text}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Send Button */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setVariables([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <LoadingIcon icon="oval" color="white" className="w-4 h-4 mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Lucide icon="Send" className="w-4 h-4 mr-2" />
                      Send Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Description>
      </Dialog.Panel>
    </Dialog>
  );
};

export default TemplateSelectorModal;
