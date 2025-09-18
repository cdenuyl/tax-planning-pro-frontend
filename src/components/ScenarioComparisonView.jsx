import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  DollarSign, 
  Percent,
  AlertCircle
} from 'lucide-react';

const ScenarioComparisonView = ({ scenarios = [], onClose }) => {
  // Ensure we have exactly 2 scenarios
  if (scenarios.length !== 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="text-gray-400 mb-4" />
          <p className="text-lg text-gray-500 mb-4">Please select exactly 2 scenarios to compare</p>
          <Button onClick={onClose}>Return to Scenarios</Button>
        </CardContent>
      </Card>
    );
  }
  
  const [scenario1, scenario2] = scenarios;
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };
  
  // Calculate difference and determine if it's better or worse
  const calculateDifference = (value1, value2, lowerIsBetter = true) => {
    if (value1 === undefined || value1 === null || value2 === undefined || value2 === null) {
      return { difference: null, isBetter: null };
    }
    
    const difference = value2 - value1;
    const isBetter = lowerIsBetter ? difference < 0 : difference > 0;
    
    return { difference, isBetter };
  };
  
  // Format difference with appropriate sign
  const formatDifference = (difference, isCurrency = true) => {
    if (difference === null) return 'N/A';
    
    const prefix = difference > 0 ? '+' : '';
    
    if (isCurrency) {
      return prefix + formatCurrency(difference);
    } else {
      return prefix + formatPercentage(difference);
    }
  };
  
  // Get difference icon
  const getDifferenceIcon = (isBetter, size = 16) => {
    if (isBetter === null) return <Minus size={size} className="text-gray-400" />;
    if (isBetter) return <TrendingDown size={size} className="text-green-500" />;
    return <TrendingUp size={size} className="text-red-500" />;
  };
  
  // Calculate differences
  const federalTaxDiff = calculateDifference(
    scenario1.results?.federalTax, 
    scenario2.results?.federalTax
  );
  
  const stateTaxDiff = calculateDifference(
    scenario1.results?.stateTax, 
    scenario2.results?.stateTax
  );
  
  const effectiveRateDiff = calculateDifference(
    scenario1.results?.effectiveRate, 
    scenario2.results?.effectiveRate
  );
  
  const marginalRateDiff = calculateDifference(
    scenario1.results?.marginalRate, 
    scenario2.results?.marginalRate
  );
  
  const totalTax1 = (scenario1.results?.federalTax || 0) + (scenario1.results?.stateTax || 0);
  const totalTax2 = (scenario2.results?.federalTax || 0) + (scenario2.results?.stateTax || 0);
  const totalTaxDiff = calculateDifference(totalTax1, totalTax2);
  
  return (
    <div className="scenario-comparison">
      <Card>
        <CardHeader>
          <CardTitle>Scenario Comparison</CardTitle>
          <CardDescription>
            Comparing tax outcomes between two scenarios
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Scenario Names */}
            <div className="col-span-3 grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <h3 className="font-bold text-lg">{scenario1.name}</h3>
                {scenario1.isActive && (
                  <Badge className="mt-1 bg-blue-500 hover:bg-blue-600">
                    Active
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-center">
                <ArrowRight size={24} className="text-gray-400" />
              </div>
              
              <div className="text-center">
                <h3 className="font-bold text-lg">{scenario2.name}</h3>
                {scenario2.isActive && (
                  <Badge className="mt-1 bg-blue-500 hover:bg-blue-600">
                    Active
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Total Tax */}
            <div className="col-span-3">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCurrency(totalTax1)}</div>
                      <div className="text-sm text-gray-500">Total Tax</div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center">
                      {getDifferenceIcon(totalTaxDiff.isBetter, 24)}
                      <div className={`text-sm font-medium ${
                        totalTaxDiff.isBetter ? 'text-green-600' : 
                        totalTaxDiff.isBetter === false ? 'text-red-600' : 
                        'text-gray-500'
                      }`}>
                        {formatDifference(totalTaxDiff.difference)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCurrency(totalTax2)}</div>
                      <div className="text-sm text-gray-500">Total Tax</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Federal Tax */}
            <div className="text-center">
              <div className="font-bold">{formatCurrency(scenario1.results?.federalTax)}</div>
              <div className="text-sm text-gray-500">Federal Tax</div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              {getDifferenceIcon(federalTaxDiff.isBetter)}
              <div className={`text-xs ${
                federalTaxDiff.isBetter ? 'text-green-600' : 
                federalTaxDiff.isBetter === false ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {formatDifference(federalTaxDiff.difference)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-bold">{formatCurrency(scenario2.results?.federalTax)}</div>
              <div className="text-sm text-gray-500">Federal Tax</div>
            </div>
            
            {/* State Tax */}
            <div className="text-center">
              <div className="font-bold">{formatCurrency(scenario1.results?.stateTax)}</div>
              <div className="text-sm text-gray-500">State Tax</div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              {getDifferenceIcon(stateTaxDiff.isBetter)}
              <div className={`text-xs ${
                stateTaxDiff.isBetter ? 'text-green-600' : 
                stateTaxDiff.isBetter === false ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {formatDifference(stateTaxDiff.difference)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-bold">{formatCurrency(scenario2.results?.stateTax)}</div>
              <div className="text-sm text-gray-500">State Tax</div>
            </div>
            
            {/* Effective Rate */}
            <div className="text-center">
              <div className="font-bold">{formatPercentage(scenario1.results?.effectiveRate)}</div>
              <div className="text-sm text-gray-500">Effective Rate</div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              {getDifferenceIcon(effectiveRateDiff.isBetter)}
              <div className={`text-xs ${
                effectiveRateDiff.isBetter ? 'text-green-600' : 
                effectiveRateDiff.isBetter === false ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {formatDifference(effectiveRateDiff.difference, false)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-bold">{formatPercentage(scenario2.results?.effectiveRate)}</div>
              <div className="text-sm text-gray-500">Effective Rate</div>
            </div>
            
            {/* Marginal Rate */}
            <div className="text-center">
              <div className="font-bold">{formatPercentage(scenario1.results?.marginalRate)}</div>
              <div className="text-sm text-gray-500">Marginal Rate</div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              {getDifferenceIcon(marginalRateDiff.isBetter)}
              <div className={`text-xs ${
                marginalRateDiff.isBetter ? 'text-green-600' : 
                marginalRateDiff.isBetter === false ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {formatDifference(marginalRateDiff.difference, false)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="font-bold">{formatPercentage(scenario2.results?.marginalRate)}</div>
              <div className="text-sm text-gray-500">Marginal Rate</div>
            </div>
            
            {/* Additional metrics can be added here */}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-bold mb-2">Summary</h3>
            <p className="text-sm">
              {totalTaxDiff.isBetter ? (
                <span>
                  <span className="font-medium">{scenario2.name}</span> results in 
                  <span className="text-green-600 font-medium"> {formatCurrency(Math.abs(totalTaxDiff.difference))} less </span> 
                  in total taxes compared to <span className="font-medium">{scenario1.name}</span>.
                </span>
              ) : totalTaxDiff.isBetter === false ? (
                <span>
                  <span className="font-medium">{scenario2.name}</span> results in 
                  <span className="text-red-600 font-medium"> {formatCurrency(Math.abs(totalTaxDiff.difference))} more </span> 
                  in total taxes compared to <span className="font-medium">{scenario1.name}</span>.
                </span>
              ) : (
                <span>
                  Unable to determine tax difference between scenarios due to missing data.
                </span>
              )}
            </p>
            
            {/* Additional analysis can be added here */}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Return to Scenarios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ScenarioComparisonView;

