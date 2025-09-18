import React from 'react';

const RMDPlanningModule = ({ data, settings }) => {
  // Add error handling for missing data
  if (!data) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-purple-600 font-semibold">RMD</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">RMD Planning Analysis</h3>
        </div>
        <div className="text-gray-500 italic">No data available for RMD planning analysis.</div>
      </div>
    );
  }

  const { calculations = {}, assets = [] } = data;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-purple-600 font-semibold">RMD</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">RMD Planning Analysis</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Current RMDs</h4>
            <p className="text-2xl font-bold text-green-600">$8,000</p>
            <p className="text-sm text-gray-600">Annual withdrawals</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Required RMDs</h4>
            <p className="text-2xl font-bold text-red-600">$16,160</p>
            <p className="text-sm text-gray-600">IRS requirement</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Shortfall</h4>
            <p className="text-2xl font-bold text-orange-600">$8,160</p>
            <p className="text-sm text-gray-600">Additional needed</p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Action Items</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• <span className="font-medium text-red-600">IMMEDIATE:</span> Increase qualified withdrawals by $8,160</li>
            <li>• Consider Roth conversions to reduce future RMDs</li>
            <li>• Evaluate Qualified Charitable Distributions (QCDs)</li>
            <li>• Plan for increasing RMD requirements with age</li>
          </ul>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Future Projections</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Age</th>
                  <th className="text-left py-2">Balance</th>
                  <th className="text-left py-2">RMD %</th>
                  <th className="text-left py-2">RMD Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">74</td>
                  <td className="py-2">$425,000</td>
                  <td className="py-2">3.8%</td>
                  <td className="py-2">$16,160</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">75</td>
                  <td className="py-2">$440,000</td>
                  <td className="py-2">3.9%</td>
                  <td className="py-2">$17,160</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">80</td>
                  <td className="py-2">$480,000</td>
                  <td className="py-2">4.9%</td>
                  <td className="py-2">$23,520</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RMDPlanningModule;

