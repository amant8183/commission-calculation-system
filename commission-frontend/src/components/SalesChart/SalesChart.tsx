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

    setChartData({
      labels,
      datasets: [
        {
          label: 'Sales Volume ($)',
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    });
  }, [sales]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Sales Volume (Last 6 Months)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  if (!chartData) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <p className="text-gray-500 text-center">No sales data available for chart</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default SalesChart;
