import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Sale } from '../SalesList';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SalesChartProps {
  sales: Sale[];
}

const SalesChart: React.FC<SalesChartProps> = ({ sales }) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!sales || sales.length === 0) {
      setChartData(null);
      return;
    }

    // Group sales by month
    const salesByMonth: { [key: string]: number } = {};
    
    sales.forEach(sale => {
      if (sale.is_cancelled) return; // Skip cancelled sales
      
      const date = new Date(sale.sale_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!salesByMonth[monthKey]) {
        salesByMonth[monthKey] = 0;
      }
      salesByMonth[monthKey] += sale.policy_value;
    });

    // Sort by month and get last 6 months
    const sortedMonths = Object.keys(salesByMonth).sort().slice(-6);
    const values = sortedMonths.map(month => salesByMonth[month]);

    // Format month labels (e.g., "2024-10" -> "Oct 2024")
    const labels = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const chartBgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-chartPrimary').trim();
    const chartBorderColor = getComputedStyle(document.documentElement).getPropertyValue('--color-chartPrimaryBorder').trim();

    setChartData({
      labels,
      datasets: [
        {
          label: 'Sales Volume ($)',
          data: values,
          backgroundColor: chartBgColor || 'rgba(59, 130, 246, 0.6)',
          borderColor: chartBorderColor || 'rgb(59, 130, 246)',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    });
  }, [sales]);

  const getColorVar = (varName: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: getColorVar('--color-chartText') || '#9ca3af',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Monthly Sales Volume (Last 6 Months)',
        color: getColorVar('--color-chartTextDim') || '#6b7280',
        font: {
          size: 13,
          weight: '500' as any,
          family: 'Inter, system-ui, sans-serif'
        },
        padding: {
          top: 0,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: getColorVar('--color-bgDark') || 'rgba(17, 24, 39, 0.95)',
        titleColor: getColorVar('--color-textPrimary') || '#f3f4f6',
        bodyColor: getColorVar('--color-textSecondary') || '#d1d5db',
        borderColor: getColorVar('--color-border') || 'rgba(75, 85, 99, 0.5)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return 'Sales Volume: $' + context.parsed.y.toLocaleString();
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: getColorVar('--color-chartText') || '#9ca3af',
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: getColorVar('--color-chartGrid') || 'rgba(75, 85, 99, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: getColorVar('--color-chartText') || '#9ca3af',
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-center text-sm text-textsubtl">No sales data available for chart</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default SalesChart;
