import React, { useState, useMemo } from 'react';

const SequenceOfReturnsAnalysis = ({ 
  assets, 
  incomeSources, 
  formatCurrency 
}) => {
  const [analysisType, setAnalysisType] = useState('historical'); // 'hypothetical' or 'historical'
  const [projectionYears] = useState(20); // Fixed at 20 years

  // Historical S&P 500 returns for the last 20 years (2004-2023)
  // Source: S&P 500 total return data including dividends
  const historicalReturns = [
    { year: 2004, return: 10.88 },
    { year: 2005, return: 4.91 },
    { year: 2006, return: 15.79 },
    { year: 2007, return: 5.49 },
    { year: 2008, return: -37.00 },
    { year: 2009, return: 26.46 },
    { year: 2010, return: 15.06 },
    { year: 2011, return: 2.11 },
    { year: 2012, return: 16.00 },
    { year: 2013, return: 32.39 },
    { year: 2014, return: 13.69 },
    { year: 2015, return: 1.38 },
    { year: 2016, return: 11.96 },
    { year: 2017, return: 21.83 },
    { year: 2018, return: -4.38 },
    { year: 2019, return: 31.49 },
    { year: 2020, return: 18.40 },
    { year: 2021, return: 28.71 },
    { year: 2022, return: -18.11 },
    { year: 2023, return: 26.29 }
  ];

  // Hypothetical returns with volatility (consistent for all clients for demonstration)
  // These are designed to show sequence risk with realistic but varied returns
  const hypotheticalReturns = [
    { year: 1, return: 12.5 },
    { year: 2, return: -8.2 },
    { year: 3, return: 15.8 },
    { year: 4, return: 3.1 },
    { year: 5, return: -12.4 },
    { year: 6, return: 22.3 },
    { year: 7, return: 7.9 },
    { year: 8, return: -5.6 },
    { year: 9, return: 18.7 },
    { year: 10, return: 9.2 },
    { year: 11, return: -15.1 },
    { year: 12, return: 24.6 },
    { year: 13, return: 6.8 },
    { year: 14, return: -9.3 },
    { year: 15, return: 19.4 },
    { year: 16, return: 4.7 },
    { year: 17, return: -11.8 },
    { year: 18, return: 16.2 },
    { year: 19, return: 8.5 },
    { year: 20, return: 13.9 }
  ];

  // Calculate total liquid assets and annual withdrawals
  const liquidAssetTypes = [
    'traditional-ira', 'roth-ira', 'traditional-401k', 'roth-401k', 
    '403b', '457', 'sep-ira', 'simple-ira', 'annuity', 'brokerage', 
    'savings', 'cd'
  ];

  const { totalLiquidAssets, totalAnnualWithdrawals } = useMemo(() => {
    const liquidAssets = assets.filter(asset => liquidAssetTypes.includes(asset.type));
    const totalAssets = liquidAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    
    const totalWithdrawals = liquidAssets.reduce((sum, asset) => {
      // Find the linked income source
      const incomeSource = asset.linkedIncomeSourceId 
        ? incomeSources.find(source => source.id === asset.linkedIncomeSourceId)
        : incomeSources.find(source => source.id === `asset-${asset.id}`);
      
      const incomeAmount = (incomeSource && incomeSource.enabled) 
        ? incomeSource.amount 
        : 0;
      
      return sum + incomeAmount;
    }, 0);

    return {
      totalLiquidAssets: totalAssets,
      totalAnnualWithdrawals: totalWithdrawals
    };
  }, [assets, incomeSources]);

  // Calculate sequence of returns scenarios
  const calculateSequenceScenario = (returns, isReversed = false) => {
    const returnsToUse = isReversed ? [...returns].reverse() : returns;
    let portfolioValue = totalLiquidAssets;
    const results = [];

    returnsToUse.forEach((returnData, index) => {
      const returnRate = returnData.return / 100;
      
      // Apply withdrawal at beginning of year
      portfolioValue -= totalAnnualWithdrawals;
      
      // Apply market return
      portfolioValue *= (1 + returnRate);
      
      // Ensure portfolio doesn't go negative
      portfolioValue = Math.max(0, portfolioValue);
      
      results.push({
        year: returnData.year, // Use the actual year from the data
        return: returnData.return,
        portfolioValue,
        withdrawal: totalAnnualWithdrawals,
        displayYear: analysisType === 'historical' ? returnData.year : `Year ${index + 1}`
      });
    });

    return results;
  };

  const getReturnsData = () => {
    return analysisType === 'historical' ? historicalReturns : hypotheticalReturns;
  };

  const normalSequence = calculateSequenceScenario(getReturnsData(), false);
  const reversedSequence = calculateSequenceScenario(getReturnsData(), true);

  const formatReturn = (returnValue) => {
    return returnValue >= 0 ? `+${returnValue.toFixed(1)}%` : `${returnValue.toFixed(1)}%`;
  };

  const getReturnColor = (returnValue) => {
    return returnValue >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sequence of Returns Analysis</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAnalysisType('hypothetical')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                analysisType === 'hypothetical'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hypothetical
            </button>
            <button
              onClick={() => setAnalysisType('historical')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                analysisType === 'historical'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Historical (2004-2023)
            </button>
          </div>
        </div>

        {/* Analysis Description */}
        <div className="mb-4 text-sm text-gray-600">
          {analysisType === 'hypothetical' 
            ? 'Static hypothetical returns (same for all clients) designed to demonstrate sequence risk effects with realistic market volatility.'
            : 'Actual S&P 500 total returns including dividends from 2004-2023 (20 years of historical data).'
          }
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalLiquidAssets)}</div>
              <div className="text-sm text-blue-700">Starting Portfolio</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalAnnualWithdrawals)}</div>
              <div className="text-sm text-blue-700">Annual Withdrawals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {totalLiquidAssets > 0 ? ((totalAnnualWithdrawals / totalLiquidAssets) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-blue-700">Withdrawal Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two charts side by side */}
      <div className="flex-1 grid grid-cols-2 gap-6">
        {/* Normal Sequence */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            {analysisType === 'historical' ? 'Historical Order (2004-2023)' : 'Hypothetical Returns'}
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {normalSequence.map((data, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    {data.displayYear}
                  </span>
                  <span className={`text-sm font-medium ${getReturnColor(data.return)}`}>
                    {formatReturn(data.return)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(data.portfolioValue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    -{formatCurrency(data.withdrawal)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Final Value:</span>
              <span className={`text-lg font-bold ${
                normalSequence[normalSequence.length - 1]?.portfolioValue > 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(normalSequence[normalSequence.length - 1]?.portfolioValue || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Reversed Sequence */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            {analysisType === 'historical' ? 'Reverse Order (2023-2004)' : 'Reversed Returns'}
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reversedSequence.map((data, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    {analysisType === 'historical' 
                      ? `${data.year} (Rev)` 
                      : data.displayYear
                    }
                  </span>
                  <span className={`text-sm font-medium ${getReturnColor(data.return)}`}>
                    {formatReturn(data.return)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(data.portfolioValue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    -{formatCurrency(data.withdrawal)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Final Value:</span>
              <span className={`text-lg font-bold ${
                reversedSequence[reversedSequence.length - 1]?.portfolioValue > 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(reversedSequence[reversedSequence.length - 1]?.portfolioValue || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="mt-4 bg-yellow-50 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-yellow-900 mb-2">Sequence Risk Analysis</h5>
        <p className="text-sm text-yellow-800">
          The order of returns matters significantly when taking withdrawals. Poor returns early in retirement 
          can have a much greater impact than poor returns later, even with identical average returns.
          {(() => {
            const normalFinal = normalSequence[normalSequence.length - 1]?.portfolioValue || 0;
            const reversedFinal = reversedSequence[reversedSequence.length - 1]?.portfolioValue || 0;
            const difference = Math.abs(normalFinal - reversedFinal);
            
            if (difference > 10000) {
              return ` In this scenario, the difference is ${formatCurrency(difference)}.`;
            }
            return '';
          })()}
        </p>
      </div>
    </div>
  );
};

export default SequenceOfReturnsAnalysis;

