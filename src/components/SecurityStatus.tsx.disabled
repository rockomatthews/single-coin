import React, { useState, useEffect } from 'react';
import { performSecurityAssessment, getSecurityBadge } from '../utils/goplus-security';

interface SecurityStatusProps {
  userAddress?: string;
  tokenAddress?: string;
  showCompact?: boolean;
}

interface SecurityAssessment {
  isSecure: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warnings: string[];
  recommendations: string[];
  details: any;
}

export default function SecurityStatus({ 
  userAddress, 
  tokenAddress, 
  showCompact = false 
}: SecurityStatusProps) {
  const [assessment, setAssessment] = useState<SecurityAssessment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performCheck = async () => {
      if (!userAddress) return;
      
      setLoading(true);
      
      try {
        const result = await performSecurityAssessment({
          userAddress,
          tokenAddress,
          feeRecipientAddress: process.env.NEXT_PUBLIC_FEE_RECIPIENT_ADDRESS,
        });
        setAssessment(result);
      } catch (err) {
        console.error('Security check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    performCheck();
  }, [userAddress, tokenAddress]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="text-sm text-gray-600">🛡️ Running security checks...</span>
      </div>
    );
  }

  if (!assessment) return null;

  const badge = getSecurityBadge(assessment);
  
  if (showCompact) {
    return (
      <div className={`flex items-center space-x-2 p-2 rounded-lg ${
        badge.color === 'green' ? 'bg-green-50' :
        badge.color === 'yellow' ? 'bg-yellow-50' :
        badge.color === 'orange' ? 'bg-orange-50' :
        badge.color === 'red' ? 'bg-red-50' : 'bg-gray-50'
      }`}>
        <span className="text-lg">{badge.icon}</span>
        <span className={`text-sm font-medium ${
          badge.color === 'green' ? 'text-green-700' :
          badge.color === 'yellow' ? 'text-yellow-700' :
          badge.color === 'orange' ? 'text-orange-700' :
          badge.color === 'red' ? 'text-red-700' : 'text-gray-700'
        }`}>
          {badge.text}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">{badge.icon}</span>
        Security Assessment
      </h3>
      
      <div className={`p-4 rounded-lg mb-4 ${
        badge.color === 'green' ? 'bg-green-50 border border-green-200' :
        badge.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
        badge.color === 'orange' ? 'bg-orange-50 border border-orange-200' :
        badge.color === 'red' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`font-medium ${
            badge.color === 'green' ? 'text-green-800' :
            badge.color === 'yellow' ? 'text-yellow-800' :
            badge.color === 'orange' ? 'text-orange-800' :
            badge.color === 'red' ? 'text-red-800' : 'text-gray-800'
          }`}>
            {badge.text}
          </span>
          <span className="text-xs text-gray-500">Powered by GoPlus</span>
        </div>
      </div>

      {assessment.warnings.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-red-700 mb-2">⚠️ Security Warnings</h4>
          <ul className="space-y-1">
            {assessment.warnings.map((warning, index) => (
              <li key={index} className="text-sm text-red-600">• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {assessment.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-blue-700 mb-2">💡 Recommendations</h4>
          <ul className="space-y-1">
            {assessment.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-600">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 