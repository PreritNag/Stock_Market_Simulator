import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

/**
 * General purpose Line Chart component
 */
export default function LineChart({ data = [], height = 150, color = '#00d09c' }) {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
        fontSize: 10,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(255,255,255,0.02)' },
      },
      rightPriceScale: {
        visible: true,
        borderColor: 'rgba(255,255,255,0.05)',
      },
      timeScale: {
        visible: true,
        borderColor: 'rgba(255,255,255,0.05)',
      },
      handleScroll: false,
      handleScale: false,
    });

    const lineSeries = chart.addLineSeries({
      color: color,
      lineWidth: 2,
    });

    const chartData = data.map((d) => ({
      time: typeof d.time === 'string' ? d.time.split('T')[0] : d.time,
      value: Number(d.value || d.close || 0),
    })).sort((a, b) => (a.time > b.time ? 1 : -1));

    lineSeries.setData(chartData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, color]);

  return <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />;
}
