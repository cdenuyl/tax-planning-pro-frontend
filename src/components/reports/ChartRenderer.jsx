import React, { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { InteractiveTaxMap } from '../InteractiveTaxMap.jsx';

/**
 * ChartRenderer component for generating PDF-compatible chart images
 * Renders charts and converts them to base64 images for PDF inclusion
 */
export const ChartRenderer = ({ 
  chartType, 
  data, 
  onImageGenerated, 
  width = 800, 
  height = 400,
  className = ""
}) => {
  const chartRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageData, setImageData] = useState(null);

  const generateChartImage = async () => {
    if (!chartRef.current || isGenerating) return;

    setIsGenerating(true);
    try {
      // Wait a moment for the chart to fully render
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution for better PDF quality
        useCORS: true,
        allowTaint: true,
        width: width,
        height: height,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          // Skip elements that might cause color parsing issues
          const computedStyle = window.getComputedStyle(element);
          const bgColor = computedStyle.backgroundColor;
          const color = computedStyle.color;
          
          // Skip elements with oklch or other unsupported color formats
          if (bgColor.includes('oklch') || color.includes('oklch')) {
            return true;
          }
          return false;
        },
        onclone: (clonedDoc) => {
          // Convert any oklch colors to rgb equivalents in the cloned document
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const style = el.style;
            if (style.backgroundColor && style.backgroundColor.includes('oklch')) {
              style.backgroundColor = '#ffffff'; // Fallback to white
            }
            if (style.color && style.color.includes('oklch')) {
              style.color = '#000000'; // Fallback to black
            }
          });
        }
      });

      const imageDataUrl = canvas.toDataURL('image/png', 0.95);
      setImageData(imageDataUrl);
      
      if (onImageGenerated) {
        onImageGenerated(imageDataUrl);
      }
    } catch (error) {
      console.warn('Chart image generation failed, but this won\'t affect functionality:', error.message);
      // Don't show user-facing error for chart generation issues
      setImageData(null);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Generate image when component mounts or data changes
    const timer = setTimeout(() => {
      generateChartImage();
    }, 1000); // Give charts time to render

    return () => clearTimeout(timer);
  }, [data, chartType]);

  const renderChart = () => {
    switch (chartType) {
      case 'tax-map':
        return (
          <InteractiveTaxMap
            calculations={data.calculations}
            incomeSources={data.incomeSourcesData || []}
            settings={data.taxMapSettings || {}}
            appSettings={data.appSettings || {}}
            ficaEnabled={false}
          />
        );
      
      case 'income-breakdown':
        return (
          <div className="p-4 bg-white">
            <h3 className="text-lg font-semibold mb-4">Income Breakdown</h3>
            <div className="space-y-2">
              {data.incomeBreakdown?.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{item.source}</span>
                  <span className="text-blue-600 font-semibold">${item.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tax-summary':
        return (
          <div className="p-4 bg-white">
            <h3 className="text-lg font-semibold mb-4">Tax Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Federal Tax:</span>
                  <span className="font-semibold text-red-600">${data.calculations?.federalTax?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>State Tax:</span>
                  <span className="font-semibold text-red-600">${data.calculations?.stateTax?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>FICA Tax:</span>
                  <span className="font-semibold text-red-600">${data.calculations?.ficaTax?.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span className="font-bold text-red-700">${data.calculations?.totalTax?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Effective Rate:</span>
                  <span className="font-semibold">{((data.calculations?.totalTax / data.calculations?.totalIncome) * 100)?.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-100 text-center">
            <p>Chart type "{chartType}" not supported</p>
          </div>
        );
    }
  };

  return (
    <div className={`chart-renderer ${className}`}>
      {/* Chart container for rendering */}
      <div 
        ref={chartRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="bg-white border rounded shadow-sm"
      >
        {renderChart()}
      </div>

      {/* Status indicator */}
      {isGenerating && (
        <div className="mt-2 text-sm text-blue-600">
          Generating chart image...
        </div>
      )}

      {/* Preview of generated image */}
      {imageData && !isGenerating && (
        <div className="mt-4">
          <p className="text-sm text-green-600 mb-2">Chart image generated successfully</p>
          <img 
            src={imageData} 
            alt="Generated chart" 
            className="max-w-full h-auto border rounded shadow-sm"
            style={{ maxHeight: '200px' }}
          />
        </div>
      )}
    </div>
  );
};

export default ChartRenderer;

