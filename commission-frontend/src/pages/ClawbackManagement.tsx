import React from 'react';
import ClawbackManagement from '../components/ClawbackManagement/ClawbackManagement';
import { Sale } from '../components/SalesList';

interface ClawbackManagementPageProps {
  sales: Sale[];
  handleCancelSale: (saleId: number) => Promise<void>;
}

const ClawbackManagementPage: React.FC<ClawbackManagementPageProps> = ({ sales, handleCancelSale }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clawback Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage policy cancellations and clawback processing
        </p>
      </div>

      {/* Reuse existing ClawbackManagement component */}
      <ClawbackManagement sales={sales} onCancelSale={handleCancelSale} />
    </div>
  );
};

export default ClawbackManagementPage;
