import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CrosshairMode, ColorType } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { 
  FiTrendingUp, FiTrendingDown, FiSettings, FiCheck,
  FiEdit3, FiTrash2, FiMinus, FiType, FiGrid
} from 'react-icons/fi';
import {
  FaMousePointer,
  FaSlash,
  FaMinus,
  FaGripLinesVertical,
  FaDrawPolygon,
  FaRegSquare,
  FaRegComment
} from 'react-icons/fa';
import { 
  calculateSMA, calculateEMA, calculateRSI, calculateMACD, 
  calculateBollingerBands, calculateStochasticRSI, calculateATR, 
  convertToHeikinAshi, calculateRenko 
} from '../../utils/indicators';

const TIMEFRAMES = [
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '1h', seconds: 3600 },
  { label: '1d', seconds: 86400 },
  { label: '1w', seconds: 604800 },
  { label: '1M', seconds: 2592000 },
];

const CHART_TYPES = [
  { value: 'candlestick', label: 'Candlestick' },
  { value: 'heikin-ashi', label: 'Heikin Ashi' },
  { value: 'renko', label: 'Renko Bricks' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
];

export default function StockChart({ ohlcvData = [], symbol = '', currentPrice, change, changePercent }) {
  const { isDark } = useTheme();

  const themeColors = {
    bg: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? '#1e293b' : '#f1f5f9',
    border: isDark ? '#1e293b' : '#e2e8f0',
  };

  const chartContainerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const macdContainerRef = useRef(null);
  const stochContainerRef = useRef(null);
  const atrContainerRef = useRef(null);
  const svgRef = useRef(null);

  const chartRef = useRef(null);
  const rsiChartRef = useRef(null);
  const macdChartRef = useRef(null);
  const stochChartRef = useRef(null);
  const atrChartRef = useRef(null);

  const candlestickSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const areaSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // Indicators Series Refs (Main Chart)
  const smaSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);
  const bbUpperSeriesRef = useRef(null);
  const bbMiddleSeriesRef = useRef(null);
  const bbLowerSeriesRef = useRef(null);

  // Indicators Series Refs (Sub-Panels)
  const rsiSeriesRef = useRef(null);
  const macdLineSeriesRef = useRef(null);
  const macdSignalSeriesRef = useRef(null);
  const macdHistSeriesRef = useRef(null);
  const stochKSeriesRef = useRef(null);
  const stochDSeriesRef = useRef(null);
  const atrSeriesRef = useRef(null);

  const [activeTimeframe, setActiveTimeframe] = useState('1d');
  const [chartType, setChartType] = useState('candlestick');
  const [legendData, setLegendData] = useState(null);

  // Indicators State
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showStoch, setShowStoch] = useState(false);
  const [showATR, setShowATR] = useState(false);

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState('cursor'); // 'cursor', 'trendline', 'horizontal', 'vertical', 'fibonacci', 'rectangle', 'text', 'eraser'
  const [drawings, setDrawings] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [textCoords, setTextCoords] = useState(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  // Update SVG dimensions to match the chart viewport overlay
  const updateSvgOverlay = useCallback(() => {
    if (chartContainerRef.current) {
      setSvgDimensions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight
      });
    }
  }, []);

  // Aggregate raw tick data into timeframe candles
  const getAggregatedData = useCallback(() => {
    if (!ohlcvData || ohlcvData.length === 0) return [];

    const timeframe = TIMEFRAMES.find(t => t.label === activeTimeframe);
    const intervalSecs = timeframe ? timeframe.seconds : 86400;

    // Convert date string or numbers to unix seconds
    const sorted = ohlcvData.map(d => {
      let timeVal = 0;
      if (d.time) {
        timeVal = Number(d.time);
      } else if (d.date) {
        const parsed = new Date(d.date).getTime();
        timeVal = isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
      }
      return {
        time: timeVal,
        open: Number(d.open),
        high: Number(d.high),
        low: Number(d.low),
        close: Number(d.close),
        volume: Number(d.volume || 0)
      };
    })
    .filter(d => d.time > 0)
    .sort((a, b) => a.time - b.time);

    // Group by timeframe buckets
    const buckets = new Map();
    sorted.forEach(c => {
      const bTime = Math.floor(c.time / intervalSecs) * intervalSecs;
      if (!buckets.has(bTime)) {
        buckets.set(bTime, []);
      }
      buckets.get(bTime).push(c);
    });

    const candles = Array.from(buckets.keys()).sort((a, b) => a - b).map(time => {
      const group = buckets.get(time);
      const open = group[0].open;
      const close = group[group.length - 1].close;
      const high = Math.max(...group.map(x => x.high));
      const low = Math.min(...group.map(x => x.low));
      const volume = group.reduce((sum, x) => sum + x.volume, 0);
      return { time, open, high, low, close, volume };
    });

    // Strictly enforce ascending unique times for lightweight-charts
    const uniqueCandles = [];
    let lastTime = 0;
    candles.forEach(c => {
      if (c.time > lastTime) {
        uniqueCandles.push(c);
        lastTime = c.time;
      }
    });

    return uniqueCandles;
  }, [ohlcvData, activeTimeframe]);

  // Sync scroll/zoom Logical Ranges across charts
  const syncLogicalRanges = useCallback(() => {
    const mainChart = chartRef.current;
    if (!mainChart) return;

    const handleRangeChange = (range) => {
      if (range) {
        rsiChartRef.current?.timeScale().setVisibleLogicalRange(range);
        macdChartRef.current?.timeScale().setVisibleLogicalRange(range);
        stochChartRef.current?.timeScale().setVisibleLogicalRange(range);
        atrChartRef.current?.timeScale().setVisibleLogicalRange(range);
      }
      // Force SVG overlay drawing recalculations on pan/zoom
      updateSvgOverlay();
    };

    mainChart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);
    return () => {
      mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
    };
  }, [updateSvgOverlay]);

  // Primary chart setup
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: themeColors.bg },
        textColor: themeColors.text,
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: themeColors.grid },
        horzLines: { color: themeColors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)', width: 1, style: 2 },
        horzLine: { color: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: themeColors.border,
        visible: true,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
      },
      rightPriceScale: {
        borderColor: themeColors.border,
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00d09c',
      downColor: '#eb5b5b',
      borderUpColor: '#00d09c',
      borderDownColor: '#eb5b5b',
      wickUpColor: '#00d09c',
      wickDownColor: '#eb5b5b',
    });

    const lineSeries = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      visible: false,
    });

    const areaSeries = chart.addAreaSeries({
      topColor: 'rgba(59, 130, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.0)',
      lineColor: '#3b82f6',
      lineWidth: 2,
      visible: false,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candleSeries;
    lineSeriesRef.current = lineSeries;
    areaSeriesRef.current = areaSeries;
    volumeSeriesRef.current = volumeSeries;

    // Crosshair Legend data
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setLegendData(null);
        return;
      }
      const activeSeries = chartType === 'line' ? lineSeries : (chartType === 'area' ? areaSeries : candleSeries);
      const candleData = param.seriesData.get(activeSeries);
      const volumeData = param.seriesData.get(volumeSeries);
      if (candleData) {
        setLegendData({
          open: candleData.open ?? candleData.value,
          high: candleData.high ?? candleData.value,
          low: candleData.low ?? candleData.value,
          close: candleData.close ?? candleData.value,
          volume: volumeData?.value || 0,
          isUp: (candleData.close ?? candleData.value) >= (candleData.open ?? candleData.value),
        });
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
        updateSvgOverlay();
      }
    });
    resizeObserver.observe(chartContainerRef.current);
    updateSvgOverlay();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [chartType, updateSvgOverlay]);

  // Synchronize secondary indicator sub-charts
  const createSubChart = (container) => {
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: themeColors.bg },
        textColor: themeColors.text,
        fontSize: 10,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: themeColors.grid },
        horzLines: { color: themeColors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)', width: 1, style: 2 },
        horzLine: { color: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)', width: 1, style: 2 },
      },
      timeScale: { visible: false },
      rightPriceScale: { borderColor: themeColors.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
    });
    return chart;
  };

  // Update chart options dynamically when theme changes
  useEffect(() => {
    const applyThemeOptions = (chartInstance) => {
      if (!chartInstance) return;
      chartInstance.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: themeColors.bg },
          textColor: themeColors.text,
        },
        grid: {
          vertLines: { color: themeColors.grid },
          horzLines: { color: themeColors.grid },
        },
        crosshair: {
          vertLine: { color: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)' },
          horzLine: { color: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)' },
        },
        timeScale: {
          borderColor: themeColors.border,
        },
        rightPriceScale: {
          borderColor: themeColors.border,
        },
      });
    };

    applyThemeOptions(chartRef.current);
    applyThemeOptions(rsiChartRef.current);
    applyThemeOptions(macdChartRef.current);
    applyThemeOptions(stochChartRef.current);
    applyThemeOptions(atrChartRef.current);
  }, [isDark, themeColors.bg, themeColors.text, themeColors.grid, themeColors.border]);

  // RSI Chart
  useEffect(() => {
    if (!showRSI) {
      rsiChartRef.current?.remove();
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
      return;
    }
    if (!rsiContainerRef.current || rsiChartRef.current) return;
    const chart = createSubChart(rsiContainerRef.current);
    const series = chart.addLineSeries({ color: '#a855f7', lineWidth: 1.5, title: 'RSI (14)' });
    
    // 30 / 70 bands
    const oLine = chart.addLineSeries({ color: 'rgba(235, 91, 91, 0.2)', lineWidth: 1, lineStyle: 3 });
    const bLine = chart.addLineSeries({ color: 'rgba(0, 208, 156, 0.2)', lineWidth: 1, lineStyle: 3 });

    rsiChartRef.current = chart;
    rsiSeriesRef.current = series;
    syncLogicalRanges();

    return () => chart.remove();
  }, [showRSI, syncLogicalRanges]);

  // MACD Chart
  useEffect(() => {
    if (!showMACD) {
      macdChartRef.current?.remove();
      macdChartRef.current = null;
      macdLineSeriesRef.current = null;
      macdSignalSeriesRef.current = null;
      macdHistSeriesRef.current = null;
      return;
    }
    if (!macdContainerRef.current || macdChartRef.current) return;
    const chart = createSubChart(macdContainerRef.current);
    const line = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1.5, title: 'MACD' });
    const sig = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1.5, title: 'Signal' });
    const hist = chart.addHistogramSeries({ title: 'Histogram' });

    macdChartRef.current = chart;
    macdLineSeriesRef.current = line;
    macdSignalSeriesRef.current = sig;
    macdHistSeriesRef.current = hist;
    syncLogicalRanges();

    return () => chart.remove();
  }, [showMACD, syncLogicalRanges]);

  // Stoch RSI Chart
  useEffect(() => {
    if (!showStoch) {
      stochChartRef.current?.remove();
      stochChartRef.current = null;
      stochKSeriesRef.current = null;
      stochDSeriesRef.current = null;
      return;
    }
    if (!stochContainerRef.current || stochChartRef.current) return;
    const chart = createSubChart(stochContainerRef.current);
    const k = chart.addLineSeries({ color: '#3b82f6', lineWidth: 1.5, title: '%K' });
    const d = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1.5, title: '%D' });

    stochChartRef.current = chart;
    stochKSeriesRef.current = k;
    stochDSeriesRef.current = d;
    syncLogicalRanges();

    return () => chart.remove();
  }, [showStoch, syncLogicalRanges]);

  // ATR Chart
  useEffect(() => {
    if (!showATR) {
      atrChartRef.current?.remove();
      atrChartRef.current = null;
      atrSeriesRef.current = null;
      return;
    }
    if (!atrContainerRef.current || atrChartRef.current) return;
    const chart = createSubChart(atrContainerRef.current);
    const series = chart.addLineSeries({ color: '#ec4899', lineWidth: 1.5, title: 'ATR (14)' });

    atrChartRef.current = chart;
    atrSeriesRef.current = series;
    syncLogicalRanges();

    return () => chart.remove();
  }, [showATR, syncLogicalRanges]);

  // Feed Data and Calculate Technical Indicators on change
  useEffect(() => {
    const mainChart = chartRef.current;
    if (!mainChart) return;

    let candles = getAggregatedData();
    if (candles.length === 0) return;

    // Apply Heikin Ashi if selected
    if (chartType === 'heikin-ashi') {
      candles = convertToHeikinAshi(candles);
    } else if (chartType === 'renko') {
      candles = calculateRenko(candles, currentPrice * 0.015 || 5);
    }

    const closePrices = candles.map(c => c.close);
    const volumes = candles.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(0, 208, 156, 0.2)' : 'rgba(235, 91, 91, 0.2)',
    }));

    // Configure styles based on selection
    if (chartType === 'line') {
      lineSeriesRef.current?.applyOptions({ visible: true });
      candlestickSeriesRef.current?.applyOptions({ visible: false });
      areaSeriesRef.current?.applyOptions({ visible: false });
      lineSeriesRef.current?.setData(candles.map(c => ({ time: c.time, value: c.close })));
    } else if (chartType === 'area') {
      areaSeriesRef.current?.applyOptions({ visible: true });
      candlestickSeriesRef.current?.applyOptions({ visible: false });
      lineSeriesRef.current?.applyOptions({ visible: false });
      areaSeriesRef.current?.setData(candles.map(c => ({ time: c.time, value: c.close })));
    } else {
      candlestickSeriesRef.current?.applyOptions({ visible: true });
      lineSeriesRef.current?.applyOptions({ visible: false });
      areaSeriesRef.current?.applyOptions({ visible: false });
      candlestickSeriesRef.current?.setData(candles);
    }

    volumeSeriesRef.current?.setData(volumes);

    // SMA Indicator
    if (showSMA) {
      if (!smaSeriesRef.current) smaSeriesRef.current = mainChart.addLineSeries({ color: '#eab308', lineWidth: 1.5, title: 'SMA 20' });
      const smaData = calculateSMA(closePrices, 20);
      smaSeriesRef.current.setData(candles.map((c, i) => ({ time: c.time, value: smaData[i] })).filter(d => d.value !== null));
    } else if (smaSeriesRef.current) {
      mainChart.removeSeries(smaSeriesRef.current);
      smaSeriesRef.current = null;
    }

    // EMA Indicator
    if (showEMA) {
      if (!emaSeriesRef.current) emaSeriesRef.current = mainChart.addLineSeries({ color: '#06b6d4', lineWidth: 1.5, title: 'EMA 9' });
      const emaData = calculateEMA(closePrices, 9);
      emaSeriesRef.current.setData(candles.map((c, i) => ({ time: c.time, value: emaData[i] })).filter(d => d.value !== null));
    } else if (emaSeriesRef.current) {
      mainChart.removeSeries(emaSeriesRef.current);
      emaSeriesRef.current = null;
    }

    // Bollinger Bands Indicator
    if (showBB) {
      if (!bbUpperSeriesRef.current) bbUpperSeriesRef.current = mainChart.addLineSeries({ color: 'rgba(245, 158, 11, 0.4)', lineWidth: 1 });
      if (!bbMiddleSeriesRef.current) bbMiddleSeriesRef.current = mainChart.addLineSeries({ color: 'rgba(100, 116, 139, 0.3)', lineWidth: 1, lineStyle: 2 });
      if (!bbLowerSeriesRef.current) bbLowerSeriesRef.current = mainChart.addLineSeries({ color: 'rgba(245, 158, 11, 0.4)', lineWidth: 1 });

      const bbData = calculateBollingerBands(closePrices, 20, 2);
      bbUpperSeriesRef.current.setData(candles.map((c, i) => ({ time: c.time, value: bbData[i].upper })).filter(d => d.value !== null));
      bbMiddleSeriesRef.current.setData(candles.map((c, i) => ({ time: c.time, value: bbData[i].middle })).filter(d => d.value !== null));
      bbLowerSeriesRef.current.setData(candles.map((c, i) => ({ time: c.time, value: bbData[i].lower })).filter(d => d.value !== null));
    } else {
      if (bbUpperSeriesRef.current) { mainChart.removeSeries(bbUpperSeriesRef.current); bbUpperSeriesRef.current = null; }
      if (bbMiddleSeriesRef.current) { mainChart.removeSeries(bbMiddleSeriesRef.current); bbMiddleSeriesRef.current = null; }
      if (bbLowerSeriesRef.current) { mainChart.removeSeries(bbLowerSeriesRef.current); bbLowerSeriesRef.current = null; }
    }

    // RSI Sub-Chart Series
    if (showRSI && rsiSeriesRef.current) {
      const rsiData = calculateRSI(closePrices, 14);
      rsiSeriesRef.current.setData(candles.map((c, i) => ({ time: c.time, value: rsiData[i] })).filter(d => d.value !== null));
      rsiChartRef.current?.timeScale().fitContent();
    }

    // MACD Sub-Chart Series
    if (showMACD && macdLineSeriesRef.current) {
      const macdData = calculateMACD(closePrices);
      macdLineSeriesRef.current.setData(candles.map((c, i) => ({ time: c.time, value: macdData[i].macd })).filter(d => d.value !== null));
      macdSignalSeriesRef.current?.setData(candles.map((c, i) => ({ time: c.time, value: macdData[i].signal })).filter(d => d.value !== null));
      macdHistSeriesRef.current?.setData(candles.map((c, i) => ({
        time: c.time,
        value: macdData[i].histogram,
        color: (macdData[i].histogram ?? 0) >= 0 ? 'rgba(0, 208, 156, 0.4)' : 'rgba(235, 91, 91, 0.4)'
      })).filter(d => d.value !== null));
    }

    // Stochastic RSI Sub-Chart Series
    if (showStoch && stochKSeriesRef.current) {
      const stochData = calculateStochasticRSI(closePrices);
      stochKSeriesRef.current.setData(candles.map((c, i) => ({ time: c.time, value: stochData[i].k })).filter(d => d.value !== null));
      stochDSeriesRef.current?.setData(candles.map((c, i) => ({ time: c.time, value: stochData[i].d })).filter(d => d.value !== null));
    }

    // ATR Sub-Chart Series
    if (showATR && atrSeriesRef.current) {
      const atrData = calculateATR(candles);
      atrSeriesRef.current.setData(candles.map((c, i) => ({ time: c.time, value: atrData[i] })).filter(d => d.value !== null));
    }

    // Set range matching
    syncLogicalRanges();
  }, [
    ohlcvData, activeTimeframe, chartType, showSMA, showEMA, showBB, 
    showRSI, showMACD, showStoch, showATR, currentPrice, getAggregatedData, syncLogicalRanges
  ]);

  // Handle drawings conversion to screen coords
  const convertDrawingsToPixels = useCallback(() => {
    const mainChart = chartRef.current;
    const activeSeries = candlestickSeriesRef.current || lineSeriesRef.current || areaSeriesRef.current;
    if (!mainChart || !activeSeries) return [];

    return drawings.map(d => {
      const pixelPoints = d.points.map(pt => {
        const x = mainChart.timeScale().timeToCoordinate(pt.time);
        const y = activeSeries.priceToCoordinate(pt.price);
        return { x, y };
      });

      return {
        ...d,
        pixelPoints
      };
    });
  }, [drawings]);

  // SVG Drawing Actions
  const handlePointerDown = (e) => {
    if (activeTool === 'cursor') return;

    const mainChart = chartRef.current;
    const activeSeries = candlestickSeriesRef.current || lineSeriesRef.current || areaSeriesRef.current;
    if (!mainChart || !activeSeries || !svgRef.current) return;

    // Get cursor offset in SVG overlay coordinates
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = mainChart.timeScale().coordinateToTime(x);
    const price = activeSeries.coordinateToPrice(y);

    if (time === null || price === null) return;

    if (activeTool === 'horizontal') {
      // Single-click placing horizontal line
      setDrawings([...drawings, {
        id: Date.now(),
        type: 'horizontal',
        points: [{ time, price }]
      }]);
      setActiveTool('cursor');
    } else if (activeTool === 'vertical') {
      // Single-click placing vertical line
      setDrawings([...drawings, {
        id: Date.now(),
        type: 'vertical',
        points: [{ time, price }]
      }]);
      setActiveTool('cursor');
    } else if (activeTool === 'text') {
      setTextCoords({ time, price });
      setTextInput('');
    } else {
      // Multi-point dragging tools (trendline, rectangle, fibonacci)
      setCurrentDrawing({
        type: activeTool,
        points: [{ time, price }, { time, price }]
      });
    }
  };

  const handlePointerMove = (e) => {
    if (!currentDrawing || !svgRef.current) return;

    const mainChart = chartRef.current;
    const activeSeries = candlestickSeriesRef.current || lineSeriesRef.current || areaSeriesRef.current;
    if (!mainChart || !activeSeries) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = mainChart.timeScale().coordinateToTime(x);
    const price = activeSeries.coordinateToPrice(y);

    if (time === null || price === null) return;

    // Update second point of the active drawing
    setCurrentDrawing({
      ...currentDrawing,
      points: [currentDrawing.points[0], { time, price }]
    });
  };

  const handlePointerUp = () => {
    if (!currentDrawing) return;

    setDrawings([...drawings, {
      id: Date.now(),
      ...currentDrawing
    }]);
    setCurrentDrawing(null);
    setActiveTool('cursor');
  };

  const deleteDrawing = (id) => {
    setDrawings(drawings.filter(d => d.id !== id));
  };

  const clearAllDrawings = () => {
    setDrawings([]);
    setCurrentDrawing(null);
  };

  const submitText = () => {
    if (textInput.trim() && textCoords) {
      setDrawings([...drawings, {
        id: Date.now(),
        type: 'text',
        text: textInput.trim(),
        points: [textCoords]
      }]);
    }
    setTextCoords(null);
    setTextInput('');
    setActiveTool('cursor');
  };

  const isPositive = (change || 0) >= 0;

  // Render overlay elements
  const drawingsWithCoords = convertDrawingsToPixels();
  let currentDrawingWithCoords = null;
  if (currentDrawing) {
    const activeSeries = candlestickSeriesRef.current || lineSeriesRef.current || areaSeriesRef.current;
    const pPoints = currentDrawing.points.map(pt => ({
      x: chartRef.current?.timeScale().timeToCoordinate(pt.time) ?? 0,
      y: activeSeries?.priceToCoordinate(pt.price) ?? 0
    }));
    currentDrawingWithCoords = { ...currentDrawing, pixelPoints: pPoints };
  }

  return (
    <div className="glass-card overflow-hidden flex flex-col xl:flex-row gap-4 p-4 lg:p-5 relative">
      {/* Side drawing toolbar */}
      <div className="flex xl:flex-col gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 items-center">
        {[
          { id: 'cursor', icon: <FaMousePointer size={14} />, label: 'Cursor' },
          { id: 'trendline', icon: <FaSlash size={14} className="-rotate-45" />, label: 'Trend Line' },
          { id: 'horizontal', icon: <FaMinus size={14} />, label: 'Horiz Line' },
          { id: 'vertical', icon: <FaGripLinesVertical size={14} />, label: 'Vert Line' },
          { id: 'fibonacci', icon: <FaDrawPolygon size={14} />, label: 'Fib Retrace' },
          { id: 'rectangle', icon: <FaRegSquare size={14} />, label: 'Rectangle' },
          { id: 'text', icon: <FaRegComment size={14} />, label: 'Text Note' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              activeTool === t.id
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
        <button
          onClick={clearAllDrawings}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-all"
          title="Clear Drawings"
        >
          <FiTrash2 size={16} />
        </button>
      </div>

      {/* Main Plot Area */}
      <div className="flex-1 flex flex-col gap-4 relative">
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Timeframes */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-1 rounded-xl">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.label}
                onClick={() => setActiveTimeframe(t.label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTimeframe === t.label
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Chart Styles */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-1 rounded-xl">
            {CHART_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setChartType(ct.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartType === ct.value
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>

          {/* Indicators dropdown toggle */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Overlays:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={showSMA} onChange={(e) => setShowSMA(e.target.checked)} className="rounded bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-amber-500 focus:ring-0" />
              <span>SMA 20</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={showEMA} onChange={(e) => setShowEMA(e.target.checked)} className="rounded bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-amber-500 focus:ring-0" />
              <span>EMA 9</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={showBB} onChange={(e) => setShowBB(e.target.checked)} className="rounded bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-amber-500 focus:ring-0" />
              <span>BB Bands</span>
            </label>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="flex flex-wrap items-center justify-between text-xs gap-4 px-2">
          <div className="flex items-center gap-4">
            <span className="text-md font-bold text-slate-800 dark:text-white uppercase">{symbol}</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">₹{Number(currentPrice || 0).toFixed(2)}</span>
            <span className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositive ? '+' : ''}{Number(change || 0).toFixed(2)} ({isPositive ? '+' : ''}{Number(changePercent || 0).toFixed(2)}%)
            </span>
          </div>
          {legendData && (
            <div className="flex items-center gap-3 font-mono text-slate-500 dark:text-slate-400">
              <span>O: <span className={legendData.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{legendData.open?.toFixed(2)}</span></span>
              <span>H: <span className="text-emerald-500 dark:text-emerald-400">{legendData.high?.toFixed(2)}</span></span>
              <span>L: <span className="text-rose-500 dark:text-rose-400">{legendData.low?.toFixed(2)}</span></span>
              <span>C: <span className={legendData.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{legendData.close?.toFixed(2)}</span></span>
              <span>V: <span className="text-slate-700 dark:text-slate-300">{Number(legendData.volume).toLocaleString()}</span></span>
            </div>
          )}
        </div>

        {/* Indicator Pane Toggles */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'rsi', label: 'RSI', active: showRSI, setter: setShowRSI },
            { id: 'macd', label: 'MACD', active: showMACD, setter: setShowMACD },
            { id: 'stoch', label: 'Stoch RSI', active: showStoch, setter: setShowStoch },
            { id: 'atr', label: 'ATR', active: showATR, setter: setShowATR },
          ].map(ind => (
            <button
              key={ind.id}
              onClick={() => ind.setter(!ind.active)}
              className={`px-3 py-1 rounded-full border transition-all ${
                ind.active 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' 
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>

        {/* Sub-charts rendering grid */}
        <div className="flex flex-col w-full relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
          {/* Main Price Plot & SVG Drawing Layer */}
          <div className="w-full relative">
            <div ref={chartContainerRef} className="w-full" style={{ height: '380px' }} />
            
            {/* Drawing overlay */}
            <svg
              ref={svgRef}
              className={`absolute inset-0 z-10 select-none ${
                activeTool !== 'cursor' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
              }`}
              style={{ width: `${svgDimensions.width}px`, height: `${svgDimensions.height}px` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Draw Finished Drawings */}
              {drawingsWithCoords.map((d) => {
                const pts = d.pixelPoints;
                if (!pts || pts.length === 0) return null;

                if (d.type === 'trendline' && pts.length >= 2) {
                  return (
                    <g key={d.id}>
                      <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke="#f59e0b" strokeWidth="2" />
                      {activeTool === 'cursor' && (
                        <circle cx={pts[0].x} cy={pts[0].y} r="5" fill={isDark ? '#ffffff' : '#0f172a'} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth="1" className="cursor-pointer pointer-events-auto" onClick={() => deleteDrawing(d.id)} />
                      )}
                    </g>
                  );
                }

                if (d.type === 'horizontal') {
                  return (
                    <g key={d.id}>
                      <line x1={0} y1={pts[0].y} x2={svgDimensions.width} y2={pts[0].y} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                      {activeTool === 'cursor' && (
                        <circle cx={20} cy={pts[0].y} r="5" fill={isDark ? '#ffffff' : '#0f172a'} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth="1" className="cursor-pointer pointer-events-auto" onClick={() => deleteDrawing(d.id)} />
                      )}
                    </g>
                  );
                }

                if (d.type === 'vertical') {
                  return (
                    <g key={d.id}>
                      <line x1={pts[0].x} y1={0} x2={pts[0].x} y2={svgDimensions.height} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                      {activeTool === 'cursor' && (
                        <circle cx={pts[0].x} cy={20} r="5" fill={isDark ? '#ffffff' : '#0f172a'} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth="1" className="cursor-pointer pointer-events-auto" onClick={() => deleteDrawing(d.id)} />
                      )}
                    </g>
                  );
                }

                if (d.type === 'rectangle' && pts.length >= 2) {
                  const width = Math.abs(pts[1].x - pts[0].x);
                  const height = Math.abs(pts[1].y - pts[0].y);
                  const x = Math.min(pts[0].x, pts[1].x);
                  const y = Math.min(pts[0].y, pts[1].y);
                  return (
                    <g key={d.id}>
                      <rect x={x} y={y} width={width} height={height} fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="1.5" />
                      {activeTool === 'cursor' && (
                        <circle cx={x} cy={y} r="5" fill={isDark ? '#ffffff' : '#0f172a'} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth="1" className="cursor-pointer pointer-events-auto" onClick={() => deleteDrawing(d.id)} />
                      )}
                    </g>
                  );
                }

                if (d.type === 'fibonacci' && pts.length >= 2) {
                  const y0 = pts[0].y;
                  const y1 = pts[1].y;
                  const dy = y1 - y0;
                  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                  const fibStroke = isDark ? 'rgba(206, 147, 216, 0.6)' : 'rgba(124, 58, 237, 0.6)';
                  const fibTextFill = isDark ? 'rgba(206, 147, 216, 0.9)' : 'rgba(124, 58, 237, 0.9)';
                  return (
                    <g key={d.id}>
                      {levels.map((lvl) => {
                        const yLvl = y0 + dy * lvl;
                        return (
                          <g key={lvl}>
                            <line x1={0} y1={yLvl} x2={svgDimensions.width} y2={yLvl} stroke={fibStroke} strokeWidth="1" />
                            <text x={10} y={yLvl - 4} fill={fibTextFill} fontSize="9" fontFamily="monospace">
                              {(lvl * 100).toFixed(1)}% (₹{(d.points[0].price + (d.points[1].price - d.points[0].price) * lvl).toFixed(2)})
                            </text>
                          </g>
                        );
                      })}
                      {activeTool === 'cursor' && (
                        <circle cx={pts[0].x} cy={pts[0].y} r="5" fill={isDark ? '#ffffff' : '#0f172a'} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth="1" className="cursor-pointer pointer-events-auto" onClick={() => deleteDrawing(d.id)} />
                      )}
                    </g>
                  );
                }

                if (d.type === 'text') {
                  return (
                    <g key={d.id}>
                      <text x={pts[0].x} y={pts[0].y} fill={isDark ? '#e2e8f0' : '#1e293b'} fontSize="12" fontWeight="500" fontFamily="sans-serif">
                        💬 {d.text}
                      </text>
                      {activeTool === 'cursor' && (
                        <circle cx={pts[0].x} cy={pts[0].y} r="5" fill={isDark ? '#ffffff' : '#0f172a'} stroke={isDark ? '#1e293b' : '#ffffff'} strokeWidth="1" className="cursor-pointer pointer-events-auto" onClick={() => deleteDrawing(d.id)} />
                      )}
                    </g>
                  );
                }

                return null;
              })}

              {/* Draw Active Live Dragging Drawing */}
              {currentDrawingWithCoords && currentDrawingWithCoords.pixelPoints.length >= 2 && (() => {
                const pts = currentDrawingWithCoords.pixelPoints;
                if (currentDrawingWithCoords.type === 'trendline') {
                  return <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 5" />;
                }
                if (currentDrawingWithCoords.type === 'rectangle') {
                  const width = Math.abs(pts[1].x - pts[0].x);
                  const height = Math.abs(pts[1].y - pts[0].y);
                  const x = Math.min(pts[0].x, pts[1].x);
                  const y = Math.min(pts[0].y, pts[1].y);
                  return <rect x={x} y={y} width={width} height={height} fill="rgba(245, 158, 11, 0.05)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />;
                }
                if (currentDrawingWithCoords.type === 'fibonacci') {
                  const y0 = pts[0].y;
                  const y1 = pts[1].y;
                  const dy = y1 - y0;
                  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                  return (
                    <g>
                      {levels.map((lvl) => {
                        const yLvl = y0 + dy * lvl;
                        return <line key={lvl} x1={0} y1={yLvl} x2={svgDimensions.width} y2={yLvl} stroke="rgba(206, 147, 216, 0.3)" strokeWidth="1" />;
                      })}
                    </g>
                  );
                }
                return null;
              })()}
            </svg>

            {/* Input Overlay for Text tool */}
            <AnimatePresence>
              {textCoords && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute z-20 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex gap-2"
                  style={{
                    left: `${chartRef.current?.timeScale().timeToCoordinate(textCoords.time) ?? 100}px`,
                    top: `${candlestickSeriesRef.current?.priceToCoordinate(textCoords.price) ?? 100}px`
                  }}
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    className="glass-input text-xs py-1.5 px-3"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && submitText()}
                  />
                  <button onClick={submitText} className="btn-primary py-1.5 px-3 text-xs">OK</button>
                  <button onClick={() => setTextCoords(null)} className="btn-ghost py-1.5 px-3 text-xs">Cancel</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Indicator Panes */}
          {showRSI && (
            <div className="w-full border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-2">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-2">RSI (14)</div>
              <div ref={rsiContainerRef} className="w-full" style={{ height: '90px' }} />
            </div>
          )}

          {showMACD && (
            <div className="w-full border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-2">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-2">MACD (12, 26, 9)</div>
              <div ref={macdContainerRef} className="w-full" style={{ height: '90px' }} />
            </div>
          )}

          {showStoch && (
            <div className="w-full border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-2">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-2">Stochastic RSI (14, 3, 3)</div>
              <div ref={stochContainerRef} className="w-full" style={{ height: '90px' }} />
            </div>
          )}

          {showATR && (
            <div className="w-full border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-2">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-2">ATR (14)</div>
              <div ref={atrContainerRef} className="w-full" style={{ height: '90px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
