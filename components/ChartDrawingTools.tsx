import React, { useState, useRef, useEffect, useCallback } from 'react';

// Drawing object types
export type DrawingType = 'trendline' | 'horizontal' | 'fibonacci' | 'support' | 'resistance' | 'rectangle' | 'channel';

export interface DrawingPoint {
  x: number; // pixel position or data index
  y: number; // price value
  dataIndex?: number;
}

export interface DrawingObject {
  id: string;
  type: DrawingType;
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
  style: 'solid' | 'dashed' | 'dotted';
  label?: string;
  fibLevels?: number[];
  locked?: boolean;
  visible?: boolean;
}

interface ChartDrawingToolsProps {
  width: number;
  height: number;
  priceMin: number;
  priceMax: number;
  dataLength: number;
  drawings: DrawingObject[];
  onDrawingsChange: (drawings: DrawingObject[]) => void;
  activeTool: DrawingType | null;
  onToolComplete: () => void;
  chartPadding?: { top: number; right: number; bottom: number; left: number };
}

// Default Fibonacci levels
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

// Color palette for drawings
export const DRAWING_COLORS = [
  '#2962ff', // Blue
  '#26a69a', // Green
  '#ef5350', // Red
  '#ff9800', // Orange
  '#ab47bc', // Purple
  '#26c6da', // Cyan
  '#ffeb3b', // Yellow
  '#ffffff', // White
];

