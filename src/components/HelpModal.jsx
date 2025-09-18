import React, { useState } from 'react';
import { 
  HelpCircle, 
  X,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const HelpModal = ({ 
  title = "Help", 
  content, 
  triggerText = "Help",
  triggerIcon = true,
  size = "default" // "sm", "default", "lg", "xl"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: "max-w-md",
    default: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl"
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          {triggerIcon && <HelpCircle className="w-4 h-4 mr-1" />}
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className={`${sizeClasses[size]} max-h-[80vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {typeof content === 'string' ? (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            content
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Quick help content for common features
export const helpContent = {
  clientManagement: `
    <div class="space-y-4">
      <p>The Client Management system allows you to organize and manage all your tax planning clients efficiently.</p>
      
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 class="font-semibold text-blue-900 mb-2">Quick Actions:</h4>
        <ul class="text-blue-800 space-y-1 text-sm">
          <li>• <strong>Create Client:</strong> Click "Create New Client" to add individual clients</li>
          <li>• <strong>Import CSV:</strong> Use Import/Export tab for bulk client import</li>
          <li>• <strong>Search:</strong> Use the search bar to find specific clients</li>
          <li>• <strong>Edit:</strong> Click on any client to view and edit details</li>
        </ul>
      </div>
      
      <div class="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 class="font-semibold text-green-900 mb-2">💡 Pro Tips:</h4>
        <ul class="text-green-800 space-y-1 text-sm">
          <li>• Include institution field for automatic branding assignment</li>
          <li>• Use household linking to group family members</li>
          <li>• Export client data regularly for backup purposes</li>
        </ul>
      </div>
    </div>
  `,
  
  brandingSystem: `
    <div class="space-y-4">
      <p>The Branding System manages logos and disclosures for professional client reports.</p>
      
      <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h4 class="font-semibold text-purple-900 mb-2">Setup Steps:</h4>
        <ol class="text-purple-800 space-y-1 text-sm list-decimal list-inside">
          <li>Go to Settings → Branding & Disclosures</li>
          <li>Upload logos for each institution you work with</li>
          <li>Create disclosure texts for each institution</li>
          <li>Use matching institution names and CRM tags</li>
          <li>Import clients with institution field for auto-assignment</li>
        </ol>
      </div>
      
      <div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <h4 class="font-semibold text-amber-900 mb-2">Best Practices:</h4>
        <ul class="text-amber-800 space-y-1 text-sm">
          <li>• Use PNG logos with transparent backgrounds</li>
          <li>• Keep file sizes under 1MB for fast loading</li>
          <li>• Include common abbreviations as CRM tags</li>
          <li>• Keep disclosures current with regulations</li>
        </ul>
      </div>
    </div>
  `,
  
  csvImport: `
    <div class="space-y-4">
      <p>Import multiple clients efficiently using CSV files with automatic branding assignment.</p>
      
      <div class="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 class="font-semibold text-green-900 mb-2">Required CSV Fields:</h4>
        <div class="bg-white p-3 rounded text-sm font-mono border">
          clientName, primaryContact, email, phone, birthdate, clientType, street, city, state, zipCode, riskProfile, planningGoals, tags, institution, isArchived
        </div>
      </div>
      
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 class="font-semibold text-blue-900 mb-2">Import Process:</h4>
        <ol class="text-blue-800 space-y-1 text-sm list-decimal list-inside">
          <li>Prepare CSV file with client data</li>
          <li>Go to Client Management → Import/Export tab</li>
          <li>Click "Choose File" and select your CSV</li>
          <li>Review the preview of imported data</li>
          <li>Click "Import Clients" to complete</li>
        </ol>
      </div>
    </div>
  `,
  
  taxCalculations: `
    <div class="space-y-4">
      <p>Comprehensive tax planning with federal and state calculations, scenario modeling, and optimization.</p>
      
      <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
        <h4 class="font-semibold text-indigo-900 mb-2">Data Entry Flow:</h4>
        <ol class="text-indigo-800 space-y-1 text-sm list-decimal list-inside">
          <li><strong>People:</strong> Enter taxpayer and spouse information</li>
          <li><strong>Income:</strong> Add all income sources and amounts</li>
          <li><strong>Deductions:</strong> Configure deductions and credits</li>
          <li><strong>Tax Analysis:</strong> Review calculations and tax map</li>
          <li><strong>Multi-Year:</strong> Plan long-term strategies</li>
        </ol>
      </div>
      
      <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
        <h4 class="font-semibold text-emerald-900 mb-2">Advanced Features:</h4>
        <ul class="text-emerald-800 space-y-1 text-sm">
          <li>• Automatic RMD calculations for qualified accounts</li>
          <li>• FICA and Medicare tax analysis</li>
          <li>• Capital gains optimization strategies</li>
          <li>• Multiple scenario comparison</li>
        </ul>
      </div>
    </div>
  `,
  
  reports: `
    <div class="space-y-4">
      <p>Generate professional reports with automatic branding and comprehensive analysis.</p>
      
      <div class="bg-rose-50 p-4 rounded-lg border border-rose-200">
        <h4 class="font-semibold text-rose-900 mb-2">Available Reports:</h4>
        <ul class="text-rose-800 space-y-1 text-sm">
          <li>• Tax summary with visual charts</li>
          <li>• Multi-year planning projections</li>
          <li>• Scenario comparison analysis</li>
          <li>• RMD planning documents</li>
          <li>• Optimization recommendations</li>
        </ul>
      </div>
      
      <div class="bg-teal-50 p-4 rounded-lg border border-teal-200">
        <h4 class="font-semibold text-teal-900 mb-2">Professional Features:</h4>
        <ul class="text-teal-800 space-y-1 text-sm">
          <li>• Automatic logo and disclosure insertion</li>
          <li>• Institution-specific branding</li>
          <li>• Export to PDF and other formats</li>
          <li>• Customizable report templates</li>
        </ul>
      </div>
    </div>
  `
};

export default HelpModal;

