import React from 'react';
import SalesForm from '../components/SalesForm';
import SalesList, { Sale } from '../components/SalesList';

interface SalesManagementProps {
  sales: Sale[];
  onSaleAdded: () => void;
  onCancelSale: (saleId: number) => Promise<void>;
}

const SalesManagement: React.FC<SalesManagementProps> = ({ sales, onSaleAdded, onCancelSale }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Record new policy sales and view sales history
        </p>
      </div>

      {/* Reuse existing SalesForm component */}
      <SalesForm onSaleAdded={onSaleAdded} />

      {/* Reuse existing SalesList component */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Sales History</h2>
        <SalesList sales={sales} onCancelSale={onCancelSale} />
      </div>
    </div>
  );
};

export default SalesManagement;
