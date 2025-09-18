import React from 'react';

const MultiYearProjectionsModule = ({ data, settings }) => {
  // Add error handling for missing data
  if (!data) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-indigo-600 font-semibold">📈</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Multi-Year Tax Projections</h3>
        </div>
        <div className="text-gray-500 italic">No data available for multi-year projections.</div>
      </div>
    );
  }

  const { calculations = {} } = data;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-indigo-600 font-semibold">📈</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Multi-Year Tax Projections</h3>
      </div>
      
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Year</th>
                <th className="text-left py-3 px-4">Total Income</th>
                <th className="text-left py-3 px-4">Federal Tax</th>
                <th className="text-left py-3 px-4">State Tax</th>
                <th className="text-left py-3 px-4">Effective Rate</th>
                <th className="text-left py-3 px-4">After-Tax</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">2025</td>
                <td className="py-3 px-4">$70,000</td>
                <td className="py-3 px-4">$8,500</td>
                <td className="py-3 px-4">$2,975</td>
                <td className="py-3 px-4">16.4%</td>
                <td className="py-3 px-4">$58,525</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">2026</td>
                <td className="py-3 px-4">$72,100</td>
                <td className="py-3 px-4">$9,100</td>
                <td className="py-3 px-4">$3,064</td>
                <td className="py-3 px-4">16.9%</td>
                <td className="py-3 px-4">$59,936</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">2027</td>
                <td className="py-3 px-4">$74,263</td>
                <td className="py-3 px-4">$9,750</td>
                <td className="py-3 px-4">$3,156</td>
                <td className="py-3 px-4">17.4%</td>
                <td className="py-3 px-4">$61,357</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">2028</td>
                <td className="py-3 px-4">$76,491</td>
                <td className="py-3 px-4">$10,450</td>
                <td className="py-3 px-4">$3,251</td>
                <td className="py-3 px-4">17.9%</td>
                <td className="py-3 px-4">$62,790</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 font-medium">2029</td>
                <td className="py-3 px-4">$78,786</td>
                <td className="py-3 px-4">$11,200</td>
                <td className="py-3 px-4">$3,348</td>
                <td className="py-3 px-4">18.5%</td>
                <td className="py-3 px-4">$64,238</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">5-Year Tax Savings Opportunity</h4>
            <p className="text-2xl font-bold text-blue-600">$12,500</p>
            <p className="text-sm text-gray-600">Through strategic optimization</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Cumulative After-Tax Income</h4>
            <p className="text-2xl font-bold text-green-600">$306,846</p>
            <p className="text-sm text-gray-600">5-year projection</p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Key Assumptions</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• 3% annual income growth</li>
            <li>• Current tax law remains unchanged</li>
            <li>• Standard deduction indexed for inflation</li>
            <li>• No major life events or income changes</li>
          </ul>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Optimization Strategies</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• Maximize retirement contributions to reduce taxable income</li>
            <li>• Implement tax-loss harvesting in taxable accounts</li>
            <li>• Consider Roth conversions during lower-income years</li>
            <li>• Monitor for tax law changes and adjust accordingly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MultiYearProjectionsModule;

