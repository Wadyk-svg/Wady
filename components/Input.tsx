import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-neon-blue text-sm font-display mb-2 uppercase tracking-wider">
        {label}
      </label>
      <input
        className="w-full bg-black/50 border border-gray-700 text-white p-3 rounded-sm focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors font-mono"
        {...props}
      />
    </div>
  );
};