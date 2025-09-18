import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  File, 
  FileText as FileTextIcon,
  Save,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  clientToCSV, 
  clientsToCSV, 
  downloadCSV, 
  clientToExcel, 
  csvToClient,
  csvToClients,
  createBackup,
  downloadBackup,
  restoreFromBackup,
  generateClientId
} from '../utils/dataExport';
import { 
  generateClientReport, 
  generateTaxSummaryReport, 
  downloadPdfReport 
} from '../utils/pdfReports';

/**
 * DataImportExport component for importing and exporting client data
 * 
 * @param {Object} props - Component props
 * @param {Object} props.client - Current client object
 * @param {Array} props.allClients - Array of all clients
 * @param {Function} props.onClientUpdate - Callback for updating client data
 * @param {Function} props.onClientsUpdate - Callback for updating all clients data
 */
const DataImportExport = ({ 
  client, 
  allClients, 
  onClientUpdate, 
  onClientsUpdate 
}) => {
  const [activeTab, setActiveTab] = useState('export');
  const [exportOptions, setExportOptions] = useState({
    includeScenarios: true,
    includeNotes: true,
    includeActionItems: true,
    includeDocuments: false
  });
  const [reportOptions, setReportOptions] = useState({
    includeScenarios: true,
    includeNotes: true,
    includeActionItems: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [backupFile, setBackupFile] = useState(null);
  const [csvPasteContent, setCsvPasteContent] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  
  // Handle export to CSV
  const handleExportCSV = () => {
    if (!client) return;
    
    const csvContent = clientToCSV(client, exportOptions.includeScenarios);
    const fileName = `${client.profile.clientName.replace(/\s+/g, '_')}_export.csv`;
    downloadCSV(csvContent, fileName);
    
    setProcessingResult({
      success: true,
      message: `Successfully exported client data to ${fileName}`
    });
  };
  
  // Handle export to Excel
  const handleExportExcel = () => {
    if (!client) return;
    
    clientToExcel(client, exportOptions.includeScenarios);
    
    setProcessingResult({
      success: true,
      message: `Successfully exported client data to Excel format`
    });
  };
  
  // Handle export all clients to CSV
  const handleExportAllClientsCSV = () => {
    if (!allClients || allClients.length === 0) return;
    
    const csvContent = clientsToCSV(allClients);
    const fileName = `all_clients_export.csv`;
    downloadCSV(csvContent, fileName);
    
    setProcessingResult({
      success: true,
      message: `Successfully exported ${allClients.length} clients to ${fileName}`
    });
  };
  
  // Handle generate PDF report
  const handleGeneratePdfReport = async () => {
    if (!client) return;
    
    setIsProcessing(true);
    setProcessingResult(null);
    
    try {
      const pdfBlob = await generateClientReport(client, reportOptions);
      const fileName = `${client.profile.clientName.replace(/\s+/g, '_')}_report.pdf`;
      downloadPdfReport(pdfBlob, fileName);
      
      setProcessingResult({
        success: true,
        message: `Successfully generated PDF report: ${fileName}`
      });
    } catch (error) {
      setProcessingResult({
        success: false,
        message: `Error generating PDF report: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle generate tax summary report
  const handleGenerateTaxSummaryReport = async () => {
    if (!client) return;
    
    setIsProcessing(true);
    setProcessingResult(null);
    
    try {
      const pdfBlob = await generateTaxSummaryReport(client);
      const fileName = `${client.profile.clientName.replace(/\s+/g, '_')}_tax_summary.pdf`;
      downloadPdfReport(pdfBlob, fileName);
      
      setProcessingResult({
        success: true,
        message: `Successfully generated tax summary report: ${fileName}`
      });
    } catch (error) {
      setProcessingResult({
        success: false,
        message: `Error generating tax summary report: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle file selection for import
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setProcessingResult(null);
    }
  };
  
  // Handle backup file selection
  const handleBackupFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackupFile(file);
      setProcessingResult(null);
    }
  };
  
  // Handle import from CSV paste
  const handleImportCSVFromPaste = () => {
    if (!csvPasteContent) return;
    
    setIsProcessing(true);
    setProcessingResult(null);
    
    try {
      const importedClients = csvToClients(csvPasteContent);
      
      if (importedClients && importedClients.length > 0) {
        // Create new clients with the imported data
        if (onClientsUpdate && allClients) {
          const newClients = importedClients.map(importedClient => ({
            id: generateClientId(),
            profile: {
              ...importedClient.profile,
              createdDate: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              isActive: true,
              isArchived: false
            },
            scenarios: [
              {
                id: 1,
                name: 'Base Case',
                isActive: true,
                createdDate: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                data: {}
              }
            ]
          }));
          
          // Add the new clients to the clients list
          onClientsUpdate([...allClients, ...newClients]);
        }
        
        setProcessingResult({
          success: true,
          message: `Successfully imported ${importedClients.length} client(s) from pasted content`
        });
      } else {
        setProcessingResult({
          success: false,
          message: `Invalid or empty client data in the pasted content`
        });
      }
    } catch (error) {
      setProcessingResult({
        success: false,
        message: `Error importing CSV: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
      setCsvPasteContent('');
    }
  };
  
  // Handle import from CSV file
  const handleImportCSV = () => {
    if (!importFile) return;
    
    setIsProcessing(true);
    setProcessingResult(null);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target.result;
        const importedClients = csvToClients(csvContent);
        
        if (importedClients && importedClients.length > 0) {
          // Create new clients with the imported data
          if (onClientsUpdate && allClients) {
            const newClients = importedClients.map(importedClient => ({
              id: generateClientId(),
              profile: {
                ...importedClient.profile,
                createdDate: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                isActive: true,
                isArchived: false
              },
              scenarios: [
                {
                  id: 1,
                  name: 'Base Case',
                  isActive: true,
                  createdDate: new Date().toISOString(),
                  lastModified: new Date().toISOString(),
                  data: {}
                }
              ]
            }));
            
            // Add the new clients to the clients list
            onClientsUpdate([...allClients, ...newClients]);
          }
          
          setProcessingResult({
            success: true,
            message: `Successfully imported ${importedClients.length} client(s) from ${importFile.name}`
          });
        } else {
          setProcessingResult({
            success: false,
            message: `Invalid or empty client data in the CSV file`
          });
        }
      } catch (error) {
        setProcessingResult({
          success: false,
          message: `Error importing CSV: ${error.message}`
        });
      } finally {
        setIsProcessing(false);
        setImportFile(null);
      }
    };
    
    reader.onerror = () => {
      setProcessingResult({
        success: false,
        message: `Error reading the file: ${reader.error}`
      });
      setIsProcessing(false);
      setImportFile(null);
    };
    
    reader.readAsText(importFile);
  };
  
  // Handle create backup
  const handleCreateBackup = () => {
    if (!allClients || allClients.length === 0) return;
    
    const backup = createBackup(allClients);
    const fileName = `tax_on_a_me_backup_${new Date().toISOString().split('T')[0]}.json`;
    downloadBackup(backup, fileName);
    
    setProcessingResult({
      success: true,
      message: `Successfully created backup of ${allClients.length} clients to ${fileName}`
    });
  };
  
  // Handle restore from backup
  const handleRestoreFromBackup = () => {
    if (!backupFile) return;
    
    setIsProcessing(true);
    setProcessingResult(null);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backupContent = JSON.parse(e.target.result);
        const restoredClients = restoreFromBackup(backupContent);
        
        if (restoredClients && Array.isArray(restoredClients) && restoredClients.length > 0) {
          if (onClientsUpdate) {
            onClientsUpdate(restoredClients);
          }
          
          setProcessingResult({
            success: true,
            message: `Successfully restored ${restoredClients.length} clients from backup`
          });
        } else {
          setProcessingResult({
            success: false,
            message: `Invalid or empty backup data`
          });
        }
      } catch (error) {
        setProcessingResult({
          success: false,
          message: `Error restoring from backup: ${error.message}`
        });
      } finally {
        setIsProcessing(false);
        setBackupFile(null);
        setShowRestoreConfirm(false);
      }
    };
    
    reader.onerror = () => {
      setProcessingResult({
        success: false,
        message: `Error reading the backup file: ${reader.error}`
      });
      setIsProcessing(false);
      setBackupFile(null);
      setShowRestoreConfirm(false);
    };
    
    reader.readAsText(backupFile);
  };
  
  return (
    <div className="data-import-export">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>
        
        {/* Export Tab */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Client Data</CardTitle>
              <CardDescription>
                Export client data to various formats for external use
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Export Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-scenarios" 
                      checked={exportOptions.includeScenarios}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeScenarios: !!checked }))
                      }
                    />
                    <Label htmlFor="include-scenarios">Include Scenarios</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-notes" 
                      checked={exportOptions.includeNotes}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeNotes: !!checked }))
                      }
                    />
                    <Label htmlFor="include-notes">Include Notes</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-action-items" 
                      checked={exportOptions.includeActionItems}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeActionItems: !!checked }))
                      }
                    />
                    <Label htmlFor="include-action-items">Include Action Items</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-documents" 
                      checked={exportOptions.includeDocuments}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeDocuments: !!checked }))
                      }
                    />
                    <Label htmlFor="include-documents">Include Documents</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Export Current Client</h3>
                
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={handleExportCSV}
                    disabled={!client}
                    className="flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Export to CSV
                  </Button>
                  
                  <Button 
                    onClick={handleExportExcel}
                    disabled={!client}
                    className="flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Export to Excel
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Export All Clients</h3>
                
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={handleExportAllClientsCSV}
                    disabled={!allClients || allClients.length === 0}
                    className="flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Export All Clients to CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Import Tab */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Client Data</CardTitle>
              <CardDescription>
                Import client data from CSV files or paste directly
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Import from CSV File</h3>
                
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="max-w-md"
                  />
                  
                  <Button
                    onClick={handleImportCSV}
                    disabled={!importFile || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Import
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Paste CSV Content</h3>
                
                <div className="space-y-4">
                  <Textarea
                    className="w-full h-40 p-2 border border-gray-300 rounded-md"
                    placeholder="Paste CSV content here..."
                    value={csvPasteContent}
                    onChange={(e) => setCsvPasteContent(e.target.value)}
                  />
                  
                  <Button
                    onClick={handleImportCSVFromPaste}
                    disabled={!csvPasteContent || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Import from Paste
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-2">
                <Info size={16} className="text-blue-500 mt-1" />
                <div>
                  <p className="text-sm text-blue-700">
                    <strong>CSV Format:</strong> The CSV file should have headers in the first row.
                    Required columns: clientName, primaryContact, email, phone, clientType.
                    Optional columns: street, city, state, zipCode, riskProfile, planningGoals, tags, isArchived.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>
                Create PDF reports for clients
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Report Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="report-include-scenarios" 
                      checked={reportOptions.includeScenarios}
                      onCheckedChange={(checked) => 
                        setReportOptions(prev => ({ ...prev, includeScenarios: !!checked }))
                      }
                    />
                    <Label htmlFor="report-include-scenarios">Include Scenarios</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="report-include-notes" 
                      checked={reportOptions.includeNotes}
                      onCheckedChange={(checked) => 
                        setReportOptions(prev => ({ ...prev, includeNotes: !!checked }))
                      }
                    />
                    <Label htmlFor="report-include-notes">Include Notes</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="report-include-action-items" 
                      checked={reportOptions.includeActionItems}
                      onCheckedChange={(checked) => 
                        setReportOptions(prev => ({ ...prev, includeActionItems: !!checked }))
                      }
                    />
                    <Label htmlFor="report-include-action-items">Include Action Items</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Generate Reports</h3>
                
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={handleGeneratePdfReport}
                    disabled={!client || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Generate Client Report
                  </Button>
                  
                  <Button 
                    onClick={handleGenerateTaxSummaryReport}
                    disabled={!client || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Generate Tax Summary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Backup & Restore Tab */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>
                Create backups of your client data or restore from previous backups
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Create Backup</h3>
                
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={handleCreateBackup}
                    disabled={!allClients || allClients.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    Create Backup
                  </Button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-2">
                  <Info size={16} className="text-blue-500 mt-1" />
                  <div>
                    <p className="text-sm text-blue-700">
                      <strong>Backup Format:</strong> Backups are saved as JSON files containing all client data.
                      Store these files securely as they contain all your client information.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Restore from Backup</h3>
                
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleBackupFileSelect}
                    className="max-w-md"
                  />
                  
                  <Button 
                    onClick={() => setShowRestoreConfirm(true)}
                    disabled={!backupFile || isProcessing}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Restore from Backup
                  </Button>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-2">
                  <AlertCircle size={16} className="text-yellow-500 mt-1" />
                  <div>
                    <p className="text-sm text-yellow-700">
                      <strong>Warning:</strong> Restoring from a backup will replace all existing client data.
                      This action cannot be undone. Make sure to create a backup of your current data first.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Processing Result Alert */}
      {processingResult && (
        <div className={`mt-6 p-4 border rounded-md flex items-start gap-2 ${
          processingResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {processingResult.success ? (
            <CheckCircle size={16} className="text-green-500 mt-1" />
          ) : (
            <XCircle size={16} className="text-red-500 mt-1" />
          )}
          <div>
            <p className={`text-sm ${
              processingResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {processingResult.message}
            </p>
          </div>
        </div>
      )}
      
      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will replace all existing client data with the data from the backup file.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreFromBackup}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Restore from Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DataImportExport;

