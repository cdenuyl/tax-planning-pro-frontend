import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Search, 
  Book, 
  Users, 
  Calculator, 
  FileText, 
  Settings, 
  Upload, 
  Download,
  Eye,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Play,
  Image as ImageIcon
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

const HelpSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [expandedSections, setExpandedSections] = useState(new Set(['getting-started']));

  // Help content structure
  const helpCategories = [
    {
      id: 'overview',
      title: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      description: 'Basic overview and first steps'
    },
    {
      id: 'authentication',
      title: 'User Management',
      icon: <Users className="w-5 h-5" />,
      description: 'Login, users, and permissions'
    },
    {
      id: 'clients',
      title: 'Client Management',
      icon: <Users className="w-5 h-5" />,
      description: 'Managing clients and households'
    },
    {
      id: 'tax-planning',
      title: 'Tax Planning',
      icon: <Calculator className="w-5 h-5" />,
      description: 'Tax calculations and scenarios'
    },
    {
      id: 'branding',
      title: 'Branding System',
      icon: <ImageIcon className="w-5 h-5" />,
      description: 'Logos, disclosures, and CRM integration'
    },
    {
      id: 'reports',
      title: 'Reports & Export',
      icon: <FileText className="w-5 h-5" />,
      description: 'Generating and exporting reports'
    },
    {
      id: 'settings',
      title: 'Settings & Configuration',
      icon: <Settings className="w-5 h-5" />,
      description: 'Application settings and preferences'
    }
  ];

  const helpContent = {
    overview: {
      title: 'Getting Started with Tax-on-a-Me',
      sections: [
        {
          id: 'welcome',
          title: 'Welcome to Tax-on-a-Me',
          content: `
            <div class="space-y-4">
              <p>Tax-on-a-Me is a comprehensive tax planning application designed for professional tax advisors and financial planners. This help system will guide you through all the features and capabilities.</p>
              
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 class="font-semibold text-blue-900 mb-2">Key Features:</h4>
                <ul class="text-blue-800 space-y-1 text-sm">
                  <li>• Multi-user authentication with role-based access</li>
                  <li>• Comprehensive client and household management</li>
                  <li>• Advanced tax calculations and scenario modeling</li>
                  <li>• Professional branding and CRM integration</li>
                  <li>• Detailed reporting and export capabilities</li>
                </ul>
              </div>
            </div>
          `
        },
        {
          id: 'navigation',
          title: 'Application Navigation',
          content: `
            <div class="space-y-4">
              <p>The application is organized into several main sections:</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="font-semibold mb-2">Left Panel - Navigation</h4>
                  <ul class="text-sm space-y-1">
                    <li>• People - Taxpayer and spouse information</li>
                    <li>• Income - Income sources and amounts</li>
                    <li>• Deductions - Tax deductions and credits</li>
                    <li>• Tax Analysis - Tax calculations and maps</li>
                    <li>• Multi-Year - Long-term planning</li>
                    <li>• AI Optimize - Optimization recommendations</li>
                    <li>• Settings - Application preferences</li>
                  </ul>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="font-semibold mb-2">Middle Panel - Content</h4>
                  <ul class="text-sm space-y-1">
                    <li>• Tax Map - Visual tax breakdown</li>
                    <li>• Assets - Asset management and RMDs</li>
                    <li>• Reports - Comprehensive reports</li>
                    <li>• Clients - Client management interface</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        },
        {
          id: 'first-steps',
          title: 'Your First Steps',
          content: `
            <div class="space-y-4">
              <p>Follow these steps to get started with Tax-on-a-Me:</p>
              
              <div class="space-y-3">
                <div class="flex items-start space-x-3">
                  <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</div>
                  <div>
                    <h4 class="font-semibold">Login and Explore</h4>
                    <p class="text-sm text-gray-600">Use the demo credentials to login and familiarize yourself with the interface.</p>
                  </div>
                </div>
                
                <div class="flex items-start space-x-3">
                  <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</div>
                  <div>
                    <h4 class="font-semibold">Set Up Branding</h4>
                    <p class="text-sm text-gray-600">Go to Settings and configure your logos and disclosures for professional reports.</p>
                  </div>
                </div>
                
                <div class="flex items-start space-x-3">
                  <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</div>
                  <div>
                    <h4 class="font-semibold">Import or Create Clients</h4>
                    <p class="text-sm text-gray-600">Use the Client Management section to import existing clients or create new ones.</p>
                  </div>
                </div>
                
                <div class="flex items-start space-x-3">
                  <div class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">4</div>
                  <div>
                    <h4 class="font-semibold">Start Tax Planning</h4>
                    <p class="text-sm text-gray-600">Enter client information and begin creating tax scenarios and analyses.</p>
                  </div>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    authentication: {
      title: 'User Management & Authentication',
      sections: [
        {
          id: 'login',
          title: 'Logging In',
          content: `
            <div class="space-y-4">
              <p>Tax-on-a-Me uses a secure authentication system with role-based access control.</p>
              
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 class="font-semibold text-green-900 mb-2">Demo Credentials:</h4>
                <div class="text-green-800 space-y-1 text-sm">
                  <div><strong>Admin:</strong> admin@taxplanning.com / TaxPlan123!</div>
                  <div><strong>Advisor:</strong> advisor@taxplanning.com / TaxPlan123!</div>
                  <div><strong>Assistant:</strong> assistant@taxplanning.com / TaxPlan123!</div>
                </div>
              </div>
              
              <div class="space-y-2">
                <h4 class="font-semibold">Login Process:</h4>
                <ol class="list-decimal list-inside text-sm space-y-1">
                  <li>Enter your email address</li>
                  <li>Enter your password</li>
                  <li>Click "Sign In"</li>
                  <li>You'll be redirected to the main application</li>
                </ol>
              </div>
            </div>
          `
        },
        {
          id: 'user-roles',
          title: 'User Roles & Permissions',
          content: `
            <div class="space-y-4">
              <p>The application supports three user roles with different permission levels:</p>
              
              <div class="space-y-4">
                <div class="border rounded-lg p-4">
                  <h4 class="font-semibold text-blue-600 mb-2">Admin</h4>
                  <ul class="text-sm space-y-1">
                    <li>• Full access to all features</li>
                    <li>• User management capabilities</li>
                    <li>• System settings and configuration</li>
                    <li>• Can view and edit all clients</li>
                    <li>• Branding and global settings management</li>
                  </ul>
                </div>
                
                <div class="border rounded-lg p-4">
                  <h4 class="font-semibold text-green-600 mb-2">Advisor</h4>
                  <ul class="text-sm space-y-1">
                    <li>• Client management and tax planning</li>
                    <li>• Can create and edit assigned clients</li>
                    <li>• Generate reports and analyses</li>
                    <li>• Access to all tax planning features</li>
                    <li>• Limited administrative functions</li>
                  </ul>
                </div>
                
                <div class="border rounded-lg p-4">
                  <h4 class="font-semibold text-orange-600 mb-2">Assistant</h4>
                  <ul class="text-sm space-y-1">
                    <li>• View access to assigned clients</li>
                    <li>• Basic data entry capabilities</li>
                    <li>• Generate standard reports</li>
                    <li>• Limited editing permissions</li>
                    <li>• Cannot access administrative features</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    clients: {
      title: 'Client Management',
      sections: [
        {
          id: 'client-overview',
          title: 'Client Management Overview',
          content: `
            <div class="space-y-4">
              <p>The client management system allows you to organize and manage all your tax planning clients efficiently.</p>
              
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 class="font-semibold text-blue-900 mb-2">Key Features:</h4>
                <ul class="text-blue-800 space-y-1 text-sm">
                  <li>• Individual and household client management</li>
                  <li>• CSV import/export for bulk operations</li>
                  <li>• Automatic branding assignment based on institution</li>
                  <li>• Scenario management for multiple tax strategies</li>
                  <li>• Client sharing and collaboration</li>
                </ul>
              </div>
              
              <div class="space-y-2">
                <h4 class="font-semibold">Accessing Client Management:</h4>
                <ol class="list-decimal list-inside text-sm space-y-1">
                  <li>Click the "Clients" button in the middle panel navigation</li>
                  <li>Use the tabs to switch between Clients, Import/Export, and Client Details</li>
                  <li>Use the search and filter options to find specific clients</li>
                </ol>
              </div>
            </div>
          `
        },
        {
          id: 'creating-clients',
          title: 'Creating New Clients',
          content: `
            <div class="space-y-4">
              <p>You can create new clients individually or import them in bulk using CSV files.</p>
              
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold mb-2">Creating Individual Clients:</h4>
                  <ol class="list-decimal list-inside text-sm space-y-1">
                    <li>Go to Client Management → Clients tab</li>
                    <li>Click "Create New Client" button</li>
                    <li>Fill in the client information form:
                      <ul class="list-disc list-inside ml-4 mt-1">
                        <li>Client name and primary contact</li>
                        <li>Contact information (email, phone)</li>
                        <li>Address details</li>
                        <li>Client type (individual, family, business)</li>
                        <li>Institution (for automatic branding)</li>
                      </ul>
                    </li>
                    <li>Click "Create Client" to save</li>
                  </ol>
                </div>
                
                <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 class="font-semibold text-yellow-900 mb-2">💡 Pro Tip:</h4>
                  <p class="text-yellow-800 text-sm">Include the institution field when creating clients to automatically assign appropriate branding (logos and disclosures) for professional reports.</p>
                </div>
              </div>
            </div>
          `
        },
        {
          id: 'csv-import',
          title: 'CSV Import & Export',
          content: `
            <div class="space-y-4">
              <p>Efficiently manage large numbers of clients using CSV import and export features.</p>
              
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold mb-2">CSV Import Process:</h4>
                  <ol class="list-decimal list-inside text-sm space-y-1">
                    <li>Go to Client Management → Import/Export tab</li>
                    <li>Download the sample CSV template or use your own</li>
                    <li>Prepare your CSV file with client data</li>
                    <li>Click "Choose File" and select your CSV</li>
                    <li>Review the preview of imported data</li>
                    <li>Click "Import Clients" to complete the process</li>
                  </ol>
                </div>
                
                <div>
                  <h4 class="font-semibold mb-2">Required CSV Fields:</h4>
                  <div class="bg-gray-50 p-3 rounded text-sm font-mono">
                    clientName, primaryContact, email, phone, birthdate, clientType, street, city, state, zipCode, riskProfile, planningGoals, tags, institution, isArchived
                  </div>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 class="font-semibold text-green-900 mb-2">✅ Automatic Features:</h4>
                  <ul class="text-green-800 space-y-1 text-sm">
                    <li>• Branding auto-assignment based on institution field</li>
                    <li>• Duplicate detection and handling</li>
                    <li>• Data validation and error reporting</li>
                    <li>• Bulk processing for large client lists</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    branding: {
      title: 'Branding System',
      sections: [
        {
          id: 'branding-overview',
          title: 'Branding System Overview',
          content: `
            <div class="space-y-4">
              <p>The branding system allows you to manage multiple institution logos and disclosures for professional client reports.</p>
              
              <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 class="font-semibold text-purple-900 mb-2">Perfect for Multi-Institutional Practices:</h4>
                <ul class="text-purple-800 space-y-1 text-sm">
                  <li>• Upload logos for different institutions (Edward Jones, Ameriprise, etc.)</li>
                  <li>• Create institution-specific disclosure texts</li>
                  <li>• Automatic assignment based on client institution</li>
                  <li>• Manual override for special cases</li>
                  <li>• Professional, consistent branding across all reports</li>
                </ul>
              </div>
              
              <div class="space-y-2">
                <h4 class="font-semibold">Accessing Branding Settings:</h4>
                <ol class="list-decimal list-inside text-sm space-y-1">
                  <li>Click the "Settings" tab in the left panel</li>
                  <li>Scroll down to the "Branding & Disclosures" section</li>
                  <li>Use the tabs to manage Logos and Disclosures</li>
                </ol>
              </div>
            </div>
          `
        },
        {
          id: 'logo-management',
          title: 'Logo Management',
          content: `
            <div class="space-y-4">
              <p>Upload and manage institution logos that will appear on client reports and documents.</p>
              
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold mb-2">Uploading Logos:</h4>
                  <ol class="list-decimal list-inside text-sm space-y-1">
                    <li>Go to Settings → Branding & Disclosures → Logos tab</li>
                    <li>Click "Upload Logo" button</li>
                    <li>Select your image file (PNG, JPG, etc.)</li>
                    <li>Enter the institution name (e.g., "Edward Jones")</li>
                    <li>Add CRM tags for flexible matching (e.g., "EJ", "EdwardJones")</li>
                    <li>Set as default if this should be your primary logo</li>
                    <li>Click "Save Logo"</li>
                  </ol>
                </div>
                
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 class="font-semibold text-blue-900 mb-2">Logo Best Practices:</h4>
                  <ul class="text-blue-800 space-y-1 text-sm">
                    <li>• Use PNG format with transparent background</li>
                    <li>• Recommended size: 300x100 pixels or similar aspect ratio</li>
                    <li>• Keep file size under 1MB for fast loading</li>
                    <li>• Use clear, professional institution names</li>
                    <li>• Include common abbreviations as CRM tags</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        },
        {
          id: 'disclosure-management',
          title: 'Disclosure Management',
          content: `
            <div class="space-y-4">
              <p>Create and manage institution-specific disclosure texts that appear on reports and documents.</p>
              
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold mb-2">Creating Disclosures:</h4>
                  <ol class="list-decimal list-inside text-sm space-y-1">
                    <li>Go to Settings → Branding & Disclosures → Disclosures tab</li>
                    <li>Click "Add Disclosure" button</li>
                    <li>Enter institution name (matching your logo)</li>
                    <li>Add CRM tags (same as corresponding logo)</li>
                    <li>Enter the complete disclosure text</li>
                    <li>Set as default if this should be your primary disclosure</li>
                    <li>Click "Save Disclosure"</li>
                  </ol>
                </div>
                
                <div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 class="font-semibold text-amber-900 mb-2">⚖️ Compliance Guidelines:</h4>
                  <ul class="text-amber-800 space-y-1 text-sm">
                    <li>• Include all required regulatory disclosures</li>
                    <li>• Tailor content to each institution's requirements</li>
                    <li>• Use professional, formal language</li>
                    <li>• Include relevant contact information</li>
                    <li>• Keep disclosures current with regulatory changes</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        },
        {
          id: 'auto-assignment',
          title: 'Automatic Branding Assignment',
          content: `
            <div class="space-y-4">
              <p>The system automatically assigns appropriate branding to clients based on their institution field.</p>
              
              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold mb-2">How Auto-Assignment Works:</h4>
                  <ol class="list-decimal list-inside text-sm space-y-1">
                    <li>Client is imported with institution field populated</li>
                    <li>System matches institution name to uploaded logos/disclosures</li>
                    <li>Appropriate branding is automatically assigned</li>
                    <li>Default branding is used if no match is found</li>
                    <li>Manual override is always possible for special cases</li>
                  </ol>
                </div>
                
                <div>
                  <h4 class="font-semibold mb-2">Matching Rules:</h4>
                  <div class="bg-gray-50 p-3 rounded">
                    <ul class="text-sm space-y-1">
                      <li><strong>Exact Match:</strong> "Edward Jones" matches "Edward Jones"</li>
                      <li><strong>Case Insensitive:</strong> "EDWARD JONES" matches "edward jones"</li>
                      <li><strong>CRM Tag Match:</strong> "EJ" matches if set as CRM tag</li>
                      <li><strong>Partial Match:</strong> "Ameriprise" matches "Ameriprise Financial"</li>
                    </ul>
                  </div>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 class="font-semibold text-green-900 mb-2">✨ Benefits:</h4>
                  <ul class="text-green-800 space-y-1 text-sm">
                    <li>• No manual branding assignment needed</li>
                    <li>• Consistent professional appearance</li>
                    <li>• Scales efficiently with large client lists</li>
                    <li>• Reduces errors and saves time</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    'tax-planning': {
      title: 'Tax Planning & Calculations',
      sections: [
        {
          id: 'tax-overview',
          title: 'Tax Planning Overview',
          content: `
            <div class="space-y-4">
              <p>Tax-on-a-Me provides comprehensive tax planning and calculation capabilities for professional tax advisors.</p>
              
              <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 class="font-semibold text-indigo-900 mb-2">Tax Planning Features:</h4>
                <ul class="text-indigo-800 space-y-1 text-sm">
                  <li>• Federal and state tax calculations</li>
                  <li>• Multiple scenario modeling</li>
                  <li>• RMD calculations and planning</li>
                  <li>• FICA and Medicare tax analysis</li>
                  <li>• Capital gains optimization</li>
                  <li>• Multi-year planning strategies</li>
                </ul>
              </div>
            </div>
          `
        },
        {
          id: 'entering-data',
          title: 'Entering Tax Data',
          content: `
            <div class="space-y-4">
              <p>Follow the left panel navigation to enter comprehensive tax information:</p>
              
              <div class="space-y-3">
                <div class="border rounded-lg p-3">
                  <h4 class="font-semibold text-blue-600 mb-2">1. People Tab</h4>
                  <ul class="text-sm space-y-1">
                    <li>• Taxpayer and spouse information</li>
                    <li>• Ages, filing status, state of residence</li>
                    <li>• Housing information for homestead credits</li>
                  </ul>
                </div>
                
                <div class="border rounded-lg p-3">
                  <h4 class="font-semibold text-green-600 mb-2">2. Income Tab</h4>
                  <ul class="text-sm space-y-1">
                    <li>• All income sources (wages, retirement, investment)</li>
                    <li>• Income amounts and tax treatment</li>
                    <li>• Automatic RMD calculations if enabled</li>
                  </ul>
                </div>
                
                <div class="border rounded-lg p-3">
                  <h4 class="font-semibold text-purple-600 mb-2">3. Deductions Tab</h4>
                  <ul class="text-sm space-y-1">
                    <li>• Standard or itemized deductions</li>
                    <li>• State and local tax deductions</li>
                    <li>• Charitable contributions and other deductions</li>
                  </ul>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    reports: {
      title: 'Reports & Export',
      sections: [
        {
          id: 'reports-overview',
          title: 'Reports Overview',
          content: `
            <div class="space-y-4">
              <p>Generate comprehensive reports for clients with professional branding and detailed analysis.</p>
              
              <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h4 class="font-semibold text-emerald-900 mb-2">Available Reports:</h4>
                <ul class="text-emerald-800 space-y-1 text-sm">
                  <li>• Tax summary reports with visual charts</li>
                  <li>• Multi-year planning projections</li>
                  <li>• Scenario comparison reports</li>
                  <li>• RMD planning documents</li>
                  <li>• Optimization recommendations</li>
                </ul>
              </div>
            </div>
          `
        }
      ]
    },
    settings: {
      title: 'Settings & Configuration',
      sections: [
        {
          id: 'settings-overview',
          title: 'Settings Overview',
          content: `
            <div class="space-y-4">
              <p>Configure application settings, tax years, and system preferences.</p>
              
              <div class="space-y-3">
                <div class="border rounded-lg p-3">
                  <h4 class="font-semibold mb-2">Tax Year Settings</h4>
                  <p class="text-sm">Configure tax year for calculations and enable TCJA sunsetting for 2026+.</p>
                </div>
                
                <div class="border rounded-lg p-3">
                  <h4 class="font-semibold mb-2">RMD Settings</h4>
                  <p class="text-sm">Enable automatic RMD calculations for qualified retirement accounts.</p>
                </div>
                
                <div class="border rounded-lg p-3">
                  <h4 class="font-semibold mb-2">Branding & Disclosures</h4>
                  <p class="text-sm">Manage institution logos and disclosure texts for professional reports.</p>
                </div>
              </div>
            </div>
          `
        }
      ]
    }
  };

  // Filter content based on search term
  const filteredContent = React.useMemo(() => {
    if (!searchTerm) return helpContent;
    
    const filtered = {};
    Object.keys(helpContent).forEach(categoryId => {
      const category = helpContent[categoryId];
      const matchingSections = category.sections.filter(section => 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingSections.length > 0) {
        filtered[categoryId] = {
          ...category,
          sections: matchingSections
        };
      }
    });
    
    return filtered;
  }, [searchTerm]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <HelpCircle className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Help & Documentation</h1>
            <p className="text-gray-600">Comprehensive guide to Tax-on-a-Me features</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search help topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Help Topics</h3>
            <div className="space-y-2">
              {helpCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {category.icon}
                    <div>
                      <div className="font-medium">{category.title}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {filteredContent[selectedCategory] && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {filteredContent[selectedCategory].title}
                </h2>
                
                <Accordion type="multiple" value={Array.from(expandedSections)} onValueChange={(value) => setExpandedSections(new Set(value))}>
                  {filteredContent[selectedCategory].sections.map((section) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger className="text-left">
                        <span className="font-medium">{section.title}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
            
            {Object.keys(filteredContent).length === 0 && searchTerm && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search terms or browse the categories.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSystem;

