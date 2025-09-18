import React from 'react';

const SocialSecurityAnalysisModule = ({ 
  calculations, 
  incomeSources, 
  assets,
  settings, 
  taxpayer,
  spouse,
  reportSettings 
}) => {
  // Only use Social Security tab data (FRA amounts), not income sources
  const taxpayerFRA = taxpayer?.fraAmount || 0;
  const spouseFRA = spouse?.fraAmount || 0;
  const hasSocialSecurityData = taxpayerFRA > 0 || spouseFRA > 0;
  
  if (!hasSocialSecurityData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-blue-600 font-semibold">SS</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Social Security Analysis</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">📋 Social Security Data Required</div>
          <div className="text-gray-600">
            Please enter FRA benefit amounts on the <strong>Social Security tab</strong> to view this analysis.
          </div>
          <div className="text-sm text-gray-500 mt-2">
            This section uses Full Retirement Age (FRA) amounts, not current income sources.
          </div>
        </div>
      </div>
    );
  }

  // Calculate individual and combined benefits
  const taxpayerMonthlyFRA = taxpayerFRA;
  const taxpayerAnnualFRA = taxpayerFRA * 12;
  const spouseMonthlyFRA = spouseFRA;
  const spouseAnnualFRA = spouseFRA * 12;
  const combinedMonthlyFRA = taxpayerFRA + spouseFRA;
  const combinedAnnualFRA = combinedMonthlyFRA * 12;
  
  // Use provisional income from calculations or estimate based on total income
  const provisionalIncome = calculations?.socialSecurity?.provisionalIncome || 
    (calculations?.totalIncome ? Math.round(calculations.totalIncome * 0.85) : 55000);
  
  // Calculate taxation for combined benefits
  const taxableAmount = combinedAnnualFRA * 0.85; // Assume 85% taxable for planning
  const taxationPercentage = 85;
  
  // Use reasonable defaults for planning parameters
  const lifeExpectancy = 85;
  const yearsWorked = 35;
  const discountRate = 3;
  const colaRate = 2.5;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-blue-600 font-semibold">SS</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Social Security Analysis</h3>
      </div>
      
      <div className="space-y-6">
        {/* Individual and Combined Benefits Overview */}
        <div className="space-y-4">
          {/* Individual Spouse Benefits */}
          {taxpayerFRA > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Primary Taxpayer Social Security</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Monthly FRA Benefit</p>
                  <p className="text-xl font-bold text-blue-600">${taxpayerMonthlyFRA.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Annual Benefits</p>
                  <p className="text-xl font-bold text-blue-600">${taxpayerAnnualFRA.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          {spouseFRA > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Spouse Social Security</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Monthly FRA Benefit</p>
                  <p className="text-xl font-bold text-purple-600">${spouseMonthlyFRA.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Annual Benefits</p>
                  <p className="text-xl font-bold text-purple-600">${spouseAnnualFRA.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Combined Benefits */}
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <h4 className="font-medium text-gray-900 mb-3">Combined Household Benefits</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Monthly FRA</p>
                <p className="text-2xl font-bold text-green-600">${combinedMonthlyFRA.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Full Retirement Age</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Annual Benefits</p>
                <p className="text-2xl font-bold text-green-600">${combinedAnnualFRA.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Combined yearly income</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Analysis */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Tax Impact Analysis</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Provisional Income</p>
              <p className="text-lg font-semibold text-gray-900">${provisionalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Taxable Portion</p>
              <p className="text-lg font-semibold text-orange-600">{taxationPercentage}%</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Taxable Amount</p>
              <p className="text-lg font-semibold text-red-600">${taxableAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Planning Insights */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Planning Insights</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Life Expectancy Planning</p>
                <p className="text-sm text-gray-600">Based on age {lifeExpectancy}, total lifetime benefits estimated at ${(combinedAnnualFRA * (lifeExpectancy - 67)).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">COLA Adjustments</p>
                <p className="text-sm text-gray-600">With {colaRate}% annual increases, benefits will grow to maintain purchasing power</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-gray-900">Tax Optimization</p>
                <p className="text-sm text-gray-600">Current provisional income of ${provisionalIncome.toLocaleString()} results in {taxationPercentage}% taxation</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Optimization Strategies */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Optimization Strategies</h4>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>Manage provisional income through strategic withdrawals to reduce Social Security taxation</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>Consider Roth conversions during lower-income years to reduce future RMDs</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>Evaluate claiming strategy timing - delaying benefits increases monthly payments by 8% per year</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>Coordinate with other retirement income sources to optimize overall tax efficiency</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>Use tax-free income sources (Roth IRA, municipal bonds) to stay below taxation thresholds</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialSecurityAnalysisModule;

