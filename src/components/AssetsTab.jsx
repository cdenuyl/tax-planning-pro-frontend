import React, { useState, useEffect } from 'react';

const AssetsTab = ({ 
  assets, 
  setAssets, 
  incomeSources, 
  setIncomeSources, 
  taxpayer, 
  spouse,
  formatCurrency 
}) => {
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'traditional-ira',
    owner: 'taxpayer',
    currentValue: 0,
    hasIncomeSource: false,
    incomeAmount: 0,
    enabled: true,
    linkToExistingIncome: false,
    existingIncomeSourceId: null,
    // Annuity-specific fields
    annuityType: 'immediate',
    qualifiedStatus: 'qualified',
    annuitizationDate: '',
    exclusionRatio: 0,
    // Life Insurance-specific fields
    policyType: 'whole-life',
    cashValue: 0,
    premiumsPaid: 0,
    deathBenefit: 0,
    isMEC: false,
    accessMethod: 'withdrawal',
    loanBalance: 0
  });

  // Asset-based income types (these can have account values)
  const assetBasedIncomeTypes = [
    'traditional-ira', 'roth-ira', 'traditional-401k', 'roth-401k', 
    '403b', '457', 'sep-ira', 'simple-ira', 'annuity', 'life-insurance', 'brokerage', 
    'savings', 'cd', 'real-estate', 'business'
  ];

  // Liquid asset types (for drawdown calculations)
  const liquidAssetTypes = [
    'traditional-ira', 'roth-ira', 'traditional-401k', 'roth-401k', 
    '403b', '457', 'sep-ira', 'simple-ira', 'annuity', 'life-insurance', 'brokerage', 
    'savings', 'cd'
  ];

  // Illiquid asset types (complex tax treatment, not included in drawdown)
  const illiquidAssetTypes = ['real-estate', 'business'];

  // Income-only types (these should not appear in asset types)
  const incomeOnlyTypes = ['wages', 'pension', 'social-security', 'interest', 'dividends', 'qualified-dividends', 'other'];

  // Tax treatment categorization
  const getTaxTreatment = (assetType) => {
    // Tax-deferred (Traditional retirement accounts)
    const taxDeferred = ['traditional-ira', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira'];
    // Tax-free (Roth accounts)
    const taxFree = ['roth-ira', 'roth-401k'];
    // Tax-advantaged (Special tax treatment)
    const taxAdvantaged = ['life-insurance'];
    // Taxable/After-tax (Everything else)
    const taxable = ['annuity', 'brokerage', 'savings', 'cd', 'real-estate', 'business', 'other'];

    if (taxDeferred.includes(assetType)) return 'tax-deferred';
    if (taxFree.includes(assetType)) return 'tax-free';
    if (taxAdvantaged.includes(assetType)) return 'tax-advantaged';
    return 'taxable';
  };

  // Get color classes for tax treatment
  const getTaxTreatmentColors = (treatment) => {
    switch (treatment) {
      case 'tax-deferred':
        return {
          bg: 'bg-red-50',
          text: 'text-red-800',
          border: 'border-red-200'
        };
      case 'tax-free':
        return {
          bg: 'bg-green-50',
          text: 'text-green-800',
          border: 'border-green-200'
        };
      case 'tax-advantaged':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-200'
        };
      case 'taxable':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-800',
          border: 'border-yellow-200'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-800',
          border: 'border-gray-200'
        };
    }
  };

  // Asset type options (filtered to exclude income-only types)
  const assetTypes = [
    { value: 'traditional-ira', label: 'Traditional IRA' },
    { value: 'roth-ira', label: 'Roth IRA' },
    { value: 'traditional-401k', label: 'Traditional 401(k)' },
    { value: 'roth-401k', label: 'Roth 401(k)' },
    { value: '403b', label: '403(b)' },
    { value: '457', label: '457 Plan' },
    { value: 'sep-ira', label: 'SEP-IRA' },
    { value: 'simple-ira', label: 'SIMPLE-IRA' },
    { value: 'annuity', label: 'Annuity' },
    { value: 'life-insurance', label: 'Life Insurance' },
    { value: 'brokerage', label: 'Brokerage Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'cd', label: 'Certificate of Deposit' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'business', label: 'Business Interest' },
    { value: 'other', label: 'Other Asset' }
  ];

  // Get existing income sources that could be linked to assets
  const linkableIncomeSources = incomeSources.filter(source => 
    assetBasedIncomeTypes.includes(source.type) && !source.isFromAsset
  );

  // Reset form when modal closes
  useEffect(() => {
    if (!showAddAssetModal && !editingAsset) {
      setNewAsset({
        name: '',
        type: 'traditional-ira',
        owner: 'taxpayer',
        currentValue: 0,
        hasIncomeSource: false,
        incomeAmount: 0,
        enabled: true,
        linkToExistingIncome: false,
        existingIncomeSourceId: null,
        // Annuity-specific fields
        annuityType: 'immediate',
        qualifiedStatus: 'qualified',
        annuitizationDate: '',
        exclusionRatio: 0,
        // Life Insurance-specific fields
        policyType: 'whole-life',
        cashValue: 0,
        premiumsPaid: 0,
        deathBenefit: 0,
        isMEC: false,
        accessMethod: 'withdrawal',
        loanBalance: 0
      });
    }
  }, [showAddAssetModal, editingAsset]);

  // Load asset data when editing
  useEffect(() => {
    if (editingAsset) {
      setNewAsset({ ...editingAsset });
    }
  }, [editingAsset]);

  const handleAddAsset = () => {
    const assetId = editingAsset ? editingAsset.id : Date.now().toString();
    const asset = {
      ...newAsset,
      id: assetId,
      currentValue: parseFloat(newAsset.currentValue) || 0,
      incomeAmount: parseFloat(newAsset.incomeAmount) || 0
    };

    if (editingAsset) {
      // Update existing asset
      setAssets(prev => prev.map(a => a.id === assetId ? asset : a));
      
      // Update corresponding income source if it exists
      if (asset.hasIncomeSource && !asset.linkToExistingIncome) {
        const incomeSourceId = `asset-${assetId}`;
        setIncomeSources(prev => prev.map(source => 
          source.id === incomeSourceId 
            ? {
                ...source,
                name: asset.name,
                type: asset.type,
                owner: asset.owner,
                amount: asset.incomeAmount,
                accountValue: asset.currentValue,
                enabled: asset.enabled
              }
            : source
        ));
      } else if (!asset.hasIncomeSource) {
        // Remove income source if hasIncomeSource is false
        setIncomeSources(prev => prev.filter(source => source.id !== `asset-${assetId}`));
      }
    } else {
      // Add new asset
      setAssets(prev => [...prev, asset]);
      
      if (asset.linkToExistingIncome && asset.existingIncomeSourceId) {
        // Link to existing income source
        const existingIncomeSource = incomeSources.find(s => s.id === asset.existingIncomeSourceId);
        
        setIncomeSources(prev => prev.map(source => 
          source.id === asset.existingIncomeSourceId
            ? {
                ...source,
                accountValue: asset.currentValue,
                linkedAssetId: assetId
              }
            : source
        ));
        
        // Update asset to reflect the link and income amount
        setAssets(prev => prev.map(a => 
          a.id === assetId 
            ? {
                ...a,
                hasIncomeSource: true,
                linkedIncomeSourceId: asset.existingIncomeSourceId,
                incomeAmount: existingIncomeSource?.amount || 0
              }
            : a
        ));
      } else if (asset.hasIncomeSource && !asset.linkToExistingIncome) {
        // Create new income source
        const incomeSource = {
          id: `asset-${assetId}`,
          name: asset.name,
          type: asset.type,
          owner: asset.owner,
          amount: asset.incomeAmount,
          accountValue: asset.currentValue,
          enabled: asset.enabled,
          isFromAsset: true,
          linkedAssetId: assetId,
          isLiquidAsset: liquidAssetTypes.includes(asset.type),
          // For annuities, include additional details
          ...(asset.type === 'annuity' && {
            annuityType: asset.annuityType,
            qualifiedStatus: asset.qualifiedStatus,
            annuitizationDate: asset.annuitizationDate,
            exclusionRatio: asset.exclusionRatio
          }),
          // For life insurance, include additional details
          ...(asset.type === 'life-insurance' && {
            policyType: asset.policyType,
            cashValue: asset.cashValue,
            premiumsPaid: asset.premiumsPaid,
            deathBenefit: asset.deathBenefit,
            isMEC: asset.isMEC,
            accessMethod: asset.accessMethod,
            loanBalance: asset.loanBalance
          })
        };
        setIncomeSources(prev => [...prev, incomeSource]);
      }
    }

    setShowAddAssetModal(false);
    setEditingAsset(null);
  };

  const handleDeleteAsset = (assetId) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    // Also remove corresponding income source
    setIncomeSources(prev => prev.filter(source => source.id !== `asset-${assetId}`));
  };

  const handleToggleIncomeSource = (asset) => {
    const incomeSourceId = `asset-${asset.id}`;
    const existingIncomeSource = incomeSources.find(source => source.id === incomeSourceId);

    if (existingIncomeSource) {
      // Remove income source
      setIncomeSources(prev => prev.filter(source => source.id !== incomeSourceId));
      setAssets(prev => prev.map(a => 
        a.id === asset.id ? { ...a, hasIncomeSource: false, incomeAmount: 0 } : a
      ));
    } else {
      // Add income source
      const incomeSource = {
        id: incomeSourceId,
        name: asset.name,
        type: asset.type,
        owner: asset.owner,
        amount: 0,
        accountValue: asset.currentValue,
        enabled: true,
        isFromAsset: true
      };
      setIncomeSources(prev => [...prev, incomeSource]);
      setAssets(prev => prev.map(a => 
        a.id === asset.id ? { ...a, hasIncomeSource: true } : a
      ));
    }
  };

  const getAssetTypeLabel = (type) => {
    const assetType = assetTypes.find(t => t.value === type);
    return assetType ? assetType.label : type;
  };

  const getWithdrawalRate = (asset) => {
    if (!asset.currentValue || asset.currentValue === 0) return 0;
    
    // Find the linked income source - either created by this asset or linked to existing
    const incomeSource = asset.linkedIncomeSourceId 
      ? incomeSources.find(source => source.id === asset.linkedIncomeSourceId)
      : incomeSources.find(source => source.id === `asset-${asset.id}`);
    
    // Only calculate rate if income source is enabled
    const incomeAmount = (incomeSource && incomeSource.enabled) 
      ? incomeSource.amount 
      : 0;
    
    return ((incomeAmount / asset.currentValue) * 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assets</h3>
        <button
          onClick={() => setShowAddAssetModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Add Asset
        </button>
      </div>

      {/* Liquid Asset Drawdown Summary */}
      {assets.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Liquid Asset Drawdown Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const liquidAssets = assets.filter(asset => liquidAssetTypes.includes(asset.type));
              const totalLiquidValue = liquidAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
              const totalLiquidIncome = liquidAssets.reduce((sum, asset) => {
                // Find the linked income source - either created by this asset or linked to existing
                const incomeSource = asset.linkedIncomeSourceId 
                  ? incomeSources.find(source => source.id === asset.linkedIncomeSourceId)
                  : incomeSources.find(source => source.id === `asset-${asset.id}`);
                
                // Only include income if the source is enabled
                const incomeAmount = (incomeSource && incomeSource.enabled) 
                  ? incomeSource.amount 
                  : 0;
                
                return sum + incomeAmount;
              }, 0);
              const overallDrawdownRate = totalLiquidValue > 0 ? ((totalLiquidIncome / totalLiquidValue) * 100) : 0;
              
              return (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalLiquidValue)}</div>
                    <div className="text-xs text-blue-600">Total Liquid Assets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{formatCurrency(totalLiquidIncome)}</div>
                    <div className="text-xs text-green-600">Annual Income Draw</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      overallDrawdownRate > 4 ? 'text-red-600' : 
                      overallDrawdownRate > 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {overallDrawdownRate.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-600">Overall Drawdown Rate</div>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="mt-3 text-xs text-blue-700">
            <p>
              <strong>Note:</strong> This analysis includes only liquid assets (IRAs, 401(k)s, brokerage accounts, etc.). 
              Real estate and business interests are excluded due to complex tax implications.
            </p>
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {assets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg mb-2">No assets added yet</div>
            <div className="text-sm">Add assets to track account values and income draws</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income Draw</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Withdrawal Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  // Debug: Log assets array to see if there are duplicates
                  console.log('AssetsTab rendering assets:', assets.length, 'assets');
                  console.log('Asset IDs:', assets.map(a => a.id));
                  console.log('Asset Names:', assets.map(a => a.name));
                  
                  // Check for duplicate IDs
                  const ids = assets.map(a => a.id);
                  const uniqueIds = [...new Set(ids)];
                  if (ids.length !== uniqueIds.length) {
                    console.warn('DUPLICATE ASSET IDs DETECTED!', ids);
                  }
                  
                  return assets.map((asset) => {
                    // Find the linked income source - either created by this asset or linked to existing
                    const incomeSource = asset.linkedIncomeSourceId 
                      ? incomeSources.find(source => source.id === asset.linkedIncomeSourceId)
                      : incomeSources.find(source => source.id === `asset-${asset.id}`);
                    
                    // Only show income amount if the income source is enabled
                    const incomeAmount = (incomeSource && incomeSource.enabled) 
                      ? incomeSource.amount : 0;
                    const withdrawalRate = getWithdrawalRate(asset);
                    const taxTreatment = getTaxTreatment(asset.type);
                    const colors = getTaxTreatmentColors(taxTreatment);
                    
                    return (
                    <tr key={asset.id} className={`hover:bg-gray-100 ${colors.bg} ${colors.border} border-l-4`}>
                      <td className={`px-4 py-3 text-sm font-medium ${colors.text}`}>{asset.name}</td>
                      <td className={`px-4 py-3 text-sm ${colors.text}`}>{getAssetTypeLabel(asset.type)}</td>
                      <td className={`px-4 py-3 text-sm ${colors.text} capitalize`}>{asset.owner}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${colors.text}`}>{formatCurrency(asset.currentValue)}</td>
                      <td className="px-4 py-3 text-sm">
                        {incomeAmount > 0 && incomeSource && incomeSource.enabled ? (
                          <span className="text-green-600 font-medium">{formatCurrency(incomeAmount)}</span>
                        ) : incomeSource && !incomeSource.enabled ? (
                          <span className="text-gray-400 italic">Income disabled</span>
                        ) : (
                          <span className="text-gray-400">No income draw</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {incomeAmount > 0 && asset.currentValue > 0 && incomeSource && incomeSource.enabled ? (
                          <span className={`font-medium ${
                            parseFloat(withdrawalRate) > 4 ? 'text-red-600' : 
                            parseFloat(withdrawalRate) > 3 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {withdrawalRate}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleIncomeSource(asset)}
                            className={`px-2 py-1 text-xs rounded ${
                              incomeSource 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {incomeSource ? 'Remove Income' : 'Add Income'}
                          </button>
                          <button
                            onClick={() => setEditingAsset(asset)}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  });
                })()}
              </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Tax Treatment Totals */}
      {assets.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-lg font-semibold mb-4 text-gray-900">Tax Treatment Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {(() => {
              // Calculate totals by tax treatment
              const taxDeferredTotal = assets
                .filter(asset => getTaxTreatment(asset.type) === 'tax-deferred')
                .reduce((sum, asset) => sum + asset.currentValue, 0);
              
              const taxableTotal = assets
                .filter(asset => getTaxTreatment(asset.type) === 'taxable')
                .reduce((sum, asset) => sum + asset.currentValue, 0);
              
              const taxFreeTotal = assets
                .filter(asset => getTaxTreatment(asset.type) === 'tax-free')
                .reduce((sum, asset) => sum + asset.currentValue, 0);
              
              const taxAdvantagedTotal = assets
                .filter(asset => getTaxTreatment(asset.type) === 'tax-advantaged')
                .reduce((sum, asset) => sum + asset.currentValue, 0);
              
              const grandTotal = taxDeferredTotal + taxableTotal + taxFreeTotal + taxAdvantagedTotal;

              return (
                <>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-700">{formatCurrency(taxDeferredTotal)}</div>
                    <div className="text-sm text-red-600 font-medium">Tax-Deferred</div>
                    <div className="text-xs text-red-500">Traditional IRA, 401(k), etc.</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">{formatCurrency(taxableTotal)}</div>
                    <div className="text-sm text-yellow-600 font-medium">Taxable</div>
                    <div className="text-xs text-yellow-500">Savings, CDs, Brokerage, etc.</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{formatCurrency(taxFreeTotal)}</div>
                    <div className="text-sm text-green-600 font-medium">Tax-Free</div>
                    <div className="text-xs text-green-500">Roth IRA, Roth 401(k), etc.</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(taxAdvantagedTotal)}</div>
                    <div className="text-sm text-blue-600 font-medium">Tax-Advantaged</div>
                    <div className="text-xs text-blue-500">Life Insurance, etc.</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-700">{formatCurrency(grandTotal)}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Assets</div>
                    <div className="text-xs text-gray-500">All asset types combined</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Required Minimum Distribution (RMD) Analysis */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="text-lg font-semibold mb-3 text-gray-900">RMD Analysis & Strategy</h4>

        {(() => {
          // Calculate RMD information
          const currentYear = new Date().getFullYear();
          const taxpayerAge = taxpayer?.dateOfBirth ? 
            currentYear - new Date(taxpayer.dateOfBirth).getFullYear() : 74;
          const spouseAge = spouse?.dateOfBirth ? 
            currentYear - new Date(spouse.dateOfBirth).getFullYear() : null;

          // RMD-eligible accounts
          const rmdAccounts = assets.filter(a => 
            ['traditional-ira', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira'].includes(a.type)
          );

          // Simple RMD calculation (using approximate life expectancy factors)
          const getRmdFactor = (age) => {
            if (age >= 73 && age <= 75) return 27.4 - (age - 73) * 1.1;
            if (age >= 76 && age <= 80) return 24.0 - (age - 76) * 0.8;
            if (age >= 81 && age <= 85) return 20.2 - (age - 81) * 0.7;
            return 15.0; // Simplified for very old ages
          };

          const calculateRmd = (asset, age) => {
            if (age < 73) return { amount: 0, isEstimated: false };
            
            // Use actual RMD if specified
            if (asset.rmdMethod === 'actual' && asset.actualRmd) {
              return { amount: asset.actualRmd, isEstimated: false };
            }
            
            // Use prior year value if available, otherwise current value
            const valueForRmd = asset.priorYearValue || asset.currentValue;
            const factor = getRmdFactor(age);
            return { amount: valueForRmd / factor, isEstimated: true };
          };

          // Calculate total required RMDs
          const totalRequiredRmd = rmdAccounts.reduce((sum, account) => {
            const ownerAge = account.owner === 'taxpayer' ? taxpayerAge : spouseAge;
            const rmdResult = ownerAge >= 73 ? calculateRmd(account, ownerAge) : { amount: 0, isEstimated: false };
            return sum + rmdResult.amount;
          }, 0);

          // Calculate current qualified withdrawals from income sources
          const qualifiedIncomeTypes = ['traditional-ira', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira'];
          const currentQualifiedWithdrawals = incomeSources
            .filter(source => source.enabled && qualifiedIncomeTypes.includes(source.type))
            .reduce((sum, source) => sum + (source.amount || 0), 0);

          const rmdShortfall = Math.max(0, totalRequiredRmd - currentQualifiedWithdrawals);
          const hasRmdRequirement = taxpayerAge >= 73 || (spouseAge && spouseAge >= 73);

          // Get qualified income sources that could be increased
          const adjustableQualifiedSources = incomeSources.filter(source => 
            source.enabled && qualifiedIncomeTypes.includes(source.type)
          );

          return (
            <div className="space-y-4">
              {/* RMD Status Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{formatCurrency(totalRequiredRmd)}</div>
                  <div className="text-xs text-gray-600">Required RMDs</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{formatCurrency(currentQualifiedWithdrawals)}</div>
                  <div className="text-xs text-gray-600">Current Qualified Withdrawals</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{formatCurrency(rmdShortfall)}</div>
                  <div className="text-xs text-gray-600">Additional Needed</div>
                </div>
              </div>

              {/* RMD Drawdown Strategy */}
              {hasRmdRequirement && rmdShortfall > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <div className="text-sm font-medium text-gray-900 mb-2">RMD Shortfall Strategy:</div>
                  <div className="text-sm text-gray-700 mb-3">
                    You need an additional {formatCurrency(rmdShortfall)} in qualified withdrawals to meet RMD requirements.
                  </div>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        // Add new RMD income source with properly rounded amount
                        const roundedShortfall = Math.round(rmdShortfall * 100) / 100;
                        const newRmdSource = {
                          id: Date.now(),
                          type: 'traditional-ira',
                          description: 'Additional RMD Withdrawal',
                          amount: roundedShortfall,
                          enabled: true,
                          isFromAsset: false
                        };
                        setIncomeSources(prev => [...prev, newRmdSource]);
                      }}
                      className="w-full text-left px-3 py-2 bg-green-100 hover:bg-green-200 rounded text-sm font-medium text-green-800"
                    >
                      + Add {formatCurrency(rmdShortfall)} as new RMD income source
                    </button>
                    
                    {adjustableQualifiedSources.length > 0 && (
                      <div className="text-xs text-gray-600 mb-1">Or increase existing qualified source:</div>
                    )}
                    
                    {adjustableQualifiedSources.map(source => (
                      <button
                        key={source.id}
                        onClick={() => {
                          // Increase existing qualified source with properly rounded amount
                          const roundedShortfall = Math.round(rmdShortfall * 100) / 100;
                          setIncomeSources(prev => prev.map(s => 
                            s.id === source.id 
                              ? { ...s, amount: Math.round(((s.amount || 0) + roundedShortfall) * 100) / 100 }
                              : s
                          ));
                        }}
                        className="w-full text-left px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-sm text-blue-800"
                      >
                        Increase "{source.description}" by {formatCurrency(rmdShortfall)} 
                        <span className="text-xs text-blue-600">
                          ({formatCurrency(source.amount)} → {formatCurrency((source.amount || 0) + rmdShortfall)})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* RMD Account Details (Compact) */}
              {rmdAccounts.length > 0 && (
                <div className="text-xs text-gray-600">
                  <strong>RMD Accounts:</strong> {rmdAccounts.map(account => {
                    const ownerAge = account.owner === 'taxpayer' ? taxpayerAge : spouseAge;
                    const rmdResult = ownerAge >= 73 ? calculateRmd(account, ownerAge) : { amount: 0, isEstimated: false };
                    const label = rmdResult.isEstimated ? ' (estimated)' : '';
                    return `${account.name} (${formatCurrency(rmdResult.amount)}${label})`;
                  }).join(', ')}
                </div>
              )}

              {!hasRmdRequirement && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-700">No RMDs required yet. RMDs begin at age 73.</div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Add/Edit Asset Modal */}
      {(showAddAssetModal || editingAsset) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingAsset ? 'Edit Asset' : 'Add New Asset'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., John's Traditional IRA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Type
                </label>
                <select
                  value={newAsset.type}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {assetTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner
                </label>
                <select
                  value={newAsset.owner}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, owner: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="taxpayer">{taxpayer.firstName || 'Taxpayer'}</option>
                  {spouse?.firstName && (
                    <option value="spouse">{spouse.firstName || 'Spouse'}</option>
                  )}
                  {/* Joint option for non-qualified accounts */}
                  {spouse?.firstName && !['traditional-ira', 'roth-ira', 'traditional-401k', 'roth-401k', '403b', '457', 'sep-ira', 'simple-ira'].includes(newAsset.type) && (
                    <option value="joint">Joint</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Value
                </label>
                <input
                  type="number"
                  value={newAsset.currentValue}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, currentValue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0"
                />
              </div>

              {/* Annuity-specific fields */}
              {newAsset.type === 'annuity' && (
                <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900">Annuity Details</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Annuity Type
                      </label>
                      <select
                        value={newAsset.annuityType}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, annuityType: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="deferred">Deferred</option>
                        <option value="variable">Variable</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Qualified Status
                      </label>
                      <select
                        value={newAsset.qualifiedStatus}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, qualifiedStatus: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="qualified">Qualified</option>
                        <option value="non-qualified">Non-Qualified</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Annuitization Date
                      </label>
                      <input
                        type="date"
                        value={newAsset.annuitizationDate}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, annuitizationDate: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Exclusion Ratio (%)
                      </label>
                      <input
                        type="number"
                        value={newAsset.exclusionRatio}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, exclusionRatio: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Life Insurance-specific fields */}
              {newAsset.type === 'life-insurance' && (
                <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900">Life Insurance Details</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Policy Type
                      </label>
                      <select
                        value={newAsset.policyType}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, policyType: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="whole-life">Whole Life</option>
                        <option value="universal-life">Universal Life</option>
                        <option value="variable-life">Variable Life</option>
                        <option value="term-life">Term Life</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Access Method
                      </label>
                      <select
                        value={newAsset.accessMethod}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, accessMethod: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="withdrawal">Withdrawal</option>
                        <option value="loan">Policy Loan</option>
                        <option value="combination">Combination</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cash Value ($)
                      </label>
                      <input
                        type="number"
                        value={newAsset.cashValue}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, cashValue: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Premiums Paid ($)
                      </label>
                      <input
                        type="number"
                        value={newAsset.premiumsPaid}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, premiumsPaid: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Death Benefit ($)
                      </label>
                      <input
                        type="number"
                        value={newAsset.deathBenefit}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, deathBenefit: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Loan Balance ($)
                      </label>
                      <input
                        type="number"
                        value={newAsset.loanBalance}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, loanBalance: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isMEC"
                      checked={newAsset.isMEC}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, isMEC: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="isMEC" className="text-xs font-medium text-gray-700">
                      Modified Endowment Contract (MEC)
                    </label>
                  </div>

                  {newAsset.isMEC && (
                    <div className="p-2 bg-amber-50 rounded border border-amber-200">
                      <p className="text-xs text-amber-800">
                        <strong>MEC Impact:</strong> Withdrawals are taxed as income first (LIFO), and may be subject to 10% early withdrawal penalty if under age 59½.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Warning for illiquid assets */}
              {illiquidAssetTypes.includes(newAsset.type) && (
                <div className="p-3 bg-amber-50 rounded-md border border-amber-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        Complex Tax Treatment
                      </h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p>
                          {newAsset.type === 'real-estate' ? 'Real estate' : 'Business interest'} income has complex tax implications and will not be included in liquid asset drawdown calculations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RMD Fields for qualified accounts */}
              {['traditional-ira', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira'].includes(newAsset.type) && (
                <div className="space-y-3 p-3 bg-orange-50 rounded-md border border-orange-200">
                  <h4 className="text-sm font-medium text-orange-900">RMD Information</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prior Year-End Value ($)
                      </label>
                      <input
                        type="number"
                        value={newAsset.priorYearValue || ''}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, priorYearValue: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="For more accurate RMDs"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        RMD Method
                      </label>
                      <select
                        value={newAsset.rmdMethod || 'estimated'}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, rmdMethod: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="estimated">Use Estimated RMD</option>
                        <option value="actual">Enter Actual RMD</option>
                      </select>
                    </div>
                  </div>

                  {newAsset.rmdMethod === 'actual' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Actual RMD Amount ($)
                        </label>
                        <input
                          type="number"
                          value={newAsset.actualRmd || ''}
                          onChange={(e) => setNewAsset(prev => ({ ...prev, actualRmd: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Enter known RMD amount"
                          min="0"
                        />
                      </div>

                      {/* Validation warning for missing prior year values */}
                      {(() => {
                        const qualifiedAccountTypes = ['traditional-ira', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira'];
                        const rmdEligibleAccounts = assets.filter(asset => {
                          if (!qualifiedAccountTypes.includes(asset.type)) return false;
                          const ownerAge = asset.owner === 'taxpayer' ? taxpayerAge : spouseAge;
                          return ownerAge >= 73 && !asset.priorYearValue;
                        });

                        if (rmdEligibleAccounts.length > 0) {
                          return (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                              <div className="flex items-start">
                                <svg className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="text-xs">
                                  <div className="font-medium text-amber-800 mb-1">Missing Prior Year-End Values</div>
                                  <div className="text-amber-700">
                                    For accurate actual RMDs, these accounts need prior year-end values:
                                  </div>
                                  <ul className="list-disc list-inside mt-1 text-amber-700">
                                    {rmdEligibleAccounts.map(account => (
                                      <li key={account.id}>{account.name} ({account.owner === 'taxpayer' ? taxpayer.firstName || 'Taxpayer' : spouse?.firstName || 'Spouse'})</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}

                  <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                    <strong>Note:</strong> RMDs are calculated using IRS Uniform Lifetime Table. 
                    {newAsset.rmdMethod === 'estimated' ? ' Values marked as "estimated" in calculations.' : ' Using your actual RMD amount.'}
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasIncomeSource"
                  checked={newAsset.hasIncomeSource}
                  onChange={(e) => setNewAsset(prev => ({ 
                    ...prev, 
                    hasIncomeSource: e.target.checked,
                    linkToExistingIncome: false,
                    existingIncomeSourceId: null
                  }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="hasIncomeSource" className="ml-2 text-sm text-gray-700">
                  Add as income source
                </label>
              </div>

              {newAsset.hasIncomeSource && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                  {/* Option to link to existing income source */}
                  {linkableIncomeSources.length > 0 && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="linkToExisting"
                        checked={newAsset.linkToExistingIncome}
                        onChange={(e) => setNewAsset(prev => ({ 
                          ...prev, 
                          linkToExistingIncome: e.target.checked,
                          existingIncomeSourceId: e.target.checked ? linkableIncomeSources[0]?.id : null
                        }))}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <label htmlFor="linkToExisting" className="ml-2 text-sm text-gray-700">
                        Link to existing income source
                      </label>
                    </div>
                  )}

                  {newAsset.linkToExistingIncome && linkableIncomeSources.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Existing Income Source
                      </label>
                      <select
                        value={newAsset.existingIncomeSourceId || ''}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, existingIncomeSourceId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {linkableIncomeSources.map(source => (
                          <option key={source.id} value={source.id}>
                            {source.name} (${formatCurrency(source.amount).replace('$', '')})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        This will add the account value to the selected income source
                      </p>
                    </div>
                  )}

                  {!newAsset.linkToExistingIncome && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Annual Income Draw
                      </label>
                      <input
                        type="number"
                        value={newAsset.incomeAmount}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, incomeAmount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will create a new income source
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddAssetModal(false);
                  setEditingAsset(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAsset}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingAsset ? 'Update Asset' : 'Add Asset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsTab;

