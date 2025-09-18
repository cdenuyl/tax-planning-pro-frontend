import React, { useState } from 'react';
import { 
  generateStrategicRecommendations,
  generateImplementationTimeline,
  generateRecommendationSummary,
  PRIORITY_LEVELS,
  RECOMMENDATION_CATEGORIES
} from '../../utils/strategicRecommendations';
import { formatCurrencyForReports } from '../../utils/reportFormatting';

const StrategicRecommendationsModule = ({ 
  scenarios, 
  differences, 
  summary, 
  template = {} 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showTimeline, setShowTimeline] = useState(false);

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No scenarios available for strategic recommendations</p>
      </div>
    );
  }

  const recommendations = generateStrategicRecommendations(scenarios, differences, summary);
  const timeline = generateImplementationTimeline(recommendations);
  const recSummary = generateRecommendationSummary(recommendations);

  // Filter recommendations based on selected filters
  const filteredRecommendations = recommendations.filter(rec => {
    const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory;
    const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
    return categoryMatch && priorityMatch;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityTextColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-700';
      case 'medium': return 'text-yellow-700';
      case 'low': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{recSummary.totalRecommendations}</div>
            <div className="text-sm text-gray-600">Total Recommendations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{recSummary.highPriorityCount}</div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrencyForReports(recSummary.totalPotentialSavings)}
            </div>
            <div className="text-sm text-gray-600">Potential Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{recSummary.categoriesCount}</div>
            <div className="text-sm text-gray-600">Strategy Areas</div>
          </div>
        </div>
        <p className="text-gray-700">{recSummary.summary}</p>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Categories</option>
              {Object.values(RECOMMENDATION_CATEGORIES).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Priority:</label>
            <select 
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
          </button>
        </div>
      </div>

      {/* Implementation Timeline */}
      {showTimeline && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Implementation Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium text-red-600 mb-2">Immediate (0-30 days)</h4>
              <div className="space-y-2">
                {timeline.immediate.map(rec => (
                  <div key={rec.id} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                    {rec.title}
                  </div>
                ))}
                {timeline.immediate.length === 0 && (
                  <div className="text-sm text-gray-500 italic">No immediate actions</div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-yellow-600 mb-2">Short Term (1-6 months)</h4>
              <div className="space-y-2">
                {timeline.shortTerm.map(rec => (
                  <div key={rec.id} className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded">
                    {rec.title}
                  </div>
                ))}
                {timeline.shortTerm.length === 0 && (
                  <div className="text-sm text-gray-500 italic">No short-term actions</div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Medium Term (6-18 months)</h4>
              <div className="space-y-2">
                {timeline.mediumTerm.map(rec => (
                  <div key={rec.id} className="text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                    {rec.title}
                  </div>
                ))}
                {timeline.mediumTerm.length === 0 && (
                  <div className="text-sm text-gray-500 italic">No medium-term actions</div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-green-600 mb-2">Long Term (18+ months)</h4>
              <div className="space-y-2">
                {timeline.longTerm.map(rec => (
                  <div key={rec.id} className="text-sm p-2 bg-green-50 border border-green-200 rounded">
                    {rec.title}
                  </div>
                ))}
                {timeline.longTerm.length === 0 && (
                  <div className="text-sm text-gray-500 italic">No long-term actions</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Strategic Recommendations 
          {filteredRecommendations.length !== recommendations.length && (
            <span className="text-sm font-normal text-gray-600">
              ({filteredRecommendations.length} of {recommendations.length})
            </span>
          )}
        </h3>
        
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No recommendations match the selected filters</p>
          </div>
        ) : (
          filteredRecommendations.map((recommendation, index) => (
            <div 
              key={recommendation.id} 
              className={`border-l-4 rounded-lg p-6 bg-white border border-gray-200 ${getPriorityColor(recommendation.priority)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">{recommendation.title}</h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`text-sm font-medium ${getPriorityTextColor(recommendation.priority)}`}>
                      {PRIORITY_LEVELS[recommendation.priority.toUpperCase()]?.label || recommendation.priority}
                    </span>
                    <span className="text-sm text-gray-600">{recommendation.category}</span>
                    {recommendation.potentialSavings && (
                      <span className="text-sm font-medium text-green-600">
                        Potential Savings: {formatCurrencyForReports(recommendation.potentialSavings)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Impact: {recommendation.impact}</div>
                  <div className="text-sm text-gray-600">Timeline: {recommendation.timeframe}</div>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{recommendation.description}</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                <div className="font-medium text-blue-800 mb-1">Recommended Action:</div>
                <div className="text-blue-700">{recommendation.action}</div>
              </div>
              
              {recommendation.considerations && recommendation.considerations.length > 0 && (
                <div>
                  <div className="font-medium text-gray-800 mb-2">Key Considerations:</div>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {recommendation.considerations.map((consideration, idx) => (
                      <li key={idx} className="text-sm">{consideration}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Top Recommendation Highlight */}
      {recSummary.topRecommendation && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Top Priority Recommendation</h3>
          <div className="text-blue-700">
            <div className="font-medium mb-1">{recSummary.topRecommendation.title}</div>
            <div className="mb-2">{recSummary.topRecommendation.description}</div>
            <div className="text-sm">
              <strong>Action:</strong> {recSummary.topRecommendation.action}
            </div>
            {recSummary.topRecommendation.potentialSavings && (
              <div className="text-sm mt-1">
                <strong>Potential Savings:</strong> {formatCurrencyForReports(recSummary.topRecommendation.potentialSavings)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategicRecommendationsModule;