const ChartDrawingTools: React.FC<ChartDrawingToolsProps> = ({
  width,
  height,
  priceMin,
  priceMax,
  dataLength,
  drawings,
  onDrawingsChange,
  activeTool,
  onToolComplete,
  chartPadding = { top: 10, right: 60, bottom: 0, left: 0 },
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<DrawingObject> | null>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [hoveredDrawing, setHoveredDrawing] = useState<string | null>(null);

  // Convert price to Y coordinate
  const priceToY = useCallback((price: number): number => {
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    return chartPadding.top + (1 - (price - priceMin) / (priceMax - priceMin)) * chartHeight;
  }, [height, priceMin, priceMax, chartPadding]);

  // Convert Y coordinate to price
  const yToPrice = useCallback((y: number): number => {
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    return priceMax - ((y - chartPadding.top) / chartHeight) * (priceMax - priceMin);
  }, [height, priceMin, priceMax, chartPadding]);

  // Convert data index to X coordinate
  const indexToX = useCallback((index: number): number => {
    const chartWidth = width - chartPadding.left - chartPadding.right;
    return chartPadding.left + (index / (dataLength - 1)) * chartWidth;
  }, [width, dataLength, chartPadding]);

  // Convert X coordinate to data index
  const xToIndex = useCallback((x: number): number => {
    const chartWidth = width - chartPadding.left - chartPadding.right;
    return Math.round(((x - chartPadding.left) / chartWidth) * (dataLength - 1));
  }, [width, dataLength, chartPadding]);

  // Get mouse position relative to SVG
  const getMousePosition = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!activeTool) return;
    
    const pos = getMousePosition(e);
    const price = yToPrice(pos.y);
    const index = xToIndex(pos.x);
    
    // For horizontal lines, only need one click
    if (activeTool === 'horizontal' || activeTool === 'support' || activeTool === 'resistance') {
      const newDrawing: DrawingObject = {
        id: `drawing_${Date.now()}`,
        type: activeTool,
        points: [{ x: pos.x, y: price, dataIndex: index }],
        color: activeTool === 'support' ? '#26a69a' : activeTool === 'resistance' ? '#ef5350' : '#2962ff',
        lineWidth: 1,
        style: activeTool === 'support' || activeTool === 'resistance' ? 'dashed' : 'solid',
        label: activeTool === 'support' ? 'Support' : activeTool === 'resistance' ? 'Resistance' : undefined,
        visible: true,
      };
      
      onDrawingsChange([...drawings, newDrawing]);
      onToolComplete();
      return;
    }

    setIsDrawing(true);
    setCurrentDrawing({
      id: `drawing_${Date.now()}`,
      type: activeTool,
      points: [{ x: pos.x, y: price, dataIndex: index }],
      color: activeTool === 'fibonacci' ? '#ff9800' : '#2962ff',
      lineWidth: 1,
      style: 'solid',
      visible: true,
      fibLevels: activeTool === 'fibonacci' ? FIB_LEVELS : undefined,
    });
  }, [activeTool, getMousePosition, yToPrice, xToIndex, drawings, onDrawingsChange, onToolComplete]);

  // Handle mouse move - update drawing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !currentDrawing) return;
    
    const pos = getMousePosition(e);
    const price = yToPrice(pos.y);
    const index = xToIndex(pos.x);
    
    const updatedDrawing = {
      ...currentDrawing,
      points: [
        currentDrawing.points![0],
        { x: pos.x, y: price, dataIndex: index },
      ],
    };
    
    setCurrentDrawing(updatedDrawing);
  }, [isDrawing, currentDrawing, getMousePosition, yToPrice, xToIndex]);

  // Handle mouse up - finish drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentDrawing || !currentDrawing.points || currentDrawing.points.length < 2) {
      setIsDrawing(false);
      setCurrentDrawing(null);
      return;
    }
    
    const newDrawing = currentDrawing as DrawingObject;
    onDrawingsChange([...drawings, newDrawing]);
    
    setIsDrawing(false);
    setCurrentDrawing(null);
    onToolComplete();
  }, [isDrawing, currentDrawing, drawings, onDrawingsChange, onToolComplete]);

  // Delete drawing
  const deleteDrawing = useCallback((id: string) => {
    onDrawingsChange(drawings.filter(d => d.id !== id));
    setSelectedDrawing(null);
  }, [drawings, onDrawingsChange]);

  // Render a trendline
  const renderTrendline = (drawing: DrawingObject, isPreview: boolean = false) => {
    if (drawing.points.length < 2) return null;
    
    const [p1, p2] = drawing.points;
    const y1 = priceToY(p1.y);
    const y2 = priceToY(p2.y);
    const x1 = isPreview ? p1.x : indexToX(p1.dataIndex || 0);
    const x2 = isPreview ? p2.x : indexToX(p2.dataIndex || 0);
    
    const isSelected = selectedDrawing === drawing.id;
    const isHovered = hoveredDrawing === drawing.id;
    
    const strokeDasharray = drawing.style === 'dashed' ? '5,5' : drawing.style === 'dotted' ? '2,2' : 'none';

    return (
      <g 
        key={drawing.id}
        onMouseEnter={() => setHoveredDrawing(drawing.id)}
        onMouseLeave={() => setHoveredDrawing(null)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedDrawing(drawing.id);
        }}
        style={{ cursor: 'pointer' }}
      >
        {/* Extended line (optional) */}
        <line
          x1={0}
          y1={y1 - (y2 - y1) / (x2 - x1) * x1}
          x2={width}
          y2={y1 + (y2 - y1) / (x2 - x1) * (width - x1)}
          stroke={drawing.color}
          strokeWidth={0.5}
          strokeOpacity={0.3}
          strokeDasharray="3,3"
        />
        
        {/* Main line */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={drawing.color}
          strokeWidth={isSelected || isHovered ? drawing.lineWidth + 1 : drawing.lineWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
        
        {/* Control points */}
        {(isSelected || isHovered) && (
          <>
            <circle cx={x1} cy={y1} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
            <circle cx={x2} cy={y2} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
          </>
        )}
        
        {/* Delete button */}
        {isSelected && (
          <g 
            transform={`translate(${x2 + 10}, ${y2 - 10})`}
            onClick={(e) => {
              e.stopPropagation();
              deleteDrawing(drawing.id);
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle r={10} fill="#ef5350" />
            <text x={0} y={4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">×</text>
          </g>
        )}
      </g>
    );
  };

  // Render a horizontal line
  const renderHorizontalLine = (drawing: DrawingObject) => {
    if (drawing.points.length < 1) return null;
    
    const p = drawing.points[0];
    const y = priceToY(p.y);
    
    const isSelected = selectedDrawing === drawing.id;
    const isHovered = hoveredDrawing === drawing.id;
    
    const strokeDasharray = drawing.style === 'dashed' ? '5,5' : drawing.style === 'dotted' ? '2,2' : 'none';

    return (
      <g 
        key={drawing.id}
        onMouseEnter={() => setHoveredDrawing(drawing.id)}
        onMouseLeave={() => setHoveredDrawing(null)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedDrawing(drawing.id);
        }}
        style={{ cursor: 'pointer' }}
      >
        <line
          x1={chartPadding.left}
          y1={y}
          x2={width - chartPadding.right}
          y2={y}
          stroke={drawing.color}
          strokeWidth={isSelected || isHovered ? drawing.lineWidth + 1 : drawing.lineWidth}
          strokeDasharray={strokeDasharray}
        />
        
        {/* Price label */}
        <g transform={`translate(${width - chartPadding.right + 5}, ${y})`}>
          <rect x={0} y={-10} width={50} height={20} fill={drawing.color} rx={3} />
          <text x={25} y={4} textAnchor="middle" fill="white" fontSize={10} fontFamily="monospace">
            {p.y.toLocaleString()}
          </text>
        </g>
        
        {/* Label */}
        {drawing.label && (
          <text 
            x={chartPadding.left + 10} 
            y={y - 5} 
            fill={drawing.color} 
            fontSize={10} 
            fontWeight="bold"
          >
            {drawing.label}
          </text>
        )}
        
        {/* Delete button */}
        {isSelected && (
          <g 
            transform={`translate(${chartPadding.left + 5}, ${y})`}
            onClick={(e) => {
              e.stopPropagation();
              deleteDrawing(drawing.id);
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle r={10} fill="#ef5350" />
            <text x={0} y={4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">×</text>
          </g>
        )}
      </g>
    );
  };

  // Render Fibonacci retracement
  const renderFibonacci = (drawing: DrawingObject, isPreview: boolean = false) => {
    if (drawing.points.length < 2) return null;
    
    const [p1, p2] = drawing.points;
    const y1 = priceToY(p1.y);
    const y2 = priceToY(p2.y);
    const x1 = isPreview ? p1.x : indexToX(p1.dataIndex || 0);
    const x2 = isPreview ? p2.x : indexToX(p2.dataIndex || 0);
    
    const isSelected = selectedDrawing === drawing.id;
    const isHovered = hoveredDrawing === drawing.id;
    
    const priceDiff = p2.y - p1.y;
    const levels = drawing.fibLevels || FIB_LEVELS;
    
    const fibColors = ['#787b86', '#26a69a', '#2962ff', '#ff9800', '#ef5350', '#ab47bc', '#787b86'];

    return (
      <g 
        key={drawing.id}
        onMouseEnter={() => setHoveredDrawing(drawing.id)}
        onMouseLeave={() => setHoveredDrawing(null)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedDrawing(drawing.id);
        }}
        style={{ cursor: 'pointer' }}
      >
        {/* Background fill between levels */}
        {levels.map((level, i) => {
          if (i === levels.length - 1) return null;
          const nextLevel = levels[i + 1];
          const levelPrice = p1.y + priceDiff * level;
          const nextLevelPrice = p1.y + priceDiff * nextLevel;
          const levelY = priceToY(levelPrice);
          const nextLevelY = priceToY(nextLevelPrice);
          
          return (
            <rect
              key={`fill_${i}`}
              x={Math.min(x1, x2)}
              y={Math.min(levelY, nextLevelY)}
              width={Math.abs(x2 - x1)}
              height={Math.abs(nextLevelY - levelY)}
              fill={fibColors[i % fibColors.length]}
              fillOpacity={0.05}
            />
          );
        })}
        
        {/* Fib level lines */}
        {levels.map((level, i) => {
          const levelPrice = p1.y + priceDiff * level;
          const levelY = priceToY(levelPrice);
          const color = fibColors[i % fibColors.length];
          
          return (
            <g key={`fib_${level}`}>
              <line
                x1={Math.min(x1, x2)}
                y1={levelY}
                x2={Math.max(x1, x2)}
                y2={levelY}
                stroke={color}
                strokeWidth={1}
                strokeDasharray={level === 0 || level === 1 ? 'none' : '3,3'}
              />
              
              {/* Level label */}
              <g transform={`translate(${Math.max(x1, x2) + 5}, ${levelY})`}>
                <rect x={0} y={-8} width={75} height={16} fill="#1e222d" rx={2} />
                <text x={4} y={4} fill={color} fontSize={10} fontFamily="monospace">
                  {(level * 100).toFixed(1)}% ({levelPrice.toFixed(0)})
                </text>
              </g>
            </g>
          );
        })}
        
        {/* Vertical lines at start and end */}
        <line x1={x1} y1={y1} x2={x1} y2={y2} stroke="#787b86" strokeWidth={0.5} strokeDasharray="2,2" />
        <line x1={x2} y1={y1} x2={x2} y2={y2} stroke="#787b86" strokeWidth={0.5} strokeDasharray="2,2" />
        
        {/* Control points */}
        {(isSelected || isHovered) && (
          <>
            <circle cx={x1} cy={y1} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
            <circle cx={x2} cy={y2} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
          </>
        )}
        
        {/* Delete button */}
        {isSelected && (
          <g 
            transform={`translate(${Math.max(x1, x2) + 85}, ${priceToY(p1.y + priceDiff * 0.5)})`}
            onClick={(e) => {
              e.stopPropagation();
              deleteDrawing(drawing.id);
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle r={10} fill="#ef5350" />
            <text x={0} y={4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">×</text>
          </g>
        )}
      </g>
    );
  };

  // Render channel
  const renderChannel = (drawing: DrawingObject, isPreview: boolean = false) => {
    if (drawing.points.length < 2) return null;
    
    const [p1, p2] = drawing.points;
    const y1 = priceToY(p1.y);
    const y2 = priceToY(p2.y);
    const x1 = isPreview ? p1.x : indexToX(p1.dataIndex || 0);
    const x2 = isPreview ? p2.x : indexToX(p2.dataIndex || 0);
    
    // Calculate parallel line offset
    const channelHeight = Math.abs(y2 - y1) * 0.5;
    
    const isSelected = selectedDrawing === drawing.id;
    const isHovered = hoveredDrawing === drawing.id;

    return (
      <g 
        key={drawing.id}
        onMouseEnter={() => setHoveredDrawing(drawing.id)}
        onMouseLeave={() => setHoveredDrawing(null)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedDrawing(drawing.id);
        }}
        style={{ cursor: 'pointer' }}
      >
        {/* Channel fill */}
        <polygon
          points={`${x1},${y1} ${x2},${y2} ${x2},${y2 + channelHeight} ${x1},${y1 + channelHeight}`}
          fill={drawing.color}
          fillOpacity={0.1}
        />
        
        {/* Upper line */}
        <line
          x1={x1} y1={y1}
          x2={x2} y2={y2}
          stroke={drawing.color}
          strokeWidth={isSelected || isHovered ? 2 : 1}
        />
        
        {/* Lower line */}
        <line
          x1={x1} y1={y1 + channelHeight}
          x2={x2} y2={y2 + channelHeight}
          stroke={drawing.color}
          strokeWidth={isSelected || isHovered ? 2 : 1}
        />
        
        {/* Middle line */}
        <line
          x1={x1} y1={y1 + channelHeight / 2}
          x2={x2} y2={y2 + channelHeight / 2}
          stroke={drawing.color}
          strokeWidth={0.5}
          strokeDasharray="5,5"
          strokeOpacity={0.5}
        />
        
        {/* Control points */}
        {(isSelected || isHovered) && (
          <>
            <circle cx={x1} cy={y1} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
            <circle cx={x2} cy={y2} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
          </>
        )}
        
        {/* Delete button */}
        {isSelected && (
          <g 
            transform={`translate(${x2 + 10}, ${y2})`}
            onClick={(e) => {
              e.stopPropagation();
              deleteDrawing(drawing.id);
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle r={10} fill="#ef5350" />
            <text x={0} y={4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">×</text>
          </g>
        )}
      </g>
    );
  };

  // Render rectangle
  const renderRectangle = (drawing: DrawingObject, isPreview: boolean = false) => {
    if (drawing.points.length < 2) return null;
    
    const [p1, p2] = drawing.points;
    const y1 = priceToY(p1.y);
    const y2 = priceToY(p2.y);
    const x1 = isPreview ? p1.x : indexToX(p1.dataIndex || 0);
    const x2 = isPreview ? p2.x : indexToX(p2.dataIndex || 0);
    
    const isSelected = selectedDrawing === drawing.id;
    const isHovered = hoveredDrawing === drawing.id;

    return (
      <g 
        key={drawing.id}
        onMouseEnter={() => setHoveredDrawing(drawing.id)}
        onMouseLeave={() => setHoveredDrawing(null)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedDrawing(drawing.id);
        }}
        style={{ cursor: 'pointer' }}
      >
        <rect
          x={Math.min(x1, x2)}
          y={Math.min(y1, y2)}
          width={Math.abs(x2 - x1)}
          height={Math.abs(y2 - y1)}
          fill={drawing.color}
          fillOpacity={0.1}
          stroke={drawing.color}
          strokeWidth={isSelected || isHovered ? 2 : 1}
        />
        
        {/* Control points */}
        {(isSelected || isHovered) && (
          <>
            <circle cx={x1} cy={y1} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
            <circle cx={x2} cy={y2} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
            <circle cx={x1} cy={y2} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
            <circle cx={x2} cy={y1} r={5} fill={drawing.color} stroke="white" strokeWidth={1} />
          </>
        )}
        
        {/* Delete button */}
        {isSelected && (
          <g 
            transform={`translate(${Math.max(x1, x2) + 10}, ${Math.min(y1, y2)})`}
            onClick={(e) => {
              e.stopPropagation();
              deleteDrawing(drawing.id);
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle r={10} fill="#ef5350" />
            <text x={0} y={4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">×</text>
          </g>
        )}
      </g>
    );
  };

  // Render drawing based on type
  const renderDrawing = (drawing: DrawingObject, isPreview: boolean = false) => {
    if (!drawing.visible && !isPreview) return null;
    
    switch (drawing.type) {
      case 'trendline':
        return renderTrendline(drawing, isPreview);
      case 'horizontal':
      case 'support':
      case 'resistance':
        return renderHorizontalLine(drawing);
      case 'fibonacci':
        return renderFibonacci(drawing, isPreview);
      case 'channel':
        return renderChannel(drawing, isPreview);
      case 'rectangle':
        return renderRectangle(drawing, isPreview);
      default:
        return null;
    }
  };

  // Clear selection when clicking empty area
  const handleBackgroundClick = () => {
    setSelectedDrawing(null);
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        pointerEvents: activeTool ? 'all' : 'none',
        cursor: activeTool ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBackgroundClick}
    >
      {/* Existing drawings */}
      <g style={{ pointerEvents: 'all' }}>
        {drawings.map(drawing => renderDrawing(drawing))}
      </g>
      
      {/* Current drawing preview */}
      {currentDrawing && currentDrawing.points && currentDrawing.points.length >= 1 && (
        <g style={{ pointerEvents: 'none' }}>
          {renderDrawing(currentDrawing as DrawingObject, true)}
        </g>
      )}
    </svg>
  );
};

export default ChartDrawingTools;

// Drawing Toolbar Component
interface DrawingToolbarProps {
  activeTool: DrawingType | null;
  onSelectTool: (tool: DrawingType | null) => void;
  onClearAll: () => void;
  drawingsCount: number;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  onClearAll,
  drawingsCount,
}) => {
  const tools: { type: DrawingType; icon: string; label: string; color: string }[] = [
    { type: 'trendline', icon: 'show_chart', label: 'Trendline', color: '#2962ff' },
    { type: 'horizontal', icon: 'horizontal_rule', label: 'Horizontal', color: '#2962ff' },
    { type: 'fibonacci', icon: 'stacked_line_chart', label: 'Fibonacci', color: '#ff9800' },
    { type: 'support', icon: 'vertical_align_bottom', label: 'Support', color: '#26a69a' },
    { type: 'resistance', icon: 'vertical_align_top', label: 'Resistance', color: '#ef5350' },
    { type: 'rectangle', icon: 'crop_square', label: 'Rectangle', color: '#ab47bc' },
    { type: 'channel', icon: 'view_stream', label: 'Channel', color: '#26c6da' },
  ];

  return (
    <div className="flex items-center gap-1 bg-[#1e222d] rounded-lg p-1 border border-[#363a45]">
      {tools.map(tool => (
        <button
          key={tool.type}
          onClick={() => onSelectTool(activeTool === tool.type ? null : tool.type)}
          className={`relative px-2.5 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1 ${
            activeTool === tool.type
              ? 'bg-[#2962ff] text-white'
              : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
          }`}
          title={tool.label}
        >
          <span className="material-icons-round text-sm">{tool.icon}</span>
          <span className="hidden lg:inline">{tool.label}</span>
        </button>
      ))}
      
      <div className="w-px h-6 bg-[#363a45] mx-1" />
      
      {/* Clear all button */}
      {drawingsCount > 0 && (
        <button
          onClick={onClearAll}
          className="px-2.5 py-1.5 rounded text-xs font-medium text-[#ef5350] hover:bg-[#ef535020] transition-all flex items-center gap-1"
          title="Clear All Drawings"
        >
          <span className="material-icons-round text-sm">delete_outline</span>
          <span className="hidden lg:inline">Clear ({drawingsCount})</span>
        </button>
      )}
      
      {/* Active tool indicator */}
      {activeTool && (
        <div className="ml-2 px-2 py-1 bg-[#2962ff20] text-[#2962ff] rounded text-[10px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-[#2962ff] rounded-full animate-pulse" />
          Click to draw
        </div>
      )}
    </div>
  );
};
